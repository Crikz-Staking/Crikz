// src/components/ProductionFund.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { Droplets, TrendingUp, Users, Info } from 'lucide-react';
import { formatTokenAmount } from '../utils/formatters';
import { fadeInUp, staggerContainer } from '../utils/animations';
import type { ProductionFund as ProductionFundType } from '../types';

interface ProductionFundProps {
  productionFund: ProductionFundType | undefined;
  onFundPool: (amount: string) => void;
  isPending: boolean;
  themeColor: string;
  gradientColors: { from: string; to: string };
}

export default function ProductionFund({
  productionFund,
  onFundPool,
  isPending,
  themeColor,
  gradientColors
}: ProductionFundProps) {
  const [fundAmount, setFundAmount] = useState('');

  const handleFund = () => {
    onFundPool(fundAmount);
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
        <h2 className="text-3xl font-black mb-2">Production Fund</h2>
        <p className="text-gray-400 text-sm">
          Fund the production pool to generate yields for all reputation holders
        </p>
      </div>

      {/* Fund Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-black/40 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `${themeColor}20`,
                color: themeColor
              }}
            >
              <Droplets size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-400">Fund Balance</div>
              <div className="text-2xl font-black" style={{ color: themeColor }}>
                {productionFund ? formatTokenAmount(formatEther(productionFund.balance)) : '0'}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">Available for distribution</div>
        </div>

        <div className="p-6 bg-black/40 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/20 text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-400">Total Reputation</div>
              <div className="text-2xl font-black text-blue-400">
                {productionFund ? formatTokenAmount(formatEther(productionFund.totalReputation)) : '0'}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">System-wide reputation</div>
        </div>

        <div className="p-6 bg-black/40 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500/20 text-green-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-400">APR</div>
              <div className="text-2xl font-black text-green-400">6.182%</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">Annual percentage rate</div>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        variants={fadeInUp}
        className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl"
      >
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-400 flex-shrink-0 mt-1" />
          <div className="text-sm text-blue-200">
            <p className="font-bold mb-2">How Production Fund Works</p>
            <ul className="space-y-1 text-blue-300/80 list-disc list-inside">
              <li>Funding increases the total yield pool for all participants</li>
              <li>Yields are distributed proportionally based on reputation</li>
              <li>The fund generates 6.182% APR continuously</li>
              <li>Higher reputation = larger share of generated yields</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Fund Input */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Fund Amount (CRIKZ)
        </label>

        <div className="relative">
          <input
            type="text"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-black/50 border-2 border-white/10 rounded-2xl px-6 py-4 text-3xl font-bold focus:outline-none transition-all"
            style={{
              borderColor: fundAmount ? `${themeColor}40` : undefined,
              color: themeColor
            }}
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
            CRIKZ
          </div>
        </div>

        <motion.button
          onClick={handleFund}
          disabled={!fundAmount || isPending}
          whileHover={{ scale: fundAmount ? 1.02 : 1 }}
          whileTap={{ scale: fundAmount ? 0.98 : 1 }}
          className="w-full py-5 rounded-2xl font-black text-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={{
            background: fundAmount
              ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
              : '#333',
            color: fundAmount ? '#000' : '#666'
          }}
        >
          {isPending ? 'PROCESSING...' : 'FUND PRODUCTION POOL'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}