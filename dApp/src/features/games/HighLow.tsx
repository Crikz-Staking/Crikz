import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUp, ArrowDown } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export default function HighLow({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(25);
  const [currentCard, setCurrentCard] = useState({ rank: 6, suit: 0 }); // Start middle-ish (8)
  const [nextCard, setNextCard] = useState<{ rank: number, suit: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("Higher or Lower?");

  const getRankValue = (r: number) => r + 2; // 0=2, 12=Ace(14)

  const drawCard = () => ({
      rank: Math.floor(Math.random() * 13),
      suit: Math.floor(Math.random() * 4)
  });

  const guess = async (direction: 'high' | 'low') => {
    if (balance < bet || playing) return;
    setPlaying(true);
    onUpdateBalance(-bet);
    
    // Animate Draw
    await new Promise(r => setTimeout(r, 600));
    
    const next = drawCard();
    // Ensure no tie for simplicity in this demo
    while (next.rank === currentCard.rank) next.rank = Math.floor(Math.random() * 13);
    
    setNextCard(next);

    const currVal = getRankValue(currentCard.rank);
    const nextVal = getRankValue(next.rank);
    
    let won = false;
    if (direction === 'high' && nextVal > currVal) won = true;
    if (direction === 'low' && nextVal < currVal) won = true;

    if (won) {
        onUpdateBalance(bet * 2);
        setMessage("Correct!");
    } else {
        setMessage("Wrong!");
    }

    setTimeout(() => {
        setCurrentCard(next);
        setNextCard(null);
        setPlaying(false);
        setMessage("Next Round");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden p-6 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <h3 className="text-xl font-black text-white mb-2">High / Low</h3>
        <p className="text-xs text-gray-500 mb-8">{message}</p>

        <div className="flex justify-center items-center gap-8 mb-10 h-40">
            <Card card={currentCard} visible={true} />
            <div className="text-gray-600 font-black text-xl">VS</div>
            <Card card={nextCard} visible={!!nextCard} placeholder={true} />
        </div>

        <div className="w-full flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase">Bet</span>
            <input type="number" value={bet} onChange={e => setBet(parseInt(e.target.value) || 0)} className="w-20 bg-transparent text-right font-bold text-white outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
            <button onClick={() => guess('high')} disabled={playing || balance < bet} className="py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                <ArrowUp size={24} /> HIGHER
            </button>
            <button onClick={() => guess('low')} disabled={playing || balance < bet} className="py-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all disabled:opacity-50">
                <ArrowDown size={24} /> LOWER
            </button>
        </div>
      </div>
    </div>
  );
}

function Card({ card, visible, placeholder }: any) {
    if (placeholder && !visible) {
        return (
            <div className="w-24 h-36 bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">?</span>
            </div>
        );
    }

    if (!card) return null;

    const color = (card.suit === 1 || card.suit === 3) ? 'text-red-500' : 'text-white';
    
    return (
        <motion.div 
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            className="w-24 h-36 bg-white rounded-xl flex flex-col items-center justify-between p-2 shadow-xl"
        >
            <div className={`text-left w-full font-black ${color}`}>{RANKS[card.rank]}</div>
            <div className={`text-4xl ${color}`}>{SUITS[card.suit]}</div>
            <div className={`text-right w-full font-black ${color} rotate-180`}>{RANKS[card.rank]}</div>
        </motion.div>
    );
}