import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

const MOOD_KEYWORDS = {
  romantic: ['pyar', 'ishq', 'mohabbat', 'chahat', 'sanam', 'prem', 'dilbar', 'humsafar', 'dhadkan', 'jaan', 'love', 'romantic'],
  sad: ['gham', 'ranjish', 'tanhai', 'dard', 'ashk', 'roye', 'hijr', 'judaai', 'dil dukhane', 'ruksat', 'ansu', 'sad', 'pain'],
  happy: ['khushi', 'masti', 'sharaarat', 'muskurana', 'jhoome', 'dhamal', 'nacho', 'gao', 'bhangra', 'happy'],
  sufi: ['sufi', 'qawwali', 'qawali', 'rubabi', 'mast', 'dum', 'ali', 'khwaja', 'maula', 'deva', 'arsh', 'bhajan'],
  ghazal: ['ghazal', 'shayari', 'sukoon', 'adab', 'mehfil', 'nigaah', 'husn'],
  patriotic: ['watan', 'milli naghma', 'josh', 'desh', 'tiranga', 'azadi', 'pakistan', 'hindustan'],
  retro: ['yaadein', 'purana', 'vintage', 'retro', 'yaad', 'guzra waqt', 'beetay din'],
  playful: ['sharaarat', 'nakhra', 'naughty', 'coquettish', 'chulbuli', 'nain', 'adaa'],
  classical: ['raaga', 'raag', 'thumri', 'classical', 'khayal', 'sur', 'alap'],
  heartbroken: ['tanhai', 'akela', 'virah', 'shiddat', 'ruswai', 'barbad'],
  philosophical: ['falsafa', 'zindagi', 'kismat', 'taqdeer', 'duniya', 'raahi', 'musafir'],
  rain: ['sawan', 'barkha', 'barsaat', 'baarisat', 'rain', 'badal', 'boond']
};

const PAKISTANI_SINGERS = [
  'mehdi hassan', 'noor jehan', 'nusrat fateh ali', 'ghulam ali', 'iqbal bano', 
  'nayyara noor', 'farida khanum', 'abida parveen', 'nazia hassan', 'zubaida khanum', 
  'reshma', 'musarrat nazir', 'alamgir', 'sajjad ali', 'naheed akhtar', 'habib wali mohammad', 
  'asad amanat ali', 'amanat ali khan', 'munni begum', 'sabri brothers', 'vital signs', 'junoon'
];

const INDIAN_SINGERS = [
  'lata mangeshkar', 'asha bhosle', 'mohammad rafi', 'kishore kumar', 'mukesh', 
  'geeta dutt', 'jagjit singh', 'pankaj udhas', 'talat mahmood', 'manna dey', 
  'hemant kumar', 'mahendra kapoor', 'kumar sanu', 'alka yagnik', 'udit narayan', 
  'sonu nigam', 'chithra', 's. p. balasubrahmanyam', 'hariharan', 'bhupen hazarika', 
  'k. j. yesudas', 'surendra'
];

class Database {
  constructor() {
    this.isPostgres = !!config.DATABASE_URL;
    this.pool = null;
    this.jsonData = {
      songs: [],
      collections: [],
      collection_songs: [],
      playlists: [],
    };

    if (this.isPostgres) {
      console.log('Database Mode: PostgreSQL');
      this.pool = new Pool({
        connectionString: config.DATABASE_URL,
        ssl: config.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      });
    } else {
      console.log('Database Mode: Local JSON File fallback');
      const dir = path.dirname(config.DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.loadJsonData();
    }
  }

  loadJsonData() {
    try {
      if (fs.existsSync(config.DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(config.DB_FILE_PATH, 'utf8');
        this.jsonData = JSON.parse(fileContent);
      } else {
        this.saveJsonData();
      }
    } catch (error) {
      console.error('Failed to load JSON database, resetting:', error);
      this.saveJsonData();
    }
  }

  saveJsonData() {
    try {
      fs.writeFileSync(config.DB_FILE_PATH, JSON.stringify(this.jsonData, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save JSON database:', error);
    }
  }

  async init() {
    if (this.isPostgres) {
      const client = await this.pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS songs (
            id UUID PRIMARY KEY,
            youtube_video_id VARCHAR UNIQUE NOT NULL,
            title VARCHAR NOT NULL,
            singer_name VARCHAR NOT NULL,
            film_name VARCHAR,
            decade VARCHAR,
            genre VARCHAR,
            thumbnail_url VARCHAR,
            duration_seconds INT,
            play_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS collections (
            id UUID PRIMARY KEY,
            name VARCHAR NOT NULL,
            description TEXT,
            cover_image_url VARCHAR,
            is_curated BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS collection_songs (
            collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
            song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
            position INT,
            PRIMARY KEY (collection_id, song_id)
          );

          CREATE TABLE IF NOT EXISTS playlists (
            id UUID PRIMARY KEY,
            user_id VARCHAR,
            name VARCHAR NOT NULL,
            song_ids UUID[] DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('PostgreSQL database schemas verified/created.');
      } catch (error) {
        console.error('PostgreSQL initialization failed:', error);
        throw error;
      } finally {
        client.release();
      }
    } else {
      // JSON schema verification
      if (!this.jsonData.songs) this.jsonData.songs = [];
      if (!this.jsonData.collections) this.jsonData.collections = [];
      if (!this.jsonData.collection_songs) this.jsonData.collection_songs = [];
      if (!this.jsonData.playlists) this.jsonData.playlists = [];
      this.saveJsonData();
      console.log('JSON database schema verified.');
    }
  }

  // --- SONGS ---

  async getSongs({ query, decade, genre, singer_name, mood, country, limit = 50 }) {
    if (this.isPostgres) {
      let sql = 'SELECT * FROM songs WHERE 1=1';
      const params = [];
      let index = 1;

      if (query) {
        sql += ` AND (title ILIKE $${index} OR singer_name ILIKE $${index} OR film_name ILIKE $${index})`;
        params.push(`%${query}%`);
        index++;
      }
      if (decade) {
        sql += ` AND decade = $${index}`;
        params.push(decade);
        index++;
      }
      if (genre) {
        sql += ` AND genre ILIKE $${index}`;
        params.push(genre);
        index++;
      }
      if (singer_name) {
        sql += ` AND singer_name ILIKE $${index}`;
        params.push(singer_name);
        index++;
      }
      if (mood) {
        const keywords = MOOD_KEYWORDS[mood.toLowerCase()] || [];
        if (keywords.length > 0) {
          const conditions = keywords.map((_, i) => `title ILIKE $${index + i} OR genre ILIKE $${index + i}`).join(' OR ');
          sql += ` AND (${conditions})`;
          keywords.forEach(kw => {
            params.push(`%${kw}%`);
          });
          index += keywords.length;
        }
      }
      if (country) {
        const targetCountry = country.toLowerCase();
        if (targetCountry === 'pakistan') {
          const conditions = PAKISTANI_SINGERS.map((_, i) => `singer_name ILIKE $${index + i}`).join(' OR ');
          sql += ` AND (${conditions} OR title ILIKE '%pakistan%' OR genre ILIKE '%pakistan%')`;
          PAKISTANI_SINGERS.forEach(s => params.push(`%${s}%`));
          index += PAKISTANI_SINGERS.length;
        } else if (targetCountry === 'india') {
          const conditions = INDIAN_SINGERS.map((_, i) => `singer_name ILIKE $${index + i}`).join(' OR ');
          sql += ` AND (${conditions} OR title ILIKE '%india%' OR genre ILIKE '%india%')`;
          INDIAN_SINGERS.forEach(s => params.push(`%${s}%`));
          index += INDIAN_SINGERS.length;
        }
      }

      sql += ' ORDER BY play_count DESC, title ASC LIMIT ' + parseInt(limit);
      const res = await this.pool.query(sql, params);
      return res.rows;
    } else {
      let filtered = [...this.jsonData.songs];

      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          s =>
            s.title.toLowerCase().includes(q) ||
            s.singer_name.toLowerCase().includes(q) ||
            (s.film_name && s.film_name.toLowerCase().includes(q))
        );
      }
      if (decade) {
        filtered = filtered.filter(s => s.decade === decade);
      }
      if (genre) {
        const g = genre.toLowerCase();
        filtered = filtered.filter(s => s.genre && s.genre.toLowerCase() === g);
      }
      if (singer_name) {
        const sn = singer_name.toLowerCase();
        filtered = filtered.filter(s => s.singer_name.toLowerCase().includes(sn));
      }
      if (mood) {
        const keywords = MOOD_KEYWORDS[mood.toLowerCase()] || [];
        if (keywords.length > 0) {
          filtered = filtered.filter(s => {
            const titleLow = s.title.toLowerCase();
            const genreLow = (s.genre || '').toLowerCase();
            const singerLow = s.singer_name.toLowerCase();
            return keywords.some(kw => titleLow.includes(kw) || genreLow.includes(kw) || singerLow.includes(kw));
          });
        }
      }
      if (country) {
        const targetCountry = country.toLowerCase();
        if (targetCountry === 'pakistan') {
          filtered = filtered.filter(s => {
            const sName = s.singer_name.toLowerCase();
            return PAKISTANI_SINGERS.some(name => sName.includes(name)) ||
                   (s.genre && s.genre.toLowerCase().includes('pakistan')) ||
                   (s.title && s.title.toLowerCase().includes('pakistan'));
          });
        } else if (targetCountry === 'india') {
          filtered = filtered.filter(s => {
            const sName = s.singer_name.toLowerCase();
            return INDIAN_SINGERS.some(name => sName.includes(name)) ||
                   (s.genre && s.genre.toLowerCase().includes('india')) ||
                   (s.title && s.title.toLowerCase().includes('india'));
          });
        }
      }

      filtered.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
      return filtered.slice(0, limit);
    }
  }

  async getSongById(id) {
    if (this.isPostgres) {
      const res = await this.pool.query('SELECT * FROM songs WHERE id = $1', [id]);
      return res.rows[0] || null;
    } else {
      return this.jsonData.songs.find(s => s.id === id) || null;
    }
  }

  async getSongByYoutubeId(videoId) {
    if (this.isPostgres) {
      const res = await this.pool.query('SELECT * FROM songs WHERE youtube_video_id = $1', [videoId]);
      return res.rows[0] || null;
    } else {
      return this.jsonData.songs.find(s => s.youtube_video_id === videoId) || null;
    }
  }

  async saveSong(songData) {
    const songId = songData.id || crypto.randomUUID();
    const videoId = songData.youtube_video_id;
    const title = songData.title;
    const singer = songData.singer_name;
    const film = songData.film_name || null;
    const decade = songData.decade || null;
    const genre = songData.genre || null;
    const thumbnail = songData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const duration = songData.duration_seconds || 0;
    const playCount = songData.play_count || 0;

    if (this.isPostgres) {
      const sql = `
        INSERT INTO songs (id, youtube_video_id, title, singer_name, film_name, decade, genre, thumbnail_url, duration_seconds, play_count, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        ON CONFLICT (youtube_video_id) 
        DO UPDATE SET 
          title = EXCLUDED.title,
          singer_name = EXCLUDED.singer_name,
          film_name = COALESCE(EXCLUDED.film_name, songs.film_name),
          decade = COALESCE(EXCLUDED.decade, songs.decade),
          genre = COALESCE(EXCLUDED.genre, songs.genre),
          thumbnail_url = EXCLUDED.thumbnail_url,
          duration_seconds = EXCLUDED.duration_seconds
        RETURNING *;
      `;
      const res = await this.pool.query(sql, [
        songId,
        videoId,
        title,
        singer,
        film,
        decade,
        genre,
        thumbnail,
        duration,
        playCount,
      ]);
      return res.rows[0];
    } else {
      let existingIndex = this.jsonData.songs.findIndex(s => s.youtube_video_id === videoId);
      const songRecord = {
        id: existingIndex >= 0 ? this.jsonData.songs[existingIndex].id : songId,
        youtube_video_id: videoId,
        title,
        singer_name: singer,
        film_name: film || (existingIndex >= 0 ? this.jsonData.songs[existingIndex].film_name : null),
        decade: decade || (existingIndex >= 0 ? this.jsonData.songs[existingIndex].decade : null),
        genre: genre || (existingIndex >= 0 ? this.jsonData.songs[existingIndex].genre : null),
        thumbnail_url: thumbnail,
        duration_seconds: duration,
        play_count: existingIndex >= 0 ? this.jsonData.songs[existingIndex].play_count : playCount,
        created_at: existingIndex >= 0 ? this.jsonData.songs[existingIndex].created_at : new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        this.jsonData.songs[existingIndex] = songRecord;
      } else {
        this.jsonData.songs.push(songRecord);
      }
      this.saveJsonData();
      return songRecord;
    }
  }

  async incrementPlayCount(songId) {
    if (this.isPostgres) {
      await this.pool.query('UPDATE songs SET play_count = play_count + 1 WHERE id = $1', [songId]);
    } else {
      const song = this.jsonData.songs.find(s => s.id === songId);
      if (song) {
        song.play_count = (song.play_count || 0) + 1;
        this.saveJsonData();
      }
    }
  }

  // --- COLLECTIONS ---

  async getCollections() {
    if (this.isPostgres) {
      const res = await this.pool.query('SELECT * FROM collections ORDER BY name ASC');
      return res.rows;
    } else {
      return [...this.jsonData.collections].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  async getCollection(id) {
    if (this.isPostgres) {
      const collRes = await this.pool.query('SELECT * FROM collections WHERE id = $1', [id]);
      const collection = collRes.rows[0];
      if (!collection) return null;

      const songsRes = await this.pool.query(`
        SELECT s.*, cs.position 
        FROM songs s
        JOIN collection_songs cs ON s.id = cs.song_id
        WHERE cs.collection_id = $1
        ORDER BY cs.position ASC
      `, [id]);
      collection.songs = songsRes.rows;
      return collection;
    } else {
      const collection = this.jsonData.collections.find(c => c.id === id);
      if (!collection) return null;

      const mappings = this.jsonData.collection_songs
        .filter(cs => cs.collection_id === id)
        .sort((a, b) => a.position - b.position);

      const songs = mappings
        .map(m => this.jsonData.songs.find(s => s.id === m.song_id))
        .filter(Boolean);

      return { ...collection, songs };
    }
  }

  async saveCollection(collectionData) {
    const id = collectionData.id || crypto.randomUUID();
    const name = collectionData.name;
    const desc = collectionData.description || null;
    const cover = collectionData.cover_image_url || null;
    const isCurated = collectionData.is_curated !== false;

    if (this.isPostgres) {
      const res = await this.pool.query(`
        INSERT INTO collections (id, name, description, cover_image_url, is_curated)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          cover_image_url = EXCLUDED.cover_image_url,
          is_curated = EXCLUDED.is_curated
        RETURNING *
      `, [id, name, desc, cover, isCurated]);
      return res.rows[0];
    } else {
      let existingIndex = this.jsonData.collections.findIndex(c => c.id === id);
      const collectionRecord = {
        id,
        name,
        description: desc,
        cover_image_url: cover,
        is_curated: isCurated,
        created_at: existingIndex >= 0 ? this.jsonData.collections[existingIndex].created_at : new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        this.jsonData.collections[existingIndex] = collectionRecord;
      } else {
        this.jsonData.collections.push(collectionRecord);
      }
      this.saveJsonData();
      return collectionRecord;
    }
  }

  async saveCollectionSong(collectionId, songId, position = 0) {
    if (this.isPostgres) {
      await this.pool.query(`
        INSERT INTO collection_songs (collection_id, song_id, position)
        VALUES ($1, $2, $3)
        ON CONFLICT (collection_id, song_id) DO UPDATE SET position = EXCLUDED.position
      `, [collectionId, songId, position]);
    } else {
      let existingIndex = this.jsonData.collection_songs.findIndex(
        cs => cs.collection_id === collectionId && cs.song_id === songId
      );

      const mapping = { collection_id: collectionId, song_id: songId, position };

      if (existingIndex >= 0) {
        this.jsonData.collection_songs[existingIndex] = mapping;
      } else {
        this.jsonData.collection_songs.push(mapping);
      }
      this.saveJsonData();
    }
  }

  // --- PLAYLISTS ---

  async getPlaylists(userId = null) {
    if (this.isPostgres) {
      const res = await this.pool.query('SELECT * FROM playlists WHERE user_id = $1 OR user_id IS NULL ORDER BY name ASC', [userId]);
      return res.rows;
    } else {
      return this.jsonData.playlists.filter(p => p.user_id === userId || !p.user_id);
    }
  }

  async savePlaylist(playlistData) {
    const id = playlistData.id || crypto.randomUUID();
    const userId = playlistData.user_id || null;
    const name = playlistData.name;
    const songIds = playlistData.song_ids || [];

    if (this.isPostgres) {
      const res = await this.pool.query(`
        INSERT INTO playlists (id, user_id, name, song_ids)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          song_ids = EXCLUDED.song_ids
        RETURNING *
      `, [id, userId, name, songIds]);
      return res.rows[0];
    } else {
      let existingIndex = this.jsonData.playlists.findIndex(p => p.id === id);
      const playlistRecord = {
        id,
        user_id: userId,
        name,
        song_ids: songIds,
        created_at: existingIndex >= 0 ? this.jsonData.playlists[existingIndex].created_at : new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        this.jsonData.playlists[existingIndex] = playlistRecord;
      } else {
        this.jsonData.playlists.push(playlistRecord);
      }
      this.saveJsonData();
      return playlistRecord;
    }
  }

  async healSongVideoId(songId, newVideoId) {
    const newThumbnail = `https://img.youtube.com/vi/${newVideoId}/hqdefault.jpg`;
    if (this.isPostgres) {
      await this.pool.query('UPDATE songs SET youtube_video_id = $1, thumbnail_url = $2 WHERE id = $3', [newVideoId, newThumbnail, songId]);
    } else {
      const song = this.jsonData.songs.find(s => s.id === songId);
      if (song) {
        song.youtube_video_id = newVideoId;
        song.thumbnail_url = newThumbnail;
        this.saveJsonData();
      }
    }
  }
}

export const db = new Database();
