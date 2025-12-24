import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Background from '@/components/layout/Background';
import TopNavigation from '@/components/layout/TopNavigation';
import CustomConnectButton from '@/components/ui/CustomConnectButton';

import Dashboard from '@/features/dashboard/Dashboard';
import NFTMarket from '@/features/nft/NFTMarket';
import LearningHub from '@/features/learning/LearningHub';
import BlockchainGames from '@/features/games/BlockchainGames';

import type { Language, ViewMode } from '@/types';

export default function App() {
  const { isConnected } = useAccount();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard'); // Default to dashboard
  const [lang, setLang] = useState<Language>('en');

  const dynamicColor = '#F59E0B'; 

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans selection:bg-primary-500/30 overflow-x-hidden flex flex-col">
      <Toaster position="bottom-right" />
      <Background />

      <Header lang={lang} setLang={setLang} setViewMode={setViewMode} />

      <main className="flex-1 w-full px-4 py-8 relative z-10">
        <div className="w-full max-w-7xl mx-auto">
          
          <TopNavigation 
            currentMode={viewMode} 
            setMode={setViewMode} 
            dynamicColor={dynamicColor} 
            lang={lang}
          />

          {/* Removed mode='wait' which often causes the 'disappearing' bug if exit animations hang */}
          <div className="relative min-h-[600px]"> 
            <AnimatePresence mode="popLayout">
              {viewMode === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {isConnected ? (
                    <Dashboard dynamicColor={dynamicColor} lang={lang} />
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 glass-card rounded-3xl p-12 border border-white/10">
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-glow-sm">
                        <Lock size={48} className="text-gray-500" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white mb-2">Access Restricted</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                          Connect your wallet to access the Production Dashboard and manage your orders.
                        </p>
                      </div>
                      <CustomConnectButton />
                    </div>
                  )}
                </motion.div>
              )}

              {viewMode === 'nft' && (
                <motion.div
                  key="nft"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <NFTMarket dynamicColor={dynamicColor} lang={lang} />
                </motion.div>
              )}

              {viewMode === 'learning' && (
                <motion.div
                  key="learning"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <LearningHub dynamicColor={dynamicColor} lang={lang} />
                </motion.div>
              )}

              {viewMode === 'games' && (
                <motion.div
                  key="games"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <BlockchainGames dynamicColor={dynamicColor} lang={lang} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}