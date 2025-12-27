import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Coins, X, Trophy } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔'];

export default function SatoshiSlots({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [reels, setReels] = useState([0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState(0);
  
  // Rolling Symbols State for visual effect
  const [displaySymbols, setDisplaySymbols] = useState([0, 0, 0]);

  // Rolling Effect Loop
  useEffect(() => {
    let interval: any;
    if (spinning) {
        interval = setInterval(() => {
            setDisplaySymbols([
                Math.floor(Math.random() * SYMBOLS.length),
                Math.floor(Math.random() * SYMBOLS.length),
                Math.floor(Math.random() * SYMBOLS.length)
            ]);
        }, 80);
    } else {
        setDisplaySymbols(reels);
    }
    return () => clearInterval(interval);
  }, [spinning, reels]);

  const spin = async () => {
    if (spinning || balance < 50) return;
    setSpinning(true);
    setWin(0);
    onUpdateBalance(-50);

    // Determine Result Logic
    // Weighted probabilities
    const getWeightedSymbol = () => {
        const r = Math.random();
        if (r < 0.3) return 0; // Cherry
        if (r < 0.55) return 1; // Lemon
        if (r < 0.75) return 2; // Grape
        if (r < 0.90) return 3; // Diamond
        if (r < 0.96) return 5; // Bell
        return 4; // 7 (Rare)
    };

    const finalReels = [getWeightedSymbol(), getWeightedSymbol(), getWeightedSymbol()];
    
    // Artificial Delay for suspense
    await new Promise(r => setTimeout(r, 2000));
    
    setReels(finalReels);
    
    // Calculate Payout
    let payout = 0;
    if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
        // Jackpot
        const base = (finalReels[0] + 1) * 10;
        payout = 50 * base; 
    } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
        // Pair
        payout = 50 * 1.5; 
    }

    setSpinning(false);
    
    if (payout > 0) {
        setWin(payout);
        onUpdateBalance(payout);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1a1a24] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative shadow-[0_0_50px_rgba(245,158,11,0.15)]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>
        
        <div className="p-8 text-center bg-gradient-to-b from-amber-500/10 to-transparent">
            <h3 className="text-2xl font-black text-amber-500 flex justify-center items-center gap-2"><Coins /> SATOSHI SLOTS</h3>
        </div>

        <div className="px-8 pb-8">
            <div className="bg-black border-4 border-amber-600/30 rounded-2xl p-6 relative overflow-hidden">
                {/* Payline */}
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500/50 z-10 pointer-events-none shadow-[0_0_5px_#ef4444]" />
                
                <div className="flex justify-between gap-2">
                    {displaySymbols.map((s, i) => (
                        <div key={i} className="w-20 h-28 bg-[#12121A] rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative">
                            {/* Moving Blur Effect */}
                            {spinning && (
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"
                                    animate={{ y: [-100, 100] }}
                                    transition={{ duration: 0.2, repeat: Infinity, ease: "linear" }}
                                />
                            )}
                            <div className="text-5xl filter drop-shadow-lg">
                                {SYMBOLS[s]}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-16 flex items-center justify-center mt-4">
                {win > 0 ? (
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="bg-emerald-500 text-black font-black px-6 py-2 rounded-full text-xl flex items-center gap-2 shadow-[0_0_20px_#10b981]"
                    >
                        <Trophy size={20} /> +{win} PTS
                    </motion.div>
                ) : (
                    <div className="text-gray-500 font-mono text-xs">SPIN TO WIN • COST 50 PTS</div>
                )}
            </div>

            <button 
                onClick={spin} 
                disabled={spinning || balance < 50} 
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xl rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
                {spinning ? 'ROLLING...' : 'SPIN!'}
            </button>
        </div>
      </motion.div>
    </div>
  );
}