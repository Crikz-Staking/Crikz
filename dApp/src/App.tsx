import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

// Common & Layout
import CustomConnectButton from '@/components/common/CustomConnectButton';
import Footer from '@/components/layout/Footer';
import BackgroundEffects from '@/components/layout/BackgroundEffects';
import TopNavigation, { ViewMode } from '@/components/layout/TopNavigation';

// Features
import Dashboard from '@/features/dashboard/Dashboard';
import NFTMarket from '@/features/nft/NFTMarket';
import LearningHub from '@/features/learning/LearningHub';
import BlockchainGames from '@/features/games/BlockchainGames';

export type Language = 'en' | 'sq';

export default function App() {
  const { isConnected, address } = useAccount();
  const [viewMode, setViewMode] = useState<ViewMode>('nft'); 
  const [lang, setLang] = useState<Language>('en');

  const dynamicColor = '#F59E0B'; 

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans selection:bg-primary-500/30 overflow-x-hidden">
      <Toaster position="bottom-right" />
      <BackgroundEffects />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewMode('nft')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-black font-black text-xl shadow-glow-sm">
              Φ
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-tight text-xl text-white leading-none">CRIKZ</span>
              <span className="text-[10px] text-primary-500 font-bold tracking-widest uppercase">dApp Ecosystem</span>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-4">
            <button onClick={() => setLang(lang === 'en' ? 'sq' : 'en')} className="text-xs font-bold text-gray-500 hover:text-white transition-colors">
              {lang.toUpperCase()}
            </button>
            
            {/* Custom Connect Button Implementation */}
            <CustomConnectButton />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-4 py-8 relative z-10">
        <div className="w-full max-w-7xl mx-auto">
          
          <TopNavigation 
            currentMode={viewMode} 
            setMode={setViewMode} 
            dynamicColor={dynamicColor} 
            lang={lang}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* DASHBOARD */}
              {viewMode === 'dashboard' ? (
                isConnected ? (
                  <Dashboard dynamicColor={dynamicColor} lang={lang} />
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                      <Lock size={40} className="text-gray-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white">Wallet Connection Required</h2>
                    <p className="text-gray-400 max-w-md">
                      To view your personal production orders, please connect your wallet.
                    </p>
                    <div className="pt-4">
                      <CustomConnectButton /> 
                    </div>
                  </div>
                )
              ) : null}

              {/* FEATURES */}
              {viewMode === 'nft' && <NFTMarket dynamicColor={dynamicColor} lang={lang} address={address} />}
              {viewMode === 'learning' && <LearningHub dynamicColor={dynamicColor} lang={lang} />}
              {viewMode === 'games' && <BlockchainGames dynamicColor={dynamicColor} lang={lang} />}
              
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Footer dynamicColor={dynamicColor} />
    </div>
  );
}