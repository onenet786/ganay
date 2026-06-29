import { execFile } from 'child_process';
import { cache } from './cache.js';
import { db } from './database.js';
import { config } from './config.js';

const execPromise = (file, args) => {
  return new Promise((resolve, reject) => {
    execFile(file, args, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
};

class YtDlpService {
  /**
   * Get direct audio stream URL for a YouTube video ID.
   * Caches the URL in Cache for 30 minutes.
   */
  async getStreamUrl(videoId) {
    const cacheKey = `stream:${videoId}`;
    const cachedUrl = await cache.get(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    console.log(`Cache miss. Resolving stream URL for video: ${videoId}`);
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const args = ['-f', 'bestaudio', '--js-runtimes', `node:${process.execPath}`, '--get-url', url];
      
      const stdout = await execPromise(config.YTDLP_PATH, args);
      const streamUrl = stdout.trim();
      
      if (!streamUrl) {
        throw new Error('yt-dlp returned an empty streaming URL');
      }

      // Cache URL for 30 minutes (1800 seconds)
      await cache.set(cacheKey, streamUrl, 1800);
      return streamUrl;
    } catch (err) {
      console.error(`yt-dlp streaming URL extraction failed for ${videoId}:`, err.stderr || err.message);
      
      // Fallback: try to see if there is an archive.org backup or return error
      throw new Error(`Failed to extract audio stream for YouTube video ${videoId}`);
    }
  }

  /**
   * Search songs via YouTube Data API or yt-dlp fallback
   */
  async searchSongs(query, filters = {}) {
    const cacheKey = `search:${query}:${filters.decade || ''}:${filters.genre || ''}`;
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    let results = [];
    
    if (config.YOUTUBE_API_KEY) {
      try {
        results = await this.searchViaYoutubeApi(query);
      } catch (err) {
        console.error('YouTube Data API search failed, falling back to yt-dlp search:', err.message);
        results = await this.searchViaYtDlp(query);
      }
    } else {
      results = await this.searchViaYtDlp(query);
    }

    // Filter results to ensure high playability and quality
    results = results.filter(item => {
      // Exclude shorts (< 45s) and long album mixes/compilations (> 900s / 15m)
      const duration = item.duration_seconds || 0;
      if (duration > 0 && (duration < 45 || duration > 900)) {
        return false;
      }
      
      const titleLow = (item.title || '').toLowerCase();
      // Exclude promotional content, multi-album jukeboxes, trailers, and ringtones
      const excludeKeywords = [
        'teaser', 'promo', 'jukebox', 'non stop', 'non-stop', 
        'full album', 'full movie', 'compilation', 'loop', 
        'status', 'whatsapp status', 'ringtone', 'trailer'
      ];
      if (excludeKeywords.some(kw => titleLow.includes(kw))) {
        return false;
      }
      
      return true;
    });

    // Apply decade/genre tags if singer or metadata matches
    results = results.map(item => {
      return {
        ...item,
        decade: filters.decade || this.inferDecadeFromTitle(item.title) || '1970s',
        genre: filters.genre || this.inferGenreFromTitle(item.title) || 'Film Song'
      };
    });

    // Cache search results for 5 minutes (300 seconds)
    await cache.set(cacheKey, JSON.stringify(results), 300);
    return results;
  }

  async searchViaYoutubeApi(query) {
    console.log(`Searching YouTube API for: "${query}"`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=15&key=${config.YOUTUBE_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items.map(item => ({
      youtube_video_id: item.id.videoId,
      title: item.snippet.title,
      singer_name: item.snippet.channelTitle.replace(' - Topic', ''),
      thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      duration_seconds: 0 // API search doesn't return duration, yt-dlp will get it or set 0
    }));
  }

  async searchViaYtDlp(query) {
    console.log(`Searching YouTube via yt-dlp for: "${query}"`);
    try {
      // ytsearch15 search query
      const args = [`ytsearch15:${query}`, '--dump-json', '--flat-playlist'];
      const stdout = await execPromise(config.YTDLP_PATH, args);
      
      const lines = stdout.split('\n').filter(line => line.trim());
      const results = [];
      
      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          if (item._type === 'url' || item.id) {
            results.push({
              youtube_video_id: item.id,
              title: item.title,
              singer_name: item.uploader ? item.uploader.replace(' - Topic', '') : 'Classic Pakistan',
              thumbnail_url: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
              duration_seconds: item.duration || 0
            });
          }
        } catch (e) {
          // ignore parsing error for single line
        }
      }
      return results;
    } catch (err) {
      console.error('yt-dlp search failed:', err.stderr || err.message);
      // Try Archive.org fallback as a last resort
      return this.searchArchiveOrg(query);
    }
  }

  /**
   * Search archive.org for public domain audio files.
   */
  async searchArchiveOrg(query) {
    console.log(`Attempting Archive.org fallback search for: "${query}"`);
    try {
      const searchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(query)})+AND+mediatype:(audio)&fl[]=identifier,title,creator,downloads,length&sort[]=downloads+desc&output=json&rows=10`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error('Archive.org search failed');
      }

      const data = await response.json();
      const docs = data.response?.docs || [];

      return docs.map(doc => {
        const identifier = doc.identifier;
        // Construct the stream URL directly using archive.org download link format
        // We set the stream URL as a pseudo youtube_video_id starting with 'archive_'
        const streamUrl = `https://archive.org/download/${identifier}/${identifier}.mp3`;
        
        return {
          youtube_video_id: `archive_${identifier}`,
          title: doc.title,
          singer_name: doc.creator || 'Classic Archive',
          thumbnail_url: 'https://archive.org/services/img/' + identifier,
          duration_seconds: doc.length ? this.parseArchiveDuration(doc.length) : 0,
          archive_stream_url: streamUrl
        };
      });
    } catch (err) {
      console.error('Archive.org fallback search failed:', err.message);
      return [];
    }
  }

  // --- HELPERS ---

  inferDecadeFromTitle(title) {
    const t = title.toLowerCase();
    if (t.includes('195') || t.includes('50s') || t.includes('50\'s')) return '1950s';
    if (t.includes('196') || t.includes('60s') || t.includes('60\'s')) return '1960s';
    if (t.includes('197') || t.includes('70s') || t.includes('70\'s')) return '1970s';
    if (t.includes('198') || t.includes('80s') || t.includes('80\'s')) return '1980s';
    if (t.includes('199') || t.includes('90s') || t.includes('90\'s')) return '1990s';
    return null;
  }

  inferGenreFromTitle(title) {
    const t = title.toLowerCase();
    if (t.includes('ghazal')) return 'Ghazal';
    if (t.includes('qawwali') || t.includes('qawali')) return 'Qawwali';
    if (t.includes('thumri')) return 'Thumri';
    if (t.includes('folk')) return 'Folk';
    if (t.includes('film') || t.includes('ost') || t.includes('song')) return 'Film Song';
    return null;
  }

  parseArchiveDuration(durationStr) {
    // duration can be "HH:MM:SS" or "MM:SS" or seconds as string
    if (!durationStr) return 0;
    if (typeof durationStr === 'number') return durationStr;
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parseInt(durationStr) || 0;
  }
}

export const ytdlpService = new YtDlpService();
