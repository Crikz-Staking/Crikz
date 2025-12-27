import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gamepad2, Dices, Layers, Crown, Coins, 
  TrendingUp, Target, Activity, ShieldAlert, Ghost,
  Zap, RefreshCw, Scissors, Binary
} from 'lucide-react';
import { Language } from '@/types';
import { toast } from 'react-hot-toast';

// Games
import FibonacciDiceGame from './FibonacciDiceGame';
import SatoshiSlots from './SatoshiSlots';
import CoinFlip from './CoinFlip';
import RockPaperScissors from './RockPaperScissors';
import HighLow from './HighLow';
import CryptoMines from './CryptoMines';

interface BlockchainGamesProps {
  dynamicColor: string;
  lang: Language;
}

const GAMES_LIST = [
    { id: 'dice', title: 'Fibonacci Dice', desc: 'Roll the Golden Ratio', icon: Dices, playable: true },
    { id: 'slots', title: 'Satoshi Slots', desc: 'Provably Fair Spins', icon: Coins, playable: true },
    { id: 'coin', title: 'Quantum Flip', desc: '50/50 Probability', icon: RefreshCw, playable: true },
    { id: 'rps', title: 'Rock Paper Scissors', desc: 'PvE Strategy', icon: Scissors, playable: true },
    { id: 'highlow', title: 'High / Low', desc: 'Predict the Next Block', icon: TrendingUp, playable: true },
    { id: 'mines', title: 'Crypto Mines', desc: 'Avoid the Rug Pull', icon: ShieldAlert, playable: true },
    
    // Future Games
    { id: 'chess', title: 'Grandmaster Chess', desc: 'Elo Rated Matches', icon: Crown, playable: false },
    { id: 'poker', title: 'Texas Hold\'em', desc: 'No-Limit Tables', icon: Dices, playable: false },
    { id: 'tictac', title: 'Phi-Tac-Toe', desc: 'Beat the AI', icon: Binary, playable: false },
    { id: 'roulette', title: 'Crypto Roulette', desc: 'European Standard', icon: Target, playable: false },
    { id: 'ghost', title: 'Ghost Protocol', desc: 'Stealth Strategy', icon: Ghost, playable: false },
];

export default function BlockchainGames({ dynamicColor, lang }: BlockchainGamesProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
  // GLOBAL DEMO POINTS STATE
  // In a real app, this would fetch from a contract or backend.
  // Here it acts as a session wallet for the games.
  const [demoBalance, setDemoBalance] = useState(1000);

  const updateBalance = (amount: number) => {
    setDemoBalance(prev => prev + amount);
  };

  const resetBalance = () => {
    setDemoBalance(1000);
    toast.success("Demo points reset to 1,000");
  };

  return (
    <div className="space-y-8">
       {/* Game Overlays - Passing Session State */}
       {activeGame === 'dice' && (
         <FibonacciDiceGame 
            onClose={() => setActiveGame(null)} 
            balance={demoBalance} 
            onUpdateBalance={updateBalance}
            dynamicColor={dynamicColor} 
         />
       )}
       {activeGame === 'slots' && (
         <SatoshiSlots 
            onClose={() => setActiveGame(null)} 
            balance={demoBalance} 
            onUpdateBalance={updateBalance}
            dynamicColor={dynamicColor} 
         />
       )}
       {activeGame === 'coin' && (
         <CoinFlip
            onClose={() => setActiveGame(null)} 
            balance={demoBalance} 
            onUpdateBalance={updateBalance}
            dynamicColor={dynamicColor} 
         />
       )}
       {activeGame === 'rps' && (
         <RockPaperScissors
            onClose={() => setActiveGame(null)} 
            balance={demoBalance} 
            onUpdateBalance={updateBalance}
            dynamicColor={dynamicColor} 
         />
       )}
       {activeGame === 'highlow' && (
         <HighLow
            onClose={() => setActiveGame(null)} 
            balance={demoBalance} 
            onUpdateBalance={updateBalance}
            dynamicColor={dynamicColor} 
         />
       )}
       {activeGame === 'mines' && (
         <CryptoMines
            onClose={() => setActiveGame(null)} 
            balance={demoBalance} 
            onUpdateBalance={updateBalance}
            dynamicColor={dynamicColor} 
         />
       )}

       {/* Header with Balance */}
       <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <Gamepad2 className="text-primary-500" /> Blockchain Games
            </h2>
            <p className="text-gray-400">Play using <b>Demo Points</b>. No real funds required.</p>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-bold uppercase">Session Balance</span>
                  <span className="text-xl font-black text-primary-500">{demoBalance.toLocaleString()} PTS</span>
              </div>
              <button 
                onClick={resetBalance}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Reset Points"
              >
                  <RefreshCw size={18} />
              </button>
          </div>
       </div>

       {/* Game Grid */}
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {GAMES_LIST.map((game) => (
             <motion.div 
                key={game.id}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`glass-card p-6 rounded-3xl border border-white/10 flex flex-col items-center text-center cursor-pointer transition-colors bg-background-elevated relative overflow-hidden group ${!game.playable && 'opacity-60 grayscale'}`}
                onClick={() => setActiveGame(game.id)}
             >
                {game.playable ? (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10B981]" title="Playable" />
                ) : (
                  <div className="absolute top-3 right-3 text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-gray-500">SOON</div>
                )}
                
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${game.playable ? 'bg-primary-500/10 text-primary-500' : 'bg-white/5 text-gray-500'}`}>
                    <game.icon size={32} />
                </div>
                
                <h3 className={`font-bold mb-1 ${game.playable ? 'text-white' : 'text-gray-500'}`}>{game.title}</h3>
                <p className="text-xs text-gray-500">{game.desc}</p>
                
                {game.playable && (
                    <div className="mt-4 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-[10px] font-bold text-primary-500 uppercase tracking-wide group-hover:bg-primary-500 group-hover:text-black transition-colors">
                        Play Demo
                    </div>
                )}
             </motion.div>
          ))}
       </div>
       
       {/* Modal for Unreleased Games */}
       {activeGame && !GAMES_LIST.find(g => g.id === activeGame)?.playable && (
           <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm" onClick={() => setActiveGame(null)}>
               <div className="glass-card p-12 rounded-3xl text-center max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
                   <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Activity size={40} className="text-gray-500" />
                   </div>
                   <h2 className="text-2xl font-bold mb-2 text-white">In Development</h2>
                   <p className="text-gray-400 mb-8">This game module is currently being built. Check back in the next update.</p>
                   <button onClick={() => setActiveGame(null)} className="px-8 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-colors text-white">Close</button>
               </div>
           </div>
       )}
    </div>
  );
}