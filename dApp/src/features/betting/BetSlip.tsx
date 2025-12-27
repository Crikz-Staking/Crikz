import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Receipt, Wallet } from 'lucide-react';
import { BetSelection } from '@/types';
import { toast } from 'react-hot-toast';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';

// You must deploy SportsBetting.sol and put address here
// Replace the hardcoded string with:
const SPORTS_BETTING_ADDRESS = import.meta.env.VITE_SPORTS_BETTING_ADDRESS;
const BETTING_ABI = [
  { "inputs": [{"name": "_matchId", "type": "string"}, {"name": "_selection", "type": "uint8"}, {"name": "_amount", "type": "uint256"}, {"name": "_odds", "type": "uint256"}], "name": "placeBet", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
] as const;

// Needs token ABI approval logic too (omitted for brevity, assume approval exists or handled)

interface BetSlipProps {
  selections: BetSelection[];
  onRemove: (id: string) => void;
  onClear: () => void;
  balance: number; // Real wallet balance passed down
  dynamicColor: string;
}

export default function BetSlip({ selections, onRemove, onClear, balance }: BetSlipProps) {
  const [wager, setWager] = useState<string>('');
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Only handling Single Bets for MVP (Multiple bets loop or single call)
  // For this update, we assume the first selection is the active one if multiple are selected,
  // or disable multiple selections in the UI.
  const activeBet = selections[0]; 

  const handlePlaceBet = async () => {
    if (!activeBet) return;
    const amount = parseFloat(wager);
    if (!amount || amount <= 0) {
        toast.error("Invalid wager");
        return;
    }

    try {
        // Selection mapping: home=0, draw=1, away=2
        const selMap = { 'home': 0, 'draw': 1, 'away': 2 };
        const selInt = selMap[activeBet.selectionId];
        
        // Scale odds by 100 (1.50 -> 150)
        const oddsScaled = Math.floor(activeBet.odds * 100);

        writeContract({
            address: SPORTS_BETTING_ADDRESS,
            abi: BETTING_ABI,
            functionName: 'placeBet',
            args: [activeBet.matchId, selInt, parseEther(wager), BigInt(oddsScaled)]
        } as any);
        
    } catch (e) {
        console.error(e);
        toast.error("Transaction failed");
    }
  };

  React.useEffect(() => {
      if (isSuccess) {
          toast.success("Bet Confirmed on Blockchain!");
          onClear();
          setWager('');
      }
  }, [isSuccess]);

  if (selections.length === 0) return null;

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
      className="fixed right-4 bottom-4 w-80 glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col max-h-[600px]"
    >
      <div className="bg-primary-500 p-4 flex justify-between items-center text-black">
        <span className="font-black">BET SLIP</span>
        <button onClick={onClear}><Trash2 size={16}/></button>
      </div>

      <div className="p-4 space-y-3 bg-[#12121A]">
        {/* Selection Details */}
        <div className="bg-black/40 border border-white/5 p-3 rounded-xl relative">
            <div className="text-xs text-gray-400 mb-1">{activeBet.matchName}</div>
            <div className="flex justify-between items-center">
                <span className="font-bold text-primary-500 capitalize">{activeBet.selectionName}</span>
                <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold text-white">{activeBet.odds}</span>
            </div>
        </div>

        {/* Input */}
        <div className="space-y-2 mt-4">
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                <span>Wager (CRKZ)</span>
                <span>Bal: {balance.toFixed(2)}</span>
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

        {/* Payout Calc */}
        <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
            <span className="text-xs text-gray-400 font-bold">Est. Payout</span>
            <span className="font-black text-emerald-400">
                {wager ? (parseFloat(wager) * activeBet.odds).toFixed(2) : '0.00'}
            </span>
        </div>

        <button 
            onClick={handlePlaceBet}
            disabled={isPending || isConfirming || !wager}
            className="w-full py-4 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-black font-black rounded-xl flex items-center justify-center gap-2 transition-all"
        >
            {isPending || isConfirming ? 'CONFIRMING...' : 'PLACE BET'} <Receipt size={18} />
        </button>
      </div>
    </motion.div>
  );
}