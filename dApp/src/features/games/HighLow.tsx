import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowUp, ArrowDown } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

export default function HighLow({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [currentNumber, setCurrentNumber] = useState(50);
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const [bet, setBet] = useState(25);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("Predict if next number is Higher or Lower");

  useEffect(() => {
    setCurrentNumber(Math.floor(Math.random() * 100));
  }, []);

  const guess = async (direction: 'high' | 'low') => {
    if (balance < bet || playing) return;
    setPlaying(true);
    onUpdateBalance(-bet);
    
    // Animate numbers
    let temp = 0;
    const interval = setInterval(() => {
        temp = Math.floor(Math.random() * 100);
        setNextNumber(temp);
    }, 50);

    await new Promise(r => setTimeout(r, 1000));
    clearInterval(interval);

    const final = Math.floor(Math.random() * 100);
    setNextNumber(final);

    let won = false;
    if (direction === 'high' && final > currentNumber) won = true;
    if (direction === 'low' && final < currentNumber) won = true;

    if (won) {
        onUpdateBalance(bet * 2);
        setMessage("Correct! You won.");
    } else {
        setMessage("Incorrect.");
    }

    setTimeout(() => {
        setCurrentNumber(final);
        setNextNumber(null);
        setPlaying(false);
        setMessage("Place your bet");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden p-6 relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        <h3 className="text-xl font-black mb-1 text-white">High / Low</h3>
        <p className="text-xs text-gray-500 mb-8">{message}</p>

        <div className="flex justify-center items-center gap-4 mb-8">
            <div className="w-24 h-32 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-4xl font-bold text-white">
                {currentNumber}
            </div>
            <div className="text-gray-600 font-black">→</div>
            <div className="w-24 h-32 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center text-4xl font-bold text-primary-500">
                {nextNumber !== null ? nextNumber : '?'}
            </div>
        </div>

        <div className="bg-black/40 p-3 rounded-xl border border-white/10 mb-4 flex justify-between items-center">
            <span className="text-xs text-gray-500 font-bold uppercase">Bet</span>
            <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="bg-transparent text-right font-bold text-white w-20 outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button onClick={() => guess('high')} disabled={playing || balance < bet} className="py-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 border border-emerald-500/30 rounded-xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                <ArrowUp size={20}/> HIGHER
            </button>
            <button onClick={() => guess('low')} disabled={playing || balance < bet} className="py-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 rounded-xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                <ArrowDown size={20}/> LOWER
            </button>
        </div>
      </motion.div>
    </div>
  );
}