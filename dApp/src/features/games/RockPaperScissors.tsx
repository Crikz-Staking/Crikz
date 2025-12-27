import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Hand, Scissors, Square } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

const OPTIONS = [
    { id: 'rock', icon: Square, beats: 'scissors' },
    { id: 'paper', icon: Hand, beats: 'rock' },
    { id: 'scissors', icon: Scissors, beats: 'paper' }
];

export default function RockPaperScissors({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [aiChoice, setAiChoice] = useState<string | null>(null);

  const play = async (userChoice: string) => {
    if (balance < bet || playing) return;
    setPlaying(true);
    setResult(null);
    setAiChoice(null);
    onUpdateBalance(-bet);

    await new Promise(r => setTimeout(r, 800));

    const ai = OPTIONS[Math.floor(Math.random() * OPTIONS.length)];
    setAiChoice(ai.id);

    if (userChoice === ai.id) {
        setResult('draw');
        onUpdateBalance(bet); // Refund
    } else if (OPTIONS.find(o => o.id === userChoice)?.beats === ai.id) {
        setResult('win');
        onUpdateBalance(bet * 2);
    } else {
        setResult('lose');
    }
    setPlaying(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        <h3 className="text-xl font-black text-center mb-2 text-white">Rock Paper Scissors</h3>
        <p className="text-center text-xs text-gray-500 mb-8">Beat the AI • Win 2x</p>

        <div className="flex justify-center items-center gap-8 mb-8 h-32">
            <div className="text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <span className="text-xs text-gray-500">YOU</span>
                </div>
            </div>
            <div className="text-2xl font-black text-gray-600">VS</div>
            <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border transition-colors ${aiChoice ? 'bg-white/10 border-white' : 'bg-white/5 border-white/10'}`}>
                    {aiChoice ? aiChoice.toUpperCase()[0] : '?'}
                </div>
            </div>
        </div>

        {result && (
            <div className={`text-center font-black text-2xl mb-6 ${result === 'win' ? 'text-emerald-500' : result === 'lose' ? 'text-red-500' : 'text-gray-400'}`}>
                {result.toUpperCase()}
            </div>
        )}

        <div className="bg-black/40 p-3 rounded-xl border border-white/10 mb-4 flex justify-between items-center max-w-xs mx-auto">
            <span className="text-xs text-gray-500 font-bold uppercase">Bet</span>
            <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="bg-transparent text-right font-bold text-white w-20 outline-none" />
        </div>

        <div className="flex justify-center gap-4">
            {OPTIONS.map(opt => (
                <button 
                    key={opt.id} 
                    onClick={() => play(opt.id)} 
                    disabled={playing || balance < bet}
                    className="p-4 bg-white/5 hover:bg-white/20 rounded-2xl border border-white/10 transition-all disabled:opacity-50"
                >
                    <opt.icon size={24} />
                </button>
            ))}
        </div>
      </motion.div>
    </div>
  );
}