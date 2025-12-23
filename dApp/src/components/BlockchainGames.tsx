// src/components/BlockchainGames.tsx
import React, { useState } from 'react';
import { Gamepad2, Trophy, Zap, RefreshCw } from 'lucide-react';
import type { Language } from '../App';

interface BlockchainGamesProps {
    dynamicColor: string;
    lang: Language;
}

export default function BlockchainGames({ dynamicColor, lang }: BlockchainGamesProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
  // Tic Tac Toe State
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  
  const calculateWinner = (squares: any[]) => {
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return null;
  };

  const winner = calculateWinner(board);
  const handleClick = (i: number) => {
    if (winner || board[i]) return;
    const nextSquares = board.slice();
    nextSquares[i] = xIsNext ? 'X' : 'O';
    setBoard(nextSquares);
    setXIsNext(!xIsNext);
  };
  
  const resetGame = () => { setBoard(Array(9).fill(null)); setXIsNext(true); };

  const t = {
    en: { title: "Arcade", ttt: "Tic-Tac-Toe", winner: "Winner:", next: "Next Player:", reset: "Reset Game", play: "Play" },
    sq: { title: "Arkade", ttt: "X dhe O", winner: "Fituesi:", next: "Lojtari tjetër:", reset: "Rifillo", play: "Luaj" }
  }[lang];

  return (
    <div className="space-y-8">
      {/* Game Categories */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {['Strategy', 'Arcade', 'Luck'].map(cat => (
          <button key={cat} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10">
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tic-Tac-Toe Card */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Gamepad2 style={{ color: dynamicColor }} /> {t.ttt}
                </h3>
                <button onClick={resetGame} className="p-2 bg-white/5 rounded-lg hover:bg-white/10"><RefreshCw size={14}/></button>
            </div>

            <div className="flex flex-col items-center">
                <div className="mb-4 text-sm font-bold text-white">
                    {winner ? `${t.winner} ${winner}` : `${t.next} ${xIsNext ? 'X' : 'O'}`}
                </div>
                <div className="grid grid-cols-3 gap-2 w-48 mb-4">
                    {board.map((val, i) => (
                        <button 
                           key={i} 
                           onClick={() => handleClick(i)}
                           className="w-14 h-14 bg-black/30 rounded-lg text-2xl font-black text-white flex items-center justify-center hover:bg-black/50"
                        >
                            {val}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Coming Soon Games */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated opacity-70 flex flex-col items-center justify-center text-center">
            <Trophy size={48} className="text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Fibonacci Runner</h3>
            <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded mt-2">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}