import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, BarChart2, Gamepad2, Headphones, Tv, Layers } from 'lucide-react';
import Reading from '@/features/learning/Reading';
import TokenAnalytics from '@/features/learning/TokenAnalytics';
import BlockchainGames from '@/features/games/BlockchainGames';
import MediaPlayer from './MediaPlayer';
import { Language } from '@/types';

interface PassiveHubProps {
  dynamicColor: string;
  lang: Language;
}

type PassiveTab = 'reading' | 'analytics' | 'games' | 'audio' | 'video';

export default function PassiveHub({ dynamicColor, lang }: PassiveHubProps) {
  const [activeTab, setActiveTab] = useState<PassiveTab>('reading');

  const tabs = [
    { id: 'reading', label: 'Knowledge Base', icon: BookOpen },
    { id: 'analytics', label: 'Data Analytics', icon: BarChart2 },
    { id: 'games', label: 'Arcade', icon: Gamepad2 },
    { id: 'audio', label: 'Audio Stream', icon: Headphones },
    { id: 'video', label: 'Video Feed', icon: Tv },
  ];

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 border-b border-white/5">
        <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
                <Layers className="text-gray-500" /> Passive Zone
            </h1>
            <p className="text-gray-400">Explore content, games, and media powered by Crikz Protocol.</p>
        </div>
        
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as PassiveTab)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'bg-white/10 text-white shadow-lg' 
                        : 'text-gray-500 hover:text-white'
                    }`}
                >
                    <tab.icon size={16} style={{ color: activeTab === tab.id ? dynamicColor : 'currentColor' }} />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
        >
            {activeTab === 'reading' && <Reading dynamicColor={dynamicColor} lang={lang} />}
            {activeTab === 'analytics' && <TokenAnalytics dynamicColor={dynamicColor} lang={lang} />}
            {activeTab === 'games' && <BlockchainGames dynamicColor={dynamicColor} lang={lang} />}
            {activeTab === 'audio' && <MediaPlayer type="audio" dynamicColor={dynamicColor} />}
            {activeTab === 'video' && <MediaPlayer type="video" dynamicColor={dynamicColor} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}