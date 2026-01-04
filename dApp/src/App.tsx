import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, LayoutDashboard, Trophy, Gamepad2 } from 'lucide-react';

// Layout Components
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GlobalNavigation from '@/components/layout/GlobalNavigation';
import BackgroundEffects from '@/components/layout/Background';
import CrikzlingAvatar from '@/components/ui/CrikzlingAvatar';
import CommandPalette from '@/components/ui/CommandPalette';

// Feature Components
import Dashboard from '@/features/dashboard/Dashboard'; // Production
import PassiveHub from '@/features/passive/PassiveHub';
import ToolsLayout from '@/features/tools/ToolsLayout';
import NFTMarket from '@/features/nft/NFTMarket';
import BlockchainGames from '@/features/games/BlockchainGames';
import BettingLayout from '@/features/betting/BettingLayout';
import About from '@/features/about/About';

// Hooks & Types
import { useAppWatcher } from '@/hooks/useAppWatcher';
import { useCrikzlingV3 } from '@/hooks/useCrikzlingV3'; 
import { MainSection, ActiveView, Language } from '@/types';
import { triggerInteraction } from '@/lib/interaction-events';

export default function App() {
  const { isConnected } = useAccount();
  const [lang, setLang] = useState<Language>('en');
  
  // Main Section State
  const [currentSection, setCurrentSection] = useState<MainSection>('active');
  
  // Sub-View State for "Active" Section
  const [activeView, setActiveView] = useState<ActiveView>('marketplace');
  
  const { aiState } = useCrikzlingV3();
  
  useAppWatcher();

  // Navigation Handlers
  const handleSectionChange = (section: string) => {
    setCurrentSection(section as MainSection);
    triggerInteraction('NAVIGATION');
  };

  const handleActiveViewChange = (view: string) => {
    setActiveView(view as ActiveView);
    triggerInteraction('NAVIGATION');
  };

  // Dynamic Theme Color based on Section/AI State
  const getThemeColor = () => {
    if (aiState === 'thinking') return '#a78bfa'; 
    if (aiState === 'responding') return '#10b981'; 

    switch (currentSection) {
      case 'active': return '#f59e0b'; // Gold
      case 'passive': return '#3b82f6'; // Blue
      case 'tools': return '#ec4899'; // Pink
      case 'about': return '#10b981'; // Emerald
      default: return '#f59e0b';
    }
  };

  const dynamicColor = getThemeColor();

  return (
    <div className="min-h-screen relative text-white selection:bg-primary-500/30 overflow-x-hidden font-sans">
      {/* Background & Effects */}
      <BackgroundEffects aiState={aiState} />
      
      {/* Custom Sci-Fi Toaster Configuration */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: '!bg-[#12121A] !border !border-white/10 !text-white !rounded-xl !shadow-2xl',
          style: {
            background: '#12121A',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'monospace',
            fontSize: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#000',
            },
            style: {
              borderLeft: '4px solid #10B981',
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#000',
            },
            style: {
              borderLeft: '4px solid #EF4444',
            }
          },
          loading: {
            style: {
              borderLeft: '4px solid #F59E0B',
            }
          }
        }}
      />

      {/* Header */}
      <Header 
        lang={lang} 
        setLang={setLang} 
        setViewMode={(mode) => {
            setCurrentSection('active');
            setActiveView('marketplace');
        }} 
        dynamicColor={dynamicColor}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-32">
        {/* 1. Main Section Tabs */}
        <GlobalNavigation 
          currentSection={currentSection} 
          setSection={(s) => handleSectionChange(s)} 
          dynamicColor={dynamicColor} 
        />

        <div className="mt-8">
          <AnimatePresence mode="wait">
            
            {/* --- ACTIVE SECTION --- */}
            {currentSection === 'active' && (
              <motion.div 
                key="active-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Sub-Navigation for Active Section */}
                <div className="flex flex-wrap justify-center gap-2 mb-8 bg-[#12121A]/80 backdrop-blur-md p-1.5 rounded-2xl w-fit mx-auto border border-white/10 shadow-2xl">
                  {[
                      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
                      { id: 'production', label: 'Production', icon: LayoutDashboard },
                      { id: 'sportsbook', label: 'Sportsbook', icon: Trophy },
                      { id: 'arcade', label: 'Arcade', icon: Gamepad2 }
                  ].map(view => {
                      const Icon = view.icon;
                      const isActive = activeView === view.id;
                      return (
                          <button 
                              key={view.id}
                              onClick={() => handleActiveViewChange(view.id as ActiveView)}
                              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                                  isActive 
                                  ? 'bg-white/10 text-white shadow-inner border border-white/5' 
                                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                              }`}
                          >
                              <Icon size={16} style={{ color: isActive ? dynamicColor : undefined }} />
                              {view.label}
                          </button>
                      );
                  })}
                </div>
                
                {/* Active Content Render */}
                <AnimatePresence mode="wait">
                  {activeView === 'marketplace' && (
                    <motion.div key="market" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <NFTMarket dynamicColor={dynamicColor} lang={lang} />
                    </motion.div>
                  )}
                  {activeView === 'production' && (
                    <motion.div key="prod" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <Dashboard dynamicColor={dynamicColor} lang={lang} />
                    </motion.div>
                  )}
                  {activeView === 'sportsbook' && (
                    <motion.div key="sports" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <BettingLayout dynamicColor={dynamicColor} />
                    </motion.div>
                  )}
                  {activeView === 'arcade' && (
                    <motion.div key="arcade" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <BlockchainGames dynamicColor={dynamicColor} lang={lang} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* --- PASSIVE SECTION --- */}
            {currentSection === 'passive' && (
              <motion.div key="passive-section" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <PassiveHub dynamicColor={dynamicColor} lang={lang} />
              </motion.div>
            )}

            {/* --- TOOLS SECTION --- */}
            {currentSection === 'tools' && (
              <motion.div key="tools-section" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <ToolsLayout dynamicColor={dynamicColor} />
              </motion.div>
            )}

            {/* --- ABOUT SECTION --- */}
            {currentSection === 'about' && (
              <motion.div key="about-section" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <About dynamicColor={dynamicColor} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette 
        setSection={handleSectionChange} 
        setView={handleActiveViewChange} 
      />

      <CrikzlingAvatar />
      <Footer />
    </div>
  );
}