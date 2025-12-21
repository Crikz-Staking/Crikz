// src/components/StatsPanel.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import {
  Wallet,
  Award,
  TrendingUp,
  Package,
  Percent,
  Zap
} from 'lucide-react';

interface StatsPanelProps {
  balance: bigint | undefined;
  totalReputation: bigint | undefined;
  pendingYield: bigint;
  activeOrdersCount: number;
  currentAPR: number;
  onClaimYield: () => void;
  isPending: boolean;
  themeColor: string;
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
  themeColor,
  isLoading
}: StatsPanelProps) {
  
  const stats = [
    {
      label: 'Balance',
      value: balance ? formatEther(balance) : '0',
      icon: Wallet,
      color: themeColor,
      suffix: 'CRIKZ'
    },
    {
      label: 'Reputation',
      value: totalReputation ? formatEther(totalReputation) : '0',
      icon: Award,
      color: '#38bdf8', // Light Blue
      suffix: 'REP'
    },
    {
      label: 'Pending Yield',
      value: formatEther(pendingYield),
      icon: TrendingUp,
      color: '#fbbf24', // Amber
      suffix: 'CRIKZ',
      isYield: true
    },
    {
      label: 'Active Orders',
      value: activeOrdersCount.toString(),
      icon: Package,
      color: '#e879f9', // Purple
      suffix: 'ORDERS'
    },
    {
      label: 'Current APR',
      value: currentAPR.toFixed(3),
      icon: Percent,
      color: '#4ade80', // Green
      suffix: '%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass-card p-6 relative overflow-hidden group transition-all duration-300"
        >
          {/* Header: Label & Icon */}
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              {stat.label}
            </span>
            <div 
              className="p-2 rounded-lg bg-white/5 backdrop-blur-sm transition-colors group-hover:bg-white/10"
              style={{ color: stat.color }}
            >
              <stat.icon size={16} />
            </div>
          </div>

          {/* Body: Value */}
          <div className="relative z-10">
            {isLoading ? (
              <div className="h-10 w-24 bg-white/5 animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tighter text-white">
                  {parseFloat(stat.value) > 1000 
                    ? (parseFloat(stat.value) / 1000).toFixed(2) + 'k'
                    : parseFloat(stat.value).toFixed(2)
                  }
                </span>
                <span className="text-[10px] font-bold text-gray-500 font-mono mt-1">
                  {stat.suffix}
                </span>
              </div>
            )}
          </div>

          {/* Conditional Footer: Yield Claim */}
          {stat.isYield && (
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                 <span className="text-xs text-amber-400/80 font-medium">Accumulating</span>
               </div>
               
               {pendingYield > 0n && (
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={onClaimYield}
                   disabled={isPending}
                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all border border-amber-500/20"
                 >
                   <Zap size={10} />
                   CLAIM
                 </motion.button>
               )}
            </div>
          )}

          {/* Decorative Gradient Glow */}
          <div
            className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
            style={{ background: stat.color }}
          />
        </motion.div>
      ))}
    </div>
  );
}