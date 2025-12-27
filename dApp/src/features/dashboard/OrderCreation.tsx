import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, AlertCircle, Wallet } from 'lucide-react';
import TierCard from './TierCard';
import { ORDER_TYPES } from '@/config/index';
import { useOrderCalculations } from '@/hooks/web3/useOrderCalculations';
import { formatTokenAmount } from '@/lib/utils';
import { formatEther, parseEther } from 'viem';

interface OrderCreationProps {
  balance: bigint | undefined;
  onCreateOrder: (amount: string, orderType: number) => void;
  isPending: boolean;
  dynamicColor: string;
}

export default function OrderCreation({ balance, onCreateOrder, isPending, dynamicColor }: OrderCreationProps) {
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState(2);
  
  const { reputation, expectedYield } = useOrderCalculations(amount, selectedTier);

  const investAmountBig = amount ? parseEther(amount) : 0n;
  const balanceBig = balance || 0n;
  const isInsufficientBalance = investAmountBig > balanceBig;
  
  const investDisplay = parseFloat(formatEther(investAmountBig));
  const yieldDisplay = parseFloat(formatEther(expectedYield));
  const totalDisplay = investDisplay + yieldDisplay;

  const handleMax = () => {
    if (balance) {
      // Leave a tiny bit for dust/gas if it were ETH, but for ERC20 full balance is usually fine
      setAmount(formatEther(balance));
    }
  };

  const handleCreate = () => {
    if (!amount || parseFloat(amount) <= 0 || isInsufficientBalance) return;
    onCreateOrder(amount, selectedTier);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: Inputs */}
      <div className="lg:col-span-7 space-y-6">
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-primary-500" /> Select Production Tier
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ORDER_TYPES.map((tier) => (
              <TierCard 
                key={tier.index} 
                tier={tier} 
                isSelected={selectedTier === tier.index} 
                onClick={() => setSelectedTier(tier.index)} 
                dynamicColor={dynamicColor} 
              />
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
           <div className="flex justify-between mb-2">
              <label className="text-sm font-bold text-gray-400">Amount to Lock</label>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Wallet size={12} />
                <span>Balance: {balance ? formatTokenAmount(balance) : '0.00'}</span>
                <button 
                  onClick={handleMax}
                  className="text-primary-500 font-bold hover:text-white transition-colors"
                >
                  MAX
                </button>
              </div>
           </div>
           
           <div className="relative">
             <input 
               type="number" 
               value={amount} 
               onChange={e => setAmount(e.target.value)} 
               className={`w-full bg-black/40 border rounded-xl p-4 text-2xl font-black text-white focus:outline-none transition-colors ${isInsufficientBalance ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary-500'}`}
               placeholder="0.00" 
             />
             <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">CRKZ</span>
           </div>

           {isInsufficientBalance && (
             <motion.div 
               initial={{ opacity: 0, y: -5 }} 
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center gap-2 mt-2 text-red-500 text-xs font-bold"
             >
               <AlertCircle size={12} /> Insufficient Balance
             </motion.div>
           )}
        </div>
      </div>

      {/* RIGHT: Math Breakdown */}
      <div className="lg:col-span-5">
        <div className="glass-card p-8 rounded-3xl border border-white/10 h-full flex flex-col justify-between bg-background-elevated relative overflow-hidden">
           {/* Decorative Background */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           
           <div className="relative z-10">
             <h3 className="text-xl font-black text-white mb-6">Production Estimate</h3>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-sm text-gray-400">Locked Capital</span>
                    <span className="font-bold text-white">{formatTokenAmount(investAmountBig)} CRKZ</span>
                </div>
                
                <div className="flex justify-center text-gray-600">
                  <ArrowRight size={20} className="animate-pulse" />
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-500/10 to-transparent border border-primary-500/20 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs text-primary-500 font-bold uppercase">Total Return</span>
                      <span className="text-[10px] text-gray-500">Principal + Yield</span>
                    </div>
                    <span className="font-black text-2xl text-white">{formatTokenAmount(parseEther(totalDisplay.toString()))}</span>
                </div>
                
                <div className="pt-4 border-t border-white/5 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Projected Yield</span>
                        <span className="text-emerald-400 font-bold">+{formatTokenAmount(expectedYield)} CRKZ</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Reputation Generated</span>
                        <span className="text-accent-cyan font-bold">+{formatTokenAmount(reputation)} REP</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Multiplier</span>
                        <span>{ORDER_TYPES[selectedTier].multiplier}x</span>
                    </div>
                </div>
             </div>
           </div>

           <button 
             onClick={handleCreate} 
             disabled={isPending || investAmountBig <= 0n || isInsufficientBalance} 
             className="w-full py-4 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 hover:scale-[1.02] active:scale-[0.98] transition-all mt-6 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-glow-sm"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : 'Initiate Production'}
           </button>
        </div>
      </div>
    </div>
  );
}