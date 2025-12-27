import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle, RotateCw, Trophy, BrainCircuit, User } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

type Player = 'X' | 'O';
type CellValue = Player | null;

const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export default function PhiTacToe({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [bet, setBet] = useState(50);
  const [gameActive, setGameActive] = useState(false);
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [difficulty, setDifficulty] = useState<'hard' | 'impossible'>('impossible');

  // --- MINIMAX ALGORITHM ---
  const checkWinCondition = (squares: CellValue[]) => {
    for (let i = 0; i < WIN_PATTERNS.length; i++) {
      const [a, b, c] = WIN_PATTERNS[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: WIN_PATTERNS[i] };
      }
    }
    if (!squares.includes(null)) return { winner: 'Draw', line: null };
    return null;
  };

  const minimax = (newBoard: CellValue[], depth: number, isMaximizing: boolean): number => {
    const result = checkWinCondition(newBoard);
    if (result?.winner === 'O') return 10 - depth;
    if (result?.winner === 'X') return depth - 10;
    if (result?.winner === 'Draw') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (newBoard[i] === null) {
          newBoard[i] = 'O';
          const score = minimax(newBoard, depth + 1, false);
          newBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (newBoard[i] === null) {
          newBoard[i] = 'X';
          const score = minimax(newBoard, depth + 1, true);
          newBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (currentBoard: CellValue[]) => {
    // Random mistake in 'hard' mode (10% chance)
    if (difficulty === 'hard' && Math.random() > 0.9) {
        const available = currentBoard.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
        return available[Math.floor(Math.random() * available.length)];
    }

    let bestScore = -Infinity;
    let move;
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        currentBoard[i] = 'O';
        const score = minimax(currentBoard, 0, false);
        currentBoard[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  const handleCellClick = (idx: number) => {
    if (!gameActive || board[idx] || !isPlayerTurn || winner) return;

    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);
    
    const result = checkWinCondition(newBoard);
    if (result) {
      endGame(result.winner as any, result.line);
    } else {
      setIsPlayerTurn(false);
    }
  };

  useEffect(() => {
    if (!isPlayerTurn && gameActive && !winner) {
      const timer = setTimeout(() => {
        const moveIdx = getBestMove([...board]);
        if (moveIdx !== undefined) {
          const newBoard = [...board];
          newBoard[moveIdx] = 'O';
          setBoard(newBoard);
          const result = checkWinCondition(newBoard);
          if (result) endGame(result.winner as any, result.line);
          else setIsPlayerTurn(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameActive, winner]);

  const startGame = () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    setIsPlayerTurn(true);
    setGameActive(true);
  };

  const endGame = (result: Player | 'Draw', line: number[] | null) => {
    setWinner(result);
    setWinningLine(line);
    setGameActive(false);
    if (result === 'X') onUpdateBalance(bet * (difficulty === 'impossible' ? 5 : 2));
    else if (result === 'Draw') onUpdateBalance(bet);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
            <h3 className="font-black text-white text-xl flex items-center gap-2">
                <BrainCircuit className="text-primary-500" /> Phi-Tac-Toe
            </h3>
            <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
                <button onClick={() => setDifficulty('hard')} disabled={gameActive} className={`px-2 py-1 text-[10px] font-bold rounded ${difficulty === 'hard' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Hard</button>
                <button onClick={() => setDifficulty('impossible')} disabled={gameActive} className={`px-2 py-1 text-[10px] font-bold rounded ${difficulty === 'impossible' ? 'bg-primary-500 text-black' : 'text-gray-500'}`}>Impossible</button>
            </div>
        </div>

        <div className="p-8 flex flex-col items-center">
            {/* Status */}
            <div className="mb-6 h-8 text-center">
                {!gameActive && !winner && <span className="text-gray-500 font-bold">Place your bet to start</span>}
                {gameActive && (
                    <span className={`text-sm font-bold flex items-center gap-2 ${isPlayerTurn ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isPlayerTurn ? <User size={16}/> : <BrainCircuit size={16}/>}
                        {isPlayerTurn ? "Your Turn" : "Neural Net Thinking..."}
                    </span>
                )}
                {winner && (
                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className={`text-lg font-black ${winner === 'X' ? 'text-emerald-500' : winner === 'O' ? 'text-red-500' : 'text-gray-400'}`}>
                        {winner === 'X' ? 'HUMAN VICTORY' : winner === 'O' ? 'AI DOMINANCE' : 'STALEMATE'}
                    </motion.div>
                )}
            </div>

            {/* Board */}
            <div className="relative">
                <div className="grid grid-cols-3 gap-2">
                    {board.map((cell, i) => (
                        <button
                            key={i}
                            onClick={() => handleCellClick(i)}
                            disabled={!gameActive || !!cell}
                            className={`w-20 h-20 rounded-xl flex items-center justify-center text-4xl transition-all ${
                                cell === 'X' ? 'bg-emerald-500/10 text-emerald-500' : 
                                cell === 'O' ? 'bg-red-500/10 text-red-500' : 
                                'bg-white/5 hover:bg-white/10'
                            }`}
                        >
                            {cell === 'X' && <motion.div initial={{scale:0}} animate={{scale:1}}><X size={40} strokeWidth={3}/></motion.div>}
                            {cell === 'O' && <motion.div initial={{scale:0}} animate={{scale:1}}><Circle size={32} strokeWidth={3}/></motion.div>}
                        </button>
                    ))}
                </div>
                {/* Winning Line Overlay */}
                {winningLine && (
                    <svg className="absolute inset-0 pointer-events-none w-full h-full z-10" style={{ padding: '4px' }}>
                        <motion.line 
                            x1={winningLine.includes(0) || winningLine.includes(3) || winningLine.includes(6) ? '16%' : winningLine.includes(1) || winningLine.includes(4) || winningLine.includes(7) ? '50%' : '84%'}
                            y1={winningLine.includes(0) || winningLine.includes(1) || winningLine.includes(2) ? '16%' : winningLine.includes(3) || winningLine.includes(4) || winningLine.includes(5) ? '50%' : '84%'}
                            x2={winningLine.includes(2) || winningLine.includes(5) || winningLine.includes(8) ? '84%' : winningLine.includes(1) || winningLine.includes(4) || winningLine.includes(7) ? '50%' : '16%'}
                            y2={winningLine.includes(6) || winningLine.includes(7) || winningLine.includes(8) ? '84%' : winningLine.includes(3) || winningLine.includes(4) || winningLine.includes(5) ? '50%' : '16%'}
                            stroke={winner === 'X' ? '#10B981' : '#EF4444'}
                            strokeWidth="6"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3 }}
                        />
                    </svg>
                )}
            </div>

            {/* Controls */}
            {!gameActive && (
                <div className="w-full mt-8 space-y-3">
                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/10">
                        <span className="text-xs font-bold text-gray-500 uppercase">Wager Points</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setBet(Math.max(10, bet - 10))} className="w-6 h-6 flex items-center justify-center bg-white/10 rounded text-gray-400">-</button>
                            <input type="number" value={bet} onChange={e => setBet(Math.max(10, parseInt(e.target.value) || 0))} className="w-12 bg-transparent text-center font-bold text-white outline-none"/>
                            <button onClick={() => setBet(bet + 10)} className="w-6 h-6 flex items-center justify-center bg-white/10 rounded text-gray-400">+</button>
                        </div>
                    </div>
                    <button 
                        onClick={startGame} 
                        disabled={balance < bet} 
                        className="w-full py-4 bg-primary-500 hover:bg-primary-400 text-black font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-glow-sm disabled:opacity-50"
                    >
                       {winner ? <RotateCw size={18}/> : <Trophy size={18}/>} {winner ? 'REMATCH' : 'START MATCH'}
                    </button>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
}