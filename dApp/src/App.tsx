import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAccount } from 'wagmi';

// Layout & UI
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GlobalNavigation from '@/components/layout/GlobalNavigation';
import BackgroundEffects from '@/components/layout/Background';
import CrikzlingAvatar from '@/components/ui/CrikzlingAvatar';

// Features
import Dashboard from '@/features/dashboard/Dashboard';
import PassiveHub from '@/features/passive/PassiveHub';
import ToolsLayout from '@/features/tools/ToolsLayout';
import NFTMarket from '@/features/nft/NFTMarket';

// Hooks & Types
import { useAppWatcher } from '@/hooks/useAppWatcher';
import { MainSection, ActiveView, Language } from '@/types';

export default function App() {
  const { isConnected } = useAccount();
  const [lang, setLang] = useState<Language>('en');
  const [currentSection, setCurrentSection] = useState<MainSection>('active');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // Global monitoring hook
  useAppWatcher();

  // Dynamic theme colors based on the active section
  const getThemeColor = () => {
    switch (currentSection) {
      case 'active': return '#f59e0b'; // Amber/Gold
      case 'passive': return '#a78bfa'; // Violet
      case 'tools': return '#22d3ee'; // Cyan
      default: return '#f59e0b';
    }
  };

  const dynamicColor = getThemeColor();

  return (
    <div className="min-h-screen relative text-white selection:bg-primary-500/30 overflow-x-hidden">
      <BackgroundEffects />
      <Toaster position="bottom-right" reverseOrder={false} />

      <Header 
        lang={lang} 
        setLang={setLang} 
        setViewMode={setActiveView} 
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-32">
        <GlobalNavigation 
          currentSection={currentSection} 
          setSection={setCurrentSection} 
          dynamicColor={dynamicColor} 
        />

        {/* Dynamic Content Rendering */}
        <div className="mt-8 transition-all duration-500">
          {currentSection === 'active' && (
            <div className="space-y-8">
              <div className="flex justify-center gap-4 mb-8">
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className={`px-6 py-2 rounded-full font-bold transition-all ${
                    activeView === 'dashboard' ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20' : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  Production Dashboard
                </button>
                <button 
                  onClick={() => setActiveView('nft')}
                  className={`px-6 py-2 rounded-full font-bold transition-all ${
                    activeView === 'nft' ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20' : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  NFT Marketplace
                </button>
              </div>
              
              {activeView === 'dashboard' ? (
                <Dashboard dynamicColor={dynamicColor} lang={lang} />
              ) : (
                <NFTMarket dynamicColor={dynamicColor} lang={lang} />
              )}
            </div>
          )}

          {currentSection === 'passive' && (
            <PassiveHub dynamicColor={dynamicColor} lang={lang} />
          )}

          {currentSection === 'tools' && (
            <ToolsLayout dynamicColor={dynamicColor} />
          )}
        </div>
      </main>

      {/* Crikzling: The Fibonacci-scaled AI Pet 
          He stays outside the main tag to hover over all content.
      */}
      <CrikzlingAvatar lang={lang} dynamicColor={dynamicColor} />

      <Footer />
    </div>
  );
}