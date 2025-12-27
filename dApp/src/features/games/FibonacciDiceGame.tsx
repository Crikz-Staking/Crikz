import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dices, Trophy, X, ChevronRight } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

export default function FibonacciDiceGame({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(50);
  const [mode, setMode] = useState<'fib' | 'slider'>('fib');
  const [sliderValue, setSliderValue] = useState(50); // Under X
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [win, setWin] = useState(false);

  // Mode 1: Fibonacci
  const FIB_NUMBERS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  
  // Calculate Odds for Slider
  const winChance = sliderValue; // Simple 1-100 logic
  const multiplier = parseFloat((99 / winChance).toFixed(2)); // House edge built in

  const roll = async () => {
    if (balance < bet || rolling) return;
    setRolling(true);
    setResult(null);
    onUpdateBalance(-bet);

    // Animation phase
    let tempRoll = 0;
    const interval = setInterval(() => {
        setResult(Math.floor(Math.random() * 100) + 1);
    }, 50);

    await new Promise(r => setTimeout(r, 1000));
    clearInterval(interval);

    const finalRoll = Math.floor(Math.random() * 100) + 1;
    setResult(finalRoll);

    let isWin = false;
    let payout = 0;

    if (mode === 'fib') {
        if (FIB_NUMBERS.includes(finalRoll)) {
            isWin = true;
            payout = bet * 5; // Fixed 5x for hitting a fib number (~10% chance)
        }
    } else {
        if (finalRoll <= sliderValue) {
            isWin = true;
            payout = bet * multiplier;
        }
    }

    setWin(isWin);
    if (isWin) onUpdateBalance(payout);
    setRolling(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <div className="flex gap-4 mb-8 justify-center">
            <button onClick={() => setMode('fib')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${mode === 'fib' ? 'bg-primary-500 text-black border-primary-500' : 'bg-transparent text-gray-500 border-white/10'}`}>Fibonacci Hunt</button>
            <button onClick={() => setMode('slider')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${mode === 'slider' ? 'bg-primary-500 text-black border-primary-500' : 'bg-transparent text-gray-500 border-white/10'}`}>Classic Range</button>
        </div>

        <div className="text-center mb-8">
            <div className={`text-7xl font-black font-mono transition-colors ${rolling ? 'text-white' : win ? 'text-emerald-500' : result ? 'text-red-500' : 'text-gray-600'}`}>
                {result !== null ? result : '00'}
            </div>
            {win && <div className="text-emerald-500 font-bold mt-2 flex items-center justify-center gap-2"><Trophy size={16}/> WINNER</div>}
        </div>

        {mode === 'slider' && (
            <div className="bg-black/40 p-6 rounded-2xl border border-white/10 mb-6">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-4 uppercase">
                    <span>Roll Under {sliderValue}</span>
                    <span>Payout {multiplier}x</span>
                </div>
                <input 
                    type="range" min="5" max="95" 
                    value={sliderValue} onChange={e => setSliderValue(parseInt(e.target.value))} 
                    className="w-full accent-primary-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                />
            </div>
        )}

        {mode === 'fib' && (
            <div className="text-center mb-6 text-xs text-gray-400">
                Target Numbers: <span className="text-primary-500 font-mono">{FIB_NUMBERS.join(', ')}</span>
                <div className="mt-1 font-bold">Payout: 5.00x</div>
            </div>
        )}

        <div className="flex gap-4">
            <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Bet</span>
                <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="bg-transparent w-full font-bold text-white outline-none" />
            </div>
            <button onClick={roll} disabled={rolling || balance < bet} className="flex-[2] btn-primary py-4 text-lg">
                {rolling ? 'Rolling...' : 'ROLL DICE'}
            </button>
        </div>
      </motion.div>
    </div>
  );
}