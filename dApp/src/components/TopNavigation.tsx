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
  isConnected: boolean;
}

export default function TopNavigation({ currentMode, setMode, dynamicColor, lang, isConnected }: TopNavigationProps) {
  const content = {
    en: { dashboard: "Dashboard", learning: "Learning Hub", nft: "NFT Market", games: "Arcade" },
    sq: { dashboard: "Paneli", learning: "Mësim", nft: "Tregu NFT", games: "Lojëra" }
  };
  const t = content[lang];

  // Define tabs order: NFT -> Learning -> Gaming. Dashboard added first if connected.
  const allModes = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, requiresAuth: true },
    { id: 'nft', label: t.nft, icon: ShoppingBag, requiresAuth: false },
    { id: 'learning', label: t.learning, icon: GraduationCap, requiresAuth: false },
    { id: 'games', label: t.games, icon: Gamepad2, requiresAuth: false },
  ] as const;

  const visibleModes = allModes.filter(mode => !mode.requiresAuth || isConnected);

  return (
    <div className="flex justify-center mb-8">
      <div className="flex gap-2 p-1.5 bg-background-elevated/80 backdrop-blur-md rounded-2xl border border-white/5 overflow-x-auto">
        {visibleModes.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setMode(mode.id as ViewMode)}
              className="relative px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap"
              style={{ color: isActive ? '#fff' : '#6b7280' }}
            >
              {isActive && (
                <motion.div
                  layoutId="topNavHighlight"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: `${dynamicColor}15`, border: `1px solid ${dynamicColor}30` }}
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