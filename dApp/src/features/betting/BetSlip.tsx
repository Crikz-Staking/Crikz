import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Receipt, Wallet, ArrowRight } from 'lucide-react';
import { BetSelection } from '@/types';
import { toast } from 'react-hot-toast';

interface BetSlipProps {
  selections: BetSelection[];
  onRemove: (id: string) => void;
  onClear: () => void;
  balance: number;
  onPlaceBet: (amount: number, totalOdds: number) => void;
  dynamicColor: string;
}

export default function BetSlip({ selections, onRemove, onClear, balance, onPlaceBet, dynamicColor }: BetSlipProps) {
  const [wager, setWager] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate Total Odds (Parlay logic: multiply odds)
  const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1);
  const potentialReturn = wager ? (parseFloat(wager) * totalOdds) : 0;

  const handlePlaceBet = async () => {
    const amount = parseFloat(wager);
    if (!amount || amount <= 0 || amount > balance) {
        toast.error("Invalid wager amount");
        return;
    }

    setIsProcessing(true);
    // Simulate Blockchain Latency
    await new Promise(r => setTimeout(r, 1500));
    
    onPlaceBet(amount, totalOdds);
    setWager('');
    setIsProcessing(false);
    toast.success("Bet Placed on-chain!");
  };

  if (selections.length === 0) return null;

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed right-4 bottom-4 w-80 glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col max-h-[600px]"
    >
      {/* Header */}
      <div className="bg-primary-500 p-4 flex justify-between items-center text-black">
        <div className="flex items-center gap-2 font-black">
            <span className="bg-black text-primary-500 w-6 h-6 rounded-full flex items-center justify-center text-xs">{selections.length}</span>
            BET SLIP
        </div>
        <button onClick={onClear} className="p-1 hover:bg-black/10 rounded"><Trash2 size={16}/></button>
      </div>

      {/* Selections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
            {selections.map((sel) => (
                <motion.div 
                    key={`${sel.matchId}-${sel.selectionId}`}
                    layout
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-black/40 border border-white/5 p-3 rounded-xl relative group"
                >
                    <button 
                        onClick={() => onRemove(sel.matchId)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={14} />
                    </button>
                    <div className="text-xs text-gray-400 mb-1 line-clamp-1">{sel.matchName}</div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-primary-500">{sel.selectionName}</span>
                        <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold text-white">{sel.odds.toFixed(2)}</span>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Footer / Wager */}
      <div className="bg-[#12121A] p-4 border-t border-white/10 space-y-4">
        
        {/* Multiplier Info */}
        {selections.length > 1 && (
            <div className="flex justify-between text-xs font-bold text-gray-400">
                <span>Parlay Odds</span>
                <span className="text-emerald-400">{totalOdds.toFixed(2)}x</span>
            </div>
        )}

        {/* Input */}
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                <span>Wager Amount</span>
                <span>Bal: {balance.toFixed(0)}</span>
            </div>
            <div className="relative">
                <input 
                    type="number" 
                    value={wager}
                    onChange={(e) => setWager(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 font-bold text-white focus:border-primary-500 outline-none"
                />
                <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
        </div>

        {/* Returns */}
        <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-xs text-gray-400 font-bold">Est. Payout</span>
            <span className="font-black text-emerald-400">{potentialReturn.toFixed(2)}</span>
        </div>

        {/* Action */}
        <button 
            onClick={handlePlaceBet}
            disabled={isProcessing || !wager || parseFloat(wager) > balance}
            className="w-full py-4 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-glow-sm"
        >
            {isProcessing ? 'CONFIRMING...' : 'PLACE BET'} <Receipt size={18} />
        </button>
      </div>
    </motion.div>
  );
}