// src/components/TopNavigation.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, GraduationCap, ShoppingBag, Gamepad2 } from 'lucide-react';
import type { Language, ViewMode } from '@/types';

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
              title={mode.label} // Shows name only on hover to prevent bloating
              className="relative p-2.5 rounded-xl transition-all flex items-center justify-center min-w-[44px]"
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
                size={20} // Slightly larger for better icon-only visibility
                strokeWidth={isActive ? 2.5 : 2}
                style={{ color: isActive ? dynamicColor : 'inherit' }}
                className="relative z-10"
              />
              {/* Text label removed to evade site bloating */}
            </button>
          );
        })}
      </div>
    </div>
  );
}