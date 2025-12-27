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
// Standard European Roulette Order (0 at index 0)
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

    const winningIndex = Math.floor(Math.random() * WHEEL_ORDER.length);
    const winningNum = WHEEL_ORDER[winningIndex];
    
    // Rotation Calculation:
    // 1. Slice Arc = 360 / 37 (~9.73 deg)
    // 2. We render the wheel such that index 0 starts at 0deg (12 o'clock) if no rotation.
    //    Actually, conic-gradients start at 0deg. The Center of slice 0 is at 4.86deg.
    //    We offset the wheel by -4.86deg in CSS so center of 0 is at absolute TOP.
    // 3. To bring index 'i' to TOP, we rotate the wheel counter-clockwise by (i * sliceArc).
    //    Target Rotation = Current - (i * sliceArc)
    
    const sliceArc = 360 / 37;
    const targetAngle = winningIndex * sliceArc; // Degrees to rotate backwards to bring 'winningIndex' to 0
    
    const extraSpins = 360 * 5; // 5 full spins
    
    // We want positive rotation (clockwise spin). 
    // We need final visual angle % 360 to result in the winning slice at top.
    // Since wheel moves clockwise, the values move past the pointer in reverse order?
    // Let's stick to absolute alignment:
    // If we want index 'i' at top, and current rotation is R.
    // We want (R_final) % 360 == (360 - targetAngle).
    // Because rotating +10 deg moves index 0 to the right, bringing index 36 (left of 0) to top.
    
    const currentRot = currentRotationRef.current;
    const targetVisualRot = (360 - targetAngle); // e.g. if target is 90deg (index ~9), we rotate 270deg to bring it to top.
    
    // Add randomness (+/- 40% of slice)
    const jitter = (Math.random() - 0.5) * (sliceArc * 0.8);
    
    // Calculate forward delta
    const currentMod = currentRot % 360;
    let delta = targetVisualRot - currentMod;
    if (delta < 0) delta += 360;
    
    const finalRot = currentRot + extraSpins + delta + jitter;
    
    currentRotationRef.current = finalRot;

    await controls.start({ 
        rotate: finalRot, 
        transition: { duration: 4, ease: [0.2, 0, 0.2, 1] } 
    });

    setResult(winningNum);

    // Payout
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
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary-500 z-20 drop-shadow-xl">
                    <ChevronDown size={48} strokeWidth={3} fill="currentColor" />
                </div>
                
                <motion.div 
                    animate={controls}
                    className="w-full h-full rounded-full border-8 border-[#1A1A24] relative shadow-2xl overflow-hidden"
                    // Initial rotation to align index 0's center to top
                    style={{ rotate: -4.86 }}
                >
                    {/* Slices */}
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
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 bg-[#12121A] rounded-full flex flex-col items-center justify-center border-4 border-white/5 shadow-inner z-10">
                            {result !== null ? (
                                <motion.div initial={{scale:0.8}} animate={{scale:1}}>
                                    <span className="text-6xl font-black text-white">{result}</span>
                                </motion.div>
                            ) : <Disc size={64} className="text-gray-700 opacity-20"/>}
                        </div>
                    </div>
                </motion.div>
            </div>
            {lastWin > 0 && <div className="mt-8 text-3xl font-black text-emerald-400 animate-bounce">+{lastWin} PTS</div>}
        </div>

        {/* Right: Board */}
        <div className="flex-[1.5] p-6 bg-[#181820] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-black text-white text-xl">Roulette</h3>
                    <p className="text-xs text-gray-500">Balance: {(balance - totalBet).toLocaleString()} PTS</p>
                </div>
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                    {[10, 50, 100, 500].map(amt => (
                        <button key={amt} onClick={() => setBetAmount(amt)} className={`px-3 py-1 text-xs font-bold rounded ${betAmount === amt ? 'bg-white text-black' : 'text-gray-500'}`}>{amt}</button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex h-full gap-1 min-h-[300px]">
                    <button onClick={() => placeBet(0)} className="w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-l-lg hover:bg-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold relative">
                        0
                        {bets.some(b => b.type === 0) && <div className="absolute inset-0 bg-yellow-400/20 border-2 border-yellow-400 rounded-l-lg animate-pulse"/>}
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
                                    className={`flex items-center justify-center font-bold text-sm rounded relative group
                                        ${isRed ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/30' : 'bg-[#2A2A35] text-gray-300 border border-white/5 hover:bg-[#3A3A45]'}
                                    `}
                                >
                                    {num}
                                    {hasBet && <div className="absolute inset-0 bg-yellow-400/10 border-2 border-yellow-400 rounded"/>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="w-16 flex flex-col gap-1">
                        {['red','black','even','odd'].map((t: any) => (
                            <button key={t} onClick={() => placeBet(t)} className="flex-1 bg-white/5 text-[10px] font-bold uppercase rounded border border-white/5 hover:bg-white/10 relative">
                                {t}
                                {bets.some(b=>b.type===t) && <div className="absolute inset-0 border-2 border-yellow-400 rounded"/>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button onClick={clearBets} className="px-6 py-3 bg-white/5 rounded-xl text-gray-400 font-bold hover:bg-white/10">Clear</button>
                <button 
                    onClick={spin}
                    disabled={spinning || totalBet === 0 || balance < totalBet}
                    className="flex-1 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 disabled:opacity-50 transition-all shadow-glow-sm"
                >
                    {spinning ? 'SPINNING...' : `SPIN (${totalBet})`}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}