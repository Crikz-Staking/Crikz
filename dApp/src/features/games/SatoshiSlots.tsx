import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Coins, RotateCw, X, Trophy } from 'lucide-react';

interface SatoshiSlotsProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔'];
const COST_PER_SPIN = 50;

export default function SatoshiSlots({ onClose, balance, onUpdateBalance, dynamicColor }: SatoshiSlotsProps) {
  const [reels, setReels] = useState([0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [message, setMessage] = useState('Spin to Win!');
  const controls = useAnimation();

  const spin = async () => {
    if (spinning || balance < COST_PER_SPIN) return;
    
    setSpinning(true);
    setWinAmount(0);
    setMessage('Spinning...');
    onUpdateBalance(-COST_PER_SPIN);

    await controls.start({ y: [0, -100, 0], transition: { duration: 0.2, repeat: 5 } });

    const newReels = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length)
    ];

    setReels(newReels);
    
    let reward = 0;
    if (newReels[0] === newReels[1] && newReels[1] === newReels[2]) {
      const symbolIndex = newReels[0];
      const multiplier = (symbolIndex + 1) * 10; 
      reward = COST_PER_SPIN * multiplier;
      setMessage(`JACKPOT! You won ${reward} PTS`);
    } else if (newReels[0] === newReels[1] || newReels[1] === newReels[2] || newReels[0] === newReels[2]) {
      reward = COST_PER_SPIN * 2;
      setMessage(`Small Win! +${reward} PTS`);
    } else {
      setMessage('Try Again');
    }

    if (reward > 0) {
        setWinAmount(reward);
        onUpdateBalance(reward);
    }

    setSpinning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1a1a24] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]">
        <div className="p-4 bg-gradient-to-r from-amber-600/20 to-transparent border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2"><Coins className="text-amber-500" /><span className="font-black text-white">SATOSHI SLOTS</span></div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full"><X size={20}/></button>
        </div>

        <div className="p-8 flex flex-col items-center">
          <div className="bg-black/50 p-6 rounded-2xl border-4 border-amber-600/30 mb-8 relative shadow-inner w-full">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/50 z-10 pointer-events-none"></div>
            <div className="flex justify-between gap-2">
              {reels.map((symbolIdx, i) => (
                <div key={i} className="w-20 h-24 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative">
                  <motion.div animate={spinning ? { y: [0, -500] } : { y: 0 }} transition={spinning ? { repeat: Infinity, duration: 0.1, ease: "linear" } : {}} className="text-5xl">{SYMBOLS[symbolIdx]}</motion.div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-16 flex flex-col items-center justify-center mb-6">
            {winAmount > 0 ? (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.1, opacity: 1 }} className="text-amber-400 font-black text-2xl flex items-center gap-2"><Trophy className="animate-bounce" /> {message}</motion.div>
            ) : <div className="text-gray-400 font-bold">{message}</div>}
          </div>

          <div className="w-full space-y-4">
            <div className="flex justify-between text-xs text-gray-500 font-mono uppercase"><span>Cost: {COST_PER_SPIN} PTS</span><span>Balance: {balance.toLocaleString()} PTS</span></div>
            <button onClick={spin} disabled={spinning || balance < COST_PER_SPIN} className="w-full py-4 bg-gradient-to-b from-amber-400 to-amber-600 text-black font-black text-xl rounded-xl shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3">
              {spinning ? <RotateCw className="animate-spin" /> : 'SPIN'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}