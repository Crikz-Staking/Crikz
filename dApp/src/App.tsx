import React, { useState, useEffect } from 'react';
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
import { useCrikzlingV3 } from '@/hooks/useCrikzlingV3'; 
import { MainSection, ActiveView, Language } from '@/types';
import { triggerInteraction } from '@/lib/interaction-events';

export default function App() {
  const { isConnected } = useAccount();
  const [lang, setLang] = useState<Language>('en');
  const [currentSection, setCurrentSection] = useState<MainSection>('active');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  
  const { aiState } = useCrikzlingV3();
  
  useAppWatcher();

  // Trigger background event when sub-view changes
  const handleSubViewChange = (view: ActiveView) => {
      setActiveView(view);
      triggerInteraction('NAVIGATION');
  };

  const getThemeColor = () => {
    if (aiState === 'thinking') return '#a78bfa'; 
    if (aiState === 'responding') return '#10b981'; 

    switch (currentSection) {
      case 'active': return '#f59e0b';
      case 'passive': return '#3b82f6';
      case 'tools': return '#ec4899';
      default: return '#f59e0b';
    }
  };

  const dynamicColor = getThemeColor();

  return (
    <div className="min-h-screen relative text-white selection:bg-primary-500/30 overflow-x-hidden">
      {/* Background reacts to AI State and Event Bus */}
      <BackgroundEffects aiState={aiState} />
      
      <Toaster position="bottom-right" reverseOrder={false} />

      <Header 
        lang={lang} 
        setLang={setLang} 
        setViewMode={handleSubViewChange} 
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
              {/* Sub-Navigation for Active Section */}
              <div className="flex flex-wrap justify-center gap-2 mb-8 bg-black/20 p-1 rounded-xl w-fit mx-auto border border-white/5">
                {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'nft', label: 'NFT Market' },
                    { id: 'betting', label: 'Sports' },
                    { id: 'arcade', label: 'Arcade' }
                ].map(view => (
                    <button 
                        key={view.id}
                        onClick={() => handleSubViewChange(view.id as ActiveView)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeView === view.id 
                            ? 'bg-white/10 text-white shadow-lg' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                    >
                        {view.label}
                    </button>
                ))}
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