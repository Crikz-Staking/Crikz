import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Bomb, Diamond, Ban } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

export default function CryptoMines({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(50);
  const [active, setActive] = useState(false);
  const [grid, setGrid] = useState<boolean[]>(Array(25).fill(false)); // Revealed state
  const [mines, setMines] = useState<number[]>([]);
  const [gemsFound, setGemsFound] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [mineCount, setMineCount] = useState(3);

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
    const multiplier = 1 + (gemsFound * 0.2); // Simple multiplier logic
    const win = Math.floor(bet * multiplier);
    onUpdateBalance(win);
    setActive(false);
    setGrid(Array(25).fill(true)); // Reveal all
  };

  const clickCell = (idx: number) => {
    if (!active || gameOver || grid[idx]) return;

    const newGrid = [...grid];
    newGrid[idx] = true;
    setGrid(newGrid);

    if (mines.includes(idx)) {
        setGameOver(true);
        setActive(false);
        // Reveal all mines
        setGrid(Array(25).fill(true));
    } else {
        setGemsFound(prev => prev + 1);
    }
  };

  const currentMultiplier = 1 + (gemsFound * 0.2);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-white">Crypto Mines</h3>
            {active && !gameOver && (
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-500 rounded-lg text-sm font-bold">
                    {currentMultiplier.toFixed(2)}x
                </div>
            )}
        </div>

        <div className="grid grid-cols-5 gap-2 mb-6">
            {Array.from({length: 25}).map((_, i) => (
                <button
                    key={i}
                    onClick={() => clickCell(i)}
                    disabled={!active || grid[i]}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                        grid[i] 
                            ? (mines.includes(i) ? 'bg-red-500/50 border-red-500' : 'bg-emerald-500/20 border-emerald-500')
                            : 'bg-white/5 hover:bg-white/10'
                    }`}
                >
                    {grid[i] && (mines.includes(i) ? <Bomb size={20} className="text-white"/> : <Diamond size={20} className="text-emerald-400"/>)}
                </button>
            ))}
        </div>

        {!active ? (
            <div className="space-y-3">
                <div className="flex justify-between bg-black/40 p-3 rounded-xl border border-white/10">
                    <span className="text-xs text-gray-500 font-bold">Bet Amount</span>
                    <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="bg-transparent text-right font-bold text-white w-20 outline-none" />
                </div>
                <button onClick={startGame} disabled={balance < bet} className="w-full btn-primary py-3">START GAME</button>
            </div>
        ) : (
            <button onClick={cashOut} className="w-full py-3 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-colors">
                CASH OUT {Math.floor(bet * currentMultiplier)} PTS
            </button>
        )}
      </motion.div>
    </div>
  );
}