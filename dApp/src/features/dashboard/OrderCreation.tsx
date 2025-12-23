import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Award, AlertCircle, Sparkles, Wallet } from 'lucide-react';
import TierCard from './TierCard';
import { ORDER_TYPES } from '@/config';
import { useOrderCalculations } from '@/hooks/useOrderCalculations';
import { formatTokenAmount } from '@/utils/formatters';
import { fadeInUp, staggerContainer } from '@/utils/animations';
import { formatEther } from 'viem';

interface OrderCreationProps {
  balance: bigint | undefined;
  onCreateOrder: (amount: string, orderType: number) => void;
  isPending: boolean;
  dynamicColor: string;
}

export default function OrderCreation({
  balance,
  onCreateOrder,
  isPending,
  dynamicColor
}: OrderCreationProps) {
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState(2); 
  
  // REMOVED productionFund argument here
  const { reputation, expectedYield, tierInfo } = useOrderCalculations(
    amount,
    selectedTier
  );

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatEther(balance));
    }
  };

  const handleCreate = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    onCreateOrder(amount, selectedTier);
    setAmount('');
  };

  const balanceNum = balance ? parseFloat(formatEther(balance)) : 0;
  const amountNum = parseFloat(amount || '0');
  const isValidAmount = amountNum > 0 && amountNum <= balanceNum;
  const isInsufficient = amountNum > balanceNum;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      <div className="lg:col-span-8 space-y-6">
        <motion.div variants={fadeInUp} className="glass-card p-6 rounded-2xl border border-white/10 bg-background-elevated">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} style={{ color: dynamicColor }} strokeWidth={2.5} />
              Select Production Tier
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
        </motion.div>

        <motion.div variants={fadeInUp} className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 bg-background-elevated">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                Staking Amount
              </label>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-black/20 px-3 py-1 rounded-full">
                <Wallet size={12} />
                <span>Balance: {balance ? formatTokenAmount(formatEther(balance)) : '0'}</span>
                <button 
                  onClick={handleMaxClick}
                  className="text-primary-500 hover:text-primary-400 font-bold ml-2 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="relative group">
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) setAmount(val);
                }}
                placeholder="0.00"
                className={`w-full bg-background-surface border-2 rounded-xl px-5 py-5 text-4xl font-black focus:outline-none transition-all placeholder:text-gray-700 ${
                  isInsufficient 
                    ? 'border-red-500/50 text-red-500' 
                    : 'border-white/5 focus:border-primary-500/50 text-white'
                }`}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-lg">
                CRKZ
              </span>
            </div>

            {isInsufficient && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 p-2 rounded-lg"
              >
                <AlertCircle size={14} />
                Insufficient balance for this transaction
              </motion.div>
            )}
        </motion.div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <motion.div variants={fadeInUp} className="glass-card p-6 rounded-2xl border border-white/10 h-full flex flex-col justify-between bg-background-elevated">
          <div>
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-white">
              Order Preview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-background-surface rounded-xl border border-white/5">
                <span className="text-sm text-gray-400 flex items-center gap-2 font-medium">
                  <Clock size={16} strokeWidth={2} /> Lock Duration
                </span>
                <span className="font-mono font-bold text-white text-lg">{tierInfo.days} Days</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-background-surface rounded-xl border border-white/5">
                <span className="text-sm text-gray-400 flex items-center gap-2 font-medium">
                  <Award size={16} strokeWidth={2} /> Multiplier
                </span>
                <span className="font-mono font-bold text-lg" style={{ color: dynamicColor }}>
                  {tierInfo.multiplier}x
                </span>
              </div>
              <div className="border-t border-white/10 my-6 pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400 font-medium">Total Reputation</span>
                  <span className="text-xl font-black text-accent-cyan">
                    {formatTokenAmount(formatEther(reputation))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400 font-medium">Est. Yield</span>
                  <span className="text-xl font-black text-accent-emerald">
                    {formatTokenAmount(formatEther(expectedYield))}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <motion.button
            onClick={handleCreate}
            disabled={!isValidAmount || isPending}
            whileHover={isValidAmount ? { scale: 1.02 } : {}}
            whileTap={isValidAmount ? { scale: 0.98 } : {}}
            className={`w-full py-5 mt-6 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2
              ${isValidAmount 
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-black shadow-glow-md' 
                : 'bg-white/5 text-gray-600 cursor-not-allowed'}
            `}
          >
            {isPending ? (
              <>
                <Zap size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Confirm Order
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}