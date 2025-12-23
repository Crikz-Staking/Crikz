// src/components/TopNavigation.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, GraduationCap, ShoppingBag, Gamepad2 } from 'lucide-react';
import type { Language } from '../App';

export type ViewMode = 'dashboard' | 'learning' | 'nft' | 'games';

interface TopNavigationProps {
  currentMode: ViewMode;
  setMode: (mode: ViewMode) => void;
  dynamicColor: string;
  lang: Language;
}

export default function TopNavigation({ currentMode, setMode, dynamicColor, lang }: TopNavigationProps) {
  const content = {
    en: { dashboard: "Dashboard", learning: "Learning & Analytics", nft: "NFT Market", games: "Blockchain Games" },
    sq: { dashboard: "Paneli Kryesor", learning: "Mësim & Analitikë", nft: "Tregu i NFT", games: "Lojërat Blockchain" }
  };

  const t = content[lang];

  const modes = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'learning', label: t.learning, icon: GraduationCap },
    { id: 'nft', label: t.nft, icon: ShoppingBag },
    { id: 'games', label: t.games, icon: Gamepad2 },
  ] as const;

  return (
    <div className="flex justify-center mb-8">
      <div className="flex gap-2 p-2 bg-background-elevated/80 backdrop-blur-md rounded-2xl border border-white/5 overflow-x-auto max-w-full">
        {modes.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setMode(mode.id as ViewMode)}
              className="relative px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                color: isActive ? '#fff' : '#9ca3af',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="topNavHighlight"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: `${dynamicColor}20`, border: `1px solid ${dynamicColor}40` }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <mode.icon 
                size={16} 
                strokeWidth={isActive ? 2.5 : 2}
                style={{ color: isActive ? dynamicColor : 'inherit' }}
              />
              <span className="relative z-10">{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}