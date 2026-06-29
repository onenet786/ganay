import express from 'express';
import { db } from './database.js';
import { ytdlpService } from './ytdlpService.js';

const router = express.Router();

const MOOD_SEARCH_MAP = {
  romantic: 'Pakistani Indian romantic songs',
  sad: 'Pakistani Indian sad songs',
  happy: 'Pakistani Indian happy upbeat songs',
  sufi: 'Pakistani Indian sufi songs qawwali',
  ghazal: 'Pakistani Indian ghazal songs',
  patriotic: 'Pakistani patriotic songs, Indian patriotic songs',
  retro: 'Pakistani Indian old classic vintage songs',
  playful: 'Pakistani Indian playful sharaarat songs',
  classical: 'Pakistani Indian classical songs thumri raag',
  heartbroken: 'Pakistani Indian heartbroken songs',
  philosophical: 'Pakistani Indian philosophical songs',
  rain: 'Pakistani Indian rain sawan songs'
};

// GET /api/search?q=...&decade=...&genre=...
router.get('/search', async (req, res) => {
  const { q, decade, genre, singer, mood, country, source } = req.query;

  try {
    // 1. Search local DB first
    let localResults = await db.getSongs({
      query: q,
      decade,
      genre,
      singer_name: singer,
      mood,
      country,
      limit: 30
    });

    // 2. If a text search query or mood was provided, query YouTube / yt-dlp to enrich findings
    const hasMood = mood && MOOD_SEARCH_MAP[mood.toLowerCase()];
    const searchTarget = q ? q.trim() : '';

    if (searchTarget.length > 2 || hasMood) {
      // Build YouTube search query targeting Pakistani/Indian songs based on selected country
      let countryPrefix = 'Pakistani and Indian';
      if (country === 'pakistan') {
        countryPrefix = 'Pakistani';
      } else if (country === 'india') {
        countryPrefix = 'Indian';
      }

      // Map mood to suffix
      let moodSuffix = '';
      if (hasMood) {
        const rawMood = mood.toLowerCase();
        if (rawMood === 'romantic') moodSuffix = 'romantic songs';
        else if (rawMood === 'sad') moodSuffix = 'sad songs';
        else if (rawMood === 'happy') moodSuffix = 'happy upbeat songs';
        else if (rawMood === 'sufi') moodSuffix = 'sufi songs qawwali';
        else if (rawMood === 'ghazal') moodSuffix = 'ghazal songs';
        else if (rawMood === 'patriotic') moodSuffix = 'patriotic national songs';
        else if (rawMood === 'retro') moodSuffix = 'old classic vintage songs';
        else if (rawMood === 'playful') moodSuffix = 'playful sharaarat songs';
        else if (rawMood === 'classical') moodSuffix = 'classical songs thumri raag';
        else if (rawMood === 'heartbroken') moodSuffix = 'heartbroken songs';
        else if (rawMood === 'philosophical') moodSuffix = 'philosophical songs';
        else if (rawMood === 'rain') moodSuffix = 'rain sawan songs';
      }

      let ytQuery = '';
      if (searchTarget) {
        ytQuery = `${searchTarget} ${countryPrefix}`;
        if (moodSuffix) ytQuery += ` ${moodSuffix}`;
      } else {
        ytQuery = `${countryPrefix} ${moodSuffix}`;
      }

      console.log(`Performing live search [Source: ${source || 'youtube'}] for: "${ytQuery}"`);
      let ytResults = [];
      if (source === 'archive') {
        ytResults = await ytdlpService.searchArchiveOrg(ytQuery);
      } else {
        ytResults = await ytdlpService.searchSongs(ytQuery, { decade, genre });
      }

      // Save new songs in background so we cache them in our database
      const savedYtResults = [];
      for (const song of ytResults) {
        try {
          const saved = await db.saveSong(song);
          savedYtResults.push(saved);
        } catch (dbErr) {
          console.error(`Failed to save search result song ${song.title}:`, dbErr.message);
          savedYtResults.push(song); // Fallback to raw song info
        }
      }

      // Merge and deduplicate by youtube_video_id
      const seen = new Set();
      const merged = [];
      
      // Prioritize local results since they might have more metadata
      for (const item of localResults) {
        if (!seen.has(item.youtube_video_id)) {
          seen.add(item.youtube_video_id);
          merged.push(item);
        }
      }
      
      for (const item of savedYtResults) {
        if (!seen.has(item.youtube_video_id)) {
          seen.add(item.youtube_video_id);
          merged.push(item);
        }
      }

      return res.json(merged.slice(0, 30));
    }

    return res.json(localResults);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Failed to search songs', details: error.message });
  }
});

// GET /api/stream?videoId=...
router.get('/stream', async (req, res) => {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'videoId query parameter is required' });
  }

  try {
    // Increment play count if the song exists in database
    const song = await db.getSongByYoutubeId(videoId);
    if (song) {
      await db.incrementPlayCount(song.id);
    }

    // Check if it's an Archive.org identifier fallback
    if (videoId.startsWith('archive_')) {
      const identifier = videoId.replace('archive_', '');
      const archiveUrl = `https://archive.org/download/${identifier}/${identifier}.mp3`;
      return res.json({ url: archiveUrl });
    }

    // Extract stream url via yt-dlp
    const streamUrl = await ytdlpService.getStreamUrl(videoId);
    return res.json({ url: streamUrl });
  } catch (error) {
    console.error(`Streaming error for video ID ${videoId}:`, error.message);
    
    // Auto-healing fallback search for database songs with broken links
    try {
      const song = await db.getSongByYoutubeId(videoId);
      if (song) {
        const query = `${song.singer_name} ${song.title}`;
        console.log(`Auto-healing broken link for song "${song.title}". Searching YouTube for "${query}"...`);
        const searchResults = await ytdlpService.searchSongs(query);
        const healingResult = searchResults.find(r => r.youtube_video_id !== videoId && !r.youtube_video_id.startsWith('archive_'));
        if (healingResult) {
          const newVideoId = healingResult.youtube_video_id;
          console.log(`Found healing replacement ID "${newVideoId}" for song "${song.title}". Resolving stream...`);
          const streamUrl = await ytdlpService.getStreamUrl(newVideoId);
          await db.healSongVideoId(song.id, newVideoId);
          console.log(`Database healed successfully. Song "${song.title}" is now mapped to "${newVideoId}".`);
          return res.json({ url: streamUrl });
        }
      }
    } catch (healErr) {
      console.error(`Auto-heal attempt failed:`, healErr.message);
    }

    res.status(500).json({ error: 'Failed to extract audio stream', details: error.message });
  }
});

// GET /api/collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await db.getCollections();
    res.json(collections);
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ error: 'Failed to retrieve collections' });
  }
});

// GET /api/collections/:id
router.get('/collections/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const collection = await db.getCollection(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    console.error(`Get collection ${id} error:`, error);
    res.status(500).json({ error: 'Failed to retrieve collection' });
  }
});

// GET /api/discover
router.get('/discover', async (req, res) => {
  try {
    const songs = await db.getSongs({ limit: 100 });
    if (songs.length === 0) {
      return res.status(404).json({ error: 'No songs found to discover' });
    }
    const randomIndex = Math.floor(Math.random() * songs.length);
    res.json(songs[randomIndex]);
  } catch (error) {
    console.error('Discover API error:', error);
    res.status(500).json({ error: 'Failed to discover song' });
  }
});

// GET /api/singer/:name
router.get('/singer/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const songs = await db.getSongs({ singer_name: name, limit: 30 });
    res.json(songs);
  } catch (error) {
    console.error(`Get singer ${name} error:`, error);
    res.status(500).json({ error: 'Failed to retrieve songs by singer' });
  }
});

// GET /api/trending
router.get('/trending', async (req, res) => {
  try {
    // Trending = top 10 songs by play count
    const songs = await db.getSongs({ limit: 10 });
    res.json(songs);
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ error: 'Failed to retrieve trending songs' });
  }
});

// GET /api/playlists
router.get('/playlists', async (req, res) => {
  const { userId } = req.query;
  try {
    const playlists = await db.getPlaylists(userId);
    res.json(playlists);
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Failed to retrieve playlists' });
  }
});

// POST /api/playlist
router.post('/playlist', async (req, res) => {
  const { id, user_id, name, song_ids } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Playlist name is required' });
  }

  try {
    const playlist = await db.savePlaylist({ id, user_id, name, song_ids });
    res.json(playlist);
  } catch (error) {
    console.error('Save playlist error:', error);
    res.status(500).json({ error: 'Failed to save playlist' });
  }
});

export default router;
