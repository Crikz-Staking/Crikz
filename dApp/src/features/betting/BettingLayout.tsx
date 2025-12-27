import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query'; // Use existing dependency
import { Trophy, Flame, Calendar, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BettingMatch, SportId, BetSelection } from '@/types';
import BetSlip from './BetSlip';
import { fetchLiveMatches, SPORT_KEYS } from '@/lib/sports-service';
import { useAccount } from 'wagmi';
import { useContractData } from '@/hooks/web3/useContractData';

interface BettingLayoutProps {
  dynamicColor: string;
}

export default function BettingLayout({ dynamicColor }: BettingLayoutProps) {
  const [activeSport, setActiveSport] = useState<SportId>('soccer');
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const { balance } = useContractData(); // Use Real Web3 Balance

  // 1. Fetch Real Data
  const { data: matches, isLoading, isError } = useQuery({
    queryKey: ['matches', activeSport],
    queryFn: () => fetchLiveMatches(SPORT_KEYS[activeSport]),
    refetchInterval: 30000, // Refresh every 30s
  });

  const toggleSelection = (match: BettingMatch, type: 'home' | 'draw' | 'away', odds: number) => {
    const id = match.id;
    const name = type === 'home' ? match.homeTeam : type === 'away' ? match.awayTeam : 'Draw';
    
    setSelections(prev => {
        const exists = prev.find(s => s.matchId === id);
        if (exists) {
            if (exists.selectionId === type) return prev.filter(s => s.matchId !== id);
            return prev.map(s => s.matchId === id ? { ...s, selectionId: type, selectionName: name, odds } : s);
        }
        return [...prev, {
            matchId: id,
            selectionId: type,
            selectionName: name,
            matchName: `${match.homeTeam} vs ${match.awayTeam}`,
            odds
        }];
    });
  };

  const sports = [
      { id: 'soccer', label: 'Football', icon: '⚽' },
      { id: 'basketball', label: 'Basketball', icon: '🏀' },
      { id: 'mma', label: 'MMA', icon: '🥊' },
      { id: 'esports', label: 'eSports', icon: '🎮' }, // Ensure this is here
      { id: 'tennis', label: 'Tennis', icon: '🎾' },
      // You can add American Football here if you want it in the UI
      { id: 'american_football', label: 'NFL', icon: '🏈' },
  ];

  return (
    <div className="relative min-h-screen pb-20">
      
      {/* Header & Nav */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <Trophy className="text-primary-500" /> Sportsbook
                </h2>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                   Powered by <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white">THE ODDS API</span>
                </p>
            </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {sports.map(s => (
                <button
                    key={s.id}
                    onClick={() => setActiveSport(s.id as SportId)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap border ${
                        activeSport === s.id 
                        ? 'bg-white text-black border-white shadow-glow-sm' 
                        : 'bg-black/40 text-gray-400 border-white/10 hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <span className="text-lg">{s.icon}</span> {s.label}
                </button>
            ))}
        </div>
      </div>

      {/* Real Data Feed */}
      <div className="min-h-[300px]">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Loader2 size={40} className="animate-spin mb-4 text-primary-500"/>
                <p>Syncing Live Odds...</p>
            </div>
        ) : isError ? (
            <div className="text-center p-8 border border-red-500/20 bg-red-500/10 rounded-2xl text-red-400">
                Failed to load odds. API Key limit might be reached.
            </div>
        ) : matches?.length === 0 ? (
            <div className="text-center p-12 text-gray-500">No active matches found for this sport.</div>
        ) : (
            <div className="grid gap-4">
                {matches?.map((match, i) => (
                    <MatchCard 
                        key={match.id} 
                        match={match} 
                        selections={selections}
                        onToggle={toggleSelection}
                        index={i}
                    />
                ))}
            </div>
        )}
      </div>

      {/* Updated Bet Slip */}
      <BetSlip 
        selections={selections}
        onRemove={(id) => setSelections(prev => prev.filter(s => s.matchId !== id))}
        onClear={() => setSelections([])}
        balance={Number(balance) / 1e18} // Convert BigInt for UI
        dynamicColor={dynamicColor}
      />
    </div>
  );
}

// Keep the existing MatchCard and OddButton sub-components (they are good)
// Just ensure odd values handle the 1.01 fallbacks gracefully.
const MatchCard = ({ match, selections, onToggle, index }: any) => {
    // ... [Same code as previous MatchCard, but use match.startTime for formatting]
    const isSelected = (type: string) => selections.some((s: any) => s.matchId === match.id && s.selectionId === type);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-4 sm:p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors bg-background-elevated group"
        >
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                
                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-1 min-w-[120px]">
                    <span className="flex items-center gap-2 text-gray-500 font-bold text-xs">
                        <Calendar size={12} /> {new Date(match.startTime).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">{match.league}</span>
                </div>

                <div className="flex-1 flex justify-between items-center w-full md:w-auto px-4">
                    <div className="text-right flex-1 font-bold text-white text-lg">{match.homeTeam}</div>
                    <div className="mx-6 text-xs font-bold text-gray-600 bg-white/5 px-2 py-1 rounded">VS</div>
                    <div className="text-left flex-1 font-bold text-white text-lg">{match.awayTeam}</div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* H2H Odds */}
                    <OddButton 
                        label="1" 
                        odd={match.markets.h2h[0]} 
                        active={isSelected('home')}
                        onClick={() => onToggle(match, 'home', match.markets.h2h[0])}
                    />
                    {/* Check if Draw exists (some sports don't have it) */}
                    {match.markets.h2h[1] > 1.01 && (
                        <OddButton 
                            label="X" 
                            odd={match.markets.h2h[1]} 
                            active={isSelected('draw')}
                            onClick={() => onToggle(match, 'draw', match.markets.h2h[1])}
                        />
                    )}
                    <OddButton 
                        label="2" 
                        odd={match.markets.h2h[2]} 
                        active={isSelected('away')}
                        onClick={() => onToggle(match, 'away', match.markets.h2h[2])}
                    />
                </div>
            </div>
        </motion.div>
    );
};

const OddButton = ({ label, odd, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 md:w-24 py-2 rounded-xl flex flex-col items-center justify-center border transition-all ${
            active 
            ? 'bg-primary-500 text-black border-primary-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
            : 'bg-black/20 text-gray-400 border-white/5 hover:bg-white/5 hover:border-white/20 hover:text-white'
        }`}
    >
        <span className={`text-[10px] font-bold ${active ? 'text-black/60' : 'text-gray-600'}`}>{label}</span>
        <span className="font-bold font-mono">{odd?.toFixed(2)}</span>
    </button>
);