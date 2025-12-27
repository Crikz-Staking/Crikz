import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Gamepad2, Dices, Coins, 
  TrendingUp, Target, ShieldAlert, Ghost,
  RefreshCw, Scissors, Binary, Rocket, ArrowDownCircle
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
import PhiTacToe from './PhiTacToe';
import CryptoRoulette from './CryptoRoulette';
import CryptoCrash from './CryptoCrash';  // <--- NEW
import Plinko from './Plinko';            // <--- NEW

interface BlockchainGamesProps {
  dynamicColor: string;
  lang: Language;
}

const GAMES_LIST = [
    // High Engagement
    { id: 'crash', title: 'Crypto Crash', desc: 'Cash Out Before the Moon', icon: Rocket, playable: true, featured: true },
    { id: 'plinko', title: 'Plinko', desc: 'Pegs of Probability', icon: ArrowDownCircle, playable: true, featured: true },
    
    // Classics
    { id: 'roulette', title: 'Crypto Roulette', desc: 'European Standard', icon: Target, playable: true },
    { id: 'dice', title: 'Fibonacci Dice', desc: 'Roll the Golden Ratio', icon: Dices, playable: true },
    { id: 'slots', title: 'Satoshi Slots', desc: 'Provably Fair Spins', icon: Coins, playable: true },
    { id: 'mines', title: 'Crypto Mines', desc: 'Avoid the Rug Pull', icon: ShieldAlert, playable: true },
    
    // Strategy / Simple
    { id: 'tictac', title: 'Phi-Tac-Toe', desc: 'Beat the AI Strategy', icon: Binary, playable: true },
    { id: 'highlow', title: 'High / Low', desc: 'Predict the Next Block', icon: TrendingUp, playable: true },
    { id: 'rps', title: 'Rock Paper Scissors', desc: 'PvE Strategy', icon: Scissors, playable: true },
    { id: 'coin', title: 'Quantum Flip', desc: '50/50 Probability', icon: RefreshCw, playable: true },
    
    // Coming Soon
    { id: 'ghost', title: 'Ghost Protocol', desc: 'Stealth Strategy', icon: Ghost, playable: false },
];

export default function BlockchainGames({ dynamicColor, lang }: BlockchainGamesProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [demoBalance, setDemoBalance] = useState(1000);

  const updateBalance = (amount: number) => setDemoBalance(prev => prev + amount);
  const resetBalance = () => { setDemoBalance(1000); toast.success("Reset to 1,000 PTS"); };

  return (
    <div className="space-y-8">
       {/* Game Overlays */}
       {activeGame === 'crash' && <CryptoCrash onClose={() => setActiveGame(null)} balance={demoBalance} onUpdateBalance={updateBalance} dynamicColor={dynamicColor} />}
       {activeGame === 'plinko' && <Plinko onClose={() => setActiveGame(null)} balance={demoBalance} onUpdateBalance={updateBalance} dynamicColor={dynamicColor} />}
       {activeGame === 'dice' && <FibonacciDiceGame onClose={() => setActiveGame(null)} balance={demoBalance} onUpdateBalance={updateBalance} dynamicColor={dynamicColor} />}
       {activeGame === 'slots' && <SatoshiSlots onClose={() => setActiveGame(null)} balance={demoBalance} onUpdateBalance={updateBalance} dynamicColor={dynamicColor} />}
       {activeGame === 'tictac' && <PhiTacToe onClose={() => setActiveGame(null)} balance={demoBalance} onUpdateBalance={updateBalance} dynamicColor={dynamicColor} />}
       {activeGame === 'roulette' && <CryptoRoulette onClose={() => setActiveGame(null)} balance={demoBalance} onUpdateBalance={updateBalance} dynamicColor={dynamicColor} />}
       {activeGame === 'coin' && <CoinFlip onClose={() => setActiveGame(null)} balance={demoBalance} onUpdateBalance={updateBalance} dynamicColor={dynamicColor} />}
       {activeGame === 'rps' && <RockPaperScissors onClose={() => setActiveGame(null)} balance={demoBalance} onUpdateBalance={updateBalance} dynamicColor={dynamicColor} />}
       {activeGame === 'highlow' && <HighLow onClose={() => setActiveGame(null)} balance={demoBalance} onUpdateBalance={updateBalance} dynamicColor={dynamicColor} />}
       {activeGame === 'mines' && <CryptoMines onClose={() => setActiveGame(null)} balance={demoBalance} onUpdateBalance={updateBalance} dynamicColor={dynamicColor} />}

       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <Gamepad2 className="text-primary-500" /> Arcade
            </h2>
            <p className="text-gray-400">Provably fair games using <b>Demo Points</b>.</p>
          </div>
          <div className="flex items-center gap-4">
              <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-bold uppercase">Balance</span>
                  <span className="text-xl font-black text-primary-500">{demoBalance.toLocaleString()} PTS</span>
              </div>
              <button onClick={resetBalance} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Reset">
                  <RefreshCw size={18} />
              </button>
          </div>
       </div>

       {/* Grid */}
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {GAMES_LIST.map((game) => (
             <motion.div 
                key={game.id}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`glass-card p-6 rounded-3xl border flex flex-col items-center text-center cursor-pointer transition-colors bg-background-elevated relative overflow-hidden group ${
                    !game.playable ? 'opacity-60 grayscale border-white/10' : 
                    (game as any).featured ? 'border-primary-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-white/10 hover:border-white/30'
                }`}
                onClick={() => game.playable && setActiveGame(game.id)}
             >
                {(game as any).featured && (
                    <div className="absolute top-0 right-0 bg-primary-500 text-black text-[9px] font-bold px-2 py-1 rounded-bl-xl">HOT</div>
                )}
                
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${game.playable ? 'bg-white/5 text-primary-500' : 'bg-white/5 text-gray-500'}`}>
                    <game.icon size={32} />
                </div>
                <h3 className="font-bold text-white mb-1">{game.title}</h3>
                <p className="text-[10px] text-gray-500">{game.desc}</p>
             </motion.div>
          ))}
       </div>
    </div>
  );
}