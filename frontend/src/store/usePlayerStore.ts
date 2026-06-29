import { create } from 'zustand';

export interface Song {
  id: string;
  youtube_video_id: string;
  title: string;
  singer_name: string;
  film_name?: string | null;
  decade?: string | null;
  genre?: string | null;
  thumbnail_url: string;
  duration_seconds: number;
  play_count?: number;
  archive_stream_url?: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: string;
}

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  streamUrl: string | null;
  queue: Song[];
  history: Song[];
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  shuffleMode: boolean;
  repeatMode: 'none' | 'one' | 'all';
  isFullScreen: boolean;
  isLoadingStream: boolean;
  error: string | null;
  playbackRetryCount: number;
  playlists: Playlist[];

  // Actions
  initAudio: () => void;
  playSong: (song: Song, contextQueue?: Song[]) => Promise<void>;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  setQueue: (songs: Song[]) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
  setFullScreen: (isFull: boolean) => void;
  clearQueue: () => void;
  
  // Playlist actions
  loadPlaylists: () => void;
  createPlaylist: (name: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
}

const isCapacitor = typeof window !== 'undefined' && 
  ((window as any).Capacitor || window.location.protocol === 'capacitor:' || (window.location.hostname === 'localhost' && !window.location.port));

const BACKEND_URL = import.meta.env.VITE_API_URL || 
  (isCapacitor 
    ? 'http://192.168.19.32:5001' 
    : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
      ? `http://${window.location.hostname}:5001` 
      : 'http://localhost:5001'));
let audioNode: HTMLAudioElement | null = null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  streamUrl: null,
  queue: [],
  history: [],
  volume: 0.8,
  isMuted: false,
  progress: 0,
  duration: 0,
  shuffleMode: false,
  repeatMode: 'none',
  isFullScreen: false,
  isLoadingStream: false,
  error: null,
  playbackRetryCount: 0,
  playlists: [],

  initAudio: () => {
    // Load playlists on app startup
    get().loadPlaylists();

    if (typeof window === 'undefined' || audioNode) return;

    audioNode = new Audio();
    audioNode.volume = get().volume;

    // Listen to updates
    audioNode.addEventListener('timeupdate', () => {
      if (audioNode) {
        set({ progress: audioNode.currentTime });
      }
    });

    audioNode.addEventListener('durationchange', () => {
      if (audioNode) {
        set({ duration: audioNode.duration || 0 });
      }
    });

    audioNode.addEventListener('play', () => {
      set({ isPlaying: true });
    });

    audioNode.addEventListener('pause', () => {
      set({ isPlaying: false });
    });

    audioNode.addEventListener('ended', () => {
      const { repeatMode, next } = get();
      if (repeatMode === 'one' && audioNode) {
        audioNode.currentTime = 0;
        audioNode.play().catch(console.error);
      } else {
        next();
      }
    });

    audioNode.addEventListener('error', (e) => {
      console.error('Audio node error:', e);
      
      const { currentSong, playbackRetryCount } = get();
      if (currentSong && playbackRetryCount < 2) {
        set({ 
          playbackRetryCount: playbackRetryCount + 1,
          error: `Audio playback error. Retrying stream (attempt ${playbackRetryCount + 1}/2)...`, 
          isPlaying: false 
        });
        
        setTimeout(() => {
          get().playSong(currentSong);
        }, 1200);
      } else {
        set({ 
          isPlaying: false, 
          isLoadingStream: false,
          error: 'This track is currently restricted or unavailable. Please choose another classic.' 
        });
      }
    });
  },

  playSong: async (song: Song, contextQueue?: Song[]) => {
    get().initAudio();
    if (!audioNode) return;

    // Slice contextQueue to build automatic Autoplay queue
    if (contextQueue && contextQueue.length > 0) {
      const idx = contextQueue.findIndex(s => s.id === song.id);
      if (idx !== -1) {
        const remaining = contextQueue.slice(idx + 1);
        set({ queue: remaining });
      }
    }

    const prevSong = get().currentSong;
    const isNewSong = !prevSong || prevSong.id !== song.id;
    const retryCount = isNewSong ? 0 : get().playbackRetryCount;

    const historyList = [...get().history];
    if (prevSong && isNewSong && (!historyList.length || historyList[historyList.length - 1].id !== prevSong.id)) {
      historyList.push(prevSong);
    }

    set({ 
      currentSong: song, 
      isLoadingStream: true, 
      error: null, 
      isPlaying: false, 
      history: historyList,
      playbackRetryCount: retryCount
    });

    try {
      let streamUrl = '';

      if (song.youtube_video_id.startsWith('archive_')) {
        // Direct Archive.org stream URL
        streamUrl = song.archive_stream_url || `https://archive.org/download/${song.youtube_video_id.replace('archive_', '')}/${song.youtube_video_id.replace('archive_', '')}.mp3`;
      } else {
        // Fetch from backend
        const response = await fetch(`${BACKEND_URL}/api/stream?videoId=${song.youtube_video_id}`);
        if (!response.ok) {
          throw new Error('Failed to resolve stream link');
        }
        const data = await response.json();
        streamUrl = data.url;
      }

      set({ streamUrl, isLoadingStream: false });
      audioNode.src = streamUrl;
      audioNode.load();
      await audioNode.play();
      set({ isPlaying: true });
    } catch (err: any) {
      console.error('Playback setup failed:', err.message);
      
      const { playbackRetryCount } = get();
      if (playbackRetryCount < 2) {
        set({ 
          playbackRetryCount: playbackRetryCount + 1,
          error: `Stream extraction failed. Retrying (attempt ${playbackRetryCount + 1}/2)...` 
        });
        setTimeout(() => {
          get().playSong(song);
        }, 1200);
      } else {
        set({ 
          isLoadingStream: false, 
          isPlaying: false,
          error: `Could not load audio. Fallback to archive.org search...` 
        });
        
        // Auto-try Archive.org search fallback if youtube failing
        try {
          const query = `${song.singer_name} ${song.title}`;
          console.log(`Fallback: Searching archive.org for "${query}"`);
          const searchRes = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`);
          const results = await searchRes.json();
          const fallbackSong = results.find((s: any) => s.youtube_video_id.startsWith('archive_'));
          
          if (fallbackSong) {
            console.log(`Found Archive.org fallback track:`, fallbackSong.title);
            set({ playbackRetryCount: 0 }); // Reset for new fallback track
            get().playSong(fallbackSong);
          } else {
            set({ error: 'Song currently unavailable. Try another song.' });
          }
        } catch (fallbackErr) {
          set({ error: 'Playback failed. Check internet connection.' });
        }
      }
    }
  },

  togglePlay: () => {
    if (!audioNode || !get().currentSong) return;
    if (get().isPlaying) {
      audioNode.pause();
    } else {
      audioNode.play().catch(console.error);
    }
  },

  next: () => {
    const { queue, shuffleMode, repeatMode } = get();
    if (queue.length === 0) {
      if (repeatMode === 'all' && get().history.length > 0) {
        // Restart entire playlist from history
        const first = get().history[0];
        set({ history: [] });
        get().playSong(first);
      } else {
        // Just stop playback or loop the current song
        set({ isPlaying: false });
      }
      return;
    }

    let nextSong: Song;
    let nextQueue = [...queue];

    if (shuffleMode) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      nextSong = queue[randomIndex];
      nextQueue.splice(randomIndex, 1);
    } else {
      nextSong = queue[0];
      nextQueue.shift();
    }

    set({ queue: nextQueue });
    get().playSong(nextSong);
  },

  prev: () => {
    const { history, currentSong, queue } = get();
    if (history.length === 0) {
      if (audioNode) {
        audioNode.currentTime = 0;
      }
      return;
    }

    const prevSong = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    // Push current song to queue front if it exists
    const newQueue = currentSong ? [currentSong, ...queue] : queue;

    set({ history: newHistory, queue: newQueue });
    get().playSong(prevSong);
  },

  seek: (seconds: number) => {
    if (audioNode) {
      audioNode.currentTime = seconds;
      set({ progress: seconds });
    }
  },

  setVolume: (volume: number) => {
    const safeVolume = Math.max(0, Math.min(1, volume));
    if (audioNode) {
      audioNode.volume = get().isMuted ? 0 : safeVolume;
    }
    set({ volume: safeVolume });
  },

  toggleMute: () => {
    const { isMuted, volume } = get();
    if (audioNode) {
      audioNode.volume = !isMuted ? 0 : volume;
    }
    set({ isMuted: !isMuted });
  },

  addToQueue: (song: Song) => {
    const { queue } = get();
    if (queue.some(s => s.id === song.id)) return; // Avoid duplicates in queue
    set({ queue: [...queue, song] });
  },

  removeFromQueue: (songId: string) => {
    set({ queue: get().queue.filter(s => s.id !== songId) });
  },

  setQueue: (songs: Song[]) => {
    set({ queue: songs });
  },

  toggleShuffle: () => {
    set({ shuffleMode: !get().shuffleMode });
  },

  setRepeatMode: (mode) => {
    set({ repeatMode: mode });
  },

  setFullScreen: (isFull: boolean) => {
    set({ isFullScreen: isFull });
  },

  clearQueue: () => {
    set({ queue: [] });
  },

  loadPlaylists: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('naghma_playlists');
    if (stored) {
      try {
        set({ playlists: JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to parse playlists from localStorage');
      }
    }
  },

  createPlaylist: (name) => {
    const playlists = get().playlists;
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      songs: [],
      createdAt: new Date().toISOString()
    };
    const updated = [...playlists, newPlaylist];
    set({ playlists: updated });
    localStorage.setItem('naghma_playlists', JSON.stringify(updated));
  },

  deletePlaylist: (playlistId) => {
    const updated = get().playlists.filter(p => p.id !== playlistId);
    set({ playlists: updated });
    localStorage.setItem('naghma_playlists', JSON.stringify(updated));
  },

  addSongToPlaylist: (playlistId, song) => {
    const updated = get().playlists.map(p => {
      if (p.id === playlistId) {
        if (p.songs.some(s => s.id === song.id)) return p;
        return { ...p, songs: [...p.songs, song] };
      }
      return p;
    });
    set({ playlists: updated });
    localStorage.setItem('naghma_playlists', JSON.stringify(updated));
  },

  removeSongFromPlaylist: (playlistId, songId) => {
    const updated = get().playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter(s => s.id !== songId) };
      }
      return p;
    });
    set({ playlists: updated });
    localStorage.setItem('naghma_playlists', JSON.stringify(updated));
  }
}));
