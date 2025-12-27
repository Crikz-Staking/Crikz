import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { X, Disc, ChevronDown } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

type BetType = 'red' | 'black' | 'green' | 'odd' | 'even' | 'low' | 'high' | number;

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
// Standard European Roulette Order (0 at top initially)
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
  // Store total rotation to prevent rewinding
  const currentRotationRef = useRef(0);

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

    // 1. Determine Result
    const winningIndex = Math.floor(Math.random() * WHEEL_ORDER.length);
    const winningNum = WHEEL_ORDER[winningIndex];
    
    // 2. Calculate Rotation
    const sliceAngle = 360 / 37;
    // The center of the 0-th slice (Number 0) starts at 0deg if we set up the gradient correctly.
    // However, usually gradients start edge-to-edge. 
    // Let's assume index 0 is at angle 0.
    // To bring Index 'i' to the top (0deg), we rotate the wheel such that 'i' moves to 0.
    // That means rotating by (360 - i * sliceAngle).
    // Plus a random jitter within the slice (+/- sliceAngle/2 * 0.8 to stay safe inside lines)
    
    const indexAngle = winningIndex * sliceAngle;
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.8);
    
    // We add 5 full spins (1800 deg)
    const extraSpins = 360 * 5;
    
    // Calculate precise rotation needed
    // New Target = Current + Extra + (Angle distance to target)
    // Distance = (360 - indexAngle) - (Current % 360)
    // We want final visual angle % 360 to be (360 - indexAngle)
    
    const currentVisual = currentRotationRef.current % 360;
    const targetVisual = (360 - indexAngle) + jitter; // Position where winning slice is at Top
    
    let delta = targetVisual - currentVisual;
    if (delta < 0) delta += 360; // Ensure positive forward rotation
    
    const finalRotation = currentRotationRef.current + extraSpins + delta;
    currentRotationRef.current = finalRotation;

    // 3. Animate
    await controls.start({ 
        rotate: finalRotation, 
        transition: { duration: 4, ease: [0.2, 0, 0.2, 1] } // Cubic bezier for realistic deceleration
    });

    setResult(winningNum);

    // 4. Payout Logic
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
                {/* Pointer - Fixed at Top */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary-500 z-20 drop-shadow-xl filter">
                    <ChevronDown size={48} strokeWidth={3} fill="currentColor" />
                </div>
                
                <motion.div 
                    animate={controls}
                    className="w-full h-full rounded-full border-8 border-[#1A1A24] relative shadow-2xl overflow-hidden"
                    style={{ 
                        // Offset by -90deg + slice/2 to align 0 at exact top center initially
                        // 360/37 = 9.72deg. Half = 4.86deg.
                        // Conic gradient starts at top (0deg). 
                        // So slice 0 covers 0 to 9.72deg. Center is 4.86deg.
                        // To align center to top (0deg), rotate -4.86deg.
                        rotate: -4.86 
                    }}
                >
                    {/* Render Slices via Conic Gradient for performance */}
                    <div 
                        className="w-full h-full rounded-full"
                        style={{
                            background: `conic-gradient(
                                ${WHEEL_ORDER.map((n, i) => {
                                    const color = n === 0 ? '#10B981' : RED_NUMBERS.includes(n) ? '#EF4444' : '#1f2937';
                                    const start = i * (100/37);
                                    const end = (i+1) * (100/37);
                                    return `${color} ${start}% ${end}%`;
                                }).join(', ')}
                            )`
                        }}
                    />
                    
                    {/* Inner Hub */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 bg-[#12121A] rounded-full flex flex-col items-center justify-center border-4 border-white/5 shadow-inner z-10">
                            {result !== null ? (
                                <>
                                    <span className="text-6xl font-black text-white">{result}</span>
                                    <span className={`text-xs font-bold uppercase mt-2 px-3 py-1 rounded-full ${getNumberColor(result)}`}>
                                        {result === 0 ? 'ZERO' : RED_NUMBERS.includes(result) ? 'RED' : 'BLACK'}
                                    </span>
                                </>
                            ) : <Disc size={64} className="text-gray-700 opacity-20"/>}
                        </div>
                    </div>
                </motion.div>
            </div>
            {lastWin > 0 && (
                <motion.div 
                    initial={{ scale: 0, y: 20 }} 
                    animate={{ scale: 1, y: 0 }} 
                    className="mt-8 text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                >
                    +{lastWin} PTS
                </motion.div>
            )}
        </div>

        {/* Right: Betting Board */}
        <div className="flex-[1.5] p-6 bg-[#181820] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-black text-white text-xl">Place Your Bets</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">Balance: {(balance - totalBet).toLocaleString()} PTS</p>
                </div>
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                    {[10, 50, 100, 500].map(amt => (
                        <button key={amt} onClick={() => setBetAmount(amt)} className={`px-3 py-1 text-xs font-bold rounded ${betAmount === amt ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>{amt}</button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex h-full gap-1 min-h-[300px]">
                    {/* Zero */}
                    <button onClick={() => placeBet(0)} className="w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-l-lg hover:bg-emerald-500/30 flex items-center justify-center text-emerald-500 font-black relative group transition-colors">
                        <span className="group-hover:scale-110 transition-transform">0</span>
                        {bets.some(b => b.type === 0) && <div className="absolute inset-0 bg-yellow-400/20 border-2 border-yellow-400 rounded-l-lg animate-pulse"/>}
                        {bets.find(b => b.type === 0) && (
                            <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
                                {bets.find(b => b.type === 0)?.amount && (bets.find(b => b.type === 0)!.amount / 100).toFixed(0)}
                            </div>
                        )}
                    </button>
                    
                    {/* Numbers Grid */}
                    <div className="flex-1 grid grid-cols-3 grid-rows-12 gap-1">
                        {Array.from({length: 36}).map((_, i) => {
                            const num = i + 1;
                            const isRed = RED_NUMBERS.includes(num);
                            const activeBet = bets.find(b => b.type === num);
                            return (
                                <button 
                                    key={num} 
                                    onClick={() => placeBet(num)}
                                    className={`relative flex items-center justify-center font-bold text-sm rounded transition-colors group
                                        ${isRed ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/30' : 'bg-[#2A2A35] text-gray-300 border border-white/5 hover:bg-[#3A3A45]'}
                                    `}
                                >
                                    <span className="group-hover:scale-110 transition-transform">{num}</span>
                                    {activeBet && (
                                        <>
                                            <div className="absolute inset-0 bg-yellow-400/10 border-2 border-yellow-400 rounded"/>
                                            <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md z-10">
                                                {activeBet.amount >= 1000 ? '1k+' : activeBet.amount}
                                            </div>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Side Bets */}
                    <div className="w-20 flex flex-col gap-1">
                        <button onClick={() => placeBet('red')} className="flex-1 bg-red-500/20 text-red-500 border border-red-500/30 font-bold text-[10px] rounded hover:bg-red-500/40 relative">
                            RED 
                            {bets.some(b=>b.type==='red') && <div className="absolute inset-0 border-2 border-yellow-400 rounded"/>}
                        </button>
                        <button onClick={() => placeBet('black')} className="flex-1 bg-gray-700/40 text-gray-300 border border-white/10 font-bold text-[10px] rounded hover:bg-gray-700/60 relative">
                            BLACK
                            {bets.some(b=>b.type==='black') && <div className="absolute inset-0 border-2 border-yellow-400 rounded"/>}
                        </button>
                        <button onClick={() => placeBet('even')} className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[10px] rounded hover:bg-blue-500/30 relative">
                            EVEN
                            {bets.some(b=>b.type==='even') && <div className="absolute inset-0 border-2 border-yellow-400 rounded"/>}
                        </button>
                        <button onClick={() => placeBet('odd')} className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[10px] rounded hover:bg-blue-500/30 relative">
                            ODD
                            {bets.some(b=>b.type==='odd') && <div className="absolute inset-0 border-2 border-yellow-400 rounded"/>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                <button onClick={clearBets} className="px-6 py-3 bg-white/5 rounded-xl text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-colors">Clear</button>
                <button 
                    onClick={spin}
                    disabled={spinning || totalBet === 0 || balance < totalBet}
                    className="flex-1 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                    {spinning ? 'SPINNING...' : `SPIN (${totalBet})`}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}