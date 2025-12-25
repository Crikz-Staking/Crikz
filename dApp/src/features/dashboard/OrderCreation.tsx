import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Wallet, ArrowRight } from 'lucide-react';
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
  
  // Hooks now handle BigInt math internally safe from UI strings
  const { reputation, expectedYield, tierInfo } = useOrderCalculations(amount, selectedTier);

  // Safe Math for display only
  const investAmountBig = amount ? parseEther(amount) : 0n;
  const investDisplay = parseFloat(formatEther(investAmountBig));
  const yieldDisplay = parseFloat(formatEther(expectedYield));
  const totalDisplay = investDisplay + yieldDisplay;

  const handleCreate = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    onCreateOrder(amount, selectedTier);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: Inputs */}
      <div className="lg:col-span-7 space-y-6">
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
          <h3 className="text-lg font-bold text-white mb-4">Select Tier</h3>
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
              <span className="text-xs text-gray-500">
                Balance: {balance ? formatTokenAmount(balance) : '0.00'}
              </span>
           </div>
           <input 
             type="number" 
             value={amount} 
             onChange={e => setAmount(e.target.value)} 
             className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-2xl font-black text-white focus:border-primary-500 outline-none" 
             placeholder="0.00" 
           />
        </div>
      </div>

      {/* RIGHT: Math Breakdown */}
      <div className="lg:col-span-5">
        <div className="glass-card p-8 rounded-3xl border border-white/10 h-full flex flex-col justify-between bg-background-elevated">
           <div>
             <h3 className="text-xl font-black text-white mb-6">Production Output</h3>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-gray-400">Invested (Locked)</span>
                    <span className="font-bold text-white">{formatTokenAmount(investAmountBig)} CRKZ</span>
                </div>
                <div className="flex justify-center text-gray-600"><ArrowRight size={20}/></div>
                <div className="flex justify-between items-center p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                    <span className="text-sm text-primary-500 font-bold">Total Generated</span>
                    <span className="font-black text-white">{formatTokenAmount(parseEther(totalDisplay.toString()))} CRKZ</span>
                </div>
                
                <div className="pt-4 border-t border-white/5">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Base Yield</span>
                        <span>+{formatTokenAmount(expectedYield)} CRKZ</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Reputation Gain</span>
                        <span>+{formatTokenAmount(reputation)} REP</span>
                    </div>
                </div>
             </div>
           </div>

           <button 
             onClick={handleCreate} 
             disabled={isPending || investAmountBig <= 0n} 
             className="w-full py-4 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 transition-colors mt-6 disabled:opacity-50"
            >
              {isPending ? 'Processing...' : 'Start Production'}
           </button>
        </div>
      </div>
    </div>
  );
}