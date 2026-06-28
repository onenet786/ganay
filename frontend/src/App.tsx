import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navigation from './components/Navigation';
import MusicPlayer from './components/MusicPlayer';
import Home from './pages/Home';
import Search from './pages/Search';
import Collections from './pages/Collections';
import { usePlayerStore } from './store/usePlayerStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const initAudio = usePlayerStore((state) => state.initAudio);

  // Initialize browser Audio events on mount
  useEffect(() => {
    initAudio();
  }, [initAudio]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home 
            setActiveTab={setActiveTab} 
            setSelectedCollectionId={setSelectedCollectionId}
            setSearchQuery={setSearchQuery}
          />
        );
      case 'search':
        return (
          <Search 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case 'collections':
        return (
          <Collections 
            selectedCollectionId={selectedCollectionId}
            setSelectedCollectionId={setSelectedCollectionId}
          />
        );
      default:
        return (
          <Home 
            setActiveTab={setActiveTab} 
            setSelectedCollectionId={setSelectedCollectionId}
            setSearchQuery={setSearchQuery}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-dark text-cream-white font-sans antialiased bg-noise flex flex-col md:flex-row">
      {/* Side Navigation for Desktop, Bottom Nav for Mobile */}
      <Navigation activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        // Reset collection selection when switching tabs
        if (tab !== 'collections') setSelectedCollectionId(null);
      }} />

      {/* Main Panel Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen flex flex-col">
        {/* Urdu calligraphy decorative border layout */}
        <div className="flex-1 max-w-7xl w-full mx-auto pb-24 md:pb-28">
          {renderActivePage()}
        </div>
      </main>

      {/* Persistent Bottom Player Bar */}
      <MusicPlayer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
