import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

export default function CoinFlip({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);

  const flip = async () => {
    if (balance < bet) return;
    setFlipping(true);
    setResult(null);
    onUpdateBalance(-bet);

    await new Promise(r => setTimeout(r, 1000));

    const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
    setResult(outcome);
    
    if (outcome === choice) {
        onUpdateBalance(bet * 2);
    }
    setFlipping(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <h3 className="text-xl font-black text-center mb-6 text-white">Quantum Flip</h3>
        
        <div className="flex justify-center mb-8">
            <motion.div 
                className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-4xl font-bold ${
                    result ? (result === choice ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500' : 'border-red-500 bg-red-500/20 text-red-500') : 'border-white/10 bg-white/5 text-gray-500'
                }`}
                animate={flipping ? { rotateY: 1800 } : { rotateY: 0 }}
                transition={{ duration: 1 }}
            >
                {result ? result.toUpperCase()[0] : '?'}
            </motion.div>
        </div>

        <div className="flex gap-2 mb-6">
            <button onClick={() => setChoice('heads')} className={`flex-1 py-3 rounded-xl font-bold border ${choice === 'heads' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10'}`}>HEADS</button>
            <button onClick={() => setChoice('tails')} className={`flex-1 py-3 rounded-xl font-bold border ${choice === 'tails' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10'}`}>TAILS</button>
        </div>

        <div className="bg-black/40 p-3 rounded-xl border border-white/10 mb-4 flex justify-between items-center">
            <span className="text-xs text-gray-500 font-bold uppercase">Wager</span>
            <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="bg-transparent text-right font-bold text-white w-20 outline-none" />
        </div>

        <button onClick={flip} disabled={flipping || balance < bet} className="w-full btn-primary py-3">
            {flipping ? 'Flipping...' : 'FLIP COIN'}
        </button>
        
        {result && (
            <div className={`mt-4 text-center text-sm font-bold ${result === choice ? 'text-emerald-500' : 'text-red-500'}`}>
                {result === choice ? `You Won ${bet * 2} PTS!` : 'You Lost'}
            </div>
        )}
      </motion.div>
    </div>
  );
}