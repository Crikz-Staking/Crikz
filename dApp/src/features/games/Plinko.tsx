import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownCircle, Settings2 } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

const ROWS = 12;

export default function Plinko({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(50);
  const [risk, setRisk] = useState<'low'|'medium'|'high'>('medium');
  const [activeBalls, setActiveBalls] = useState<{ id: number; path: number[]; bucket: number }[]>([]);
  const ballIdCounter = useRef(0);

  const multipliers = useMemo(() => {
      const count = ROWS + 1; 
      const center = Math.floor(count / 2);
      return Array.from({ length: count }).map((_, i) => {
          const dist = Math.abs(i - center);
          if (risk === 'high') {
              if (dist === center) return 29; 
              if (dist >= center - 2) return 9;
              return i % 2 === 0 ? 0.2 : 0.3;
          } else if (risk === 'medium') {
              if (dist === center) return 13;
              return dist === 0 ? 0.4 : 0.6 + (dist * 0.5);
          } else {
              return dist === 0 ? 0.5 : 1 + (dist * 0.2);
          }
      }).map(n => parseFloat(n.toFixed(1)));
  }, [risk]);

  const dropBall = () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);

    const path: number[] = []; 
    for(let i=0; i<ROWS; i++) {
        path.push(Math.random() > 0.5 ? 1 : 0);
    }

    const bucketIndex = path.reduce((a, b) => a + b, 0);
    const multiplier = multipliers[bucketIndex];
    
    const newBall = { id: ballIdCounter.current++, path, bucket: bucketIndex };
    setActiveBalls(prev => [...prev, newBall]);

    setTimeout(() => {
        const win = Math.floor(bet * multiplier);
        if (win > 0) onUpdateBalance(win);
        setActiveBalls(prev => prev.filter(b => b.id !== newBall.id));
    }, 2000); 
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>

        <div className="flex-[2] bg-[#0A0A0F] relative p-4 flex flex-col items-center justify-center border-r border-white/5 overflow-hidden">
            <div className="relative w-full max-w-md h-full flex flex-col justify-end pb-8">
                {/* Pins */}
                <div className="absolute top-10 left-0 right-0 bottom-16 flex flex-col justify-between z-10">
                    {Array.from({ length: ROWS }).map((_, row) => (
                        <div key={row} className="flex justify-center gap-[6%]" style={{ marginBottom: 'auto' }}>
                            {Array.from({ length: row + 3 }).map((_, col) => (
                                <div key={col} className="w-1.5 h-1.5 bg-white/20 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                            ))}
                        </div>
                    ))}
                </div>

                <AnimatePresence>
                    {activeBalls.map(ball => <PlinkoBall key={ball.id} path={ball.path} rows={ROWS} />)}
                </AnimatePresence>

                <div className="flex gap-1 w-full mt-auto pt-4 relative z-20">
                    {multipliers.map((m, i) => {
                        let color = 'bg-[#1a1a24] text-gray-500';
                        if (m >= 10) color = 'bg-red-500/20 text-red-500 border-red-500/50';
                        else if (m >= 2) color = 'bg-orange-500/20 text-orange-500 border-orange-500/50';
                        else if (m >= 1) color = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50';
                        
                        return (
                            <div key={i} className={`flex-1 h-10 flex items-center justify-center rounded-md border border-white/5 text-[9px] font-bold ${color}`}>
                                {m}x
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="flex-1 bg-[#181820] p-6 flex flex-col gap-6">
            <h3 className="text-xl font-black text-white flex items-center gap-2"><ArrowDownCircle className="text-primary-500"/> Plinko</h3>
            <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Bet Amount</label>
                    <input type="number" value={bet} onChange={e => setBet(Math.max(10, parseInt(e.target.value)))} className="w-full bg-white/5 rounded-lg px-3 py-2 text-white font-bold outline-none"/>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Risk Level</label>
                    <div className="flex bg-black/40 rounded-lg p-1">
                        {(['low', 'medium', 'high'] as const).map(r => (
                            <button key={r} onClick={() => setRisk(r)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${risk === r ? 'bg-primary-500 text-black' : 'text-gray-500'}`}>{r.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
            </div>
            <button onClick={dropBall} disabled={balance < bet} className="mt-auto w-full py-4 btn-primary shadow-glow-md">DROP BALL</button>
        </div>
      </div>
    </div>
  );
}

function PlinkoBall({ path, rows }: { path: number[], rows: number }) {
    const keyframesX = ['50%'];
    const keyframesY = ['5%']; 
    let currentX = 50;
    
    path.forEach((dir, i) => {
        const stepSize = 3.8; 
        const jitter = (Math.random() - 0.5) * 1.5;
        currentX += (dir === 0 ? -stepSize : stepSize) + jitter;
        
        keyframesX.push(`${currentX}%`);
        keyframesY.push(`${((i + 1) / rows) * 90}%`);
    });

    return (
        <motion.div
            initial={{ left: '50%', top: '5%', opacity: 1 }}
            animate={{ left: keyframesX, top: keyframesY }}
            transition={{ duration: 2, ease: "linear" }}
            className="absolute w-3 h-3 bg-primary-500 rounded-full shadow-[0_0_8px_#f59e0b] z-30"
        />
    );
}