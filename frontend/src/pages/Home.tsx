import { useEffect, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import type { Song } from '../store/usePlayerStore';
import CollectionCard from '../components/CollectionCard';
import type { Collection } from '../components/CollectionCard';
import SongCard from '../components/SongCard';
import { Play, Sparkles, TrendingUp, Music, ArrowRight } from 'lucide-react';

interface HomeProps {
  setActiveTab: (tab: string) => void;
  setSelectedCollectionId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

const CLASSIC_SINGERS = [
  { name: "Mehdi Hassan", urdu: "مہدی حسن", searchQuery: "Mehdi Hassan ghazal", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" },
  { name: "Noor Jehan", urdu: "نور جہاں", searchQuery: "Madam Noor Jehan song", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
  { name: "Nusrat Fateh Ali", urdu: "نصرت فتح علی خان", searchQuery: "NFAK qawwali", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80" },
  { name: "Ghulam Ali", urdu: "غلام علی", searchQuery: "Ghulam Ali ghazal", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
  { name: "Iqbal Bano", urdu: "اقبال بانو", searchQuery: "Iqbal Bano classic", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80" },
  { name: "Nayyara Noor", urdu: "نیرہ نور", searchQuery: "Nayyara Noor song", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80" }
];

const BACKEND_URL = 'http://192.168.19.32:5000';

export default function Home({ setActiveTab, setSelectedCollectionId, setSearchQuery }: HomeProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [songOfTheDay, setSongOfTheDay] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayerStore();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch Collections
        const collectionsRes = await fetch(`${BACKEND_URL}/api/collections`);
        const collectionsData = await collectionsRes.json();
        setCollections(collectionsData);

        // Fetch Trending / Top Songs
        const trendingRes = await fetch(`${BACKEND_URL}/api/trending`);
        const trendingData = await trendingRes.json();
        setTrendingSongs(trendingData);

        // Fetch Song of the Day (randomly query from trending or discover)
        const discoverRes = await fetch(`${BACKEND_URL}/api/discover`);
        if (discoverRes.ok) {
          const discoverData = await discoverRes.json();
          setSongOfTheDay(discoverData);
        } else if (trendingData.length > 0) {
          setSongOfTheDay(trendingData[0]);
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSingerClick = (searchQueryStr: string) => {
    setSearchQuery(searchQueryStr);
    setActiveTab('search');
  };

  const handlePlaySongOfTheDay = () => {
    if (songOfTheDay) {
      playSong(songOfTheDay);
    }
  };

  const handleOpenCollection = (id: string) => {
    setSelectedCollectionId(id);
    setActiveTab('collections');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh] text-gold-warm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gold-warm border-t-transparent rounded-full animate-spin"></div>
          <p className="font-display text-sm tracking-widest uppercase">Khol Ke Rakh Rahe Hain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 md:pb-12">
      {/* Song of the Day (Hero Banner) */}
      {songOfTheDay && (
        <section className="relative rounded-2xl overflow-hidden border border-gold-warm/25 bg-emerald-deep bg-noise p-6 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-gold-warm/60"></div>
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-gold-warm/60"></div>
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-gold-warm/60"></div>
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-gold-warm/60"></div>

          <div className="flex-1 space-y-4 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-charcoal-dark/70 backdrop-blur px-3 py-1 rounded-full border border-gold-warm/30 text-gold-warm text-xs uppercase font-sans tracking-widest font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Song of the Day
            </div>
            <div>
              <h2 className="font-display font-bold text-3xl md:text-5xl text-cream-white leading-tight">
                {songOfTheDay.title}
              </h2>
              <p className="text-lg md:text-xl text-gold-warm font-medium mt-2">
                {songOfTheDay.singer_name} {songOfTheDay.film_name ? `(Film: ${songOfTheDay.film_name})` : ''}
              </p>
            </div>
            <p className="text-cream-white/70 text-xs md:text-sm max-w-xl leading-relaxed font-sans">
              "A masterpiece from the golden era of Pakistani music. Touch play to trigger our analog-feel stream resolved from the vintage archives."
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <button 
                onClick={handlePlaySongOfTheDay}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-gold-warm hover:bg-gold-light text-charcoal-dark font-semibold text-sm shadow-xl shadow-gold-warm/15 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current text-charcoal-dark" /> Play Now
              </button>
              <button 
                onClick={() => handleSingerClick(songOfTheDay.singer_name)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gold-warm/30 text-gold-warm hover:bg-charcoal-dark/50 hover:border-gold-warm font-medium text-sm transition-all"
              >
                Discover Artist
              </button>
            </div>
          </div>

          {/* Album sleeve graphic layout (Right) */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0 z-10">
            {/* Vinyl record slipping out */}
            <div className="absolute w-44 h-44 md:w-52 md:h-52 rounded-full bg-neutral-950 top-2 right-[-24px] shadow-lg animate-spin-slow z-0"
                 style={{
                   background: 'radial-gradient(circle, transparent 20%, #111 20%, #111 21%, #222 21%, #222 28%, #111 28%, #111 29%, #222 29%, #222 36%, #111 36%, #111 37%, #222 37%, #222 45%, #111 45%, #111 46%, #333 46%, #333 50%)'
                 }}
            >
              <div className="absolute inset-0 m-auto w-12 h-12 rounded-full border-2 border-emerald-deep bg-charcoal-dark"></div>
            </div>
            
            {/* Record cover art */}
            <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-gold-warm/40 shadow-2xl z-10 bg-neutral-900">
              <img 
                src={songOfTheDay.thumbnail_url} 
                alt="Song of the Day Cover" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Curated Collections (Grid) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gold-warm/15 pb-2">
          <h3 className="font-display font-bold text-2xl text-gold-warm flex items-center gap-2">
            <Music className="w-5 h-5 text-gold-warm" /> Curated Collections
          </h3>
          <button 
            onClick={() => setActiveTab('collections')}
            className="text-xs text-gold-warm hover:text-gold-light flex items-center gap-1 font-semibold uppercase tracking-wider transition-colors"
          >
            See All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.slice(0, 3).map((collection) => (
            <CollectionCard 
              key={collection.id} 
              collection={collection} 
              onClick={() => handleOpenCollection(collection.id)}
            />
          ))}
        </div>
      </section>

      {/* Classic Singers Shelf */}
      <section className="space-y-4">
        <div className="border-b border-gold-warm/15 pb-2">
          <h3 className="font-display font-bold text-2xl text-gold-warm">
            Masters of the Golden Era
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CLASSIC_SINGERS.map((singer, i) => (
            <div 
              key={i}
              onClick={() => handleSingerClick(singer.searchQuery)}
              className="group bg-charcoal-light/40 border border-gold-warm/10 hover:border-gold-warm/30 rounded-xl p-3 text-center cursor-pointer transition-all duration-300 bg-noise hover:shadow-lg"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border border-gold-warm/20 mx-auto mb-3 relative group-hover:scale-105 transition-transform duration-300">
                <img src={singer.img} alt={singer.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <h4 className="font-display font-semibold text-xs text-cream-white group-hover:text-gold-warm transition-colors truncate">
                {singer.name}
              </h4>
              {/* Urdu script label */}
              <span className="urdu-text text-sm text-gold-warm/65 group-hover:text-gold-warm block font-normal mt-1 leading-none select-none">
                {singer.urdu}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Trending & Popular Tracks */}
      <section className="space-y-4">
        <div className="border-b border-gold-warm/15 pb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold-warm" />
          <h3 className="font-display font-bold text-2xl text-gold-warm">
            Trending Classics
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendingSongs.slice(0, 6).map((song, index) => (
            <SongCard 
              key={song.id} 
              song={song} 
              index={index} 
              layout="list"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
