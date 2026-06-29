import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import type { Playlist } from '../store/usePlayerStore';
import { Play, Plus, Trash2, ListMusic, Music, Calendar, Clock, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Playlists() {
  const { 
    playlists, createPlaylist, deletePlaylist, removeSongFromPlaylist, playSong 
  } = usePlayerStore();

  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.songs.length === 0) return;
    // Play the first song and set the rest as queue context
    playSong(playlist.songs[0], playlist.songs);
  };

  // Format date helper
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-10rem)] relative">
      
      {/* LEFT COLUMN: Playlists Sidebar List */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gold-warm/20 pb-4">
          <div>
            <h2 className="font-display font-bold text-2xl text-gold-warm tracking-wide leading-none mb-1">
              My Playlists
            </h2>
            <span className="text-[10px] text-cream-white/40 uppercase tracking-[0.2em] font-sans">
              میری پلے لسٹس
            </span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-deep hover:bg-emerald-deep/80 text-gold-warm text-xs font-semibold font-display border border-gold-warm/30 shadow-md shadow-emerald-deep/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Sidebar Cards Scroll */}
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] md:max-h-[calc(100vh-16rem)] pr-1">
          {playlists.length === 0 ? (
            <div className="border border-dashed border-gold-warm/15 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-charcoal-light/10">
              <ListMusic className="w-8 h-8 text-cream-white/20 mb-2" />
              <p className="text-xs text-cream-white/45">No custom playlists created yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 text-xs text-gold-warm font-medium hover:underline"
              >
                Create one now
              </button>
            </div>
          ) : (
            playlists.map((playlist) => {
              const isActive = playlist.id === activePlaylistId;
              const hasSongs = playlist.songs.length > 0;
              return (
                <div
                  key={playlist.id}
                  onClick={() => setActivePlaylistId(playlist.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer border transition-all duration-300 group relative overflow-hidden ${
                    isActive
                      ? 'bg-emerald-deep/25 border-gold-warm/50 text-gold-warm shadow-md shadow-emerald-deep/10'
                      : 'bg-charcoal-light/30 border-transparent hover:bg-neutral-800/40 hover:border-gold-warm/15'
                  }`}
                >
                  <div className="flex items-center gap-3.5 overflow-hidden flex-1">
                    {/* Vinyl / Cover Stack */}
                    <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-950 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-md relative">
                      {hasSongs ? (
                        <img 
                          src={playlist.songs[0].thumbnail_url} 
                          alt={playlist.name} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                      ) : (
                        <ListMusic className="w-5 h-5 text-gold-warm/60" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-gold-warm fill-current" />
                      </div>
                    </div>

                    <div className="overflow-hidden flex-1">
                      <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-gold-warm' : 'text-cream-white'}`}>
                        {playlist.name}
                      </h4>
                      <p className="text-xs text-cream-white/50 mt-0.5">
                        {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                  </div>

                  {/* Play Hover Button */}
                  {hasSongs && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPlaylist(playlist);
                      }}
                      className="p-1.5 rounded-full bg-gold-warm/10 text-gold-warm hover:bg-gold-warm hover:text-charcoal-dark border border-gold-warm/20 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      title="Play entire playlist"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Playlist Song Details */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {activePlaylist ? (
            <motion.div
              key={activePlaylist.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {/* Header Panel */}
              <div className="relative rounded-2xl border border-gold-warm/25 overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-6 bg-charcoal-light/20 bg-noise">
                {/* Vintage cassette / vinyl playlist cover design */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-neutral-900 border-2 border-neutral-950 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-xl shadow-black/40 relative group">
                  {activePlaylist.songs.length > 0 ? (
                    <img 
                      src={activePlaylist.songs[0].thumbnail_url} 
                      alt="playlist art" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc className="w-12 h-12 text-gold-warm/40 animate-spin-slow" />
                  )}
                  <div className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center border-t-8 border-gold-warm/20 border-b-8">
                    <Music className="w-8 h-8 text-gold-warm/50" />
                    <span className="text-[9px] uppercase tracking-[0.25em] text-cream-white/30 font-sans mt-2">Naghma Tape</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between py-1 flex-1">
                  <div>
                    <h3 className="font-display font-bold text-3xl text-gold-warm tracking-wide">
                      {activePlaylist.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-cream-white/60 mt-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gold-warm/60" />
                        Created {formatDate(activePlaylist.createdAt)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gold-warm/60" />
                        {activePlaylist.songs.length} curated tracks
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    {activePlaylist.songs.length > 0 ? (
                      <button
                        onClick={() => handlePlayPlaylist(activePlaylist)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold-warm text-charcoal-dark font-display font-semibold hover:bg-gold-warm-hover shadow-lg shadow-gold-warm/15 transition-all transform active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Play All
                      </button>
                    ) : (
                      <div className="text-xs text-cream-white/40 italic">
                        Add songs to this playlist from the Search page.
                      </div>
                    )}
                    <button
                      onClick={() => {
                        const confirmDelete = window.confirm(`Are you sure you want to delete "${activePlaylist.name}"?`);
                        if (confirmDelete) {
                          deletePlaylist(activePlaylist.id);
                          setActivePlaylistId(null);
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-950/20 text-red-400 hover:bg-red-950/40 border border-red-500/10 hover:border-red-500/20 transition-all font-display text-xs font-semibold"
                      title="Delete Playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Playlist
                    </button>
                  </div>
                </div>
              </div>

              {/* Song list layout */}
              <div className="flex flex-col gap-2">
                <h4 className="font-display font-bold text-lg text-cream-white/90 border-b border-gold-warm/10 pb-2 mb-2">
                  Playlist Songs
                </h4>

                {activePlaylist.songs.length === 0 ? (
                  <div className="border border-dashed border-gold-warm/15 rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-charcoal-light/10">
                    <ListMusic className="w-10 h-10 text-gold-warm/40 mb-3" />
                    <h5 className="font-display font-semibold text-cream-white text-base">Your playlist is empty</h5>
                    <p className="text-xs text-cream-white/50 max-w-sm mt-1.5">
                      Explore classical music in the Search or Collections tab and click the add button to add them here.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {activePlaylist.songs.map((song, index) => (
                      <div
                        key={song.id}
                        onClick={() => playSong(song, activePlaylist.songs)}
                        className="flex items-center justify-between p-3 rounded-xl bg-charcoal-light/20 border border-transparent hover:border-gold-warm/15 hover:bg-neutral-800/30 cursor-pointer group transition-all duration-300"
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <span className="w-6 text-center text-xs text-cream-white/35 font-semibold font-sans group-hover:text-gold-warm">
                            {index + 1}
                          </span>
                          
                          {/* Image */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
                            <img src={song.thumbnail_url} alt={song.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-4 h-4 text-gold-warm fill-current" />
                            </div>
                          </div>

                          <div className="overflow-hidden flex-1">
                            <h5 className="text-sm font-semibold text-cream-white group-hover:text-gold-warm truncate transition-colors">
                              {song.title}
                            </h5>
                            <p className="text-xs text-cream-white/50 truncate mt-0.5">
                              {song.singer_name} {song.film_name ? `• ${song.film_name}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded border text-cream-white/40 border-cream-white/10 font-sans uppercase">
                            {song.genre}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSongFromPlaylist(activePlaylist.id, song.id);
                            }}
                            className="p-2 rounded-lg text-cream-white/30 hover:text-red-400 hover:bg-neutral-800/50 transition-colors"
                            title="Remove from playlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[300px] border border-dashed border-gold-warm/15 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-charcoal-light/10">
              <Music className="w-12 h-12 text-gold-warm/20 mb-3 animate-pulse" />
              <h3 className="font-display font-bold text-lg text-cream-white/70">
                Select a Playlist
              </h3>
              <p className="text-xs text-cream-white/45 max-w-xs mt-1.5">
                Choose a custom compilation from the sidebar or click "New" to start creating a vintage audio stack.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* CREATE PLAYLIST MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-charcoal-dark border border-gold-warm/35 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden bg-noise text-cream-white"
            >
              {/* Retro decorative borders */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold-warm/40"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold-warm/40"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold-warm/40"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold-warm/40"></div>

              <h3 className="font-display font-bold text-xl text-gold-warm mb-1 leading-none">
                Create Playlist
              </h3>
              <p className="text-[10px] text-cream-white/50 uppercase tracking-[0.2em] font-sans mb-5">
                نئی پلے لسٹ بنائیں
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-cream-white/60 mb-2 font-display uppercase tracking-wider">
                    Playlist Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="e.g., Classical Ghazal Radio"
                    className="w-full bg-neutral-900 border border-gold-warm/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-warm font-sans"
                    maxLength={32}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewPlaylistName('');
                    }}
                    className="px-4 py-2 rounded-xl text-cream-white/70 hover:bg-neutral-800 text-xs font-semibold font-display"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gold-warm hover:bg-gold-warm-hover text-charcoal-dark text-xs font-bold font-display shadow-md shadow-gold-warm/10"
                  >
                    Create Playlist
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
