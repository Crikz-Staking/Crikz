// src/components/OrderCreation.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { Info, Zap } from 'lucide-react';
import TierCard from './TierCard';
import { ORDER_TYPES } from '../config';
import { useOrderCalculations } from '../hooks/useOrderCalculations';
import { formatTokenAmount } from '../utils/formatters';
import { fadeInUp, staggerContainer } from '../utils/animations';
import type { ProductionFund } from '../types';

interface OrderCreationProps {
  balance: bigint | undefined;
  productionFund: ProductionFund | undefined;
  onCreateOrder: (amount: string, orderType: number) => void;
  isPending: boolean;
  themeColor: string;
  gradientColors: { from: string; to: string };
}

export default function OrderCreation({
  balance,
  productionFund,
  onCreateOrder,
  isPending,
  themeColor,
  gradientColors
}: OrderCreationProps) {
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState(2);
  
  const { reputation, expectedYield, tierInfo } = useOrderCalculations(
    amount,
    selectedTier,
    productionFund
  );

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatEther(balance));
    }
  };

  const handleCreate = () => {
    onCreateOrder(amount, selectedTier);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 space-y-8"
    >
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black mb-2">Create Production Order</h2>
        <p className="text-gray-400 text-sm">
          Lock tokens to earn reputation and yield based on Fibonacci tiers
        </p>
      </div>

      {/* Tier Selection */}
      <motion.div variants={fadeInUp}>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
          Select Production Tier
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ORDER_TYPES.map((tier) => (
            <TierCard
              key={tier.index}
              tier={tier}
              isSelected={selectedTier === tier.index}
              onClick={() => setSelectedTier(tier.index)}
              themeColor={themeColor}
            />
          ))}
        </div>
      </motion.div>

      {/* Amount Input */}
      <motion.div variants={fadeInUp} className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Order Amount
          </label>
          <button
            onClick={handleMaxClick}
            className="text-sm font-bold px-3 py-1 rounded-lg transition-all"
            style={{
              background: `${themeColor}20`,
              color: themeColor
            }}
          >
            MAX: {balance ? formatTokenAmount(formatEther(balance)) : '0'}
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-black/50 border-2 border-white/10 rounded-2xl px-6 py-4 text-3xl font-bold focus:outline-none transition-all"
            style={{
              borderColor: amount ? `${themeColor}40` : undefined,
              color: themeColor
            }}
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
            CRIKZ
          </div>
        </div>
      </motion.div>

      {/* Order Details */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-black/30 rounded-2xl border border-white/5"
      >
        <div>
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Info size={12} />
            Lock Duration
          </div>
          <div className="text-2xl font-black">{tierInfo.days} Days</div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Zap size={12} />
            Reputation Gain
          </div>
          <div className="text-2xl font-black" style={{ color: '#00d4ff' }}>
            {formatTokenAmount(formatEther(reputation))}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Zap size={12} />
            Expected Yield
          </div>
          <div className="text-2xl font-black" style={{ color: '#ffaa00' }}>
            {formatTokenAmount(formatEther(expectedYield))}
          </div>
        </div>
      </motion.div>

      {/* Create Button */}
      <motion.button
        variants={fadeInUp}
        onClick={handleCreate}
        disabled={!amount || isPending}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-5 rounded-2xl font-black text-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
        style={{
          background: amount ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})` : '#333',
          color: amount ? '#000' : '#666'
        }}
      >
        <span className="relative z-10">
          {isPending ? 'PROCESSING...' : 'CREATE ORDER'}
        </span>
        
        {/* Shine effect */}
        {amount && !isPending && (
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-30"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, white, transparent)'
            }}
          />
        )}
      </motion.button>
    </motion.div>
  );
}