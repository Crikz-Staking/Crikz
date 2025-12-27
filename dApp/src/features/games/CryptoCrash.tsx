import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Rocket, X, TrendingUp, AlertTriangle, Settings } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

export default function CryptoCrash({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [multiplier, setMultiplier] = useState(1.00);
  const [bet, setBet] = useState(100);
  const [autoCashout, setAutoCashout] = useState<number | ''>(2.0);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'crashed' | 'cashed'>('idle');
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  
  const reqRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const graphPathRef = useRef<string>("M 0 300");

  const startGame = () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);
    
    // Crash logic: 1% house edge instant crash, otherwise Pareto distribution
    const instantCrash = Math.random() < 0.03; // 3% instant loss
    const limit = instantCrash ? 1.00 : Math.max(1.01, (0.99 / (1 - Math.random())));
    
    setCrashPoint(limit);
    setGameState('running');
    setMultiplier(1.00);
    graphPathRef.current = "M 0 300";
    startTimeRef.current = Date.now();
    
    runGame();
  };

  const runGame = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const nextMult = 1.00 * Math.exp(0.12 * elapsed); // Slower exponential growth

    if (nextMult >= crashPoint) {
      handleCrash(crashPoint);
    } else {
      setMultiplier(nextMult);
      
      // Auto Cashout Check
      if (gameState === 'running' && autoCashout && nextMult >= Number(autoCashout)) {
          doCashOut(Number(autoCashout));
          // Game continues visually until crash, but user is out
      } else {
          reqRef.current = requestAnimationFrame(runGame);
      }
    }
  };

  const handleCrash = (finalValue: number) => {
    setGameState('crashed');
    setMultiplier(finalValue);
    setHistory(prev => [finalValue, ...prev].slice(0, 7));
    cancelAnimationFrame(reqRef.current!);
  };

  const doCashOut = (atMultiplier: number) => {
    if (gameState !== 'running') return;
    setGameState('cashed'); // Visual state for user
    const profit = Math.floor(bet * atMultiplier);
    onUpdateBalance(profit);
    // Animation frame continues until actual crash
  };

  useEffect(() => {
    return () => cancelAnimationFrame(reqRef.current!);
  }, []);

  // Generate Graph Path
  const width = 600;
  const height = 300;
  const normalizedX = Math.min(width, (multiplier - 1) * 50); // Scale X
  const normalizedY = height - Math.min(height, (multiplier - 1) * 80); // Scale Y
  const currentPath = `L ${normalizedX} ${normalizedY}`;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>

        {/* Graph Area */}
        <div className="flex-[2] bg-[#0A0A0F] relative flex flex-col border-r border-white/5 min-h-[350px] overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {/* SVG Graph */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
             <defs>
                <linearGradient id="crashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={dynamicColor} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={dynamicColor} stopOpacity="0" />
                </linearGradient>
             </defs>
             {gameState !== 'idle' && (
                 <>
                    <path d={`M 0 ${height} ${graphPathRef.current} ${currentPath}`} fill="none" stroke={gameState === 'crashed' ? '#EF4444' : dynamicColor} strokeWidth="3" />
                    <path d={`M 0 ${height} ${graphPathRef.current} ${currentPath} V ${height} H 0 Z`} fill="url(#crashGrad)" stroke="none" />
                 </>
             )}
          </svg>

          {/* Multiplier Display */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
             <motion.div 
                animate={gameState === 'crashed' ? { scale: [1, 1.1, 1], x: [0, -5, 5, 0] } : {}}
                className={`text-7xl font-black font-mono tracking-tighter ${
                    gameState === 'crashed' ? 'text-red-500' : 
                    gameState === 'cashed' ? 'text-emerald-500 opacity-50' : 
                    'text-white'
                }`}
             >
                {multiplier.toFixed(2)}x
             </motion.div>
             <div className="h-6 mt-2">
                {gameState === 'crashed' && <span className="text-red-500 font-bold flex items-center gap-2"><AlertTriangle size={16}/> CRASHED</span>}
                {gameState === 'cashed' && <span className="text-emerald-500 font-bold flex items-center gap-2"><TrendingUp size={16}/> CASHED OUT</span>}
                {gameState === 'running' && <span className="text-primary-500 font-bold flex items-center gap-2"><Rocket size={16} className="animate-pulse"/> LIFTOFF</span>}
             </div>
          </div>

          {/* History Bar */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
             {history.map((h, i) => (
               <div key={i} className={`text-[10px] font-bold px-2 py-1 rounded border ${h >= 2 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                 {h.toFixed(2)}x
               </div>
             ))}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="flex-1 p-6 bg-[#181820] flex flex-col gap-6 border-t md:border-t-0 md:border-l border-white/5">
           <div className="flex items-center gap-2">
              <Rocket className="text-primary-500" />
              <h3 className="font-black text-white text-lg">Control Panel</h3>
           </div>

           {/* Bet Input */}
           <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Bet Amount</label>
                  <span className="text-[10px] font-bold text-gray-400">{balance} PTS</span>
              </div>
              <div className="flex gap-2">
                 <input 
                    type="number" 
                    value={bet} 
                    onChange={e => setBet(Math.max(0, parseInt(e.target.value) || 0))} 
                    className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    disabled={gameState === 'running'}
                 />
                 <button onClick={() => setBet(Math.floor(balance/2))} className="px-3 bg-white/5 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white">1/2</button>
                 <button onClick={() => setBet(balance)} className="px-3 bg-white/5 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white">MAX</button>
              </div>
           </div>

           {/* Auto Cashout */}
           <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block flex items-center gap-1">
                  <Settings size={10}/> Auto Cashout
              </label>
              <div className="relative">
                 <input 
                    type="number" 
                    value={autoCashout} 
                    onChange={e => setAutoCashout(e.target.value === '' ? '' : Math.max(1.01, parseFloat(e.target.value)))} 
                    step="0.1"
                    className="w-full bg-white/5 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 pr-8"
                    placeholder="None"
                    disabled={gameState === 'running'}
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">x</span>
              </div>
           </div>

           <div className="mt-auto">
               {gameState === 'running' && gameState !== 'cashed' ? (
                 <button 
                    onClick={() => doCashOut(multiplier)}
                    className="w-full py-4 bg-emerald-500 text-black font-black text-xl rounded-xl hover:bg-emerald-400 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
                 >
                    CASH OUT <span className="block text-sm font-bold opacity-80">{(bet * multiplier).toFixed(0)} PTS</span>
                 </button>
               ) : (
                 <button 
                    onClick={startGame}
                    disabled={balance < bet || gameState === 'running'}
                    className="w-full py-4 bg-primary-500 text-black font-black text-xl rounded-xl hover:bg-primary-400 disabled:opacity-50 disabled:grayscale transition-all shadow-glow-md"
                 >
                    {gameState === 'cashed' ? 'NEXT ROUND' : 'PLACE BET'}
                 </button>
               )}
           </div>
        </div>
      </div>
    </div>
  );
}