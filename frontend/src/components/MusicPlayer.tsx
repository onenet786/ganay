import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, 
  Volume2, VolumeX, ListMusic, Maximize2, Minimize2, AlertCircle, Loader2, Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MusicPlayer() {
  const {
    currentSong, isPlaying, volume, isMuted, progress, duration, 
    shuffleMode, repeatMode, isFullScreen, queue, isLoadingStream, error,
    togglePlay, next, prev, seek, setVolume, toggleMute, toggleShuffle, 
    setRepeatMode, setFullScreen, removeFromQueue, clearQueue, playSong
  } = usePlayerStore();

  const [showQueue, setShowQueue] = useState(false);

  if (!currentSong) return null;

  // Format seconds to MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time) || time === null) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get decade color tint for vinyl record label
  const getDecadeColor = (decade?: string | null) => {
    switch (decade) {
      case '1950s':
      case '1960s':
        return 'bg-gold-warm border-gold-light';
      case '1970s':
        return 'bg-emerald-deep border-emerald-light';
      case '1980s':
        return 'bg-amber-800 border-amber-600'; // rust/orange
      case '1990s':
        return 'bg-teal-700 border-teal-500'; // teal/blue
      default:
        return 'bg-neutral-700 border-neutral-500';
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const repeatCycle = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  };

  return (
    <>
      {/* Bottom Mini Player Bar */}
      <div className={`fixed bottom-16 md:bottom-0 left-0 md:left-64 right-0 h-20 bg-charcoal-dark/95 backdrop-blur-md border-t border-gold-warm/20 flex items-center justify-between px-4 md:px-8 z-30 bg-noise text-cream-white transition-all duration-300 ${isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Track Details & Vinyl */}
        <div className="flex items-center gap-3 w-1/3 min-w-[180px]">
          {/* Vinyl Container */}
          <div 
            onClick={() => setFullScreen(true)}
            className="relative w-12 h-12 cursor-pointer rounded-full shadow-lg shadow-black/40 overflow-hidden flex-shrink-0 group"
          >
            {/* Grooved Vinyl Body */}
            <div 
              className={`w-full h-full rounded-full bg-neutral-900 border border-neutral-950 flex items-center justify-center relative transition-all duration-300 group-hover:scale-105 ${
                isPlaying ? 'animate-spin-slow' : 'animate-spin-slow-paused'
              }`}
              style={{
                background: 'radial-gradient(circle, transparent 20%, #111 20%, #111 21%, #222 21%, #222 28%, #111 28%, #111 29%, #222 29%, #222 36%, #111 36%, #111 37%, #222 37%, #222 45%, #111 45%, #111 46%, #333 46%, #333 50%)'
              }}
            >
              {/* Colored Decade Ring Label */}
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${getDecadeColor(currentSong.decade)}`}>
                {/* Center sticker (YouTube Thumbnail thumbnail) */}
                <img 
                  src={currentSong.thumbnail_url} 
                  alt="art" 
                  className="w-4 h-4 rounded-full object-cover border border-black/30"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            <h4 className="font-display font-medium text-sm truncate text-gold-warm cursor-pointer hover:underline" onClick={() => setFullScreen(true)}>
              {currentSong.title}
            </h4>
            <p className="text-xs text-cream-white/60 truncate">
              {currentSong.singer_name} {currentSong.film_name ? `• ${currentSong.film_name}` : ''}
            </p>
          </div>
        </div>

        {/* Player Controls (Center) */}
        <div className="flex flex-col items-center gap-1.5 w-1/3 max-w-[450px]">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleShuffle}
              className={`p-1.5 rounded-full transition-colors ${shuffleMode ? 'text-gold-warm' : 'text-cream-white/40 hover:text-cream-white'}`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button 
              onClick={prev}
              className="p-1.5 rounded-full text-cream-white/60 hover:text-cream-white transition-colors"
              title="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={togglePlay}
              disabled={isLoadingStream}
              className="w-9 h-9 rounded-full bg-gold-warm text-charcoal-dark flex items-center justify-center hover:bg-gold-light hover:scale-105 active:scale-95 transition-all shadow-md shadow-gold-warm/20"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoadingStream ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current text-charcoal-dark" />
              ) : (
                <Play className="w-5 h-5 fill-current text-charcoal-dark ml-0.5" />
              )}
            </button>
            <button 
              onClick={next}
              className="p-1.5 rounded-full text-cream-white/60 hover:text-cream-white transition-colors"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={repeatCycle}
              className={`p-1.5 rounded-full relative transition-colors ${repeatMode !== 'none' ? 'text-gold-warm' : 'text-cream-white/40 hover:text-cream-white'}`}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat className="w-4 h-4" />
              {repeatMode === 'one' && (
                <span className="absolute top-0 right-0 bg-gold-warm text-charcoal-dark text-[7px] w-2.5 h-2.5 rounded-full flex items-center justify-center font-bold">1</span>
              )}
            </button>
          </div>

          {/* Scrubber Timeline */}
          <div className="w-full flex items-center gap-2 text-[10px] text-cream-white/50 font-sans">
            <span>{formatTime(progress)}</span>
            <input 
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={handleSeekChange}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-gold-warm hover:h-1.5 transition-all"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Utility Actions (Right) */}
        <div className="flex items-center gap-3 w-1/3 justify-end">
          {error && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{error}</span>
            </div>
          )}

          <button 
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 rounded-full transition-colors ${showQueue ? 'text-gold-warm bg-neutral-800' : 'text-cream-white/60 hover:text-cream-white'}`}
            title="Queue"
          >
            <ListMusic className="w-5 h-5" />
          </button>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-2 group/volume">
            <button 
              onClick={toggleMute}
              className="p-1.5 text-cream-white/60 hover:text-cream-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input 
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 md:w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-gold-warm group-hover/volume:h-1.5 transition-all"
            />
          </div>

          <button 
            onClick={() => setFullScreen(true)}
            className="p-2 text-cream-white/60 hover:text-cream-white transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Drawer Overlay */}
      <AnimatePresence>
        {showQueue && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-20 md:bottom-24 right-4 w-80 max-h-[400px] bg-charcoal-light border border-gold-warm/20 rounded-xl shadow-2xl z-40 p-4 flex flex-col bg-noise text-cream-white overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gold-warm/10 mb-2">
              <h3 className="font-display font-medium text-gold-warm text-sm flex items-center gap-2">
                <ListMusic className="w-4 h-4" /> Playback Queue ({queue.length})
              </h3>
              {queue.length > 0 && (
                <button 
                  onClick={clearQueue}
                  className="text-[10px] text-red-400 hover:underline uppercase tracking-wider"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <div className="p-2 rounded bg-emerald-deep/20 border border-emerald-deep/30">
                <span className="text-[9px] uppercase tracking-wider text-gold-warm/80 font-bold block mb-1">Now Playing</span>
                <span className="font-medium text-xs block text-gold-warm truncate">{currentSong.title}</span>
                <span className="text-[10px] text-cream-white/60 block truncate">{currentSong.singer_name}</span>
              </div>

              {queue.length === 0 ? (
                <p className="text-center text-xs text-cream-white/30 py-8">Queue is empty</p>
              ) : (
                queue.map((song, i) => (
                  <div key={`${song.id}-${i}`} className="flex items-center justify-between p-2 rounded hover:bg-neutral-800/50 group text-xs border border-transparent hover:border-gold-warm/10">
                    <div className="overflow-hidden flex-1 cursor-pointer" onClick={() => playSong(song)}>
                      <span className="font-medium block truncate group-hover:text-gold-warm">{song.title}</span>
                      <span className="text-[10px] text-cream-white/50 block truncate">{song.singer_name}</span>
                    </div>
                    <button 
                      onClick={() => removeFromQueue(song.id)}
                      className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 px-1.5 py-0.5 text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Player Mode */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-charcoal-dark z-50 overflow-y-auto flex flex-col p-6 md:p-12 bg-noise text-cream-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between max-w-5xl w-full mx-auto mb-6">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-gold-warm" />
                <span className="font-display font-medium text-gold-warm text-sm uppercase tracking-widest">Now Playing</span>
              </div>
              <button 
                onClick={() => setFullScreen(false)}
                className="p-2 rounded-full border border-gold-warm/20 text-cream-white/60 hover:text-cream-white hover:bg-neutral-800 transition-all"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16 max-w-5xl w-full mx-auto my-auto py-4">
              
              {/* Vinyl Record Area (Left/Center) */}
              <div className="flex flex-col items-center">
                {/* Vintage record frame */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-gold-warm/20 p-2 bg-charcoal-light flex items-center justify-center">
                  
                  {/* Concentric grooved lines */}
                  <div 
                    className={`w-full h-full rounded-full bg-neutral-950 flex items-center justify-center relative transition-all duration-300 ${
                      isPlaying ? 'animate-spin-slow' : 'animate-spin-slow-paused'
                    }`}
                    style={{
                      background: 'radial-gradient(circle, transparent 18%, #0a0a0a 18%, #0a0a0a 19%, #151515 19%, #151515 25%, #050505 25%, #050505 26%, #151515 26%, #151515 32%, #050505 32%, #050505 33%, #151515 33%, #151515 40%, #050505 40%, #050505 41%, #151515 41%, #151515 48%, #050505 48%, #050505 49%, #222 49%, #222 55%, #111 55%, #111 56%, #222 56%, #222 62%, #111 62%, #111 63%, #333 63%, #333 67%)'
                    }}
                  >
                    {/* Color Decade Label */}
                    <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center shadow-inner ${getDecadeColor(currentSong.decade)}`}>
                      {/* Center photo sticker */}
                      <img 
                        src={currentSong.thumbnail_url} 
                        alt="cover" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-black/40 shadow-md"
                      />
                    </div>
                    {/* Center spindle hole */}
                    <div className="absolute w-4 h-4 bg-charcoal-dark rounded-full border border-gold-warm/40 shadow-inner"></div>
                  </div>

                  {/* Tonearm overlay (vintage needle) */}
                  <div className="absolute top-2 -right-4 w-24 h-40 pointer-events-none origin-top-left transition-transform duration-700"
                       style={{ transform: isPlaying ? 'rotate(18deg)' : 'rotate(0deg)' }}>
                    {/* SVG Tonearm */}
                    <svg viewBox="0 0 100 150" className="w-full h-full text-gold-warm/80 drop-shadow-md">
                      <path d="M10,10 L50,15 L60,80 L70,120 L68,135 L62,125" fill="none" stroke="currentColor" strokeWidth="4" />
                      <circle cx="10" cy="10" r="8" fill="currentColor" />
                      <rect x="58" y="125" width="12" height="15" rx="2" fill="currentColor" transform="rotate(10 64 132)" />
                    </svg>
                  </div>
                </div>

                {/* Decade Badge */}
                <div className="mt-8 px-4 py-1.5 rounded-full border border-gold-warm/30 bg-emerald-deep/20 text-gold-warm text-xs font-display tracking-widest uppercase shadow">
                  {currentSong.decade || 'Unknown Era'} Era
                </div>
              </div>

              {/* Controls and metadata (Right) */}
              <div className="flex-1 flex flex-col max-w-md w-full">
                <div className="text-center md:text-left mb-8">
                  <span className="text-gold-warm text-xs uppercase tracking-[0.2em] font-sans font-semibold mb-2 block">
                    {currentSong.genre || 'Classic Track'}
                  </span>
                  <h2 className="font-display font-bold text-3xl md:text-4xl text-cream-white leading-tight mb-2">
                    {currentSong.title}
                  </h2>
                  <p className="text-lg text-gold-warm/80 font-medium">
                    {currentSong.singer_name}
                  </p>
                  {currentSong.film_name && (
                    <p className="text-xs text-cream-white/50 italic mt-1 font-sans">
                      Featured in Film: "{currentSong.film_name}"
                    </p>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-sans">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Timeline Scrubber */}
                <div className="space-y-2 mb-8 font-sans">
                  <input 
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={progress}
                    onChange={handleSeekChange}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-gold-warm hover:h-2 transition-all"
                  />
                  <div className="flex justify-between text-xs text-cream-white/50">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Action Controllers */}
                <div className="flex flex-col gap-6 items-center">
                  <div className="flex items-center justify-between w-full max-w-[360px]">
                    <button 
                      onClick={toggleShuffle}
                      className={`p-2.5 rounded-full transition-colors ${shuffleMode ? 'text-gold-warm bg-gold-warm/10' : 'text-cream-white/40 hover:text-cream-white'}`}
                      title="Shuffle"
                    >
                      <Shuffle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={prev}
                      className="p-3 rounded-full text-cream-white/70 hover:text-cream-white hover:bg-neutral-800 transition-colors"
                      title="Previous"
                    >
                      <SkipBack className="w-7 h-7 fill-current" />
                    </button>
                    <button 
                      onClick={togglePlay}
                      disabled={isLoadingStream}
                      className="w-16 h-16 rounded-full bg-gold-warm text-charcoal-dark flex items-center justify-center hover:bg-gold-light hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gold-warm/10"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isLoadingStream ? (
                        <Loader2 className="w-7 h-7 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-7 h-7 fill-current text-charcoal-dark" />
                      ) : (
                        <Play className="w-7 h-7 fill-current text-charcoal-dark ml-1" />
                      )}
                    </button>
                    <button 
                      onClick={next}
                      className="p-3 rounded-full text-cream-white/70 hover:text-cream-white hover:bg-neutral-800 transition-colors"
                      title="Next"
                    >
                      <SkipForward className="w-7 h-7 fill-current" />
                    </button>
                    <button 
                      onClick={repeatCycle}
                      className={`p-2.5 rounded-full relative transition-colors ${repeatMode !== 'none' ? 'text-gold-warm bg-gold-warm/10' : 'text-cream-white/40 hover:text-cream-white'}`}
                      title={`Repeat: ${repeatMode}`}
                    >
                      <Repeat className="w-5 h-5" />
                      {repeatMode === 'one' && (
                        <span className="absolute top-1 right-1 bg-gold-warm text-charcoal-dark text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold">1</span>
                      )}
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-3 w-full max-w-[280px] group/vol-full">
                    <button 
                      onClick={toggleMute}
                      className="text-cream-white/60 hover:text-cream-white transition-colors"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input 
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-gold-warm group-hover/vol-full:h-1.5 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vintage Urdi Calligraphy Accent Overlay (purely decorative graphic element) */}
            <div className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 opacity-[0.03] select-none pointer-events-none text-center">
              <span className="urdu-text text-8xl block text-gold-warm leading-relaxed">
                موسیقی روح کی غذا ہے
              </span>
              <span className="font-display tracking-[0.4em] text-xs block text-gold-warm mt-2 uppercase">
                Purani Yaadein, Sunehri Baatein
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
export { AlertCircle };
