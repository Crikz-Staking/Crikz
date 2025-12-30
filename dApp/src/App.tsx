import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAccount } from 'wagmi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GlobalNavigation from '@/components/layout/GlobalNavigation';
import BackgroundEffects from '@/components/layout/Background';
import CrikzlingAvatar from '@/components/ui/CrikzlingAvatar';

import Dashboard from '@/features/dashboard/Dashboard';
import PassiveHub from '@/features/passive/PassiveHub';
import ToolsLayout from '@/features/tools/ToolsLayout';
import NFTMarket from '@/features/nft/NFTMarket';
import BlockchainGames from '@/features/games/BlockchainGames';
import BettingLayout from '@/features/betting/BettingLayout';

import { useAppWatcher } from '@/hooks/useAppWatcher';
import { MainSection, ActiveView, Language } from '@/types';

export default function App() {
  const { isConnected } = useAccount();
  const [lang, setLang] = useState<Language>('en');
  const [currentSection, setCurrentSection] = useState<MainSection>('active');
  // Default to NFT Marketplace
  const [activeView, setActiveView] = useState<ActiveView>('nft');
  
  useAppWatcher();

  const getThemeColor = () => {
    switch (currentSection) {
      case 'active': return '#f59e0b';
      case 'passive': return '#a78bfa';
      case 'tools': return '#22d3ee';
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
        dynamicColor={dynamicColor}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-32">
        <GlobalNavigation 
          currentSection={currentSection} 
          setSection={setCurrentSection} 
          dynamicColor={dynamicColor} 
        />

        <div className="mt-8 transition-all duration-500">
          {currentSection === 'active' && (
            <div className="space-y-8">
              {/* Navigation Sub-Menu for Active Section - REORDERED */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className={`px-6 py-2 rounded-full font-bold transition-all ${
                    activeView === 'dashboard' ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20' : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveView('nft')}
                  className={`px-6 py-2 rounded-full font-bold transition-all ${
                    activeView === 'nft' ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20' : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  NFT Marketplace
                </button>
                <button 
                  onClick={() => setActiveView('betting')}
                  className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${
                    activeView === 'betting' ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20' : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  Sports Betting
                </button>
                <button 
                  onClick={() => setActiveView('arcade')}
                  className={`px-6 py-2 rounded-full font-bold transition-all ${
                    activeView === 'arcade' ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20' : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  Blockchain Games
                </button>
              </div>
              
              {/* Content Render */}
              {activeView === 'dashboard' && <Dashboard dynamicColor={dynamicColor} lang={lang} />}
              {activeView === 'nft' && <NFTMarket dynamicColor={dynamicColor} lang={lang} />}
              {activeView === 'betting' && <BettingLayout dynamicColor={dynamicColor} />}
              {activeView === 'arcade' && <BlockchainGames dynamicColor={dynamicColor} lang={lang} />}
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

      <CrikzlingAvatar />

      <Footer />
    </div>
  );
}