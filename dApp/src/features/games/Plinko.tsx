import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownCircle, Settings2 } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

const ROWS = 12; // Increased rows
const RISK_MULTIPLIERS = {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6], // Needs padding for 12 rows, simplified logic below
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
};

// Generate multipliers dynamically for row count
const generateMultipliers = (rows: number, risk: 'low'|'medium'|'high') => {
    // This is a mock function to simulate bell curve payouts
    const len = rows + 1;
    const center = Math.floor(len / 2);
    const arr = new Array(len).fill(0).map((_, i) => {
        const dist = Math.abs(i - center);
        const factor = risk === 'high' ? 3.5 : risk === 'medium' ? 2.5 : 1.5;
        let mult = Math.pow(factor, dist) * 0.2;
        if(dist === 0) mult = 0.3; // Center sink
        return parseFloat(mult.toFixed(1));
    });
    // Scale edges
    arr[0] *= (risk === 'high' ? 3 : 1.5);
    arr[arr.length-1] *= (risk === 'high' ? 3 : 1.5);
    return arr;
};

export default function Plinko({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(50);
  const [risk, setRisk] = useState<'low'|'medium'|'high'>('medium');
  const [activeBalls, setActiveBalls] = useState<{ id: number; path: number[]; multiplier: number }[]>([]);
  const ballIdCounter = useRef(0);
  const multipliers = generateMultipliers(ROWS, risk);

  const dropBall = () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);

    // Path generation with slight center bias (approximate normal distribution)
    const path: number[] = []; 
    for(let i=0; i<ROWS; i++) {
        // 0 = Left, 1 = Right.
        path.push(Math.random() > 0.5 ? 1 : 0);
    }

    const bucketIndex = path.reduce((a, b) => a + b, 0);
    const multiplier = multipliers[bucketIndex];
    
    const newBall = { id: ballIdCounter.current++, path, multiplier };
    setActiveBalls(prev => [...prev, newBall]);

    setTimeout(() => {
        const win = Math.floor(bet * multiplier);
        if (win > 0) onUpdateBalance(win);
        setActiveBalls(prev => prev.filter(b => b.id !== newBall.id));
    }, 3000); 
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>

        {/* Game Board */}
        <div className="flex-[2] bg-[#0A0A0F] relative p-4 flex flex-col items-center justify-center border-r border-white/5">
            <div className="relative w-full max-w-md h-full flex flex-col justify-end pb-8">
                {/* Pins */}
                <div className="absolute top-10 left-0 right-0 bottom-16 flex flex-col justify-between">
                    {Array.from({ length: ROWS }).map((_, row) => (
                        <div key={row} className="flex justify-center gap-[4%] h-2">
                            {Array.from({ length: row + 3 }).map((_, col) => (
                                <div key={col} className="w-1.5 h-1.5 bg-white/20 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Balls */}
                <AnimatePresence>
                    {activeBalls.map(ball => (
                        <PlinkoBall key={ball.id} path={ball.path} rows={ROWS} />
                    ))}
                </AnimatePresence>

                {/* Buckets */}
                <div className="flex gap-1 w-full mt-auto pt-4">
                    {multipliers.map((m, i) => {
                        let color = 'bg-white/5 text-gray-500';
                        if (m >= 10) color = 'bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_10px_#EF4444]';
                        else if (m >= 3) color = 'bg-orange-500/20 text-orange-500 border-orange-500/50';
                        else if (m >= 1) color = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50';
                        else color = 'bg-blue-500/10 text-blue-500/50';
                        
                        return (
                            <div key={i} className={`flex-1 h-8 flex items-center justify-center rounded-sm border border-white/5 text-[9px] font-bold ${color}`}>
                                {m}x
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="flex-1 bg-[#181820] p-6 flex flex-col gap-6">
            <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <ArrowDownCircle className="text-primary-500"/> Plinko
                </h3>
                <p className="text-xs text-gray-500">Drop balls, hit multipliers.</p>
            </div>

            <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Bet Amount</label>
                    <div className="flex gap-2">
                        <input type="number" value={bet} onChange={e => setBet(Math.max(10, parseInt(e.target.value)))} className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-white font-bold"/>
                        <button onClick={() => setBet(bet * 2)} className="px-3 bg-white/5 rounded-lg text-xs font-bold text-gray-400">2x</button>
                    </div>
                </div>

                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                        <Settings2 size={12}/> Risk Level
                    </label>
                    <div className="flex bg-black/40 rounded-lg p-1">
                        {(['low', 'medium', 'high'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setRisk(r)}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${risk === r ? 'bg-primary-500 text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                {r.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button 
                onClick={dropBall}
                disabled={balance < bet}
                className="mt-auto w-full py-4 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 hover:translate-y-[-2px] active:translate-y-[0px] transition-all shadow-glow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                DROP BALL
            </button>
        </div>
      </div>
    </div>
  );
}

function PlinkoBall({ path, rows }: { path: number[], rows: number }) {
    // Generate simple keyframes approximating physics
    // x follows the path array (0 left, 1 right)
    // y accelerates downwards
    
    // We map 0..1 to percentage across container width
    const moves = path.length;
    const keyframesX = ['50%'];
    const keyframesY = ['0%'];
    
    let currentX = 50; // Percent
    const stepX = 80 / rows; // Spread over 80% width
    
    path.forEach((dir, i) => {
        // Adding random jitter for "bouncing" look
        const jitter = (Math.random() - 0.5) * 2; 
        currentX += (dir === 0 ? -stepX/2 : stepX/2) + jitter;
        keyframesX.push(`${currentX}%`);
        keyframesY.push(`${((i + 1) / rows) * 90}%`); // Stop at 90% height (buckets)
    });

    return (
        <motion.div
            initial={{ left: '50%', top: '5%', opacity: 1, scale: 1 }}
            animate={{ 
                left: keyframesX,
                top: keyframesY
            }}
            transition={{ duration: 2.5, ease: "linear" }}
            onAnimationComplete={() => {}} // Could trigger sound here
            className="absolute w-3 h-3 bg-primary-500 rounded-full shadow-[0_0_8px_#f59e0b] z-20"
        />
    );
}