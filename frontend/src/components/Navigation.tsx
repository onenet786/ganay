import { Home, Search, Library, Music } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'collections', label: 'Collections', icon: Library },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-charcoal-dark border-r border-gold-warm/20 p-6 fixed left-0 top-0 text-cream-white bg-noise z-30">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-10 mt-2 px-2">
          <div className="bg-emerald-deep p-2.5 rounded-full border border-gold-warm/40 shadow-lg shadow-emerald-deep/20">
            <Music className="w-6 h-6 text-gold-warm animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-wide text-gold-warm mb-0 leading-none">
              Naghma
            </h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-cream-white/50 block mt-1">
              Purani Yaadein
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 space-y-2">
          <span className="px-3 text-[11px] uppercase tracking-wider font-semibold text-gold-warm/60 block mb-3">
            Menu
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all-300 group ${
                  isActive
                    ? 'bg-emerald-deep text-gold-warm border-l-4 border-gold-warm shadow-md shadow-emerald-deep/20'
                    : 'text-cream-white/70 hover:text-gold-warm hover:bg-emerald-light/20'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-gold-warm' : 'text-cream-white/50 group-hover:text-gold-warm'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Vintage Ornament Frame (Bottom decoration) */}
        <div className="mt-auto border border-gold-warm/20 p-4 rounded-lg relative overflow-hidden bg-emerald-deep/10 bg-noise">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold-warm/50"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold-warm/50"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gold-warm/50"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold-warm/50"></div>
          <p className="text-center font-display text-xs text-gold-warm/95 italic">
            "Suno Aur Kho Jao"
          </p>
          <p className="text-center text-[10px] text-cream-white/40 mt-1 uppercase tracking-widest font-sans">
            Classic Archives
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-charcoal-dark/95 backdrop-blur-lg border-t border-gold-warm/20 flex justify-around items-center z-40 px-4 text-cream-white">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
                isActive ? 'text-gold-warm' : 'text-cream-white/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-wider font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
