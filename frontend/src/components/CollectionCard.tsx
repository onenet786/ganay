import { Library, Sparkles } from 'lucide-react';

export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
  is_curated?: boolean;
}

interface CollectionCardProps {
  collection: Collection;
  onClick: () => void;
}

export default function CollectionCard({ collection, onClick }: CollectionCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col bg-charcoal-light border border-gold-warm/15 hover:border-gold-warm/40 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/40 bg-noise hover:-translate-y-1"
    >
      {/* Decorative Gold Corner Borders (Signature Detail) */}
      <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-gold-warm/40 opacity-50 group-hover:opacity-100 group-hover:w-3.5 group-hover:h-3.5 transition-all"></div>
      <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-gold-warm/40 opacity-50 group-hover:opacity-100 group-hover:w-3.5 group-hover:h-3.5 transition-all"></div>
      <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-gold-warm/40 opacity-50 group-hover:opacity-100 group-hover:w-3.5 group-hover:h-3.5 transition-all"></div>
      <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-gold-warm/40 opacity-50 group-hover:opacity-100 group-hover:w-3.5 group-hover:h-3.5 transition-all"></div>

      {/* Cover Artwork wrapper */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gold-warm/20 shadow-md mb-4 bg-neutral-900">
        {collection.cover_image_url ? (
          <img 
            src={collection.cover_image_url} 
            alt={collection.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-deep/20 text-gold-warm">
            <Library className="w-12 h-12" />
          </div>
        )}
        
        {/* Curated Sparkle Badge */}
        {collection.is_curated !== false && (
          <div className="absolute top-2 right-2 bg-gold-warm text-charcoal-dark border border-gold-light/40 text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded flex items-center gap-1 shadow">
            <Sparkles className="w-2.5 h-2.5" /> Curated
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-emerald-deep/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="px-4 py-2 border border-gold-warm bg-charcoal-dark/85 text-gold-warm text-xs uppercase tracking-widest font-sans rounded shadow-lg font-medium">
            Open Record
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-bold text-base text-gold-warm group-hover:text-gold-light transition-colors line-clamp-1">
            {collection.name}
          </h3>
          <p className="text-xs text-cream-white/60 line-clamp-2 mt-2 leading-relaxed font-sans">
            {collection.description || 'A beautiful selection of classic records from the vintage archives of Pakistan.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 mt-4 text-[10px] text-cream-white/40 uppercase tracking-widest font-sans">
          <Library className="w-3.5 h-3.5 text-gold-warm" />
          <span>Lollywood Archives</span>
        </div>
      </div>
    </div>
  );
}
export { Library };
