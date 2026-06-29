import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import type { Song } from '../store/usePlayerStore';
import { Play, Plus, Volume2, ListPlus } from 'lucide-react';

interface SongCardProps {
  song: Song;
  index?: number;
  layout?: 'grid' | 'list';
  contextQueue?: Song[];
}

export default function SongCard({ song, index, layout = 'grid', contextQueue }: SongCardProps) {
  const { 
    currentSong, isPlaying, playSong, addToQueue, playlists, addSongToPlaylist, createPlaylist 
  } = usePlayerStore();

  const [showPlaylists, setShowPlaylists] = useState(false);
  const [quickPlaylistName, setQuickPlaylistName] = useState('');

  const isCurrent = currentSong?.id === song.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSong(song, contextQueue);
  };

  const handleAddQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(song);
  };

  const handlePlaylistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPlaylists(!showPlaylists);
  };

  // Helper to determine decade badge color
  const getDecadeClass = (dec?: string | null) => {
    switch (dec) {
      case '1950s':
      case '1960s':
        return 'text-gold-warm bg-gold-warm/10 border-gold-warm/20';
      case '1970s':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case '1980s':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
    }
  };

  // Playlist Dropdown render utility
  const renderPlaylistDropdown = (isListLayout: boolean) => {
    if (!showPlaylists) return null;
    return (
      <>
        {/* Backdrop for outside click */}
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={(e) => {
            e.stopPropagation();
            setShowPlaylists(false);
          }} 
        />
        {/* Popover container */}
        <div 
          className={`absolute ${
            isListLayout ? 'right-12 top-10' : 'right-4 bottom-14'
          } w-52 bg-charcoal-dark/95 border border-gold-warm/30 rounded-xl shadow-2xl z-50 p-2 text-cream-white text-left text-xs bg-noise`}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-2 py-1 text-[10px] text-cream-white/40 uppercase tracking-wider font-semibold border-b border-gold-warm/10 mb-1">
            Add to Playlist
          </p>
          <div className="max-h-32 overflow-y-auto space-y-0.5 custom-scrollbar">
            {playlists.length === 0 ? (
              <p className="px-2 py-1 text-cream-white/40 italic text-[11px]">No playlists found</p>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => {
                    addSongToPlaylist(pl.id, song);
                    setShowPlaylists(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-emerald-deep/30 hover:text-gold-warm transition-colors truncate font-sans text-[11px] block"
                >
                  {pl.name}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-gold-warm/10 mt-2 pt-2 px-1">
            <input
              type="text"
              placeholder="New playlist name..."
              value={quickPlaylistName}
              onChange={(e) => setQuickPlaylistName(e.target.value)}
              className="w-full bg-neutral-900 border border-gold-warm/15 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-gold-warm text-cream-white placeholder-cream-white/35 font-sans"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (quickPlaylistName.trim()) {
                    createPlaylist(quickPlaylistName.trim());
                    setQuickPlaylistName('');
                  }
                }
              }}
            />
            <span className="text-[8px] text-cream-white/30 block mt-1 text-center font-sans">Press Enter to create</span>
          </div>
        </div>
      </>
    );
  };

  if (layout === 'list') {
    return (
      <div 
        onClick={() => playSong(song, contextQueue)}
        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-300 group relative ${
          isCurrent 
            ? 'bg-emerald-deep/20 border-gold-warm/40 text-gold-warm' 
            : 'bg-charcoal-light/40 border-transparent hover:bg-neutral-800/40 hover:border-gold-warm/10'
        }`}
      >
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          {/* Index or Icon */}
          <div className="w-6 text-center text-cream-white/35 text-xs font-semibold font-sans">
            {isCurrent && isPlaying ? (
              <Volume2 className="w-4 h-4 text-gold-warm animate-bounce mx-auto" />
            ) : (
              index !== undefined ? index + 1 : <Play className="w-3 h-3 text-cream-white/50 group-hover:text-gold-warm mx-auto" />
            )}
          </div>

          {/* Cover thumbnail */}
          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 relative border border-gold-warm/10">
            <img src={song.thumbnail_url} alt={song.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-4 h-4 text-gold-warm fill-current" />
            </div>
          </div>

          {/* Details */}
          <div className="overflow-hidden flex-1">
            <h4 className={`text-sm font-medium truncate ${isCurrent ? 'text-gold-warm' : 'text-cream-white group-hover:text-gold-warm'}`}>
              {song.title}
            </h4>
            <p className="text-xs text-cream-white/50 truncate">
              {song.singer_name} {song.film_name ? `• ${song.film_name}` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 ml-4 relative">
          <span className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded border ${getDecadeClass(song.decade)}`}>
            {song.decade}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-cream-white/40 uppercase tracking-widest font-sans">
            {song.genre}
          </span>
          <button 
            onClick={handleAddQueue}
            className="p-1.5 rounded text-cream-white/40 hover:text-gold-warm hover:bg-neutral-800 transition-colors"
            title="Add to queue"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={handlePlaylistClick}
            className={`p-1.5 rounded transition-colors relative z-10 ${
              showPlaylists ? 'text-gold-warm bg-neutral-800' : 'text-cream-white/40 hover:text-gold-warm hover:bg-neutral-800'
            }`}
            title="Add to playlist"
          >
            <ListPlus className="w-4 h-4" />
          </button>
          
          {renderPlaylistDropdown(true)}
        </div>
      </div>
    );
  }

  // Grid Layout with Premium Slide-out Vinyl Animation
  return (
    <div 
      onClick={() => playSong(song, contextQueue)}
      className="relative flex flex-col bg-charcoal-light/60 border border-gold-warm/10 hover:border-gold-warm/25 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/30 group overflow-visible bg-noise"
    >
      {/* Vinyl Slide-out Container */}
      <div className="relative w-full aspect-video rounded-lg overflow-visible mb-4 flex items-center justify-center">
        
        {/* Vinyl Disc (Hidden & slides out on hover) */}
        <div 
          className="absolute w-28 h-28 rounded-full bg-neutral-950 border border-neutral-900 shadow-lg flex items-center justify-center transition-all duration-500 ease-out left-1/2 -translate-x-1/2 group-hover:left-[60%] group-hover:rotate-45 group-hover:scale-105 z-0"
          style={{
            background: 'radial-gradient(circle, transparent 20%, #111 20%, #111 21%, #222 21%, #222 28%, #111 28%, #111 29%, #222 29%, #222 36%, #111 36%, #111 37%, #222 37%, #222 45%, #111 45%, #111 46%, #333 46%, #333 50%)'
          }}
        >
          {/* Label color border */}
          <div className="w-10 h-10 rounded-full border border-black/20 bg-charcoal-dark flex items-center justify-center">
            {/* spindle hole */}
            <div className="w-2.5 h-2.5 bg-neutral-800 rounded-full"></div>
          </div>
        </div>

        {/* Record Sleeve (Foreground Cover Art) */}
        <div className="relative w-full h-full rounded-lg overflow-hidden border border-gold-warm/20 shadow-md z-10 bg-neutral-900">
          <img 
            src={song.thumbnail_url} 
            alt={song.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Cover Overlay with Play Button */}
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2.5 z-20">
            <button 
              onClick={handlePlay}
              className="w-11 h-11 rounded-full bg-gold-warm text-charcoal-dark flex items-center justify-center hover:bg-gold-light hover:scale-110 transition-all shadow-lg"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
            <button 
              onClick={handleAddQueue}
              className="w-9 h-9 rounded-full bg-neutral-800/90 text-cream-white border border-gold-warm/20 flex items-center justify-center hover:bg-neutral-700 hover:text-gold-warm hover:scale-105 transition-all shadow"
              title="Add to queue"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={handlePlaylistClick}
              className={`w-9 h-9 rounded-full border flex items-center justify-center hover:scale-105 transition-all shadow relative ${
                showPlaylists 
                  ? 'bg-gold-warm text-charcoal-dark border-gold-warm' 
                  : 'bg-neutral-800/90 text-cream-white border-gold-warm/20 hover:bg-neutral-700 hover:text-gold-warm'
              }`}
              title="Add to playlist"
            >
              <ListPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Current track indicator banner */}
          {isCurrent && (
            <div className="absolute top-2 left-2 bg-emerald-deep text-gold-warm border border-gold-warm/30 text-[9px] px-2 py-0.5 rounded font-sans uppercase font-bold tracking-wider z-20">
              {isPlaying ? 'Playing' : 'Paused'}
            </div>
          )}

          {/* Decade Label (Bottom-right label) */}
          <div className="absolute bottom-2 right-2 bg-charcoal-dark/85 backdrop-blur-sm border border-gold-warm/20 text-[9px] px-2 py-0.5 rounded text-gold-warm font-sans font-semibold z-20">
            {song.decade}
          </div>
        </div>
      </div>

      {/* Info details */}
      <div className="flex-1 flex flex-col justify-between z-10 relative">
        <div>
          <h4 className="font-display font-semibold text-sm line-clamp-1 group-hover:text-gold-warm transition-colors text-cream-white">
            {song.title}
          </h4>
          <p className="text-xs text-cream-white/60 truncate mt-1">
            {song.singer_name}
          </p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gold-warm/10 text-[10px] text-cream-white/40 uppercase tracking-widest font-sans">
          <span>{song.genre}</span>
          {song.film_name && (
            <span className="truncate max-w-[100px] text-right italic font-normal">
              {song.film_name}
            </span>
          )}
        </div>
        
        {/* Playlist popover render for grid view */}
        {renderPlaylistDropdown(false)}
      </div>
    </div>
  );
}
export { Volume2 };
