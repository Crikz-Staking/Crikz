// src/components/ProductionFund.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatEther, parseEther } from 'viem';
import { Droplets, TrendingUp, Users, Info, Sparkles, AlertCircle } from 'lucide-react';
import { formatTokenAmount } from '../utils/formatters';
import { fadeInUp, staggerContainer } from '../utils/animations';
import type { ProductionFund as ProductionFundType } from '../types';

interface ProductionFundProps {
  productionFund: ProductionFundType | undefined;
  onFundPool: (amount: string) => void;
  isPending: boolean;
  dynamicColor: string;
}

export default function ProductionFund({
  productionFund,
  onFundPool,
  isPending,
  dynamicColor
}: ProductionFundProps) {
  const [fundAmount, setFundAmount] = useState('');

  const handleFund = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) return;
    onFundPool(fundAmount);
    setFundAmount('');
  };

  const isValidAmount = fundAmount && parseFloat(fundAmount) > 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-8"
    >
      {/* Header */}
      <div>
        <h2 className="text-3xl sm:text-4xl font-black mb-2 text-gradient">
          Production Fund
        </h2>
        <p className="text-sm text-gray-400">
          Fund the production pool to generate yields for all reputation holders
        </p>
      </div>

      {/* Fund Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="p-6 bg-background-elevated rounded-2xl border border-white/10 relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{
                  background: `${dynamicColor}20`,
                  boxShadow: `0 0 20px ${dynamicColor}20`
                }}
              >
                <Droplets size={28} style={{ color: dynamicColor }} />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fund Balance</div>
                <div className="text-3xl font-black" style={{ color: dynamicColor }}>
                  {productionFund ? formatTokenAmount(formatEther(productionFund.balance)) : '0'}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">Available for distribution</div>
          </div>
          
          <motion.div
            className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20"
            style={{ background: dynamicColor }}
          />
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="p-6 bg-background-elevated rounded-2xl border border-white/10 relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-accent-cyan/20 transition-all group-hover:scale-110">
                <Users size={28} className="text-accent-cyan" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Reputation</div>
                <div className="text-3xl font-black text-accent-cyan">
                  {productionFund ? formatTokenAmount(formatEther(productionFund.totalReputation)) : '0'}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">System-wide reputation</div>
          </div>
          
          <motion.div
            className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-accent-cyan blur-3xl opacity-0 group-hover:opacity-20"
          />
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="p-6 bg-background-elevated rounded-2xl border border-white/10 relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-accent-emerald/20 transition-all group-hover:scale-110">
                <TrendingUp size={28} className="text-accent-emerald" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">APR</div>
                <div className="text-3xl font-black text-accent-emerald">6.182%</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">Annual percentage rate</div>
          </div>
          
          <motion.div
            className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-accent-emerald blur-3xl opacity-0 group-hover:opacity-20"
          />
        </motion.div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        variants={fadeInUp}
        className="p-6 bg-accent-cyan/10 border border-accent-cyan/30 rounded-2xl"
      >
        <div className="flex items-start gap-3">
          <Info size={20} className="text-accent-cyan flex-shrink-0 mt-1" />
          <div className="text-sm text-accent-cyan/90">
            <p className="font-bold mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              How Production Fund Works
            </p>
            <ul className="space-y-2 list-disc list-inside text-accent-cyan/80">
              <li>Funding increases the total yield pool for all participants</li>
              <li>Yields are distributed proportionally based on reputation</li>
              <li>The fund generates 6.182% APR continuously (Fibonacci-aligned)</li>
              <li>Higher reputation = larger share of generated yields</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Fund Input */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Droplets size={14} />
          Fund Amount (CRIKZ)
        </label>

        <div className="relative group">
          <input
            type="text"
            value={fundAmount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setFundAmount(val);
              }
            }}
            placeholder="0.00"
            className="w-full bg-background-surface border-2 transition-all rounded-2xl px-6 py-5 text-4xl font-black focus:outline-none"
            style={{
              borderColor: fundAmount ? `${dynamicColor}60` : 'rgba(255, 255, 255, 0.1)',
              color: isValidAmount ? dynamicColor : fundAmount ? '#EF4444' : '#666',
              boxShadow: fundAmount ? `0 0 40px ${dynamicColor}20` : 'none'
            }}
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-bold">
            CRIKZ
          </div>

          {fundAmount && !isValidAmount && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-6 left-0 flex items-center gap-2 text-xs text-error"
            >
              <AlertCircle size={12} />
              <span>Invalid amount</span>
            </motion.div>
          )}
        </div>

        <motion.button
          onClick={handleFund}
          disabled={!isValidAmount || isPending}
          whileHover={isValidAmount ? { scale: 1.02 } : {}}
          whileTap={isValidAmount ? { scale: 0.98 } : {}}
          className="w-full py-6 rounded-2xl font-black text-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
          style={{
            background: isValidAmount
              ? `linear-gradient(135deg, ${dynamicColor} 0%, ${dynamicColor}CC 100%)`
              : '#333',
            color: isValidAmount ? '#000' : '#666',
            boxShadow: isValidAmount ? `0 10px 40px ${dynamicColor}40` : 'none'
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Droplets size={20} />
                </motion.div>
                PROCESSING...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                FUND PRODUCTION POOL
              </>
            )}
          </span>

          {isValidAmount && !isPending && (
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-30"
              animate={{
                x: ['-200%', '200%']
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
    </motion.div>
  );
}