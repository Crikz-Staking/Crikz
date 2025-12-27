import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Star } from 'lucide-react';
import { BettingMatch, BetSelection } from '@/types';

interface MatchRowProps {
  match: BettingMatch;
  selections: BetSelection[];
  onToggle: (match: BettingMatch, type: 'home' | 'draw' | 'away', odds: number) => void;
  index: number;
}

export default function MatchRow({ match, selections, onToggle, index }: MatchRowProps) {
  const isSelected = (type: string) => selections.some((s) => s.matchId === match.id && s.selectionId === type);
  
  // Format Date: "Today 14:00" or "Dec 24 20:00"
  const dateObj = new Date(match.startTime);
  const isToday = new Date().toDateString() === dateObj.toDateString();
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = isToday ? 'Today' : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#1a1a24] hover:bg-[#20202b] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 transition-colors group relative overflow-hidden"
    >
      {/* Decorative Left Border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-primary-500 transition-colors" />

      {/* Meta Info */}
      <div className="flex flex-row md:flex-col items-center md:items-start justify-between min-w-[140px] gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
          <Clock size={12} />
          <span className={match.isLive ? 'text-red-500 animate-pulse' : ''}>
            {match.isLive ? 'LIVE' : `${dateStr} ${timeStr}`}
          </span>
        </div>
        <div className="text-[10px] text-gray-600 uppercase font-black tracking-wider truncate max-w-[120px]">
          {match.league}
        </div>
      </div>

      {/* Teams */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-200 text-sm">{match.homeTeam}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-200 text-sm">{match.awayTeam}</span>
        </div>
      </div>

      {/* Odds Grid */}
      <div className="grid grid-cols-3 gap-2 w-full md:w-auto min-w-[240px]">
        <OddBtn 
          label="1" 
          value={match.markets.h2h[0]} 
          active={isSelected('home')} 
          onClick={() => onToggle(match, 'home', match.markets.h2h[0])} 
        />
        <OddBtn 
          label="X" 
          value={match.markets.h2h[1]} 
          active={isSelected('draw')} 
          onClick={() => onToggle(match, 'draw', match.markets.h2h[1])}
          disabled={match.markets.h2h[1] <= 1.01} // Disable if draw is invalid (e.g. Basketball sometimes)
        />
        <OddBtn 
          label="2" 
          value={match.markets.h2h[2]} 
          active={isSelected('away')} 
          onClick={() => onToggle(match, 'away', match.markets.h2h[2])} 
        />
      </div>
    </motion.div>
  );
}

const OddBtn = ({ label, value, active, onClick, disabled }: any) => {
  if (disabled) return <div className="bg-transparent" />; // Empty spacer

  return (
    <button
      onClick={onClick}
      className={`relative h-12 rounded-lg flex flex-col items-center justify-center transition-all overflow-hidden ${
        active 
          ? 'bg-primary-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
          : 'bg-[#12121a] text-gray-400 hover:bg-[#2a2a35] hover:text-white border border-white/5'
      }`}
    >
      <span className={`text-[9px] font-bold ${active ? 'text-black/60' : 'text-gray-600'}`}>{label}</span>
      <span className="font-mono font-bold text-sm">{value.toFixed(2)}</span>
    </button>
  );
};