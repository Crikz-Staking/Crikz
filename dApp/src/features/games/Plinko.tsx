import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDown } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

// Simplified physics: 8 Rows
const ROWS = 8;
const MULTIPLIERS = [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6]; // 9 Buckets for 8 Rows

export default function Plinko({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(50);
  const [activeBalls, setActiveBalls] = useState<{ id: number; path: number[] }[]>([]);
  const ballIdCounter = useRef(0);

  const dropBall = () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);

    const path: number[] = []; // 0 = Left, 1 = Right
    let currentPos = 0; // Center offset approximation
    
    for(let i=0; i<ROWS; i++) {
        const dir = Math.random() > 0.5 ? 1 : 0;
        path.push(dir);
        currentPos += dir;
    }

    const newBall = { id: ballIdCounter.current++, path };
    setActiveBalls(prev => [...prev, newBall]);

    // Cleanup and Payout logic after animation duration
    setTimeout(() => {
        const bucketIndex = path.reduce((a, b) => a + b, 0); // 0 to 8
        const multiplier = MULTIPLIERS[bucketIndex];
        const win = Math.floor(bet * multiplier);
        if (win > 0) onUpdateBalance(win);
        
        setActiveBalls(prev => prev.filter(b => b.id !== newBall.id));
    }, 2500); // 2.5s fall time
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden relative flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
            <h3 className="font-black text-white text-xl">Plinko</h3>
            <div className="text-xs text-gray-500">Rows: {ROWS} • Risk: Medium</div>
        </div>

        <div className="flex-1 bg-black/40 p-8 relative min-h-[400px] flex flex-col items-center">
            {/* Pyramid */}
            <div className="relative w-full max-w-sm aspect-[4/3]">
                {/* Pins */}
                {Array.from({ length: ROWS }).map((_, row) => (
                    <div key={row} className="flex justify-center gap-8 mb-8" style={{ paddingLeft: (ROWS - row) * 0 }}>
                        {Array.from({ length: row + 3 }).map((_, col) => (
                            <div key={col} className="w-2 h-2 bg-white/20 rounded-full" />
                        ))}
                    </div>
                ))}

                {/* Balls */}
                <AnimatePresence>
                    {activeBalls.map(ball => (
                        <PlinkoBall key={ball.id} path={ball.path} />
                    ))}
                </AnimatePresence>
            </div>

            {/* Buckets */}
            <div className="flex gap-1 w-full justify-center mt-auto">
                {MULTIPLIERS.map((m, i) => {
                    let color = 'bg-white/5 text-gray-500';
                    if (m >= 5) color = 'bg-red-500/20 text-red-500 border-red-500/50';
                    else if (m >= 2) color = 'bg-orange-500/20 text-orange-500 border-orange-500/50';
                    else if (m < 1) color = 'bg-blue-500/10 text-blue-500/50';
                    
                    return (
                        <div key={i} className={`flex-1 h-10 flex items-center justify-center rounded-md border border-white/5 text-[10px] font-bold ${color}`}>
                            {m}x
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Controls */}
        <div className="p-6 bg-[#181820] flex gap-4 items-center">
            <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/10 flex-1 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Bet</span>
                <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="w-16 bg-transparent text-right font-bold text-white outline-none" />
            </div>
            <button 
                onClick={dropBall} 
                disabled={balance < bet}
                className="flex-[2] py-3 bg-primary-500 text-black font-black rounded-xl hover:bg-primary-400 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
                DROP BALL
            </button>
        </div>
      </motion.div>
    </div>
  );
}

// Ball Animation Component
function PlinkoBall({ path }: { path: number[] }) {
    // Generate keyframes based on path
    // 0 = Left, 1 = Right. 
    // Start at top center. 
    
    // Simplified visual logic for demo:
    // x range is roughly -150 to +150
    // y range is 0 to 300
    
    const keyframes = {
        x: [0, ...path.map((_, i) => {
            // Calculate cumulative offset
            const currentPath = path.slice(0, i + 1);
            const rightMoves = currentPath.filter(x => x === 1).length;
            const leftMoves = currentPath.length - rightMoves;
            return (rightMoves - leftMoves) * 15; // 15px visual spacing
        })],
        y: [0, ...path.map((_, i) => (i + 1) * 35)] // 35px row height
    };

    return (
        <motion.div
            initial={{ x: 0, y: -20, opacity: 0 }}
            animate={{ 
                x: keyframes.x,
                y: keyframes.y,
                opacity: 1
            }}
            exit={{ opacity: 0, scale: 2 }} // Disappear into bucket
            transition={{ duration: 2.5, ease: "linear" }}
            className="absolute top-4 left-[50%] -ml-1.5 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399] z-10"
        />
    );
}