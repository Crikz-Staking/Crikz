import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Rocket, X, TrendingUp, AlertTriangle } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

export default function CryptoCrash({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [multiplier, setMultiplier] = useState(1.00);
  const [bet, setBet] = useState(100);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'crashed' | 'cashed'>('idle');
  const [crashPoint, setCrashPoint] = useState(0);
  const [cashedAt, setCashedAt] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  
  const reqRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const startGame = () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);
    
    // Provably fair-ish simulation: 1% chance of instant crash, otherwise exponential
    const limit = Math.max(1.0, (0.99 / (1 - Math.random())));
    setCrashPoint(limit);
    
    setGameState('running');
    setMultiplier(1.00);
    setCashedAt(0);
    startTimeRef.current = Date.now();
    
    runGame();
  };

  const runGame = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    // Growth function: 1.00 * e^(0.15 * t)
    const nextMult = 1.00 * Math.exp(0.15 * elapsed);

    if (nextMult >= crashPoint) {
      setGameState('crashed');
      setMultiplier(crashPoint);
      setHistory(prev => [crashPoint, ...prev].slice(0, 5));
    } else {
      setMultiplier(nextMult);
      reqRef.current = requestAnimationFrame(runGame);
    }
  };

  const cashOut = () => {
    if (gameState !== 'running') return;
    cancelAnimationFrame(reqRef.current!);
    setGameState('cashed');
    setCashedAt(multiplier);
    
    const profit = Math.floor(bet * multiplier);
    onUpdateBalance(profit);
    setHistory(prev => [multiplier, ...prev].slice(0, 5));
  };

  useEffect(() => {
    return () => cancelAnimationFrame(reqRef.current!);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden relative flex flex-col md:flex-row">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>

        {/* Game Area (Graph) */}
        <div className="flex-1 bg-black/40 p-8 relative flex flex-col justify-between min-h-[300px] border-r border-white/5">
          {/* History */}
          <div className="flex gap-2 absolute top-4 left-4">
            {history.map((h, i) => (
              <div key={i} className={`text-[10px] font-bold px-2 py-1 rounded-md ${h >= 2 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                {h.toFixed(2)}x
              </div>
            ))}
          </div>

          {/* Main Display */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className={`text-6xl font-black font-mono transition-colors ${
              gameState === 'crashed' ? 'text-red-500' : 
              gameState === 'cashed' ? 'text-emerald-500' : 
              'text-white'
            }`}>
              {multiplier.toFixed(2)}x
            </div>
            
            <div className="h-8 mt-2">
              {gameState === 'crashed' && <span className="text-red-500 font-bold flex items-center gap-2"><AlertTriangle size={16}/> CRASHED</span>}
              {gameState === 'cashed' && <span className="text-emerald-500 font-bold flex items-center gap-2"><TrendingUp size={16}/> CASHED OUT</span>}
              {gameState === 'running' && <span className="text-primary-500 font-bold flex items-center gap-2"><Rocket size={16} className="animate-pulse"/> TO THE MOON</span>}
            </div>
          </div>

          {/* Graph visual (Simplified CSS Rocket) */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
             {gameState === 'running' && (
                <motion.div 
                    className="absolute bottom-0 left-0 bg-primary-500 w-2 h-2 rounded-full shadow-[0_0_20px_#f59e0b]"
                    animate={{ x: "100%", y: "-100%" }}
                    transition={{ duration: 10, ease: "linear" }}
                />
             )}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full md:w-64 p-6 bg-[#181820] flex flex-col gap-6">
           <div>
              <h3 className="text-xl font-black text-white mb-1">Crash</h3>
              <p className="text-xs text-gray-500">Cash out before the crash.</p>
           </div>

           <div className="bg-black/40 p-4 rounded-xl border border-white/10">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Bet Amount</label>
              <div className="flex items-center justify-between">
                 <button onClick={() => setBet(Math.max(10, bet - 10))} className="p-1 bg-white/5 rounded text-gray-400 hover:text-white">-</button>
                 <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="bg-transparent text-center font-bold text-white w-20 outline-none" />
                 <button onClick={() => setBet(bet + 10)} className="p-1 bg-white/5 rounded text-gray-400 hover:text-white">+</button>
              </div>
              <div className="flex gap-1 mt-2">
                 <button onClick={() => setBet(100)} className="flex-1 py-1 bg-white/5 rounded text-[10px] text-gray-400 hover:bg-white/10">100</button>
                 <button onClick={() => setBet(500)} className="flex-1 py-1 bg-white/5 rounded text-[10px] text-gray-400 hover:bg-white/10">500</button>
                 <button onClick={() => setBet(Math.floor(balance/2))} className="flex-1 py-1 bg-white/5 rounded text-[10px] text-gray-400 hover:bg-white/10">1/2</button>
              </div>
           </div>

           {gameState === 'running' ? (
             <button 
                onClick={cashOut}
                className="w-full py-4 bg-emerald-500 text-black font-black text-lg rounded-xl hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
             >
                CASH OUT {(bet * multiplier).toFixed(0)}
             </button>
           ) : (
             <button 
                onClick={startGame}
                disabled={balance < bet}
                className="w-full py-4 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 disabled:opacity-50 transition-all"
             >
                PLACE BET
             </button>
           )}
        </div>
      </motion.div>
    </div>
  );
}