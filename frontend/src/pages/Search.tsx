import { useEffect, useState, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import type { Song } from '../store/usePlayerStore';
import SongCard from '../components/SongCard';
import { Search as SearchIcon, Shuffle, X } from 'lucide-react';

interface SearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface MoodCategory {
  id: string;
  name: string;
  urduName: string;
  description: string;
  gradient: string;
  icon: string;
}

const MOODS: MoodCategory[] = [
  {
    id: 'romantic',
    name: 'Romantic',
    urduName: 'رومانوی - عشق',
    description: 'Songs of love, longing, and romance',
    gradient: 'from-pink-500/20 to-red-500/10 border-pink-500/30 hover:border-pink-500/70 hover:from-pink-500/30 hover:to-red-500/20 text-pink-300',
    icon: '❤️'
  },
  {
    id: 'sad',
    name: 'Sad & Sorrowful',
    urduName: 'دردناک - غم',
    description: 'Melancholic tracks of heartbreak and separation',
    gradient: 'from-blue-600/20 to-indigo-700/10 border-blue-500/30 hover:border-blue-500/70 hover:from-blue-600/30 hover:to-indigo-700/20 text-blue-300',
    icon: '😢'
  },
  {
    id: 'happy',
    name: 'Happy & Upbeat',
    urduName: 'خوش مزاج - مستی',
    description: 'Lively, joyful, and dancing classic tunes',
    gradient: 'from-amber-400/20 to-yellow-500/10 border-amber-400/30 hover:border-amber-400/70 hover:from-amber-400/30 hover:to-yellow-500/20 text-amber-300',
    icon: '☀️'
  },
  {
    id: 'sufi',
    name: 'Sufi & Devotional',
    urduName: 'صوفیانہ - قوالی',
    description: 'Mystical Sufi tracks, qawwalis, and spiritual poetry',
    gradient: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/30 hover:border-emerald-500/70 hover:from-emerald-500/30 hover:to-teal-600/20 text-emerald-300',
    icon: '🕌'
  },
  {
    id: 'ghazal',
    name: 'Soulful Ghazals',
    urduName: 'سکون - غزل',
    description: 'Poetic, slow, and soothing classics',
    gradient: 'from-purple-500/20 to-violet-600/10 border-purple-500/30 hover:border-purple-500/70 hover:from-purple-500/30 hover:to-violet-600/20 text-purple-300',
    icon: '✍️'
  },
  {
    id: 'patriotic',
    name: 'Patriotic',
    urduName: 'ملی نغمے - وطن',
    description: 'National pride and patriotic melodies',
    gradient: 'from-green-600/25 to-emerald-700/15 border-green-500/30 hover:border-green-500/70 hover:from-green-600/35 hover:to-emerald-700/25 text-green-300',
    icon: '🇵🇰🇮🇳'
  },
  {
    id: 'retro',
    name: 'Nostalgic Retro',
    urduName: 'یادیں - پرانا',
    description: 'Nostalgic hits invoking gold retro memories',
    gradient: 'from-yellow-600/25 to-amber-700/15 border-yellow-500/30 hover:border-yellow-500/70 hover:from-yellow-600/35 hover:to-amber-700/25 text-yellow-200',
    icon: '📻'
  },
  {
    id: 'playful',
    name: 'Playful & Flirty',
    urduName: 'شرارت - چنچل',
    description: 'Playful, cheeky, and coquettish film hits',
    gradient: 'from-orange-500/20 to-red-500/10 border-orange-500/30 hover:border-orange-500/70 hover:from-orange-500/30 hover:to-red-500/20 text-orange-300',
    icon: '😜'
  },
  {
    id: 'classical',
    name: 'Classical / Raag',
    urduName: 'کلاسیکی - راگ',
    description: 'Raga-based classical masterworks',
    gradient: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 hover:border-cyan-500/70 hover:from-cyan-500/30 hover:to-teal-500/20 text-cyan-300',
    icon: '🎵'
  },
  {
    id: 'heartbroken',
    name: 'Heartbroken',
    urduName: 'تنہائی - اجڑا دل',
    description: 'For lonely nights and quiet grief',
    gradient: 'from-slate-600/20 to-neutral-700/15 border-slate-500/30 hover:border-slate-500/70 hover:from-slate-600/30 hover:to-neutral-700/20 text-slate-300',
    icon: '💔'
  },
  {
    id: 'philosophical',
    name: 'Philosophical',
    urduName: 'فلسفہ - زندگی',
    description: 'Songs on life, destiny, and the universe',
    gradient: 'from-fuchsia-600/20 to-purple-700/15 border-fuchsia-500/30 hover:border-fuchsia-500/70 hover:from-fuchsia-600/30 hover:to-purple-700/20 text-fuchsia-300',
    icon: '🌌'
  },
  {
    id: 'rain',
    name: 'Monsoon & Rain',
    urduName: 'برکھا - ساون',
    description: 'Melodies of showers, clouds, and sweet rain',
    gradient: 'from-sky-500/20 to-blue-500/10 border-sky-400/30 hover:border-sky-400/70 hover:from-sky-500/30 hover:to-blue-500/20 text-sky-300',
    icon: '🌧️'
  }
];

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://192.168.19.32:5000';

export default function Search({ searchQuery, setSearchQuery }: SearchProps) {
  const { playSong } = usePlayerStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Trigger search whenever query, mood, or country changes
  useEffect(() => {
    // If no mood is selected, don't auto-fetch empty search
    if (!selectedMood && !searchQuery) {
      setSongs([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      triggerSearch();
    }, 450); // Debounce API calls

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedMood, selectedCountry]);

  async function triggerSearch() {
    setLoading(true);
    setError(null);
    try {
      // Build query string params
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedMood) params.append('mood', selectedMood);
      if (selectedCountry && selectedCountry !== 'all') params.append('country', selectedCountry);

      const res = await fetch(`${BACKEND_URL}/api/search?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      
      const data = await res.json();
      setSongs(data);
    } catch (err: any) {
      console.error(err);
      setError('Could not complete search. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  }

  // Surprise Me / Play Random Song
  const handleSurpriseMe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/discover`);
      if (!res.ok) throw new Error('Failed to discover random song');
      const song = await res.json();
      playSong(song);
    } catch (err) {
      console.error(err);
      setError('Could not discover a random song right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedMood('');
    setSelectedCountry('all');
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  const activeMoodObj = MOODS.find(m => m.id === selectedMood);

  return (
    <div className="space-y-8 pb-24 md:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gold-warm/15 pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-gold-warm">
            Mood Soundscapes
          </h2>
          <p className="text-xs text-cream-white/50 mt-1 font-sans">
            Select a mood to dynamically scan and stream retro Pakistani & Indian classics.
          </p>
        </div>

        {/* Surprise Me Button */}
        <button
          onClick={handleSurpriseMe}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-deep hover:bg-emerald-light border border-gold-warm/30 text-gold-warm font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex-shrink-0"
        >
          <Shuffle className="w-3.5 h-3.5" /> Surprise Me
        </button>
      </div>

      {/* Main Mood Selection & Search Area */}
      {!selectedMood ? (
        <div className="space-y-6">
          <div className="text-center py-6 border border-dashed border-gold-warm/25 rounded-2xl bg-charcoal-light/10 relative overflow-hidden bg-noise">
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-gold-warm/30"></div>
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-gold-warm/30"></div>
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-gold-warm/30"></div>
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-gold-warm/30"></div>
            <h3 className="font-display text-lg text-gold-warm font-semibold mb-1">
              Suno Aur Kho Jao
            </h3>
            <p className="text-xs text-cream-white/50 font-sans max-w-md mx-auto mb-3">
              Select one of our curated emotional frequencies below to start streaming vintage archives.
            </p>

            {/* Country Toggle Group */}
            <div className="flex items-center justify-center gap-2 p-1 border border-gold-warm/15 rounded-xl bg-charcoal-dark/60 backdrop-blur w-fit mx-auto shadow-inner">
              <button
                onClick={() => setSelectedCountry('all')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  selectedCountry === 'all'
                    ? 'bg-gold-warm text-charcoal-dark shadow'
                    : 'text-cream-white/60 hover:text-cream-white'
                }`}
              >
                🌍 All Countries
              </button>
              <button
                onClick={() => setSelectedCountry('pakistan')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  selectedCountry === 'pakistan'
                    ? 'bg-gold-warm text-charcoal-dark shadow'
                    : 'text-cream-white/60 hover:text-cream-white'
                }`}
              >
                <span>🇵🇰</span> Pakistan Only
              </button>
              <button
                onClick={() => setSelectedCountry('india')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  selectedCountry === 'india'
                    ? 'bg-gold-warm text-charcoal-dark shadow'
                    : 'text-cream-white/60 hover:text-cream-white'
                }`}
              >
                <span>🇮🇳</span> India Only
              </button>
            </div>
          </div>

          {/* Grid of Mood Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={`group relative flex flex-col items-start text-left p-5 rounded-xl border bg-gradient-to-br transition-all-300 cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.02] bg-noise ${mood.gradient}`}
              >
                <div className="absolute top-3 right-4 text-2xl group-hover:scale-110 transition-transform duration-300 select-none">
                  {mood.icon}
                </div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-gold-warm/75 mb-1">
                  Mood Filter
                </span>
                <h4 className="font-display font-bold text-lg text-cream-white mb-0.5 group-hover:text-gold-light transition-colors">
                  {mood.name}
                </h4>
                <span className="urdu-text text-sm font-semibold mb-3 leading-none opacity-80">
                  {mood.urduName}
                </span>
                <p className="text-xs text-cream-white/60 leading-relaxed font-sans line-clamp-2">
                  {mood.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Mood Details Card */}
          <div className={`p-6 rounded-xl border bg-gradient-to-br bg-noise relative ${activeMoodObj?.gradient}`}>
            {/* Vintage border corners */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-gold-warm/30"></div>
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-gold-warm/30"></div>
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-gold-warm/30"></div>
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-gold-warm/30"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold-warm/80">
                  Active Frequency {activeMoodObj?.icon}
                </span>
                <h3 className="font-display text-2xl font-bold text-cream-white mt-1">
                  {activeMoodObj?.name} <span className="urdu-text text-lg mr-2 leading-none">{activeMoodObj?.urduName}</span>
                </h3>
                <p className="text-xs text-cream-white/70 font-sans mt-2 max-w-xl">
                  {activeMoodObj?.description}. Restricting YouTube search query to {selectedCountry === 'all' ? 'Pakistani and Indian' : selectedCountry === 'pakistan' ? 'Pakistani' : 'Indian'} retro hits.
                </p>
              </div>

              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-charcoal-dark/70 hover:bg-charcoal-dark border border-gold-warm/35 text-gold-warm rounded-lg text-xs font-semibold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex-shrink-0"
              >
                Change Mood
              </button>
            </div>

            {/* Quick Switch & Country toggle Bar */}
            <div className="mt-4 pt-4 border-t border-gold-warm/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-[10px] text-gold-warm/70 font-semibold uppercase tracking-wider flex-shrink-0 mr-2">
                  Quick Switch:
                </span>
                <div className="flex gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMood(m.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-sans border transition-all flex-shrink-0 ${
                        selectedMood === m.id
                          ? 'bg-gold-warm text-charcoal-dark border-gold-warm font-semibold'
                          : 'bg-charcoal-dark/40 border-gold-warm/15 text-cream-white/60 hover:border-gold-warm/40 hover:text-cream-white'
                      }`}
                    >
                      {m.icon} {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Selection inside active card */}
              <div className="flex items-center gap-1 bg-charcoal-dark/50 border border-gold-warm/20 rounded-lg p-0.5 self-start md:self-auto flex-shrink-0">
                <button
                  onClick={() => setSelectedCountry('all')}
                  className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                    selectedCountry === 'all'
                      ? 'bg-gold-warm text-charcoal-dark'
                      : 'text-cream-white/50 hover:text-cream-white'
                  }`}
                >
                  🌍 All
                </button>
                <button
                  onClick={() => setSelectedCountry('pakistan')}
                  className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                    selectedCountry === 'pakistan'
                      ? 'bg-gold-warm text-charcoal-dark'
                      : 'text-cream-white/50 hover:text-cream-white'
                  }`}
                >
                  🇵🇰 PK
                </button>
                <button
                  onClick={() => setSelectedCountry('india')}
                  className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                    selectedCountry === 'india'
                      ? 'bg-gold-warm text-charcoal-dark'
                      : 'text-cream-white/50 hover:text-cream-white'
                  }`}
                >
                  🇮🇳 IN
                </button>
              </div>
            </div>
          </div>

          {/* Search Box inside Active Mood */}
          <div className="space-y-4">
            <div className="relative w-full max-w-2xl">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search singer/song/film in ${activeMoodObj?.name} (e.g. Noor Jehan, Rafi, Kishore)...`}
                className="w-full bg-charcoal-light/70 border border-gold-warm/25 focus:border-gold-warm rounded-xl pl-12 pr-4 py-3.5 text-cream-white placeholder-cream-white/35 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-gold-warm/40 shadow-inner bg-noise transition-all"
              />
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cream-white/35" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-800 text-cream-white/50"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 text-sm font-sans">
          {error}
        </div>
      )}

      {/* Search Loading Spinner / Results Container */}
      {selectedMood || searchQuery ? (
        loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-gold-warm border-t-transparent rounded-full animate-spin"></div>
              <p className="font-sans text-xs text-cream-white/40 uppercase tracking-widest">Searching Archives...</p>
            </div>
          </div>
        ) : songs.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-gold-warm/10 rounded-2xl bg-charcoal-light/10 bg-noise relative">
            <SearchIcon className="w-12 h-12 text-cream-white/20 mb-4" />
            <h3 className="font-display font-medium text-cream-white text-base">No classic records found</h3>
            <p className="text-xs text-cream-white/40 max-w-sm mt-1 leading-relaxed font-sans">
              Try removing the keyword filter or searching for a different singer. You can also quick-switch moods or change country settings above.
            </p>
          </div>
        ) : (
          /* Results Grid */
          <section className="space-y-4">
            <div className="text-xs text-cream-white/40 font-sans flex items-center justify-between">
              <span>Showing {songs.length} vintage tracks for {activeMoodObj?.name || 'All'} mood ({selectedCountry === 'all' ? 'All Countries' : selectedCountry === 'pakistan' ? 'Pakistan Only' : 'India Only'})</span>
              {searchQuery && <span>Filtered by: "{searchQuery}"</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {songs.map((song) => (
                <SongCard key={song.id} song={song} layout="grid" />
              ))}
            </div>
          </section>
        )
      ) : null}
    </div>
  );
}
export { SearchIcon };
