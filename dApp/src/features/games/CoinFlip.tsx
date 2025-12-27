import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

export default function CoinFlip({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(50);
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);

  const flip = async () => {
    if (balance < bet || flipping) return;
    setFlipping(true);
    setResult(null);
    onUpdateBalance(-bet);

    await new Promise(r => setTimeout(r, 2000)); // Wait for animation

    const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
    setResult(outcome);
    
    if (outcome === choice) {
        onUpdateBalance(bet * 2);
    }
    setFlipping(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden p-6 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <h3 className="text-xl font-black text-white mb-8">Quantum Flip</h3>

        {/* 3D Coin Container */}
        <div className="w-40 h-40 mb-8 perspective-[1000px]">
            <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: flipping ? 1800 : result === 'tails' ? 180 : 0 }}
                transition={{ duration: flipping ? 2 : 0.5, ease: "easeInOut" }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front (Heads) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-4 border-yellow-200 flex items-center justify-center backface-hidden shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                    <span className="text-4xl font-black text-yellow-900">H</span>
                </div>
                {/* Back (Tails) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border-4 border-gray-200 flex items-center justify-center backface-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ transform: 'rotateY(180deg)' }}>
                    <span className="text-4xl font-black text-gray-800">T</span>
                </div>
            </motion.div>
        </div>

        <div className="flex gap-2 w-full mb-6 bg-black/40 p-1 rounded-xl">
            <button onClick={() => setChoice('heads')} className={`flex-1 py-3 rounded-lg font-bold transition-all ${choice === 'heads' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}>HEADS</button>
            <button onClick={() => setChoice('tails')} className={`flex-1 py-3 rounded-lg font-bold transition-all ${choice === 'tails' ? 'bg-gray-200 text-black' : 'text-gray-500 hover:text-white'}`}>TAILS</button>
        </div>

        <div className="w-full flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5 mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase">Wager</span>
            <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="w-20 bg-transparent text-right font-bold text-white outline-none" />
        </div>

        <button onClick={flip} disabled={flipping || balance < bet} className="w-full btn-primary py-4 shadow-glow-sm">
            {flipping ? 'FLIPPING...' : `FLIP FOR ${bet * 2}`}
        </button>

        {result && !flipping && (
            <div className={`mt-4 font-bold flex items-center gap-2 ${result === choice ? 'text-emerald-500' : 'text-red-500'}`}>
                {result === choice ? <><CheckCircle size={16}/> YOU WON!</> : 'YOU LOST'}
            </div>
        )}
      </div>
    </div>
  );
}