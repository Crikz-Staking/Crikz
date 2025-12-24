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
import { formatTokenAmount } from '@/lib/utils';

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
      color: '#22d3ee', // Cyan
      suffix: 'REP'
    },
    {
      label: 'Pending Yield',
      value: formatEther(pendingYield),
      icon: TrendingUp,
      color: '#10B981', // Emerald
      suffix: 'CRIKZ',
      isYield: true
    },
    {
      label: 'Active Orders',
      value: activeOrdersCount.toString(),
      icon: Package,
      color: '#A78BFA', // Purple
      suffix: ''
    },
    {
      label: 'APR',
      value: currentAPR.toFixed(3),
      icon: Percent,
      color: '#F472B6', // Pink
      suffix: '%'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass-card p-5 rounded-2xl border border-white/10 relative overflow-hidden group cursor-pointer bg-background-elevated/50"
        >
          {/* Content */}
          <div className="relative z-10">
            {/* Icon & Label */}
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ 
                  background: `${stat.color}15`,
                  border: `1px solid ${stat.color}30`,
                  boxShadow: `0 0 20px ${stat.color}10`
                }}
              >
                <stat.icon size={20} style={{ color: stat.color }} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md">
                {stat.label}
              </span>
            </div>

            {/* Value */}
            {isLoading ? (
              <div className="h-8 w-3/4 bg-white/10 animate-pulse rounded-lg" />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={stat.value}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-baseline gap-1.5"
                >
                  <span 
                    className="text-2xl font-black tracking-tight truncate text-white"
                  >
                    {parseFloat(stat.value) > 1000 
                      ? formatTokenAmount(stat.value, 2)
                      : parseFloat(stat.value).toFixed(2)
                    }
                  </span>
                  {stat.suffix && (
                    <span className="text-[10px] font-bold text-gray-400 font-mono">
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
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}40)`,
                  color: '#fff',
                  border: `1px solid ${stat.color}50`
                }}
              >
                <Zap size={12} fill="currentColor" />
                CLAIM REWARDS
              </motion.button>
            )}
          </div>

          {/* Hover Glow */}
          <motion.div
            className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
            style={{ background: stat.color }}
          />
        </motion.div>
      ))}
    </div>
  );
}