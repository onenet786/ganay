import { useEffect, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import type { Song } from '../store/usePlayerStore';
import CollectionCard from '../components/CollectionCard';
import type { Collection } from '../components/CollectionCard';
import SongCard from '../components/SongCard';
import { ArrowLeft, Play, ListMusic, Music, Sparkles, Library } from 'lucide-react';

interface CollectionsProps {
  selectedCollectionId: string | null;
  setSelectedCollectionId: (id: string | null) => void;
}

interface CollectionDetail extends Collection {
  songs?: Song[];
}

const BACKEND_URL = 'http://192.168.19.32:5000';

export default function Collections({ selectedCollectionId, setSelectedCollectionId }: CollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<CollectionDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { playSong, setQueue } = usePlayerStore();

  // Fetch collections list
  useEffect(() => {
    async function fetchCollections() {
      try {
        setLoadingList(true);
        const res = await fetch(`${BACKEND_URL}/api/collections`);
        if (!res.ok) throw new Error('Failed to load collections');
        const data = await res.json();
        setCollections(data);
      } catch (err) {
        console.error(err);
        setError('Could not retrieve collections.');
      } finally {
        setLoadingList(false);
      }
    }
    fetchCollections();
  }, []);

  // Fetch detailed collection if selected
  useEffect(() => {
    if (!selectedCollectionId) {
      setActiveCollection(null);
      return;
    }

    async function fetchDetail() {
      try {
        setLoadingDetail(true);
        const res = await fetch(`${BACKEND_URL}/api/collections/${selectedCollectionId}`);
        if (!res.ok) throw new Error('Failed to load collection details');
        const data = await res.json();
        setActiveCollection(data);
      } catch (err) {
        console.error(err);
        setError('Failed to open collection.');
      } finally {
        setLoadingDetail(false);
      }
    }
    fetchDetail();
  }, [selectedCollectionId]);

  // Queue all songs in this collection and start playing the first one
  const handlePlayCollection = () => {
    if (activeCollection && activeCollection.songs && activeCollection.songs.length > 0) {
      const list = activeCollection.songs;
      playSong(list[0]);
      if (list.length > 1) {
        setQueue(list.slice(1));
      } else {
        setQueue([]);
      }
    }
  };

  if (selectedCollectionId && activeCollection) {
    if (loadingDetail) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] text-gold-warm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-gold-warm border-t-transparent rounded-full animate-spin"></div>
            <p className="font-sans text-xs uppercase tracking-widest">Opening Sleeve...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 pb-24 md:pb-12">
        {/* Back Button */}
        <button
          onClick={() => setSelectedCollectionId(null)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gold-warm hover:text-gold-light uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Collections
        </button>

        {/* Collection Cover Banner */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 bg-charcoal-light/30 border border-gold-warm/15 rounded-2xl p-6 md:p-8 bg-noise relative">
          
          {/* Corner gold borders */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-gold-warm/30"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-gold-warm/30"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-gold-warm/30"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-gold-warm/30"></div>

          <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-gold-warm/30 shadow-2xl bg-neutral-900 flex-shrink-0 relative">
            {activeCollection.cover_image_url ? (
              <img src={activeCollection.cover_image_url} alt={activeCollection.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gold-warm bg-emerald-deep/20">
                <Library className="w-16 h-16" />
              </div>
            )}
            {activeCollection.is_curated !== false && (
              <span className="absolute top-2 right-2 bg-gold-warm text-charcoal-dark text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow">
                Curated
              </span>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <span className="text-[10px] text-gold-warm/75 font-sans font-semibold uppercase tracking-[0.2em] block">
              LOLlYWOOD MUSIC RECORD
            </span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-cream-white leading-tight">
              {activeCollection.name}
            </h2>
            <p className="text-xs md:text-sm text-cream-white/70 leading-relaxed font-sans max-w-2xl">
              {activeCollection.description || 'A timeless selection of classic records from the vintage archives of Pakistan.'}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-3 text-xs font-sans">
              <button
                onClick={handlePlayCollection}
                disabled={!activeCollection.songs || activeCollection.songs.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-lg bg-gold-warm hover:bg-gold-light text-charcoal-dark font-semibold uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current text-charcoal-dark" /> Play Sleeve
              </button>
              <span className="text-cream-white/40 flex items-center gap-1.5">
                <Music className="w-4 h-4 text-gold-warm" /> {activeCollection.songs?.length || 0} Tracks Available
              </span>
            </div>
          </div>
        </div>

        {/* Songs List */}
        <section className="space-y-3">
          <div className="pb-2 border-b border-gold-warm/10 flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-gold-warm" />
            <span className="font-display font-medium text-gold-warm text-sm uppercase tracking-wider">Record Tracklist</span>
          </div>

          {activeCollection.songs && activeCollection.songs.length > 0 ? (
            <div className="space-y-2">
              {activeCollection.songs.map((song, index) => (
                <SongCard 
                  key={song.id} 
                  song={song} 
                  index={index} 
                  layout="list"
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-cream-white/30 py-16">No tracks listed in this collection</p>
          )}
        </section>
      </div>
    );
  }

  // Collections List View (Grid)
  return (
    <div className="space-y-8 pb-24 md:pb-12">
      {/* Header */}
      <div className="border-b border-gold-warm/15 pb-4">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-gold-warm">
          Curated Archives
        </h2>
        <p className="text-xs text-cream-white/50 mt-1 font-sans">
          Select a sleeve to browse and queue pre-assembled vintage libraries.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 text-sm">
          {error}
        </div>
      )}

      {loadingList ? (
        <div className="flex items-center justify-center min-h-[40vh] text-gold-warm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-gold-warm border-t-transparent rounded-full animate-spin"></div>
            <p className="font-sans text-xs uppercase tracking-widest">Loading Archives...</p>
          </div>
        </div>
      ) : collections.length === 0 ? (
        <p className="text-center text-xs text-cream-white/30 py-20 font-sans">No collections curated yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onClick={() => setSelectedCollectionId(collection.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export { Sparkles };
