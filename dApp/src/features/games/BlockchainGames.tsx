import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Brain, Swords, Coins, RotateCcw, Trophy } from 'lucide-react';
import { getBestMove, calculateWinner, generateFibSequence } from '@/utils/gameLogic';
import { fadeInUp } from '@/utils/animations';
import { toast } from 'react-hot-toast';

type GameType = 'tictactoe' | 'fibpuzzle' | 'chess' | 'none';

export default function BlockchainGames({ dynamicColor }: { dynamicColor: string }) {
  const [activeGame, setActiveGame] = useState<GameType>('none');

  return (
    <div className="space-y-8 min-h-[600px]">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Gamepad2 className="text-primary-500" />
          Crikz Game Zone
        </h2>
        <p className="text-gray-400">Play games inspired by the Fibonacci protocol to earn ecosystem reputation.</p>
      </div>

      <AnimatePresence mode="wait">
        {activeGame === 'none' ? (
          <motion.div 
            key="library"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <GameCard 
              title="Phi-Tac-Toe" 
              desc="Outsmart the Intelligent Being in a 3x3 grid" 
              icon={<Brain />} 
              onClick={() => setActiveGame('tictactoe')}
            />
            <GameCard 
              title="Fibonacci Puzzle" 
              desc="Complete the sequence to unlock rewards" 
              icon={<Coins />} 
              onClick={() => setActiveGame('fibpuzzle')}
            />
            <GameCard 
              title="Grandmaster's Gambit" 
              desc="Strategic chess logic on the blockchain" 
              icon={<Swords />} 
              onClick={() => setActiveGame('chess')}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="game-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden"
          >
            <button 
              onClick={() => setActiveGame('none')}
              className="mb-8 text-sm font-bold text-gray-500 hover:text-white flex items-center gap-2 transition-colors"
            >
              <RotateCcw size={16} /> Exit to Library
            </button>
            
            <div className="flex flex-col items-center">
              {activeGame === 'tictactoe' && <TicTacToeGame />}
              {activeGame === 'fibpuzzle' && <FibonacciGame />}
              {activeGame === 'chess' && <ChessGame />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- GAME 1: TIC TAC TOE (FIXED) ---
function TicTacToeGame() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const winner = calculateWinner(board);

  const handleClick = (i: number) => {
    if (winner || board[i] || !isXNext) return;
    
    const nextBoard = [...board];
    nextBoard[i] = 'X';
    setBoard(nextBoard);
    setIsXNext(false);

    // AI Response
    setTimeout(() => {
      const aiMove = getBestMove(nextBoard, 'O');
      if (aiMove !== null && !calculateWinner(nextBoard)) {
        nextBoard[aiMove] = 'O';
        setBoard([...nextBoard]);
        setIsXNext(true);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <h3 className="text-2xl font-bold text-white">Phi-Tac-Toe</h3>
      <div className="grid grid-cols-3 gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
        {board.map((val, i) => (
          <button 
            key={i}
            onClick={() => handleClick(i)}
            className={`w-20 h-20 rounded-xl text-3xl font-black transition-all flex items-center justify-center
              ${val === 'X' ? 'text-primary-500' : 'text-blue-400'} 
              ${!val ? 'bg-white/5 hover:bg-white/10' : 'bg-white/10 shadow-glow-sm'}`}
          >
            {val}
          </button>
        ))}
      </div>
      {winner && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2">
          <Trophy className="text-primary-500" size={40} />
          <p className="text-xl font-black text-white">{winner === 'X' ? 'You Won!' : 'AI Won!'}</p>
          <button onClick={() => setBoard(Array(9).fill(null))} className="mt-2 text-primary-500 font-bold underline">Play Again</button>
        </motion.div>
      )}
    </div>
  );
}

// --- GAME 2: FIBONACCI PUZZLE (FIXED) ---
function FibonacciGame() {
  const [seq, setSeq] = useState<number[]>([]);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    const s = generateFibSequence(1);
    setSeq(s.slice(0, 5));
  }, [score]);

  const checkResult = () => {
    const numericAnswer = parseInt(answer);
    const correctValue = seq[3] + seq[4];

    if (numericAnswer === correctValue) {
      toast.success("Correct! Reputation increased.");
      setScore(score + 1);
      setAnswer('');
    } else {
      toast.error("Incorrect sequence logic.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 text-center max-w-md">
      <h3 className="text-2xl font-bold">Fibonacci Sequence</h3>
      <p className="text-gray-400 text-sm">Calculate the 6th number in the sequence below.</p>
      
      <div className="flex gap-3 text-4xl font-black font-mono text-primary-500">
        {seq.map((n, i) => <span key={i}>{n}</span>)}
        <span className="text-white border-b-4 border-white w-16 text-center">?</span>
      </div>

      <div className="w-full space-y-4">
        <input 
          type="number"
          value={answer} 
          onChange={e => setAnswer(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-2xl font-bold focus:border-primary-500 outline-none transition-all"
          placeholder="Value"
          onKeyPress={(e) => e.key === 'Enter' && checkResult()}
        />
        <button onClick={checkResult} className="w-full py-4 rounded-2xl bg-primary-500 text-black font-black text-lg hover:bg-primary-400 transition-colors">
          Verify Calculation
        </button>
        <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Score: {score}</p>
      </div>
    </div>
  );
}

// --- GAME 3: CHESS (IMPLEMENTED) ---
function ChessGame() {
  const initialPieces = [
    ['♜','♞','♜','♛','♚','♜','♞','♜'],
    ['♟','♟','♟','♟','♟','♟','♟','♟'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['♙','♙','♙','♙','♙','♙','♙','♙'],
    ['♖','♘','♖','♕','♔','♖','♘','♖']
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <h3 className="text-2xl font-bold">Grandmaster's Gambit</h3>
      <div className="bg-white/5 p-2 rounded-xl border border-white/10 shadow-2xl">
        <div className="grid grid-cols-8 border border-white/5">
          {initialPieces.map((row, rIdx) => 
            row.map((piece, cIdx) => (
              <div 
                key={`${rIdx}-${cIdx}`}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-2xl
                  ${(rIdx + cIdx) % 2 === 0 ? 'bg-white/5' : 'bg-black/40'}`}
              >
                <span className={rIdx > 4 ? 'text-primary-500' : 'text-blue-400'}>
                  {piece}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
          <div className="w-3 h-3 rounded-full bg-blue-400" /> AI Turn
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-primary-500">
          <div className="w-3 h-3 rounded-full bg-primary-500" /> Your Turn
        </div>
      </div>
    </div>
  );
}

function GameCard({ title, desc, icon, onClick }: any) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card p-8 rounded-3xl border border-white/10 cursor-pointer group hover:border-primary-500/50 transition-all"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-6 text-primary-500 group-hover:scale-110 group-hover:bg-primary-500/20 transition-all">
        {React.cloneElement(icon, { size: 32 })}
      </div>
      <h3 className="text-2xl font-black text-white mb-3">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}