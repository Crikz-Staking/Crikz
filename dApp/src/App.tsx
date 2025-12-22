// src/App.tsx
import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import BackgroundEffects from './components/BackgroundEffects';
import Footer from './components/Footer';
import TopNavigation, { ViewMode } from './components/TopNavigation';
import LearningHub from './components/LearningHub';
import NFTMarket from './components/NFTMarket';
import BlockchainGames from './components/BlockchainGames';

export type Language = 'en' | 'sq';

export default function App() {
  const { isConnected, address } = useAccount();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [lang, setLang] = useState<Language>('en');

  // Fixed Gold/Amber Color
  const dynamicColor = '#F59E0B'; 

  const handleLangChange = (targetLang: Language) => {
    if (targetLang === 'sq' && lang !== 'sq') {
      const confirm = window.confirm(
        "A jeni të sigurt që dëshironi të ndryshoni gjuhën në Shqip? Ky veprim do të përkthejë të gjithë ndërfaqen."
      );
      if (confirm) setLang('sq');
    } else {
      setLang(targetLang);
    }
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans selection:bg-primary-500/30 selection:text-white overflow-x-hidden">
      <Toaster position="bottom-right" />
      <BackgroundEffects />

      {/* Language Switcher */}
      <div className="fixed top-24 right-6 z-[60] flex flex-col gap-2">
        <button 
          onClick={() => handleLangChange('en')}
          className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${lang === 'en' ? 'border-primary-500 text-primary-500 bg-primary-500/10' : 'border-white/10 text-gray-500 hover:border-white/30'}`}
        >
          EN
        </button>
        <button 
          onClick={() => handleLangChange('sq')}
          className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${lang === 'sq' ? 'border-primary-500 text-primary-500 bg-primary-500/10' : 'border-white/10 text-gray-500 hover:border-white/30'}`}
        >
          SQ
        </button>
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-black font-black text-lg shadow-glow-sm">
              Φ
            </div>
            <span className="font-bold tracking-tight text-lg hidden sm:block text-white">
              CRIKZ <span className="text-primary-500 font-normal">PROTOCOL</span>
            </span>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            <ConnectButton 
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
              showBalance={false} 
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 py-8 sm:py-12 relative z-10">
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero dynamicColor={dynamicColor} />
            </motion.div>
          ) : (
            <div className="w-full max-w-7xl mx-auto">
              <TopNavigation 
                currentMode={viewMode} 
                setMode={setViewMode} 
                dynamicColor={dynamicColor} 
                lang={lang}
              />

              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {viewMode === 'dashboard' && <Dashboard dynamicColor={dynamicColor} lang={lang} />}
                {viewMode === 'learning' && <LearningHub dynamicColor={dynamicColor} lang={lang} />}
                {viewMode === 'nft' && <NFTMarket dynamicColor={dynamicColor} lang={lang} address={address} />}
                {viewMode === 'games' && <BlockchainGames dynamicColor={dynamicColor} lang={lang} />}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <Footer dynamicColor={dynamicColor} />
    </div>
  );
}