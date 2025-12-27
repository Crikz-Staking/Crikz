import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Gamepad2, Swords, Brain, Dices, Layers, 
  Crown, Coins, TrendingUp, Target, Activity, 
  ShieldAlert, Ghost 
} from 'lucide-react';
import { Language } from '@/types';
import FibonacciDiceGame from './FibonacciDiceGame';

interface BlockchainGamesProps {
  dynamicColor: string;
  lang: Language;
}

const GAMES_LIST = [
    { id: 'dice', title: 'Fibonacci Dice', desc: 'Roll for Golden Ratio', icon: Dices, playable: true },
    { id: 'chess', title: 'Grandmaster Chess', desc: 'P2P Betting Elo Rated', icon: Crown, playable: false },
    { id: 'poker', title: 'Texas Hold\'em', desc: 'No-Limit P2P Tables', icon: Dices, playable: false },
    { id: 'tictac', title: 'Phi-Tac-Toe', desc: 'Beat the Fibonacci AI', icon: Brain, playable: false },
    { id: 'prime', title: 'Prime Hunter', desc: 'Find Primes, Earn Yield', icon: Layers, playable: false },
    { id: 'slots', title: 'Satoshi Slots', desc: 'Provably Fair Spins', icon: Coins, playable: false },
    { id: 'roulette', title: 'Crypto Roulette', desc: 'European Standard', icon: Target, playable: false },
    { id: 'blackjack', title: '21 Blackjack', desc: 'Dealer stands on 17', icon: Swords, playable: false },
    { id: 'baccarat', title: 'Baccarat', desc: 'Player vs Banker', icon: Activity, playable: false },
    { id: 'crash', title: 'Moon Crash', desc: 'Exit before the crash', icon: TrendingUp, playable: false },
    { id: 'mines', title: 'Minesweeper', desc: 'Clear the board', icon: ShieldAlert, playable: false },
    { id: 'ghost', title: 'Ghost Protocol', desc: 'Stealth Strategy', icon: Ghost, playable: false },
];

export default function BlockchainGames({ dynamicColor, lang }: BlockchainGamesProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  return (
    <div className="space-y-8">
       {activeGame === 'dice' && (
         <FibonacciDiceGame onClose={() => setActiveGame(null)} dynamicColor={dynamicColor} />
       )}

       <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <Gamepad2 className="text-primary-500" /> Active Arcade
            </h2>
            <p className="text-gray-400">P2P Betting & Provably Fair Games. Connect wallet to play.</p>
          </div>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {GAMES_LIST.map((game) => (
             <motion.div 
                key={game.id}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col items-center text-center cursor-pointer hover:border-primary-500/50 transition-colors bg-background-elevated relative overflow-hidden"
                onClick={() => setActiveGame(game.id)}
             >
                {game.playable && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live" />
                )}
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-primary-500">
                    <game.icon size={32} />
                </div>
                <h3 className="font-bold text-white mb-1">{game.title}</h3>
                <p className="text-xs text-gray-500">{game.desc}</p>
             </motion.div>
          ))}
       </div>
       
       {activeGame && activeGame !== 'dice' && (
           <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm" onClick={() => setActiveGame(null)}>
               <div className="glass-card p-12 rounded-3xl text-center max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
                   <h2 className="text-2xl font-bold mb-4">Coming in v3.1</h2>
                   <p className="text-gray-400 mb-6">Real-time P2P betting infrastructure for {activeGame} is currently being audited.</p>
                   <button onClick={() => setActiveGame(null)} className="px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-colors">Close</button>
               </div>
           </div>
       )}
    </div>
  );
}