import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Coins, X, Trophy } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔'];
// Weighted random for better game feel (near misses)
const getRandomSymbol = () => {
    const weights = [0.3, 0.25, 0.2, 0.15, 0.05, 0.05]; // 7 and Bell rare
    const r = Math.random();
    let sum = 0;
    for(let i=0; i<weights.length; i++) {
        sum += weights[i];
        if (r <= sum) return i;
    }
    return 0;
};

export default function SatoshiSlots({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [reels, setReels] = useState([0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState(0);
  const controls = useAnimation();

  const spin = async () => {
    if (spinning || balance < 50) return;
    setSpinning(true);
    setWin(0);
    onUpdateBalance(-50);

    // Start blur animation
    await controls.start({ y: [0, -100, 0], filter: "blur(4px)", transition: { duration: 0.1, repeat: 10 } });
    
    // Stop blur
    controls.set({ filter: "blur(0px)" });

    const newReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
    setReels(newReels);

    let payout = 0;
    if (newReels[0] === newReels[1] && newReels[1] === newReels[2]) {
        payout = 50 * ((newReels[0] + 1) * 5); // 5x to 30x base multiplier
    } else if (newReels[0] === newReels[1] || newReels[1] === newReels[2]) {
        payout = 50 * 1.5; // Small win
    }

    if (payout > 0) {
        setWin(payout);
        onUpdateBalance(payout);
    }
    setSpinning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1a1a24] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative shadow-[0_0_50px_rgba(245,158,11,0.15)]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>
        
        <div className="p-8 text-center bg-gradient-to-b from-amber-500/10 to-transparent">
            <h3 className="text-2xl font-black text-amber-500 flex justify-center items-center gap-2"><Coins /> SATOSHI SLOTS</h3>
        </div>

        <div className="px-8 pb-8">
            <div className="bg-black border-4 border-amber-600/30 rounded-2xl p-6 relative overflow-hidden">
                {/* Payline */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/50 z-10 pointer-events-none" />
                
                <div className="flex justify-between gap-2">
                    {reels.map((s, i) => (
                        <div key={i} className="w-20 h-28 bg-[#12121A] rounded-lg border border-white/10 flex items-center justify-center overflow-hidden">
                            <motion.div animate={spinning ? { y: [0, -100, 0], filter: ["blur(0px)", "blur(8px)", "blur(0px)"] } : {}} transition={spinning ? { repeat: Infinity, duration: 0.1 } : {}} className="text-5xl">
                                {SYMBOLS[s]}
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-16 flex items-center justify-center mt-4">
                {win > 0 ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-emerald-500 text-black font-black px-6 py-2 rounded-full text-xl flex items-center gap-2">
                        <Trophy size={20} /> +{win} PTS
                    </motion.div>
                ) : (
                    <div className="text-gray-500 font-mono text-xs">SPIN TO WIN • COST 50 PTS</div>
                )}
            </div>

            <button onClick={spin} disabled={spinning || balance < 50} className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xl rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100">
                {spinning ? 'ROLLING...' : 'SPIN!'}
            </button>
        </div>
      </motion.div>
    </div>
  );
}