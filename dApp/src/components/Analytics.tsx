// src/components/Analytics.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { BarChart3, PieChart, TrendingUp, Package, Activity, Zap } from 'lucide-react';
import { ORDER_TYPES } from '../config';
import { formatTokenAmount } from '../utils/formatters';
import { fadeInUp, staggerContainer } from '../utils/animations';
import type { Order, ProductionFund } from '../types';

interface AnalyticsProps {
  orders: Order[] | undefined;
  totalReputation: bigint | undefined;
  productionFund: ProductionFund | undefined;
  currentAPR: number;
  dynamicColor: string;
}

export default function Analytics({
  orders,
  totalReputation,
  productionFund,
  currentAPR,
  dynamicColor
}: AnalyticsProps) {
  const analytics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalLocked: 0n,
        averageDuration: 0,
        tierDistribution: [] as { tier: string; count: number; percentage: number; color: string }[],
        reputationShare: 0
      };
    }

    const totalLocked = orders.reduce((sum, order) => sum + order.amount, 0n);
    const averageDuration = orders.reduce((sum, order) => sum + Number(order.duration), 0) / orders.length / 86400;

    // Tier distribution with colors
    const tierCounts = new Map<number, number>();
    orders.forEach((order) => {
      tierCounts.set(order.orderType, (tierCounts.get(order.orderType) || 0) + 1);
    });

    const colors = ['#FFA500', '#FFB733', '#00D4FF', '#10B981', '#A78BFA', '#F59E0B', '#FB7185'];
    const tierDistribution = Array.from(tierCounts.entries()).map(([tierIndex, count]) => ({
      tier: ORDER_TYPES[tierIndex].name,
      count,
      percentage: (count / orders.length) * 100,
      color: colors[tierIndex]
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
        <h2 className="text-3xl sm:text-4xl font-black mb-2 text-white">
          Analytics Dashboard
        </h2>
        <p className="text-sm text-gray-300">Your production performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Locked',
            value: formatTokenAmount(formatEther(analytics.totalLocked)),
            suffix: 'CRIKZ',
            icon: Package,
            color: dynamicColor
          },
          {
            label: 'Avg Duration',
            value: analytics.averageDuration.toFixed(0),
            suffix: 'Days',
            icon: Activity,
            color: '#00D4FF'
          },
          {
            label: 'Rep Share',
            value: analytics.reputationShare.toFixed(2),
            suffix: '%',
            icon: PieChart,
            color: '#A78BFA'
          },
          {
            label: 'APR',
            value: currentAPR.toFixed(3),
            suffix: '%',
            icon: TrendingUp,
            color: '#10B981'
          }
        ].map((metric) => (
          <motion.div
            key={metric.label}
            whileHover={{ scale: 1.05, y: -4 }}
            className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group bg-background-elevated"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                  style={{
                    background: `${metric.color}15`,
                    boxShadow: `0 0 20px ${metric.color}10`,
                    border: `1px solid ${metric.color}30`
                  }}
                >
                  <metric.icon size={24} style={{ color: metric.color }} strokeWidth={2.5} />
                </div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {metric.label}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black" style={{ color: metric.color }}>
                  {metric.value}
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  {metric.suffix}
                </div>
              </div>
            </div>
            <motion.div
              className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10"
              style={{ background: metric.color }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Tier Distribution */}
      <motion.div
        variants={fadeInUp}
        className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-background-elevated"
      >
        <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-white">
          <PieChart size={24} style={{ color: dynamicColor }} strokeWidth={2.5} />
          Tier Distribution
        </h3>

        {analytics.tierDistribution.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BarChart3 size={60} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold mb-2 text-white">No orders to analyze</p>
            <p className="text-sm">Create your first order to see analytics</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics.tierDistribution.map((item, index) => (
              <motion.div
                key={item.tier}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold flex items-center gap-2 text-gray-200">
                    <div 
                      className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                      style={{ background: item.color, color: item.color }}
                    />
                    {item.tier}
                  </span>
                  <span className="text-gray-400 font-mono">
                    {item.count} order{item.count !== 1 ? 's' : ''} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>

                <div className="h-3 bg-background-surface rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full rounded-full relative overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                    style={{ background: item.color }}
                  >
                    <motion.div
                      className="absolute inset-0 opacity-50"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                      style={{
                        background: 'linear-gradient(90deg, transparent, white, transparent)'
                      }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Production Fund Status */}
      {productionFund && (
        <motion.div
          variants={fadeInUp}
          className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-background-elevated"
        >
          <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-white">
            <Zap size={24} style={{ color: dynamicColor }} strokeWidth={2.5} />
            Global Production Fund
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-background-surface rounded-xl border border-white/5">
              <div className="text-sm text-gray-400 mb-3 uppercase tracking-wider font-bold">Fund Balance</div>
              <div className="text-4xl font-black mb-2" style={{ color: dynamicColor }}>
                {formatTokenAmount(formatEther(productionFund.balance))}
              </div>
              <div className="text-xs text-gray-500">Total CRIKZ currently available for yield distribution</div>
            </div>

            <div className="p-6 bg-background-surface rounded-xl border border-white/5">
              <div className="text-sm text-gray-400 mb-3 uppercase tracking-wider font-bold">System Reputation</div>
              <div className="text-4xl font-black text-accent-cyan mb-2">
                {formatTokenAmount(formatEther(productionFund.totalReputation))}
              </div>
              <div className="text-xs text-gray-500">Total reputation score across all protocol users</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}