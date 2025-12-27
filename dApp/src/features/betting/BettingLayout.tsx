import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Calendar, Flame, Search, ChevronRight } from 'lucide-react';
import { BettingMatch, SportId, BetSelection } from '@/types';
import BetSlip from './BetSlip';

interface BettingLayoutProps {
  dynamicColor: string;
}

// --- MOCK DATA GENERATOR ---
const generateMatches = (sport: SportId): BettingMatch[] => {
    const now = Date.now();
    const mock: BettingMatch[] = [];
    
    const teams = {
        soccer: [['Man City', 'Liverpool'], ['Real Madrid', 'Barcelona'], ['Bayern', 'Dortmund'], ['Juventus', 'AC Milan']],
        basketball: [['Lakers', 'Warriors'], ['Celtics', 'Heat'], ['Bulls', 'Knicks']],
        mma: [['McGregor', 'Chandler'], ['Jones', 'Miocic'], ['O\'Malley', 'Vera']],
        esports: [['T1', 'Gen.G'], ['FaZe', 'NaVi'], ['G2', 'Fnatic']],
        tennis: [['Alcaraz', 'Djokovic'], ['Sinner', 'Medvedev']]
    };

    const sportTeams = teams[sport] || teams.soccer;

    sportTeams.forEach((pair, i) => {
        const isLive = i === 0; // First match is always live
        mock.push({
            id: `${sport}-${i}`,
            sport,
            league: sport === 'soccer' ? 'Champions League' : sport === 'basketball' ? 'NBA' : 'Major League',
            homeTeam: pair[0],
            awayTeam: pair[1],
            startTime: isLive ? now - (1000 * 60 * 45) : now + (1000 * 60 * 60 * (i + 1) * 2),
            isLive,
            score: isLive ? `${Math.floor(Math.random()*3)} - ${Math.floor(Math.random()*2)}` : undefined,
            markets: {
                h2h: [
                    parseFloat((1.5 + Math.random()).toFixed(2)), 
                    parseFloat((2.5 + Math.random()).toFixed(2)), 
                    parseFloat((1.8 + Math.random()).toFixed(2))
                ]
            }
        });
    });
    return mock;
};

export default function BettingLayout({ dynamicColor }: BettingLayoutProps) {
  const [activeSport, setActiveSport] = useState<SportId>('soccer');
  const [matches, setMatches] = useState<BettingMatch[]>([]);
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [userBalance, setUserBalance] = useState(5000); // Mock Balance

  // Load matches when sport changes
  useEffect(() => {
    setMatches(generateMatches(activeSport));
  }, [activeSport]);

  const toggleSelection = (match: BettingMatch, type: 'home' | 'draw' | 'away', odds: number) => {
    const id = match.id;
    const name = type === 'home' ? match.homeTeam : type === 'away' ? match.awayTeam : 'Draw';
    
    setSelections(prev => {
        const exists = prev.find(s => s.matchId === id);
        if (exists) {
            // If clicking same selection, remove it. If different, replace it (single bet per match for simplicity)
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
      { id: 'soccer', label: 'Soccer', icon: '⚽' },
      { id: 'basketball', label: 'Basketball', icon: '🏀' },
      { id: 'mma', label: 'MMA', icon: '🥊' },
      { id: 'esports', label: 'eSports', icon: '🎮' },
      { id: 'tennis', label: 'Tennis', icon: '🎾' },
  ];

  return (
    <div className="relative min-h-screen pb-20">
      
      {/* 1. Header & Sports Nav */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <Trophy className="text-primary-500" /> Sportsbook
                </h2>
                <p className="text-gray-400 text-sm">Decentralized P2P Betting Protocol</p>
            </div>
            
            <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-xl flex gap-4 text-sm font-bold">
                <span className="text-gray-500">Available</span>
                <span className="text-white">{userBalance.toLocaleString()} CRKZ</span>
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

      {/* 2. Match Feed */}
      <div className="grid gap-4">
        {matches.map((match, i) => (
            <MatchCard 
                key={match.id} 
                match={match} 
                selections={selections}
                onToggle={toggleSelection}
                index={i}
            />
        ))}
      </div>

      {/* 3. Bet Slip Sidebar */}
      <BetSlip 
        selections={selections}
        onRemove={(id) => setSelections(prev => prev.filter(s => s.matchId !== id))}
        onClear={() => setSelections([])}
        balance={userBalance}
        onPlaceBet={(amount) => setUserBalance(prev => prev - amount)}
        dynamicColor={dynamicColor}
      />
    </div>
  );
}

// --- SUB-COMPONENT: Match Card ---
const MatchCard = ({ match, selections, onToggle, index }: { 
    match: BettingMatch, 
    selections: BetSelection[], 
    onToggle: any,
    index: number 
}) => {
    const isSelected = (type: string) => selections.some(s => s.matchId === match.id && s.selectionId === type);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-4 sm:p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors bg-background-elevated group"
        >
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                
                {/* Time & League */}
                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-1 min-w-[120px]">
                    {match.isLive ? (
                        <span className="flex items-center gap-2 text-red-500 font-bold text-xs animate-pulse">
                            <Flame size={12} fill="currentColor" /> LIVE • {match.score}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 text-gray-500 font-bold text-xs">
                            <Calendar size={12} /> {new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    )}
                    <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">{match.league}</span>
                </div>

                {/* Teams */}
                <div className="flex-1 flex justify-between items-center w-full md:w-auto px-4">
                    <div className="text-right flex-1 font-bold text-white text-lg">{match.homeTeam}</div>
                    <div className="mx-6 text-xs font-bold text-gray-600 bg-white/5 px-2 py-1 rounded">VS</div>
                    <div className="text-left flex-1 font-bold text-white text-lg">{match.awayTeam}</div>
                </div>

                {/* Odds Buttons */}
                <div className="flex gap-2 w-full md:w-auto">
                    <OddButton 
                        label="1" 
                        odd={match.markets.h2h[0]} 
                        active={isSelected('home')}
                        onClick={() => onToggle(match, 'home', match.markets.h2h[0])}
                    />
                    <OddButton 
                        label="X" 
                        odd={match.markets.h2h[1]} 
                        active={isSelected('draw')}
                        onClick={() => onToggle(match, 'draw', match.markets.h2h[1])}
                    />
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

const OddButton = ({ label, odd, active, onClick }: { label: string, odd: number, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`flex-1 md:w-24 py-2 rounded-xl flex flex-col items-center justify-center border transition-all ${
            active 
            ? 'bg-primary-500 text-black border-primary-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
            : 'bg-black/20 text-gray-400 border-white/5 hover:bg-white/5 hover:border-white/20 hover:text-white'
        }`}
    >
        <span className={`text-[10px] font-bold ${active ? 'text-black/60' : 'text-gray-600'}`}>{label}</span>
        <span className="font-bold font-mono">{odd.toFixed(2)}</span>
    </button>
);