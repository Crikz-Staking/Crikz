// src/components/Analytics.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { BarChart3, PieChart, TrendingUp, Package } from 'lucide-react';
import { ORDER_TYPES } from '../config';
import { formatTokenAmount } from '../utils/formatters';
import { fadeInUp, staggerContainer } from '../utils/animations';
import type { Order, ProductionFund } from '../types';

interface AnalyticsProps {
  orders: Order[] | undefined;
  totalReputation: bigint | undefined;
  productionFund: ProductionFund | undefined;
  currentAPR: number;
  themeColor: string;
}

export default function Analytics({
  orders,
  totalReputation,
  productionFund,
  currentAPR,
  themeColor
}: AnalyticsProps) {
  const analytics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalLocked: 0n,
        averageDuration: 0,
        tierDistribution: [] as { tier: string; count: number; percentage: number }[],
        reputationShare: 0
      };
    }

    const totalLocked = orders.reduce((sum, order) => sum + order.amount, 0n);
    const averageDuration = orders.reduce((sum, order) => sum + Number(order.duration), 0) / orders.length / 86400;

    // Tier distribution
    const tierCounts = new Map<number, number>();
    orders.forEach((order) => {
      tierCounts.set(order.orderType, (tierCounts.get(order.orderType) || 0) + 1);
    });

    const tierDistribution = Array.from(tierCounts.entries()).map(([tierIndex, count]) => ({
      tier: ORDER_TYPES[tierIndex].name,
      count,
      percentage: (count / orders.length) * 100
    }));

    // Reputation share
    const myReputation = totalReputation ? Number(formatEther(totalReputation)) : 0;
    const totalSystemReputation = productionFund ? Number(formatEther(productionFund.totalReputation)) : 0;
    const reputationShare = totalSystemReputation > 0 ? (myReputation / totalSystemReputation) * 100 : 0;

    return {
      totalLocked,
      averageDuration,
      tierDistribution,
      reputationShare
    };
  }, [orders, totalReputation, productionFund]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black mb-2">Analytics Dashboard</h2>
        <p className="text-gray-400 text-sm">Your production performance metrics</p>
      </div>

      {/* Key Metrics */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <Package size={20} style={{ color: themeColor }} />
            <div className="text-xs text-gray-400 uppercase">Total Locked</div>
          </div>
          <div className="text-3xl font-black" style={{ color: themeColor }}>
            {formatTokenAmount(formatEther(analytics.totalLocked))}
          </div>
          <div className="text-xs text-gray-500 mt-1">CRIKZ</div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 size={20} className="text-blue-400" />
            <div className="text-xs text-gray-400 uppercase">Avg Duration</div>
          </div>
          <div className="text-3xl font-black text-blue-400">
            {analytics.averageDuration.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Days</div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <PieChart size={20} className="text-purple-400" />
            <div className="text-xs text-gray-400 uppercase">Rep Share</div>
          </div>
          <div className="text-3xl font-black text-purple-400">
            {analytics.reputationShare.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Of total</div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp size={20} className="text-green-400" />
            <div className="text-xs text-gray-400 uppercase">APR</div>
          </div>
          <div className="text-3xl font-black text-green-400">{currentAPR.toFixed(3)}%</div>
          <div className="text-xs text-gray-500 mt-1">Annual</div>
        </div>
      </motion.div>

      {/* Tier Distribution */}
      <motion.div
        variants={fadeInUp}
        className="glass-card p-6 md:p-8 rounded-3xl border border-white/10"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PieChart size={20} style={{ color: themeColor }} />
          Tier Distribution
        </h3>

        {analytics.tierDistribution.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No orders to analyze</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics.tierDistribution.map((item, index) => (
              <div key={item.tier} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{item.tier}</span>
                  <span className="text-gray-400">
                    {item.count} order{item.count !== 1 ? 's' : ''} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    style={{
                      background: `hsl(${(index * 60) % 360}, 70%, 50%)`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Production Fund Status */}
      {productionFund && (
        <motion.div
          variants={fadeInUp}
          className="glass-card p-6 md:p-8 rounded-3xl border border-white/10"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} style={{ color: themeColor }} />
            Production Fund Status
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-2">Fund Balance</div>
              <div className="text-3xl font-black" style={{ color: themeColor }}>
                {formatTokenAmount(formatEther(productionFund.balance))} CRIKZ
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-2">Total System Reputation</div>
              <div className="text-3xl font-black text-blue-400">
                {formatTokenAmount(formatEther(productionFund.totalReputation))} REP
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}