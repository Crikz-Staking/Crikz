import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUp, Skull, Diamond, ShieldCheck } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

const LEVELS: Record<Difficulty, { mines: number; cols: number; multipliers: number[] }> = {
    easy: { 
        mines: 1, cols: 4, 
        multipliers: [1.2, 1.5, 1.9, 2.4, 3.1, 4.0, 5.3, 7.0, 9.5] 
    },
    medium: { 
        mines: 1, cols: 3, 
        multipliers: [1.4, 2.0, 2.9, 4.3, 6.4, 9.8, 15.0, 23.0, 36.0] 
    },
    hard: { 
        mines: 1, cols: 2, 
        multipliers: [1.9, 3.8, 7.6, 15.0, 31.0, 63.0, 127.0, 255.0, 510.0] 
    },
    expert: {
        mines: 2, cols: 3,
        multipliers: [2.9, 8.7, 26.0, 78.0, 235.0, 706.0, 2120.0, 6360.0, 19080.0]
    }
};

const ROWS = 9;

export default function NeonTower({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(50);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [currentRow, setCurrentRow] = useState(0); // 0 = Bottom row
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'cashed' | 'gameover'>('idle');
  const [gridState, setGridState] = useState<{ status: 'hidden'|'safe'|'mine', revealed: boolean }[][]>([]);
  const [mineLocations, setMineLocations] = useState<number[][]>([]);

  // Init Game
  const startGame = () => {
      if (balance < bet) return;
      onUpdateBalance(-bet);
      
      const config = LEVELS[difficulty];
      const newMines: number[][] = [];
      const newGrid = [];

      // Generate Logic
      for(let r=0; r<ROWS; r++) {
          const rowMines: number[] = [];
          while(rowMines.length < config.mines) {
              const m = Math.floor(Math.random() * config.cols);
              if(!rowMines.includes(m)) rowMines.push(m);
          }
          newMines.push(rowMines);
          
          // Grid Visual State
          newGrid.push(Array(config.cols).fill({ status: 'hidden', revealed: false }));
      }

      setMineLocations(newMines);
      setGridState(newGrid);
      setCurrentRow(0);
      setGameState('playing');
  };

  const handleTileClick = (colIndex: number) => {
      if (gameState !== 'playing') return;

      const config = LEVELS[difficulty];
      const isMine = mineLocations[currentRow].includes(colIndex);
      
      // Update Grid State
      const newGrid = [...gridState];
      
      // Reveal clicked tile
      newGrid[currentRow] = newGrid[currentRow].map((cell, idx) => ({
          status: mineLocations[currentRow].includes(idx) ? 'mine' : 'safe',
          revealed: idx === colIndex
      }));

      if (isMine) {
          // GAME OVER
          setGridState(newGrid.map((row, rIdx) => 
            // Reveal all mines on board
            row.map((cell, cIdx) => ({
                ...cell,
                revealed: cell.revealed || (mineLocations[rIdx].includes(cIdx))
            }))
          ));
          setGameState('gameover');
      } else {
          // SAFE
          newGrid[currentRow][colIndex] = { status: 'safe', revealed: true };
          setGridState(newGrid);
          
          if (currentRow === ROWS - 1) {
              // Reached Top
              cashOut(true);
          } else {
              setCurrentRow(prev => prev + 1);
          }
      }
  };

  const cashOut = (isWin = false) => {
      if (gameState !== 'playing' && !isWin) return;
      
      const rowToPay = isWin ? ROWS - 1 : currentRow - 1;
      if (rowToPay < 0) {
          setGameState('cashed'); // No win yet
          return; 
      }

      const mult = LEVELS[difficulty].multipliers[rowToPay];
      const win = Math.floor(bet * mult);
      onUpdateBalance(win);
      setGameState('cashed');
  };

  const config = LEVELS[difficulty];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0A0A0F] border border-white/10 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>

        {/* Game Board */}
        <div className="flex-[2] relative p-8 flex flex-col items-center justify-center border-r border-white/5 overflow-hidden">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(20deg)] origin-bottom opacity-50 pointer-events-none" />

            <div className="relative z-10 w-full max-w-md flex flex-col-reverse gap-3">
                {Array.from({ length: ROWS }).map((_, rIdx) => {
                    const isActiveRow = rIdx === currentRow && gameState === 'playing';
                    const isPastRow = rIdx < currentRow || gameState === 'cashed';
                    const mult = config.multipliers[rIdx];

                    return (
                        <div key={rIdx} className="flex gap-4 items-center">
                            {/* Multiplier Label */}
                            <div className={`w-16 text-right text-xs font-bold font-mono transition-colors ${isActiveRow ? 'text-white' : isPastRow ? 'text-emerald-500' : 'text-gray-600'}`}>
                                {mult}x
                            </div>

                            {/* Tiles Container */}
                            <div className={`flex-1 flex gap-3 p-2 rounded-xl transition-all duration-500 ${isActiveRow ? 'bg-white/5 ring-1 ring-white/10 scale-105' : ''}`}>
                                {Array.from({ length: config.cols }).map((_, cIdx) => {
                                    const cell = gridState[rIdx]?.[cIdx] || { status: 'hidden', revealed: false };
                                    
                                    return (
                                        <button
                                            key={cIdx}
                                            onClick={() => handleTileClick(cIdx)}
                                            disabled={!isActiveRow}
                                            className={`flex-1 h-12 rounded-lg relative overflow-hidden transition-all duration-300
                                                ${!cell.revealed 
                                                    ? (isActiveRow ? 'bg-white/10 hover:bg-white/20 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-[#15151a] opacity-50') 
                                                    : (cell.status === 'mine' ? 'bg-red-500/20 border border-red-500' : 'bg-emerald-500 text-black shadow-[0_0_20px_#10b981] scale-105')
                                                }
                                            `}
                                        >
                                            <AnimatePresence>
                                                {cell.revealed && (
                                                    <motion.div 
                                                        initial={{ scale: 0, rotate: 180 }} 
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        className="absolute inset-0 flex items-center justify-center"
                                                    >
                                                        {cell.status === 'mine' 
                                                            ? <Skull size={20} className="text-red-500" /> 
                                                            : <Diamond size={20} fill="black" className="text-black" />
                                                        }
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Controls */}
        <div className="flex-1 bg-[#12121A] p-6 flex flex-col gap-6 relative z-20">
            <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <ArrowUp className="text-primary-500"/> Neon Tower
                </h3>
                <p className="text-xs text-gray-500">Climb rows for higher multipliers.</p>
            </div>

            <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Bet Amount</label>
                    <div className="flex gap-2">
                        <input type="number" value={bet} onChange={e => setBet(Math.max(10, parseInt(e.target.value)))} className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-white font-bold outline-none" disabled={gameState === 'playing'}/>
                        <button onClick={() => setBet(bet * 2)} disabled={gameState === 'playing'} className="px-3 bg-white/5 rounded-lg text-xs font-bold text-gray-400 hover:text-white">2x</button>
                    </div>
                </div>

                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                        <ShieldCheck size={12}/> Difficulty
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {(['easy', 'medium', 'hard', 'expert'] as const).map(d => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                disabled={gameState === 'playing'}
                                className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                                    difficulty === d 
                                    ? 'bg-primary-500 text-black border-primary-500' 
                                    : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-auto space-y-3">
                {gameState === 'playing' ? (
                    <button 
                        onClick={() => cashOut(false)}
                        disabled={currentRow === 0}
                        className="w-full py-4 bg-emerald-500 text-black font-black text-lg rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_#10b981]"
                    >
                        CASH OUT {currentRow > 0 ? (bet * config.multipliers[currentRow - 1]).toFixed(0) : 0} PTS
                    </button>
                ) : (
                    <button 
                        onClick={startGame}
                        disabled={balance < bet}
                        className="w-full py-4 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow-md disabled:opacity-50"
                    >
                        START CLIMB
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}