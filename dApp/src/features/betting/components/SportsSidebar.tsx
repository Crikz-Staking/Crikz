import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gamepad2, Target, Activity, Search, ChevronRight } from 'lucide-react';
import { SportId } from '@/types';

interface SidebarProps {
  activeSport: SportId;
  onSelect: (id: SportId) => void;
  dynamicColor: string;
}

// Added 'leagues' and 'count' for visual richness
const CATEGORIES = [
  { 
      id: 'soccer', 
      label: 'Soccer', 
      icon: Trophy, 
      count: 42, 
      leagues: ['Premier League', 'La Liga', 'Champions League', 'Serie A'] 
  },
  { 
      id: 'basketball', 
      label: 'Basketball', 
      icon: Activity, 
      count: 12, 
      leagues: ['NBA', 'EuroLeague', 'NCAA'] 
  },
  { 
      id: 'tennis', 
      label: 'Tennis', 
      icon: Target, 
      count: 8, 
      leagues: ['ATP', 'WTA', 'Grand Slam'] 
  },
  { 
      id: 'mma', 
      label: 'MMA', 
      icon: '🥊', 
      count: 5, 
      leagues: ['UFC', 'Bellator'] 
  },
  { 
      id: 'esports', 
      label: 'eSports', 
      icon: Gamepad2, 
      count: 24, 
      leagues: ['League of Legends', 'CS2', 'Dota 2', 'Valorant'] 
  },
  { 
      id: 'american_football', 
      label: 'American Football', 
      icon: '🏈', 
      count: 3, 
      leagues: ['NFL', 'NCAA Football'] 
  },
];

export default function SportsSidebar({ activeSport, onSelect, dynamicColor }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = CATEGORIES.filter(cat => 
      cat.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full lg:w-64 flex flex-col gap-2 p-2 lg:border-r border-white/5 lg:h-[calc(100vh-200px)] lg:overflow-y-auto custom-scrollbar">
      
      {/* Search Bar */}
      <div className="px-2 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 transition-colors" 
                placeholder="Search sports..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      <div className="text-xs font-bold text-gray-500 uppercase px-4 py-2">Top Sports</div>
      
      {filteredCategories.map((cat) => {
        const isActive = activeSport === cat.id;
        const Icon = cat.icon;

        return (
            <div key={cat.id}>
                <button
                    onClick={() => onSelect(cat.id as SportId)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
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
                    
                    {/* Badge / Count */}
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${isActive ? 'bg-primary-500 text-black font-bold' : 'bg-black/20 text-gray-500'}`}>
                        {cat.count}
                    </span>
                </button>
                
                {/* Sub-menu simulation for Active Sport */}
                <AnimatePresence>
                    {isActive && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pl-12 pr-4 space-y-1 mt-1 mb-2 border-l border-white/5 ml-6">
                                {cat.leagues.map(l => (
                                    <div key={l} className="text-[11px] font-bold text-gray-500 py-1.5 hover:text-primary-500 cursor-pointer flex justify-between items-center transition-colors group/league">
                                        {l} <ChevronRight size={10} className="opacity-0 group-hover/league:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
      })}

      <div className="mt-4 px-4 py-4 bg-gradient-to-br from-primary-500/10 to-transparent rounded-2xl border border-primary-500/20">
        <h4 className="text-primary-500 font-black text-sm mb-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"/> Live Events
        </h4>
        <p className="text-xs text-gray-400">Real-time odds updates powered by Chainlink & The Odds API.</p>
      </div>
    </div>
  );
}