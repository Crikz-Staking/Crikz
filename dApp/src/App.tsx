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
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const { isConnected } = useAccount();
  const [lang, setLang] = useState<Language>('en');
  
  // LOGIC FIX: Default to 'active' section and 'nft' view immediately as requested
  const [currentSection, setCurrentSection] = useState<MainSection>('active');
  const [activeView, setActiveView] = useState<ActiveView>('nft');
  
  const { aiState } = useCrikzlingV3();
  
  useAppWatcher();

  // LOGIC FIX: Centralized Navigation Handler
  const handleSectionChange = (section: MainSection) => {
    setCurrentSection(section);
    triggerInteraction('NAVIGATION');
    
    // Reset sub-views when changing main context
    // Defaulting to NFT Marketplace when clicking "Dashboard" / Active section
    if (section === 'active') setActiveView('nft');
  };

  // Handler for Sub-Navigation (Dashboard, NFT, etc.)
  const handleActiveViewChange = (view: ActiveView) => {
    setActiveView(view);
    triggerInteraction('NAVIGATION');
  };

  const getThemeColor = () => {
    if (aiState === 'thinking') return '#a78bfa'; 
    if (aiState === 'responding') return '#10b981'; 

    switch (currentSection) {
      case 'active': return '#f59e0b'; // Gold
      case 'passive': return '#3b82f6'; // Blue
      case 'tools': return '#ec4899'; // Pink
      default: return '#f59e0b';
    }
  };

  const dynamicColor = getThemeColor();

  return (
    <div className="min-h-screen relative text-white selection:bg-primary-500/30 overflow-x-hidden font-sans">
      {/* The Spiral AI Background */}
      <BackgroundEffects aiState={aiState} />
      
      <Toaster position="bottom-right" reverseOrder={false} />

      <Header 
        lang={lang} 
        setLang={setLang} 
        setViewMode={handleActiveViewChange} 
        dynamicColor={dynamicColor}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-32">
        <GlobalNavigation 
          currentSection={currentSection} 
          setSection={handleSectionChange} 
          dynamicColor={dynamicColor} 
        />

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {currentSection === 'active' && (
              <motion.div 
                key="active-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Sub-Navigation: Only visible in Active Section */}
                <div className="flex flex-wrap justify-center gap-2 mb-8 bg-[#12121A]/80 backdrop-blur-md p-1.5 rounded-2xl w-fit mx-auto border border-white/10 shadow-2xl">
                  {[
                      { id: 'nft', label: 'Marketplace' }, // Moved to first position
                      { id: 'dashboard', label: 'Production' },
                      { id: 'betting', label: 'Sportsbook' },
                      { id: 'arcade', label: 'Arcade' }
                  ].map(view => (
                      <button 
                          key={view.id}
                          onClick={() => handleActiveViewChange(view.id as ActiveView)}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                              activeView === view.id 
                              ? 'bg-white/10 text-white shadow-inner border border-white/5' 
                              : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                      >
                          {view.label}
                      </button>
                  ))}
                </div>
                
                {/* Content Render with specific keys for animation */}
                <AnimatePresence mode="wait">
                  {activeView === 'nft' && (
                    <motion.div key="nft" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <NFTMarket dynamicColor={dynamicColor} lang={lang} />
                    </motion.div>
                  )}
                  {activeView === 'dashboard' && (
                    <motion.div key="dash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <Dashboard dynamicColor={dynamicColor} lang={lang} />
                    </motion.div>
                  )}
                  {activeView === 'betting' && (
                    <motion.div key="bet" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <BettingLayout dynamicColor={dynamicColor} />
                    </motion.div>
                  )}
                  {activeView === 'arcade' && (
                    <motion.div key="arc" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <BlockchainGames dynamicColor={dynamicColor} lang={lang} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {currentSection === 'passive' && (
              <motion.div key="passive-section" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <PassiveHub dynamicColor={dynamicColor} lang={lang} />
              </motion.div>
            )}

            {currentSection === 'tools' && (
              <motion.div key="tools-section" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <ToolsLayout dynamicColor={dynamicColor} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <CrikzlingAvatar />
      <Footer />
    </div>
  );
}