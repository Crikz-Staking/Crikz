import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Rocket, X, TrendingUp, AlertTriangle, Settings } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

type CrashState = 'idle' | 'running' | 'crashed' | 'cashed';

export default function CryptoCrash({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [multiplier, setMultiplier] = useState(1.00);
  const [bet, setBet] = useState(100);
  const [autoCashout, setAutoCashout] = useState<number | ''>(2.0);
  const [gameState, setGameState] = useState<CrashState>('idle');
  const [history, setHistory] = useState<number[]>([]);
  
  const stateRef = useRef<CrashState>('idle');
  const crashPointRef = useRef(0);
  const startTimeRef = useRef(0);
  const reqRef = useRef<number>();
  const betRef = useRef(100);

  useEffect(() => { stateRef.current = gameState; }, [gameState]);
  useEffect(() => { betRef.current = bet; }, [bet]);

  const startGame = () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);
    
    // Crash logic: 3% instant crash (House Edge)
    const instantCrash = Math.random() < 0.03;
    const limit = instantCrash ? 1.00 : Math.max(1.01, (0.99 / (1 - Math.random())));
    
    crashPointRef.current = limit;
    startTimeRef.current = Date.now();
    setMultiplier(1.00);
    setGameState('running');
    
    runGame();
  };

  const runGame = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const nextMult = 1.00 * Math.exp(0.12 * elapsed); // Slightly slower curve for tension

    if (nextMult >= crashPointRef.current) {
      setMultiplier(crashPointRef.current);
      setGameState('crashed');
      setHistory(prev => [crashPointRef.current, ...prev].slice(0, 7));
    } else {
      setMultiplier(nextMult);
      
      if (stateRef.current === 'running' && autoCashout && nextMult >= Number(autoCashout)) {
          handleCashOut(Number(autoCashout));
          reqRef.current = requestAnimationFrame(runGame);
      } else {
          reqRef.current = requestAnimationFrame(runGame);
      }
    }
  };

  const handleCashOut = (atMult: number) => {
      if (stateRef.current !== 'running') return;
      setGameState('cashed');
      const profit = Math.floor(betRef.current * atMult);
      onUpdateBalance(profit);
  };

  const userCashOut = () => {
      handleCashOut(multiplier);
  };

  useEffect(() => {
    return () => { if (reqRef.current) cancelAnimationFrame(reqRef.current); };
  }, []);

  // SVG Logic
  const width = 600;
  const height = 300;
  const maxDisplay = Math.max(2, multiplier * 1.1); // Keep line somewhat grounded
  const normX = Math.min(width, (Math.log(multiplier) / Math.log(maxDisplay)) * width); 
  const normY = height - ((multiplier - 1) / (maxDisplay - 1)) * height * 0.8; // Use 80% height max
  
  const path = `M 0 ${height} Q ${width/4} ${height} ${normX} ${Math.max(20, normY)}`;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>

        <div className="flex-[2] bg-[#0A0A0F] relative flex flex-col border-r border-white/5 min-h-[350px] overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
             <defs>
                <linearGradient id="crashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={dynamicColor} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={dynamicColor} stopOpacity="0" />
                </linearGradient>
             </defs>
             {gameState !== 'idle' && (
                 <>
                    <path d={path} fill="none" stroke={gameState === 'crashed' ? '#EF4444' : dynamicColor} strokeWidth="4" strokeLinecap="round"/>
                    <path d={`${path} V ${height} H 0 Z`} fill="url(#crashGrad)" stroke="none" />
                 </>
             )}
          </svg>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
             <div className={`text-7xl font-black font-mono tracking-tighter transition-colors ${
                 gameState === 'crashed' ? 'text-red-500' : 
                 gameState === 'cashed' ? 'text-emerald-500' : 'text-white'
             }`}>
                {multiplier.toFixed(2)}x
             </div>
             <div className="h-6 mt-2 font-bold flex items-center gap-2">
                {gameState === 'crashed' && <span className="text-red-500"><AlertTriangle size={16}/> CRASHED</span>}
                {gameState === 'cashed' && <span className="text-emerald-500"><TrendingUp size={16}/> CASHED OUT</span>}
                {gameState === 'running' && <span className="text-primary-500"><Rocket size={16} className="animate-pulse"/> FLYING</span>}
             </div>
          </div>

          <div className="absolute top-4 left-4 flex gap-2 z-10">
             {history.map((h, i) => (
               <div key={i} className={`text-[10px] font-bold px-2 py-1 rounded border ${h >= 2 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                 {h.toFixed(2)}x
               </div>
             ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 p-6 bg-[#181820] flex flex-col gap-6 border-t md:border-t-0 md:border-l border-white/5">
           <div><h3 className="font-black text-white text-lg">Control Panel</h3></div>

           <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Bet Amount</label>
              <div className="flex gap-2">
                 <input 
                    type="number" 
                    value={bet} 
                    onChange={e => setBet(Math.max(0, parseInt(e.target.value) || 0))} 
                    className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-white font-bold text-sm outline-none focus:ring-1 focus:ring-primary-500"
                    disabled={gameState === 'running'}
                 />
                 <button onClick={() => setBet(Math.floor(balance/2))} disabled={gameState === 'running'} className="px-3 bg-white/5 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white">1/2</button>
                 <button onClick={() => setBet(balance)} disabled={gameState === 'running'} className="px-3 bg-white/5 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white">MAX</button>
              </div>
           </div>

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
                    className="w-full bg-white/5 rounded-lg px-3 py-2 text-white font-bold text-sm outline-none focus:ring-1 focus:ring-primary-500 pr-8"
                    placeholder="None"
                    disabled={gameState === 'running'}
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">x</span>
              </div>
           </div>

           <div className="mt-auto">
               {gameState === 'running' ? (
                 <button 
                    onClick={userCashOut}
                    className="w-full py-4 bg-emerald-500 text-black font-black text-xl rounded-xl hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
                 >
                    CASH OUT {(bet * multiplier).toFixed(0)}
                 </button>
               ) : (
                 <button 
                    onClick={startGame}
                    disabled={balance < bet}
                    className="w-full py-4 bg-primary-500 text-black font-black text-xl rounded-xl hover:bg-primary-400 disabled:opacity-50 disabled:grayscale transition-all shadow-glow-md"
                 >
                    {gameState === 'cashed' || gameState === 'crashed' ? 'NEXT ROUND' : 'PLACE BET'}
                 </button>
               )}
           </div>
        </div>
      </div>
    </div>
  );
}