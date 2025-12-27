import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Bomb, Diamond, Skull } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

export default function CryptoMines({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(50);
  const [mineCount, setMineCount] = useState(3);
  const [active, setActive] = useState(false);
  const [grid, setGrid] = useState<boolean[]>(Array(25).fill(false)); 
  const [mines, setMines] = useState<number[]>([]);
  const [gemsFound, setGemsFound] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Multiplier logic: (25! / (25-n)!) / ((25-m)! / (25-m-n)!) approx logic for fair odds + house edge
  const calculateNextMultiplier = (gems: number) => {
      // Simplified exponential growth for demo
      const base = 1 + (mineCount * 0.05);
      const mult = Math.pow(base, gems + 1);
      return parseFloat(mult.toFixed(2));
  };

  const startGame = () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);
    
    // Generate mines
    const newMines: number[] = [];
    while(newMines.length < mineCount) {
        const r = Math.floor(Math.random() * 25);
        if (!newMines.includes(r)) newMines.push(r);
    }
    
    setMines(newMines);
    setGrid(Array(25).fill(false));
    setActive(true);
    setGameOver(false);
    setGemsFound(0);
  };

  const cashOut = () => {
    if (!active || gameOver) return;
    const currentMult = gemsFound === 0 ? 1 : calculateNextMultiplier(gemsFound - 1);
    const win = Math.floor(bet * currentMult);
    onUpdateBalance(win);
    revealAll();
  };

  const clickCell = (idx: number) => {
    if (!active || gameOver || grid[idx]) return;

    const newGrid = [...grid];
    newGrid[idx] = true;
    setGrid(newGrid);

    if (mines.includes(idx)) {
        setGameOver(true);
        // Do not reset active here to show "Boom" state
        revealAll();
    } else {
        setGemsFound(prev => prev + 1);
    }
  };

  const revealAll = () => {
      setGrid(Array(25).fill(true));
      setActive(false);
  };

  const nextMult = calculateNextMultiplier(gemsFound);
  const currentMult = gemsFound === 0 ? 1.00 : calculateNextMultiplier(gemsFound - 1);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-xl font-black text-white">Crypto Mines</h3>
                <p className="text-xs text-gray-500">Find gems, avoid bombs.</p>
            </div>
            {active && !gameOver && (
                <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase font-bold">Current Win</div>
                    <div className="text-xl font-black text-emerald-500">{Math.floor(bet * currentMult)} PTS</div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-5 gap-2 mb-6">
            {Array.from({length: 25}).map((_, i) => (
                <button
                    key={i}
                    onClick={() => clickCell(i)}
                    disabled={!active && !grid[i]}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all text-2xl relative overflow-hidden ${
                        grid[i] 
                            ? (mines.includes(i) ? 'bg-red-500/20 border border-red-500' : 'bg-emerald-500/20 border border-emerald-500')
                            : 'bg-white/5 hover:bg-white/10 border border-white/5'
                    }`}
                >
                    {grid[i] && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            {mines.includes(i) ? <Bomb className="text-red-500"/> : <Diamond className="text-emerald-400"/>}
                        </motion.div>
                    )}
                </button>
            ))}
        </div>

        {gameOver && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                <Skull size={48} className="text-red-500 mb-4" />
                <h3 className="text-2xl font-black text-white mb-2">BOOM!</h3>
                <p className="text-gray-400 mb-6">You hit a mine.</p>
                <button onClick={() => setGameOver(false)} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200">Try Again</button>
            </motion.div>
        )}

        {!active && !gameOver ? (
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1 bg-black/40 p-3 rounded-xl border border-white/10">
                        <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Bet</span>
                        <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="bg-transparent w-full font-bold text-white outline-none" />
                    </div>
                    <div className="flex-1 bg-black/40 p-3 rounded-xl border border-white/10">
                        <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Mines ({mineCount})</span>
                        <input type="range" min="1" max="24" value={mineCount} onChange={e => setMineCount(parseInt(e.target.value))} className="w-full accent-primary-500" />
                    </div>
                </div>
                <button onClick={startGame} disabled={balance < bet} className="w-full btn-primary py-4 text-lg shadow-glow-sm">
                    START GAME
                </button>
            </div>
        ) : (
            !gameOver && (
                <button onClick={cashOut} className="w-full py-4 bg-emerald-500 text-black font-black text-lg rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    CASH OUT {Math.floor(bet * currentMult)} PTS
                    <span className="block text-xs opacity-70 font-normal">Next: {nextMult}x</span>
                </button>
            )
        )}
      </motion.div>
    </div>
  );
}