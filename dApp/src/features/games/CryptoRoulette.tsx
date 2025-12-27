import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { X, Disc } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

type BetType = 'red' | 'black' | 'green' | 'odd' | 'even' | 'low' | 'high' | number;

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
// Standard European Roulette Order
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export default function CryptoRoulette({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [betAmount, setBetAmount] = useState(100);
  const [bets, setBets] = useState<{ type: BetType, amount: number }[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  
  const controls = useAnimation();
  const currentRotation = useRef(0);

  const placeBet = (type: BetType) => {
    if (spinning) return;
    const existing = bets.find(b => b.type === type);
    if (existing) {
        setBets(bets.map(b => b.type === type ? { ...b, amount: b.amount + betAmount } : b));
    } else {
        setBets([...bets, { type, amount: betAmount }]);
    }
  };

  const clearBets = () => setBets([]);

  const totalBet = bets.reduce((a, b) => a + b.amount, 0);

  const spin = async () => {
    if (bets.length === 0 || balance < totalBet || spinning) return;
    
    onUpdateBalance(-totalBet);
    setSpinning(true);
    setLastWin(0);
    setResult(null);

    const winningIndex = Math.floor(Math.random() * WHEEL_ORDER.length);
    const winningNum = WHEEL_ORDER[winningIndex];
    
    // Calculate Rotation:
    // We want to land on 'winningIndex'. 
    // Wheel is fixed, we rotate the div. 
    // If angle 0 is top (Index 0), then Index i is at (i * 360/37).
    // To bring Index i to top, we rotate NEGATIVE (i * 360/37).
    
    const singleSlice = 360 / 37;
    const targetSliceAngle = winningIndex * singleSlice;
    
    // Add multiple full rotations (5 to 10 spins)
    const extraSpins = 360 * (5 + Math.floor(Math.random() * 5));
    
    // Calculate final absolute rotation needed
    // Current - (Current % 360) resets to 0 visually (aligned), then subtract target offset
    // We actually want to increase rotation to spin clockwise visually
    
    const newRotation = currentRotation.current + extraSpins + (360 - (targetSliceAngle - (currentRotation.current % 360)));
    
    // Just force it to align perfectly:
    // This logic approximates for visual flair. 
    // Precise: currentRotation + (360 * 5) + (angle_difference_to_target)
    
    const finalRotation = currentRotation.current + extraSpins + (360 - targetSliceAngle); 
    
    currentRotation.current = finalRotation;

    await controls.start({ 
        rotate: finalRotation, 
        transition: { duration: 4, ease: [0.2, 0, 0.2, 1] } 
    });

    setResult(winningNum);

    // Calculate Winnings
    let winTotal = 0;
    bets.forEach(bet => {
        let won = false;
        if (typeof bet.type === 'number' && bet.type === winningNum) won = true;
        else if (bet.type === 'red' && RED_NUMBERS.includes(winningNum)) won = true;
        else if (bet.type === 'black' && winningNum !== 0 && !RED_NUMBERS.includes(winningNum)) won = true;
        else if (bet.type === 'even' && winningNum !== 0 && winningNum % 2 === 0) won = true;
        else if (bet.type === 'odd' && winningNum % 2 !== 0) won = true;
        else if (bet.type === 'low' && winningNum >= 1 && winningNum <= 18) won = true;
        else if (bet.type === 'high' && winningNum >= 19 && winningNum <= 36) won = true;
        
        if (won) {
            const multiplier = typeof bet.type === 'number' ? 36 : 2; 
            winTotal += bet.amount * multiplier;
        }
    });

    if (winTotal > 0) {
        setLastWin(winTotal);
        onUpdateBalance(winTotal);
    }
    setSpinning(false);
  };

  const getNumberColor = (n: number) => {
      if (n === 0) return 'bg-emerald-500 text-black';
      return RED_NUMBERS.includes(n) ? 'bg-red-500 text-white' : 'bg-[#2A2A35] text-white';
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>

        {/* Left: Wheel */}
        <div className="flex-1 bg-[#0A0A0F] border-r border-white/5 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white z-20 text-3xl drop-shadow-lg">▼</div>
                <motion.div 
                    animate={controls}
                    className="w-full h-full rounded-full border-4 border-[#1A1A24] relative shadow-2xl"
                    style={{ background: 'conic-gradient(#10B981 0deg 9.7deg, #EF4444 9.7deg 19.4deg, #1f2937 19.4deg 29.1deg, #EF4444 29.1deg 38.8deg, #1f2937 38.8deg 48.5deg)' }} 
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 bg-[#12121A] rounded-full flex flex-col items-center justify-center border border-white/10 shadow-inner">
                            {result !== null ? (
                                <>
                                    <span className="text-5xl font-black text-white">{result}</span>
                                    <span className={`text-xs font-bold uppercase mt-1 px-2 py-0.5 rounded ${getNumberColor(result)}`}>
                                        {result === 0 ? 'ZERO' : RED_NUMBERS.includes(result) ? 'RED' : 'BLACK'}
                                    </span>
                                </>
                            ) : <Disc size={64} className="text-gray-700 opacity-20"/>}
                        </div>
                    </div>
                </motion.div>
            </div>
            {lastWin > 0 && <div className="mt-8 text-2xl font-black text-emerald-400 animate-bounce">+{lastWin} PTS</div>}
        </div>

        {/* Right: Board */}
        <div className="flex-[1.5] p-6 bg-[#181820] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-black text-white text-xl">Roulette</h3>
                    <p className="text-xs text-gray-500">Balance: {balance - totalBet}</p>
                </div>
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                    {[10, 50, 100, 500].map(amt => (
                        <button key={amt} onClick={() => setBetAmount(amt)} className={`px-3 py-1 text-xs font-bold rounded ${betAmount === amt ? 'bg-white text-black' : 'text-gray-500'}`}>{amt}</button>
                    ))}
                </div>
            </div>

            {/* Board Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex h-full gap-1">
                    <button onClick={() => placeBet(0)} className="w-12 bg-emerald-500/20 border border-emerald-500/30 rounded-l-lg hover:bg-emerald-500/40 flex items-center justify-center text-emerald-500 font-bold relative">
                        0
                        {bets.some(b => b.type === 0) && <div className="absolute inset-0 bg-yellow-400/30 rounded-l-lg border-2 border-yellow-400 animate-pulse"/>}
                    </button>
                    
                    <div className="flex-1 grid grid-cols-3 grid-rows-12 gap-1">
                        {Array.from({length: 36}).map((_, i) => {
                            const num = i + 1;
                            const isRed = RED_NUMBERS.includes(num);
                            const hasBet = bets.some(b => b.type === num);
                            return (
                                <button 
                                    key={num} 
                                    onClick={() => placeBet(num)}
                                    className={`h-10 flex items-center justify-center font-bold text-sm rounded relative ${isRed ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-[#2A2A35] text-white hover:bg-[#3A3A45]'}`}
                                >
                                    {num}
                                    {hasBet && <div className="absolute inset-0 bg-yellow-400/30 border-2 border-yellow-400 rounded"/>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="w-16 flex flex-col gap-1">
                        <button onClick={() => placeBet('red')} className="flex-1 bg-red-500/20 text-red-500 font-bold text-[10px] rounded hover:bg-red-500/30 relative">RED {bets.some(b=>b.type==='red') && <div className="absolute inset-0 border-2 border-yellow-400 rounded"/>}</button>
                        <button onClick={() => placeBet('black')} className="flex-1 bg-gray-700/40 text-gray-300 font-bold text-[10px] rounded hover:bg-gray-700/60 relative">BLK {bets.some(b=>b.type==='black') && <div className="absolute inset-0 border-2 border-yellow-400 rounded"/>}</button>
                        <button onClick={() => placeBet('even')} className="flex-1 bg-blue-500/20 text-blue-400 font-bold text-[10px] rounded hover:bg-blue-500/30 relative">EVEN {bets.some(b=>b.type==='even') && <div className="absolute inset-0 border-2 border-yellow-400 rounded"/>}</button>
                        <button onClick={() => placeBet('odd')} className="flex-1 bg-blue-500/20 text-blue-400 font-bold text-[10px] rounded hover:bg-blue-500/30 relative">ODD {bets.some(b=>b.type==='odd') && <div className="absolute inset-0 border-2 border-yellow-400 rounded"/>}</button>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mt-4">
                <button onClick={clearBets} className="px-4 py-3 bg-white/5 rounded-xl text-gray-400 font-bold hover:bg-white/10">Clear</button>
                <button 
                    onClick={spin}
                    disabled={spinning || totalBet === 0 || balance < totalBet}
                    className="flex-1 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    {spinning ? 'SPINNING...' : `SPIN (${totalBet})`}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}