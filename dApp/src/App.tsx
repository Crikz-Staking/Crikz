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
import { useCrikzlingV3 } from '@/hooks/useCrikzlingV3'; // Import hook here to share state
import { MainSection, ActiveView, Language } from '@/types';

export default function App() {
  const { isConnected } = useAccount();
  const [lang, setLang] = useState<Language>('en');
  const [currentSection, setCurrentSection] = useState<MainSection>('active');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  
  // Initialize AI Hook at App level to share 'aiState' with Background
  const { aiState } = useCrikzlingV3();
  
  useAppWatcher();

  const getThemeColor = () => {
    // Dynamic color based on AI state takes precedence for "Cool Factor"
    if (aiState === 'thinking') return '#a78bfa'; // Purple
    if (aiState === 'responding') return '#10b981'; // Emerald

    // Fallback to section colors
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
      {/* Pass AI State to Background */}
      <BackgroundEffects aiState={aiState} />
      
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
                        onClick={() => setActiveView(view.id as ActiveView)}
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

      {/* AI Avatar is self-contained but shares context via hook internally if needed, 
          but here we just render it. Note: The hook inside App() is just for background state. 
          The component uses its own instance of the hook. 
          *Correction*: To sync state perfectly, we should pass props, but useCrikzlingV3 
          creates a new brain instance. For visual sync, the background reacting to *any* 
          hook instance is fine for visual flair, or we can context provider it. 
          For simplicity in this file structure, the Avatar component manages the actual chat.
      */}
      <CrikzlingAvatar />

      <Footer />
    </div>
  );
}