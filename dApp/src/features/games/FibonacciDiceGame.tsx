import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dices, Trophy, X } from 'lucide-react';

interface FibonacciDiceGameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

export default function FibonacciDiceGame({ onClose, balance, onUpdateBalance, dynamicColor }: FibonacciDiceGameProps) {
  const [betAmount, setBetAmount] = useState(10);
  const [gameMode, setGameMode] = useState<'fib' | 'prime'>('fib');
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState<{ roll: number; won: boolean; profit: number } | null>(null);

  const FIB_NUMBERS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

  const handleRoll = async () => {
    if (balance < betAmount) return;
    
    setRolling(true);
    setLastResult(null);
    onUpdateBalance(-betAmount); // Deduct bet immediately

    await new Promise(r => setTimeout(r, 1000));

    const roll = Math.floor(Math.random() * 100) + 1;
    let won = false;
    let multiplier = 0;

    if (gameMode === 'fib') {
        if (FIB_NUMBERS.includes(roll)) {
            won = true;
            multiplier = 5;
        }
    } else {
        if (PRIMES.includes(roll)) {
            won = true;
            multiplier = 3;
        }
    }

    const profit = won ? betAmount * multiplier : 0;
    if (won) onUpdateBalance(profit);

    setLastResult({ roll, won, profit });
    setRolling(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg text-primary-500"><Dices size={24} /></div>
            <div>
              <h3 className="text-xl font-black text-white">Fibonacci Dice</h3>
              <p className="text-xs text-gray-500">Balance: {balance.toLocaleString()} PTS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        <div className="p-8 text-center">
          <div className="flex justify-center gap-4 mb-8">
             <button onClick={() => setGameMode('fib')} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${gameMode === 'fib' ? 'bg-primary-500 text-black border-primary-500' : 'bg-transparent text-gray-400 border-white/10'}`}>Fibonacci (5x)</button>
             <button onClick={() => setGameMode('prime')} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${gameMode === 'prime' ? 'bg-primary-500 text-black border-primary-500' : 'bg-transparent text-gray-400 border-white/10'}`}>Prime (3x)</button>
          </div>

          <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-8">
            {rolling ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }} className="w-24 h-24 border-4 border-dashed border-primary-500 rounded-full" />
            ) : (
              <div className={`w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-black border-2 ${lastResult ? (lastResult.won ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-red-500/20 border-red-500 text-red-500') : 'bg-white/5 border-white/10 text-gray-500'}`}>
                {lastResult ? lastResult.roll : '?'}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
               <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Bet Points</label>
               <input type="number" value={betAmount} onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)} className="bg-transparent text-center text-xl font-bold text-white w-24 outline-none" />
            </div>
          </div>

          <button onClick={handleRoll} disabled={rolling || balance < betAmount} className="w-full py-4 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 disabled:opacity-50 transition-all">
            {rolling ? 'Rolling...' : 'ROLL DICE'}
          </button>

          {lastResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 p-4 rounded-xl border ${lastResult.won ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {lastResult.won ? <div className="flex items-center justify-center gap-2 font-bold"><Trophy size={18} /><span>Win! +{lastResult.profit} PTS</span></div> : <div className="font-bold text-sm">Miss. Try again?</div>}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}