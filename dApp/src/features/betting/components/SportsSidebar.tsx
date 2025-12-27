import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Gamepad2, Target, Activity } from 'lucide-react';
import { SportId } from '@/types';

interface SidebarProps {
  activeSport: SportId;
  onSelect: (id: SportId) => void;
  dynamicColor: string;
}

const CATEGORIES = [
  { id: 'soccer', label: 'Soccer', icon: Trophy, count: 42 },
  { id: 'basketball', label: 'Basketball', icon: Activity, count: 12 },
  { id: 'tennis', label: 'Tennis', icon: Target, count: 8 },
  { id: 'mma', label: 'MMA', icon: '🥊', count: 5 }, // Emoji fallback for icon
  { id: 'esports', label: 'eSports', icon: Gamepad2, count: 24 },
  { id: 'american_football', label: 'American Football', icon: '🏈', count: 3 },
];

export default function SportsSidebar({ activeSport, onSelect, dynamicColor }: SidebarProps) {
  return (
    <div className="w-full lg:w-64 flex flex-col gap-2 p-2 lg:border-r border-white/5 lg:h-[calc(100vh-200px)] lg:overflow-y-auto custom-scrollbar">
      <div className="text-xs font-bold text-gray-500 uppercase px-4 py-2">Top Sports</div>
      
      {CATEGORIES.map((cat) => {
        const isActive = activeSport === cat.id;
        const Icon = cat.icon;

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id as SportId)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
              isActive 
                ? 'bg-white/10 text-white shadow-glow-sm' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {typeof Icon === 'string' ? (
                <span className="text-lg">{Icon}</span>
              ) : (
                <Icon size={18} style={{ color: isActive ? dynamicColor : 'currentColor' }} />
              )}
              <span className="font-bold text-sm">{cat.label}</span>
            </div>
            
            {isActive && (
              <motion.div 
                layoutId="active-sport-dot"
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: dynamicColor }}
              />
            )}
          </button>
        );
      })}

      <div className="mt-4 px-4 py-4 bg-gradient-to-br from-primary-500/10 to-transparent rounded-2xl border border-primary-500/20">
        <h4 className="text-primary-500 font-black text-sm mb-1">Live Events</h4>
        <p className="text-xs text-gray-400">Real-time odds updates powered by Chainlink & The Odds API.</p>
      </div>
    </div>
  );
}