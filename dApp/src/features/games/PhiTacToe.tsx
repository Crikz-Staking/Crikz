import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Circle, RotateCcw, Trophy } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

type Player = 'X' | 'O';
type CellValue = Player | null;

const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export default function PhiTacToe({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [bet, setBet] = useState(50);
  const [gameActive, setGameActive] = useState(false);
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);

  const checkWinner = (squares: CellValue[]) => {
    for (let i = 0; i < WIN_PATTERNS.length; i++) {
      const [a, b, c] = WIN_PATTERNS[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (!squares.includes(null)) return 'Draw';
    return null;
  };

  const aiMove = (currentBoard: CellValue[]) => {
    // 1. Try to win
    for (let i = 0; i < WIN_PATTERNS.length; i++) {
      const [a, b, c] = WIN_PATTERNS[i];
      const line = [currentBoard[a], currentBoard[b], currentBoard[c]];
      if (line.filter(x => x === 'O').length === 2 && line.includes(null)) {
        const emptyIdx = [a, b, c].find(idx => currentBoard[idx] === null);
        if (emptyIdx !== undefined) return emptyIdx;
      }
    }
    // 2. Block player
    for (let i = 0; i < WIN_PATTERNS.length; i++) {
      const [a, b, c] = WIN_PATTERNS[i];
      const line = [currentBoard[a], currentBoard[b], currentBoard[c]];
      if (line.filter(x => x === 'X').length === 2 && line.includes(null)) {
        const emptyIdx = [a, b, c].find(idx => currentBoard[idx] === null);
        if (emptyIdx !== undefined) return emptyIdx;
      }
    }
    // 3. Pick center
    if (currentBoard[4] === null) return 4;
    
    // 4. Random available
    const available = currentBoard.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleCellClick = (idx: number) => {
    if (!gameActive || board[idx] || !isPlayerTurn || winner) return;

    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);
    
    const result = checkWinner(newBoard);
    if (result) {
      endGame(result);
    } else {
      setIsPlayerTurn(false);
    }
  };

  // AI Turn Effect
  useEffect(() => {
    if (!isPlayerTurn && gameActive && !winner) {
      const timer = setTimeout(() => {
        const moveIdx = aiMove(board);
        if (moveIdx !== undefined) {
          const newBoard = [...board];
          newBoard[moveIdx] = 'O';
          setBoard(newBoard);
          const result = checkWinner(newBoard);
          if (result) endGame(result);
          else setIsPlayerTurn(true);
        }
      }, 600); // Thinking delay
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameActive, winner]);

  const startGame = () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsPlayerTurn(true);
    setGameActive(true);
  };

  const endGame = (result: Player | 'Draw') => {
    setWinner(result);
    setGameActive(false);
    if (result === 'X') {
      onUpdateBalance(bet * 2); // Win 2x
    } else if (result === 'Draw') {
      onUpdateBalance(bet); // Refund
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-white">Phi-Tac-Toe</h3>
          <p className="text-xs text-gray-500">{gameActive ? (isPlayerTurn ? "Your Turn (X)" : "AI Thinking...") : "Beat the AI to double your points"}</p>
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-2 mb-6 max-w-[250px] mx-auto">
          {board.map((cell, i) => (
            <motion.button
              key={i}
              whileHover={!cell && gameActive && isPlayerTurn ? { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
              onClick={() => handleCellClick(i)}
              disabled={!gameActive || !!cell}
              className={`aspect-square rounded-xl flex items-center justify-center text-4xl font-black transition-colors ${
                cell === 'X' ? 'bg-primary-500/20 text-primary-500 border border-primary-500/50' : 
                cell === 'O' ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 
                'bg-white/5 border border-white/10'
              }`}
            >
              {cell === 'X' && <X size={40} strokeWidth={2.5} />}
              {cell === 'O' && <Circle size={32} strokeWidth={3} />}
            </motion.button>
          ))}
        </div>

        {/* Controls / Result */}
        {!gameActive && (
          <div className="text-center space-y-4">
            {winner && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className={`text-xl font-black mb-2 ${winner === 'X' ? 'text-emerald-500' : winner === 'Draw' ? 'text-gray-400' : 'text-red-500'}`}
              >
                {winner === 'X' ? "VICTORY!" : winner === 'Draw' ? "DRAW - REFUNDED" : "DEFEAT"}
              </motion.div>
            )}

            <div className="flex justify-center items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/10 w-fit mx-auto">
                <span className="text-xs font-bold text-gray-500 uppercase">Bet</span>
                <input 
                  type="number" 
                  value={bet} 
                  onChange={e => setBet(Math.max(10, parseInt(e.target.value) || 0))} 
                  className="w-16 bg-transparent text-right font-bold text-white outline-none"
                />
            </div>

            <button 
              onClick={startGame} 
              disabled={balance < bet}
              className="w-full py-3 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {winner ? <RotateCw size={18} /> : <Trophy size={18} />}
              {winner ? 'PLAY AGAIN' : 'START GAME'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}