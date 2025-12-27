import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dices, Trophy, RotateCcw, X } from 'lucide-react';
import { calculateDiceResult } from '@/lib/gameLogic';
import { formatTokenAmount } from '@/lib/utils';
import { parseEther } from 'viem';

interface FibonacciDiceGameProps {
  onClose: () => void;
  dynamicColor: string;
}

export default function FibonacciDiceGame({ onClose, dynamicColor }: FibonacciDiceGameProps) {
  const [betAmount, setBetAmount] = useState('10');
  const [gameMode, setGameMode] = useState<'fib' | 'prime'>('fib');
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState<{ roll: number; won: boolean; reward: bigint } | null>(null);

  const handleRoll = async () => {
    setRolling(true);
    setLastResult(null);

    // Simulate network delay / VRF wait
    await new Promise(r => setTimeout(r, 1500));

    const betBig = parseEther(betAmount);
    // Use the logic from your library (ensuring we handle the object return correctly)
    const logicResult = calculateDiceResult(betBig, gameMode);
    
    // Parse the message to extract the roll number for display (hacky but works for demo)
    const match = logicResult.message.match(/rolled (\d+)/);
    const rollVal = match ? parseInt(match[1]) : 0;

    setLastResult({
      roll: rollVal,
      won: logicResult.won,
      reward: logicResult.reward
    });
    setRolling(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg text-primary-500">
              <Dices size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Fibonacci Dice</h3>
              <p className="text-xs text-gray-500">Roll a Fibonacci number to win 5x</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Game Area */}
        <div className="p-8 text-center">
          
          <div className="mb-8">
            <div className="flex justify-center gap-4 mb-6">
               <button 
                 onClick={() => setGameMode('fib')}
                 className={`px-4 py-2 rounded-xl text-sm font-bold border ${gameMode === 'fib' ? 'bg-primary-500 text-black border-primary-500' : 'bg-black/40 text-gray-400 border-white/10'}`}
               >
                 Fibonacci Mode (5x)
               </button>
               <button 
                 onClick={() => setGameMode('prime')}
                 className={`px-4 py-2 rounded-xl text-sm font-bold border ${gameMode === 'prime' ? 'bg-primary-500 text-black border-primary-500' : 'bg-black/40 text-gray-400 border-white/10'}`}
               >
                 Prime Mode (2x)
               </button>
            </div>

            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              {rolling ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                  className="w-24 h-24 border-4 border-dashed border-primary-500 rounded-full"
                />
              ) : (
                <div className={`w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-black border-2 ${
                  lastResult ? (lastResult.won ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-red-500/20 border-red-500 text-red-500') : 'bg-white/5 border-white/10 text-gray-500'
                }`}>
                  {lastResult ? lastResult.roll : '?'}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
               <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Wager (CRKZ)</label>
               <input 
                 type="number" 
                 value={betAmount} 
                 onChange={(e) => setBetAmount(e.target.value)}
                 className="bg-transparent text-center text-xl font-bold text-white w-24 outline-none"
               />
            </div>
          </div>

          <button
            onClick={handleRoll}
            disabled={rolling}
            className="w-full py-4 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 disabled:opacity-50 shadow-glow-sm transition-all"
          >
            {rolling ? 'Rolling...' : 'ROLL DICE'}
          </button>

          {lastResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-xl border ${lastResult.won ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}
            >
              {lastResult.won ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold">
                  <Trophy size={18} />
                  <span>Win! +{formatTokenAmount(lastResult.reward)} CRKZ</span>
                </div>
              ) : (
                <div className="text-red-400 font-bold text-sm">
                  Miss. Try again?
                </div>
              )}
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}