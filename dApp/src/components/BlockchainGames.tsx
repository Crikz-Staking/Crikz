// src/components/BlockchainGames.tsx
import React from 'react';
import { Gamepad2, Trophy, Zap, Brain, Timer } from 'lucide-react';
import type { Language } from '../App';

interface BlockchainGamesProps {
    dynamicColor: string;
    lang: Language;
}

export default function BlockchainGames({ dynamicColor, lang }: BlockchainGamesProps) {
  const t = {
    en: { 
      title: "Blockchain Games", 
      game1: "Fibonacci Runner", 
      desc1: "Predict the next sequence block to earn reputation multipliers.",
      game2: "Crikz Duel", 
      desc2: "High-stakes production battles between protocol creators.",
      play: "Start Game",
      comingSoon: "COMING SOON"
    },
    sq: { 
      title: "Lojërat Blockchain", 
      game1: "Vrapimi Fibonacci", 
      desc1: "Parashikoni bllokun e ardhshëm të sekuencës për të fituar shumëfishues reputacioni.",
      game2: "Dueli Crikz", 
      desc2: "Beteja prodhimi me rrezik të lartë midis krijuesve të protokollit.",
      play: "Fillo Lojën",
      comingSoon: "SË SHPEJTI"
    }
  }[lang];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Game 1 */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated relative overflow-hidden group hover:border-primary-500/30 transition-colors">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6">
                 <Brain size={24} className="text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{t.game1}</h3>
            <p className="text-sm text-gray-300 mb-8 leading-relaxed">{t.desc1}</p>
            <button className="flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all hover:scale-105">
              <Zap size={14} style={{ color: dynamicColor }} /> {t.play}
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Trophy size={200} />
          </div>
        </div>

        {/* Game 2 */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated relative overflow-hidden group hover:border-red-500/30 transition-colors">
          <div className="relative z-10">
             <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-6">
                 <Timer size={24} className="text-red-400" />
            </div>
            <div className="flex justify-between items-start">
                <h3 className="text-2xl font-black text-white mb-2">{t.game2}</h3>
                <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-gray-400">{t.comingSoon}</span>
            </div>
            <p className="text-sm text-gray-300 mb-8 leading-relaxed">{t.desc2}</p>
            <button disabled className="flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl bg-black/40 border border-white/5 text-gray-600 cursor-not-allowed">
              <Zap size={14} /> {t.play}
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Gamepad2 size={200} />
          </div>
        </div>
    </div>
  );
}