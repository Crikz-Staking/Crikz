// src/components/StatsPanel.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'viem';
import {
  Wallet,
  Award,
  TrendingUp,
  Package,
  Percent,
  Zap
} from 'lucide-react';
import { formatTokenAmount } from '../utils/formatters';

interface StatsPanelProps {
  balance: bigint | undefined;
  totalReputation: bigint | undefined;
  pendingYield: bigint;
  activeOrdersCount: number;
  currentAPR: number;
  onClaimYield: () => void;
  isPending: boolean;
  dynamicColor: string;
  isLoading: boolean;
}

export default function StatsPanel({
  balance,
  totalReputation,
  pendingYield,
  activeOrdersCount,
  currentAPR,
  onClaimYield,
  isPending,
  dynamicColor,
  isLoading
}: StatsPanelProps) {
  
  const stats = [
    {
      label: 'Balance',
      value: balance ? formatEther(balance) : '0',
      icon: Wallet,
      color: dynamicColor,
      suffix: 'CRIKZ'
    },
    {
      label: 'Reputation',
      value: totalReputation ? formatEther(totalReputation) : '0',
      icon: Award,
      color: '#00D4FF',
      suffix: 'REP'
    },
    {
      label: 'Pending Yield',
      value: formatEther(pendingYield),
      icon: TrendingUp,
      color: '#10B981',
      suffix: 'CRIKZ',
      isYield: true
    },
    {
      label: 'Active Orders',
      value: activeOrdersCount.toString(),
      icon: Package,
      color: '#A78BFA',
      suffix: ''
    },
    {
      label: 'APR',
      value: currentAPR.toFixed(3),
      icon: Percent,
      color: '#F59E0B',
      suffix: '%'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass-card p-4 rounded-xl border border-white/10 relative overflow-hidden group cursor-pointer"
        >
          {/* Content */}
          <div className="relative z-10">
            {/* Icon & Label */}
            <div className="flex items-center justify-between mb-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ 
                  background: `${stat.color}20`,
                  boxShadow: `0 0 15px ${stat.color}15`
                }}
              >
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>

            {/* Value */}
            {isLoading ? (
              <div className="h-8 w-full bg-white/5 animate-pulse rounded-lg" />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={stat.value}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-baseline gap-1.5"
                >
                  <span 
                    className="text-2xl font-black tracking-tighter truncate"
                    style={{ color: stat.color }}
                  >
                    {parseFloat(stat.value) > 1000 
                      ? formatTokenAmount(stat.value, 2)
                      : parseFloat(stat.value).toFixed(2)
                    }
                  </span>
                  {stat.suffix && (
                    <span className="text-[8px] font-bold text-gray-600 font-mono">
                      {stat.suffix}
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Yield Claim */}
            {stat.isYield && pendingYield > 0n && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClaimYield}
                disabled={isPending}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all disabled:opacity-50"
                style={{
                  background: `${stat.color}20`,
                  color: stat.color,
                  border: `1px solid ${stat.color}40`
                }}
              >
                <Zap size={10} />
                CLAIM
              </motion.button>
            )}
          </div>

          {/* Hover Glow */}
          <motion.div
            className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity"
            style={{ background: stat.color }}
          />
        </motion.div>
      ))}
    </div>
  );
}