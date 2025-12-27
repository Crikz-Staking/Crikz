import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Receipt, Wallet, X, AlertTriangle, Loader2 } from 'lucide-react';
import { BetSelection } from '@/types';
import { toast } from 'react-hot-toast';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

const SPORTS_BETTING_ADDRESS = import.meta.env.VITE_SPORTS_BETTING_ADDRESS;
const BETTING_ABI = [
  { "inputs": [{"name": "_matchId", "type": "string"}, {"name": "_selection", "type": "uint8"}, {"name": "_amount", "type": "uint256"}, {"name": "_odds", "type": "uint256"}], "name": "placeBet", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
] as const;

interface BetSlipProps {
  selections: BetSelection[];
  onRemove: (id: string) => void;
  onClear: () => void;
  balance: number;
  dynamicColor: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export default function BetSlip({ selections, onRemove, onClear, balance, dynamicColor, isOpenMobile, onCloseMobile }: BetSlipProps) {
  const [wager, setWager] = useState<string>('');
  const activeBet = selections[0]; // MVP: Single Bet Only for now

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Bet Placed Successfully!", { icon: '🎟️' });
      onClear();
      setWager('');
    }
    if (error) {
        toast.error("Transaction Failed");
        console.error(error);
    }
  }, [isSuccess, error]);

  const handlePlaceBet = () => {
    if (!activeBet || !wager) return;
    if (parseFloat(wager) > balance) {
        toast.error("Insufficient Funds");
        return;
    }

    const selMap: Record<string, number> = { 'home': 0, 'draw': 1, 'away': 2 };
    const oddsScaled = Math.floor(activeBet.odds * 100);

    writeContract({
        address: SPORTS_BETTING_ADDRESS,
        abi: BETTING_ABI,
        functionName: 'placeBet',
        args: [activeBet.matchId, selMap[activeBet.selectionId], parseEther(wager), BigInt(oddsScaled)]
    } as any);
  };

  const containerClass = `fixed inset-y-0 right-0 w-80 bg-[#12121A] border-l border-white/10 z-[60] flex flex-col transition-transform duration-300 transform 
    ${isOpenMobile ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static lg:h-[calc(100vh-200px)] lg:rounded-2xl lg:border lg:ml-4 lg:shadow-xl`;

  if (selections.length === 0) {
    return (
      <div className={`${containerClass} items-center justify-center text-center p-8`}>
        {/* Mobile Close */}
        <button onClick={onCloseMobile} className="lg:hidden absolute top-4 left-4 p-2 bg-white/5 rounded-full"><X/></button>
        
        <Receipt size={48} className="text-white/10 mb-4" />
        <h3 className="text-gray-500 font-bold">Bet Slip Empty</h3>
        <p className="text-xs text-gray-600 mt-2">Select odds to start playing</p>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#1a1a24]">
        <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-xs">1</span>
            <span className="font-black text-white">Bet Slip</span>
        </div>
        <div className="flex gap-2">
            <button onClick={onClear} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 transition-colors"><Trash2 size={16}/></button>
            <button onClick={onCloseMobile} className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-gray-500"><X size={16}/></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-black/40 border border-white/10 rounded-xl overflow-hidden relative"
            >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500" />
                <button onClick={() => onRemove(activeBet.matchId)} className="absolute top-2 right-2 text-gray-600 hover:text-white"><X size={14}/></button>
                
                <div className="p-4">
                    <div className="text-xs text-gray-400 mb-1 line-clamp-1">{activeBet.matchName}</div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-primary-500">{activeBet.selectionName}</span>
                        <span className="bg-primary-500/10 text-primary-500 px-2 py-1 rounded text-xs font-bold border border-primary-500/20">
                            {activeBet.odds.toFixed(2)}
                        </span>
                    </div>
                    
                    <div className="relative">
                        <input 
                            type="number" 
                            value={wager}
                            onChange={(e) => setWager(e.target.value)}
                            placeholder="Wager..."
                            className="w-full bg-[#12121a] border border-white/10 rounded-lg py-2 pl-3 pr-12 text-sm text-white font-bold focus:border-primary-500 outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500">CRKZ</span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>

        {selections.length > 1 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-xs text-red-400">
                <AlertTriangle size={16} />
                <span>Multi-bets coming in v2. Only the first selection will be placed.</span>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#1a1a24] border-t border-white/5 space-y-4">
        <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-bold">Total Odds</span>
            <span className="text-white font-mono font-bold">{activeBet.odds.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-bold">Possible Win</span>
            <span className="text-emerald-400 font-mono font-bold text-lg">
                {(parseFloat(wager || '0') * activeBet.odds).toFixed(2)} CRKZ
            </span>
        </div>
        
        <div className="flex justify-between items-center text-[10px] text-gray-600 uppercase font-bold">
            <span>Wallet Balance</span>
            <span className="flex items-center gap-1"><Wallet size={10}/> {balance.toFixed(2)}</span>
        </div>

        <button 
            onClick={handlePlaceBet}
            disabled={!wager || isPending || isConfirming || parseFloat(wager) > balance}
            className="w-full py-4 bg-primary-500 hover:bg-primary-400 text-black font-black rounded-xl transition-all shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {isPending || isConfirming ? <Loader2 className="animate-spin" size={18}/> : <Receipt size={18} />}
            {isPending ? 'Confirming...' : 'Place Bet'}
        </button>
      </div>
    </div>
  );
}