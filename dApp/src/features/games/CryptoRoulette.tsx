import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { X, Target, DollarSign, Disc } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

type BetType = 'red' | 'black' | 'green' | 'odd' | 'even' | 'low' | 'high';

const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export default function CryptoRoulette({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [betAmount, setBetAmount] = useState(100);
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState(0);
  
  const controls = useAnimation();

  const getNumberColor = (num: number) => {
    if (num === 0) return 'text-green-500';
    return RED_NUMBERS.includes(num) ? 'text-red-500' : 'text-gray-200';
  };

  const getMultiplier = (type: BetType) => {
    if (type === 'green') return 35; // 0 prediction
    return 2; // Even money bets
  };

  const spin = async () => {
    if (!selectedBet || balance < betAmount || spinning) return;
    
    setSpinning(true);
    setResultNumber(null);
    setLastWin(0);
    onUpdateBalance(-betAmount);

    // Random rotation + ensuring it lands on a number conceptually
    const randomRotation = 1440 + Math.floor(Math.random() * 360); 
    await controls.start({ 
        rotate: randomRotation, 
        transition: { duration: 3, ease: "circOut" } 
    });

    const winningIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
    const num = WHEEL_NUMBERS[winningIndex];
    setResultNumber(num);

    // Reset rotation visually without animation for next spin
    controls.set({ rotate: 0 });

    let won = false;
    if (selectedBet === 'green' && num === 0) won = true;
    if (selectedBet === 'red' && RED_NUMBERS.includes(num)) won = true;
    if (selectedBet === 'black' && num !== 0 && !RED_NUMBERS.includes(num)) won = true;
    if (selectedBet === 'even' && num !== 0 && num % 2 === 0) won = true;
    if (selectedBet === 'odd' && num % 2 !== 0) won = true;
    if (selectedBet === 'low' && num >= 1 && num <= 18) won = true;
    if (selectedBet === 'high' && num >= 19 && num <= 36) won = true;

    if (won) {
        const win = betAmount * getMultiplier(selectedBet);
        onUpdateBalance(win);
        setLastWin(win);
    }

    setSpinning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden p-6 relative flex flex-col md:flex-row gap-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>
        
        {/* Left: Wheel */}
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 text-white">▼</div>
                
                {/* Wheel SVG */}
                <motion.div 
                    animate={controls}
                    className="w-full h-full rounded-full border-8 border-[#2A2A35] relative overflow-hidden bg-black shadow-2xl"
                    style={{ background: 'conic-gradient(from 0deg, #10B981 0deg 10deg, #EF4444 10deg 180deg, #1f2937 180deg 350deg, #EF4444 350deg 360deg)' }} // Simplified visual gradient
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 rounded-full border border-white/10 bg-[#12121A] flex items-center justify-center">
                            {resultNumber !== null ? (
                                <span className={`text-6xl font-black ${getNumberColor(resultNumber)}`}>{resultNumber}</span>
                            ) : (
                                <Disc size={64} className="text-gray-700 animate-spin-slow" />
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
            {lastWin > 0 && (
                <motion.div initial={{y:10, opacity:0}} animate={{y:0, opacity:1}} className="mt-4 px-6 py-2 bg-emerald-500/20 text-emerald-400 font-black rounded-xl border border-emerald-500/50">
                    WON {lastWin} PTS
                </motion.div>
            )}
        </div>

        {/* Right: Controls */}
        <div className="flex-1 flex flex-col justify-center space-y-6">
            <div>
                <h3 className="text-2xl font-black text-white mb-1">Crypto Roulette</h3>
                <p className="text-xs text-gray-500">European Rules • Single Zero</p>
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Wager Amount</label>
                <div className="flex gap-2">
                    {[50, 100, 500, 1000].map(amt => (
                        <button 
                            key={amt}
                            onClick={() => setBetAmount(amt)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${betAmount === amt ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}
                        >
                            {amt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <BetButton type="red" label="RED (2x)" color="bg-red-500/20 border-red-500/50 text-red-500" selected={selectedBet} onClick={setSelectedBet} />
                <BetButton type="black" label="BLACK (2x)" color="bg-gray-700/40 border-gray-600 text-gray-300" selected={selectedBet} onClick={setSelectedBet} />
                <BetButton type="even" label="EVEN (2x)" color="bg-blue-500/20 border-blue-500/50 text-blue-400" selected={selectedBet} onClick={setSelectedBet} />
                <BetButton type="odd" label="ODD (2x)" color="bg-blue-500/20 border-blue-500/50 text-blue-400" selected={selectedBet} onClick={setSelectedBet} />
                <BetButton type="low" label="1-18 (2x)" color="bg-purple-500/20 border-purple-500/50 text-purple-400" selected={selectedBet} onClick={setSelectedBet} />
                <BetButton type="high" label="19-36 (2x)" color="bg-purple-500/20 border-purple-500/50 text-purple-400" selected={selectedBet} onClick={setSelectedBet} />
                <button 
                    onClick={() => setSelectedBet('green')}
                    className={`col-span-2 py-3 rounded-xl border font-bold text-sm transition-all ${selectedBet === 'green' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'}`}
                >
                    ZERO (Green) • 35x
                </button>
            </div>

            <button 
                onClick={spin}
                disabled={spinning || !selectedBet || balance < betAmount}
                className="w-full py-4 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-sm"
            >
                {spinning ? 'NO MORE BETS...' : 'SPIN WHEEL'}
            </button>
        </div>
      </div>
    </div>
  );
}

function BetButton({ type, label, color, selected, onClick }: any) {
    const isSelected = selected === type;
    return (
        <button
            onClick={() => onClick(type)}
            className={`py-3 rounded-xl border font-bold text-xs transition-all ${color} ${isSelected ? 'ring-2 ring-white scale-105' : 'opacity-80 hover:opacity-100'}`}
        >
            {label}
        </button>
    );
}