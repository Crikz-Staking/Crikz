import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hand, Scissors, Square, Swords } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

const OPTIONS = [
    { id: 'rock', icon: Square, label: 'Rock' },
    { id: 'paper', icon: Hand, label: 'Paper' },
    { id: 'scissors', icon: Scissors, label: 'Scissors' }
];

export default function RockPaperScissors({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(50);
  const [phase, setPhase] = useState<'idle' | 'countdown' | 'result'>('idle');
  const [countdownText, setCountdownText] = useState('');
  const [userChoice, setUserChoice] = useState('');
  const [aiChoice, setAiChoice] = useState('');
  const [result, setResult] = useState('');

  const play = async (choice: string) => {
    if (balance < bet) return;
    onUpdateBalance(-bet);
    setUserChoice(choice);
    setPhase('countdown');

    const sequence = ["ROCK", "PAPER", "SCISSORS", "SHOOT!"];
    for (const txt of sequence) {
        setCountdownText(txt);
        await new Promise(r => setTimeout(r, 500));
    }

    const ai = OPTIONS[Math.floor(Math.random() * 3)].id;
    setAiChoice(ai);
    
    let outcome = 'lose';
    if (choice === ai) outcome = 'draw';
    else if (
        (choice === 'rock' && ai === 'scissors') ||
        (choice === 'paper' && ai === 'rock') ||
        (choice === 'scissors' && ai === 'paper')
    ) outcome = 'win';

    setResult(outcome);
    setPhase('result');

    if (outcome === 'win') onUpdateBalance(bet * 2);
    if (outcome === 'draw') onUpdateBalance(bet);
  };

  const reset = () => {
      setPhase('idle');
      setAiChoice('');
      setResult('');
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden p-6 relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <h3 className="text-xl font-black text-white mb-8 flex items-center justify-center gap-2"><Swords size={20} className="text-primary-500"/> RPS Arena</h3>

        <div className="h-40 flex items-center justify-center mb-8">
            {phase === 'idle' && <div className="text-gray-500 text-sm">Choose your weapon</div>}
            
            {phase === 'countdown' && (
                <motion.div 
                    key={countdownText}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    className="text-4xl font-black text-white"
                >
                    {countdownText}
                </motion.div>
            )}

            {phase === 'result' && (
                <div className="flex gap-8 items-center">
                    <div className={`p-4 rounded-2xl border-2 ${result === 'win' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10'}`}>
                        {OPTIONS.find(o => o.id === userChoice)?.icon({ size: 40 })}
                    </div>
                    <div className="text-2xl font-black text-gray-600">VS</div>
                    <div className={`p-4 rounded-2xl border-2 ${result === 'lose' ? 'border-red-500 bg-red-500/10' : 'border-white/10'}`}>
                        {OPTIONS.find(o => o.id === aiChoice)?.icon({ size: 40 })}
                    </div>
                </div>
            )}
        </div>

        {phase === 'result' && (
            <div className={`text-2xl font-black mb-6 ${result === 'win' ? 'text-emerald-500' : result === 'draw' ? 'text-gray-400' : 'text-red-500'}`}>
                {result.toUpperCase()}
            </div>
        )}

        {phase === 'idle' ? (
            <>
                <div className="flex gap-4 mb-6 justify-center">
                    {OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => play(opt.id)} disabled={balance < bet} className="p-4 bg-white/5 hover:bg-white/20 rounded-2xl border border-white/10 transition-all disabled:opacity-50">
                            <opt.icon size={32} />
                        </button>
                    ))}
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-white/10 w-fit mx-auto flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">BET</span>
                    <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="w-16 bg-transparent font-bold text-white outline-none"/>
                </div>
            </>
        ) : (
            phase === 'result' && (
                <button onClick={reset} className="btn-primary w-full py-3">PLAY AGAIN</button>
            )
        )}
      </div>
    </div>
  );
}