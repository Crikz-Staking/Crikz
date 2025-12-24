import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Brain, Swords, Coins, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Language } from '@/types';

interface BlockchainGamesProps {
  dynamicColor: string;
  lang: Language;
}

type GameType = 'tictactoe' | 'fibpuzzle' | 'chess' | 'none';

export default function BlockchainGames({ dynamicColor, lang }: BlockchainGamesProps) {
  const [activeGame, setActiveGame] = useState<GameType>('none');

  const t = {
    en: {
      title: "Crikz Game Zone",
      subtitle: "Play games inspired by the Fibonacci protocol to earn ecosystem reputation.",
      exit: "Exit to Library",
      tic: "Phi-Tac-Toe", ticDesc: "Outsmart the Intelligent Being in a 3x3 grid",
      fib: "Fibonacci Puzzle", fibDesc: "Complete the sequence to unlock rewards",
      chess: "Grandmaster's Gambit", chessDesc: "Strategic chess logic on the blockchain"
    },
    sq: {
      title: "Zona e Lojërave Crikz",
      subtitle: "Luani lojëra të frymëzuara nga protokolli Fibonacci për të fituar reputacion.",
      exit: "Kthehu te Biblioteka",
      tic: "Phi-Tac-Toe", ticDesc: "Mundni Inteligjencën në një rrjet 3x3",
      fib: "Ekuacioni Fibonacci", fibDesc: "Plotësoni sekuencën për të zhbllokuar shpërblime",
      chess: "Gambiti i Mjeshtrit", chessDesc: "Logjikë strategjike shahu në blockchain"
    }
  }[lang];

  return (
    <div className="space-y-8 min-h-[600px] w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Gamepad2 className="text-primary-500" style={{ color: dynamicColor }} />
          {t.title}
        </h2>
        <p className="text-gray-400">{t.subtitle}</p>
      </div>

      <AnimatePresence mode="wait">
        {activeGame === 'none' ? (
          <motion.div 
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <GameCard 
              title={t.tic} desc={t.ticDesc} 
              icon={<Brain />} dynamicColor={dynamicColor}
              onClick={() => setActiveGame('tictactoe')}
            />
            <GameCard 
              title={t.fib} desc={t.fibDesc} 
              icon={<Coins />} dynamicColor={dynamicColor}
              onClick={() => setActiveGame('fibpuzzle')}
            />
            <GameCard 
              title={t.chess} desc={t.chessDesc} 
              icon={<Swords />} dynamicColor={dynamicColor}
              onClick={() => setActiveGame('chess')}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="game-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-background-elevated"
          >
            <button 
              onClick={() => setActiveGame('none')}
              className="mb-8 text-sm font-bold text-gray-500 hover:text-white flex items-center gap-2 transition-colors"
            >
              <RotateCcw size={16} /> {t.exit}
            </button>
            
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="text-center">
                 <p className="text-xl font-bold mb-4">Game Module Loaded</p>
                 <p className="text-gray-500">Logic for {activeGame} goes here.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GameCard({ title, desc, icon, onClick, dynamicColor }: any) {
  return (
    <div 
      onClick={onClick}
      className="glass-card p-8 rounded-3xl border border-white/10 cursor-pointer group transition-all hover:scale-[1.02] hover:bg-white/5 bg-background-elevated"
    >
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all"
        style={{ backgroundColor: `${dynamicColor}20`, color: dynamicColor }}
      >
        {React.cloneElement(icon, { size: 32 })}
      </div>
      <h3 className="text-2xl font-black text-white mb-3">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}