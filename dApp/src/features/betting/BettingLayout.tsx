import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, AlignLeft, Receipt, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { BettingMatch, SportId, BetSelection } from '@/types';
import { fetchLiveMatches, SPORT_KEYS } from '@/lib/sports-service';
import { useContractData } from '@/hooks/web3/useContractData';

// New Components
import SportsSidebar from './components/SportsSidebar';
import MatchRow from './components/MatchRow';
import BetSlip from './BetSlip';

interface BettingLayoutProps {
  dynamicColor: string;
}

export default function BettingLayout({ dynamicColor }: BettingLayoutProps) {
  const [activeSport, setActiveSport] = useState<SportId>('soccer');
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // For sidebar on mobile
  const [mobileSlipOpen, setMobileSlipOpen] = useState(false); // For slip on mobile
  
  const { balance } = useContractData();

  const { data: matches, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['matches', activeSport],
    queryFn: () => fetchLiveMatches(SPORT_KEYS[activeSport]),
    refetchInterval: 60000,
  });

  const toggleSelection = (match: BettingMatch, type: 'home' | 'draw' | 'away', odds: number) => {
    // Basic logic: if clicking existing, remove it. If new, replace existing for that match.
    // MVP: Single bet logic mostly, but array allows expansion.
    const id = match.id;
    const name = type === 'home' ? match.homeTeam : type === 'away' ? match.awayTeam : 'Draw';
    
    setSelections(prev => {
        const exists = prev.find(s => s.matchId === id);
        if (exists && exists.selectionId === type) {
            return prev.filter(s => s.matchId !== id);
        }
        // Replace previous selection for this match with new one (cannot bet Home AND Away same ticket usually)
        const others = prev.filter(s => s.matchId !== id);
        return [...others, {
            matchId: id,
            selectionId: type,
            selectionName: name,
            matchName: `${match.homeTeam} vs ${match.awayTeam}`,
            odds
        }];
    });
    // Open slip on selection
    setMobileSlipOpen(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[800px] relative">
      
      {/* LEFT: Sidebar (Sport Navigation) */}
      <div className={`fixed inset-0 bg-black/95 z-50 lg:static lg:bg-transparent lg:block lg:w-64 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
         <SportsSidebar 
            activeSport={activeSport} 
            onSelect={(id) => { setActiveSport(id); setMobileMenuOpen(false); }} 
            dynamicColor={dynamicColor} 
         />
      </div>

      {/* CENTER: Main Feed */}
      <div className="flex-1 min-w-0">
        {/* Mobile Header Controls */}
        <div className="flex lg:hidden justify-between items-center mb-4">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-white/5 rounded-lg text-white"><AlignLeft/></button>
            <h2 className="font-black text-white flex items-center gap-2"><Trophy size={18} className="text-primary-500"/> Sports</h2>
            <button onClick={() => setMobileSlipOpen(true)} className="p-2 bg-white/5 rounded-lg text-white relative">
                <Receipt/>
                {selections.length > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-primary-500 rounded-full"/>}
            </button>
        </div>

        {/* Feed Header */}
        <div className="glass-card p-6 rounded-2xl mb-6 bg-gradient-to-r from-[#1a1a24] to-[#12121a] border border-white/5 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    {/* Dynamic Icon based on sport would go here */}
                    {activeSport.toUpperCase()}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                    Live Markets Available
                </div>
            </div>
            <button 
                onClick={() => refetch()} 
                className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all ${isRefetching ? 'animate-spin' : ''}`}
            >
                <RefreshCw size={18} />
            </button>
        </div>

        {/* Matches List */}
        <div className="space-y-3">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"/>
                    <p className="text-xs font-bold text-gray-500">Scanning Oracle Networks...</p>
                </div>
            ) : isError ? (
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center gap-4 text-red-400">
                    <AlertCircle size={24}/>
                    <div>
                        <h4 className="font-bold">Data Stream Offline</h4>
                        <p className="text-xs opacity-70">Could not fetch live odds. Please check API limits.</p>
                    </div>
                </div>
            ) : matches?.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                    <p className="text-gray-500 font-bold">No live matches found for this category.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {matches?.map((match, i) => (
                        <MatchRow 
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
      </div>

      {/* RIGHT: Bet Slip */}
      <BetSlip 
        selections={selections}
        onRemove={(id) => setSelections(p => p.filter(s => s.matchId !== id))}
        onClear={() => setSelections([])}
        balance={Number(balance) / 1e18}
        dynamicColor={dynamicColor}
        isOpenMobile={mobileSlipOpen}
        onCloseMobile={() => setMobileSlipOpen(false)}
      />

      {/* Mobile Overlay Background */}
      {(mobileMenuOpen || mobileSlipOpen) && (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => { setMobileMenuOpen(false); setMobileSlipOpen(false); }}
        />
      )}
    </div>
  );
}