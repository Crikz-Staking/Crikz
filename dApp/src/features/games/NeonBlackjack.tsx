import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Shield } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

type Suit = '♠' | '♥' | '♣' | '♦';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  id: string;
}

export default function NeonBlackjack({ onClose, balance, onUpdateBalance }: GameProps) {
  const [bet, setBet] = useState(50);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealer' | 'result'>('betting');
  const [message, setMessage] = useState('');
  const [resultType, setResultType] = useState<'win'|'lose'|'push'|'blackjack'|null>(null);

  // Initialize Deck
  const createDeck = () => {
    const suits: Suit[] = ['♠', '♥', '♣', '♦'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const newDeck: Card[] = [];
    
    suits.forEach(suit => {
      ranks.forEach(rank => {
        let value = parseInt(rank);
        if (['J', 'Q', 'K'].includes(rank)) value = 10;
        if (rank === 'A') value = 11;
        newDeck.push({ suit, rank, value, id: `${rank}${suit}-${Math.random()}` });
      });
    });
    
    // Fisher-Yates Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  const calculateScore = (hand: Card[]) => {
    let score = hand.reduce((acc, card) => acc + card.value, 0);
    let aces = hand.filter(card => card.rank === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const dealCard = (target: 'player' | 'dealer', currentDeck: Card[]) => {
    const card = currentDeck.pop();
    if (!card) return currentDeck;
    
    if (target === 'player') setPlayerHand(prev => [...prev, card]);
    else setDealerHand(prev => [...prev, card]);
    
    return currentDeck;
  };

  const startGame = async () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);
    setGameState('playing');
    setMessage('');
    setResultType(null);
    setPlayerHand([]);
    setDealerHand([]);

    let d = createDeck();
    
    // Initial Deal Sequence
    d = dealCard('player', d) as Card[];
    await new Promise(r => setTimeout(r, 400));
    d = dealCard('dealer', d) as Card[]; 
    await new Promise(r => setTimeout(r, 400));
    d = dealCard('player', d) as Card[];
    await new Promise(r => setTimeout(r, 400));
    d = dealCard('dealer', d) as Card[]; 
    
    setDeck(d);
  };

  // Check Blackjack immediately after deal
  useEffect(() => {
    if (gameState === 'playing' && playerHand.length === 2 && dealerHand.length === 2) {
        const pScore = calculateScore(playerHand);
        if (pScore === 21) {
            handleStand();
        }
    }
  }, [playerHand, dealerHand]);

  const handleHit = () => {
    const newDeck = [...deck];
    const card = newDeck.pop();
    if (card) {
        const newHand = [...playerHand, card];
        setPlayerHand(newHand);
        setDeck(newDeck);
        if (calculateScore(newHand) > 21) {
            endGame('lose', 'Bust!');
        }
    }
  };

  const handleStand = async () => {
    setGameState('dealer');
    let currentDealerHand = [...dealerHand];
    let dScore = calculateScore(currentDealerHand);
    let currentDeck = [...deck];

    // Dealer draws until 17
    while (dScore < 17) {
        await new Promise(r => setTimeout(r, 800));
        const card = currentDeck.pop();
        if (card) {
            currentDealerHand = [...currentDealerHand, card];
            setDealerHand(currentDealerHand);
            dScore = calculateScore(currentDealerHand);
        }
    }
    setDeck(currentDeck);
    determineWinner(currentDealerHand);
  };

  const determineWinner = (finalDealerHand: Card[]) => {
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(finalDealerHand);

    if (dScore > 21) {
        endGame('win', 'Dealer Busts!');
    } else if (pScore > dScore) {
        endGame(pScore === 21 && playerHand.length === 2 ? 'blackjack' : 'win', 'You Win!');
    } else if (dScore > pScore) {
        endGame('lose', 'Dealer Wins');
    } else {
        endGame('push', 'Push');
    }
  };

  const endGame = (result: 'win'|'lose'|'push'|'blackjack', msg: string) => {
    setMessage(msg);
    setResultType(result);
    setGameState('result');
    
    if (result === 'win') onUpdateBalance(bet * 2);
    if (result === 'blackjack') onUpdateBalance(bet * 2.5);
    if (result === 'push') onUpdateBalance(bet);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f2e20] border-4 border-[#1a4c35] rounded-[3rem] w-full max-w-4xl h-[85vh] relative overflow-hidden shadow-2xl flex flex-col">
        {/* Felt Texture Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <button onClick={onClose} className="absolute top-6 right-6 z-50 text-white/50 hover:text-white"><X size={24}/></button>

        {/* Dealer Area */}
        <div className="flex-1 flex flex-col items-center justify-center pt-8 relative">
            <div className="mb-2 text-xs font-bold text-[#4ade80]/50 uppercase tracking-widest flex items-center gap-2">
                <Shield size={12}/> Dealer {gameState === 'result' && <span>({calculateScore(dealerHand)})</span>}
            </div>
            <div className="flex -space-x-12 h-32">
                <AnimatePresence>
                    {dealerHand.map((card, i) => (
                        <PlayingCard 
                            key={card.id} 
                            card={card} 
                            index={i} 
                            faceDown={i === 0 && gameState === 'playing'} 
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>

        {/* Center Info */}
        <div className="h-20 flex items-center justify-center relative z-10">
            {gameState === 'result' && (
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-8 py-3 rounded-full text-xl font-black border-2 shadow-lg backdrop-blur-md
                        ${resultType === 'win' || resultType === 'blackjack' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 
                          resultType === 'lose' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/10 border-white/30 text-white'}
                    `}
                >
                    {message.toUpperCase()}
                </motion.div>
            )}
        </div>

        {/* Player Area */}
        <div className="flex-1 flex flex-col items-center justify-start relative">
            <div className="flex -space-x-12 h-32 mb-4">
                <AnimatePresence>
                    {playerHand.map((card, i) => (
                        <PlayingCard key={card.id} card={card} index={i} />
                    ))}
                </AnimatePresence>
            </div>
            {playerHand.length > 0 && (
                <div className="mb-2 text-xs font-bold text-white/70 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/10">
                    Player: {calculateScore(playerHand)}
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="bg-black/40 backdrop-blur-md p-6 border-t border-white/5">
            {gameState === 'betting' || gameState === 'result' ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/10">
                        <button onClick={() => setBet(Math.max(10, bet - 10))} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">-</button>
                        <div className="w-24 text-center font-black text-2xl text-white">{bet}</div>
                        <button onClick={() => setBet(bet + 10)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">+</button>
                    </div>
                    <button onClick={startGame} disabled={balance < bet} className="btn-primary px-12 py-3 text-lg shadow-glow-sm w-full max-w-sm">
                        {gameState === 'result' ? 'DEAL AGAIN' : 'DEAL'}
                    </button>
                </div>
            ) : (
                <div className="flex justify-center gap-4">
                    <button onClick={handleHit} disabled={gameState !== 'playing'} className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-black text-white transition-all flex flex-col items-center gap-1 min-w-[120px]">
                        <Layers size={20} /> HIT
                    </button>
                    <button onClick={handleStand} disabled={gameState !== 'playing'} className="px-8 py-4 bg-primary-500 hover:bg-primary-400 text-black rounded-2xl font-black transition-all flex flex-col items-center gap-1 min-w-[120px] shadow-glow-sm">
                        <Shield size={20} /> STAND
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function PlayingCard({ card, index, faceDown = false }: { card: Card, index: number, faceDown?: boolean }) {
    const isRed = card.suit === '♥' || card.suit === '♦';
    
    return (
        <motion.div
            initial={{ y: -200, opacity: 0, rotateY: 180 }}
            animate={{ y: 0, opacity: 1, rotateY: faceDown ? 180 : 0 }}
            transition={{ delay: index * 0.1, type: 'spring', damping: 20 }}
            className="w-24 h-36 rounded-xl relative preserve-3d transition-transform hover:-translate-y-4 duration-300"
            style={{ 
                transformStyle: 'preserve-3d',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
        >
            {/* Front */}
            <div className={`absolute inset-0 bg-white rounded-xl border border-gray-300 p-2 flex flex-col justify-between backface-hidden ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
                <div className="text-left font-bold leading-none">
                    <div className="text-lg">{card.rank}</div>
                    <div className="text-xl">{card.suit}</div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl opacity-20">
                    {card.suit}
                </div>
                <div className="text-right font-bold leading-none rotate-180">
                    <div className="text-lg">{card.rank}</div>
                    <div className="text-xl">{card.suit}</div>
                </div>
            </div>

            {/* Back */}
            <div 
                className="absolute inset-0 bg-[#1a2e4c] rounded-xl border-2 border-white/20 backface-hidden flex items-center justify-center"
                style={{ 
                    transform: 'rotateY(180deg)',
                    backgroundImage: 'repeating-linear-gradient(45deg, #1a2e4c 0, #1a2e4c 10px, #233b5d 10px, #233b5d 20px)'
                }}
            >
                <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center">
                    <div className="text-white/20 font-black">CRIKZ</div>
                </div>
            </div>
        </motion.div>
    );
}