// src/App.tsx
import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import BackgroundEffects from './components/BackgroundEffects';
import Footer from './components/Footer';

export default function App() {
  const { isConnected } = useAccount();

  // Dynamic Theme Generator (Subtle Pulse)
  const [themeHue, setThemeHue] = useState(38); // Starts at Gold/Orange
  useEffect(() => {
    const interval = setInterval(() => {
      setThemeHue((prev) => (prev + 0.1) % 360);
    }, 200); // Slower, more professional pulse
    return () => clearInterval(interval);
  }, []);
  
  const dynamicColor = `hsl(${themeHue}, 100%, 50%)`;

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans selection:bg-primary-500/30 selection:text-white overflow-x-hidden">
      <Toaster position="bottom-right" />
      <BackgroundEffects />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-black font-black text-lg shadow-glow-sm"
              style={{ filter: `hue-rotate(${themeHue - 38}deg)` }}
            >
              Φ
            </div>
            <span className="font-bold tracking-tight text-lg hidden sm:block">
              CRIKZ <span className="text-gray-500 font-normal">PROTOCOL</span>
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
      <main className="flex-1 w-full px-4 py-8 sm:py-12">
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
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <Dashboard dynamicColor={dynamicColor} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer dynamicColor={dynamicColor} />
    </div>
  );
}