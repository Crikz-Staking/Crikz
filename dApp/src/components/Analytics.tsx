// src/components/Analytics.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { BarChart3, PieChart, TrendingUp, Package, Activity, Zap, History } from 'lucide-react';
import { ORDER_TYPES } from '../config';
import { formatTokenAmount } from '../utils/formatters';
import { fadeInUp, staggerContainer } from '../utils/animations';
import type { Order, ProductionFund } from '../types';
import type { Language } from '../App';

interface AnalyticsProps {
  orders: Order[] | undefined;
  totalReputation: bigint | undefined;
  productionFund: ProductionFund | undefined;
  currentAPR: number;
  dynamicColor: string;
  isUserView?: boolean;
  lang: Language;
}

export default function Analytics({
  orders,
  totalReputation,
  productionFund,
  currentAPR,
  dynamicColor,
  isUserView = false,
  lang
}: AnalyticsProps) {
  
  const t = {
      en: { 
          title: isUserView ? "My Performance" : "Protocol Analytics",
          locked: "Total Locked",
          avgDur: "Avg Duration",
          repShare: "Rep Share",
          apr: "Current APR",
          dist: "Tier Distribution",
          noOrders: "No active orders",
          createFirst: "Create your first order to see analytics",
          history: "Recent Activity",
          fundBal: "Fund Balance",
          sysRep: "System Reputation"
      },
      sq: { 
          title: isUserView ? "Performanca Ime" : "Analitika e Protokollit",
          locked: "Totali i Kyçur",
          avgDur: "Kohëzgjatja Mesatare",
          repShare: "Pjesa e Reputacionit",
          apr: "APR Aktuale",
          dist: "Shpërndarja e Niveleve",
          noOrders: "Asnjë urdhër aktiv",
          createFirst: "Krijoni urdhërin tuaj të parë për të parë analitikën",
          history: "Aktiviteti i Fundit",
          fundBal: "Balanca e Fondit",
          sysRep: "Reputacioni i Sistemit"
      }
  }[lang];

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
      <div>
        <h2 className="text-3xl sm:text-4xl font-black mb-2 text-white">{t.title}</h2>
      </div>

      {/* User Metrics */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.locked, value: formatTokenAmount(formatEther(analytics.totalLocked)), suffix: 'CRIKZ', icon: Package, color: dynamicColor },
          { label: t.avgDur, value: analytics.averageDuration.toFixed(0), suffix: lang === 'en' ? 'Days' : 'Ditë', icon: Activity, color: '#00D4FF' },
          { label: t.repShare, value: analytics.reputationShare.toFixed(2), suffix: '%', icon: PieChart, color: '#A78BFA' },
          { label: t.apr, value: currentAPR.toFixed(3), suffix: '%', icon: TrendingUp, color: '#10B981' }
        ].map((metric) => (
          <motion.div
            key={metric.label}
            whileHover={{ scale: 1.05, y: -4 }}
            className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group bg-background-elevated"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${metric.color}15`, border: `1px solid ${metric.color}30` }}>
                  <metric.icon size={24} style={{ color: metric.color }} strokeWidth={2.5} />
                </div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{metric.label}</div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black" style={{ color: metric.color }}>{metric.value}</div>
                <div className="text-xs text-gray-500 font-mono">{metric.suffix}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tier Distribution Chart */}
      <motion.div variants={fadeInUp} className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-background-elevated">
        <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-white">
          <PieChart size={24} style={{ color: dynamicColor }} strokeWidth={2.5} />
          {t.dist}
        </h3>

        {analytics.tierDistribution.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BarChart3 size={60} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold mb-2 text-white">{t.noOrders}</p>
            <p className="text-sm">{t.createFirst}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics.tierDistribution.map((item, index) => (
              <motion.div key={item.tier} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold flex items-center gap-2 text-gray-200">
                    <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ background: item.color, color: item.color }} />
                    {item.tier}
                  </span>
                  <span className="text-gray-400 font-mono">{item.count} order(s) ({item.percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-3 bg-background-surface rounded-full overflow-hidden border border-white/5">
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} style={{ background: item.color }} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Global Stats - Hidden in User View */}
      {!isUserView && productionFund && (
        <motion.div variants={fadeInUp} className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-background-elevated">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-white">
            <Zap size={24} style={{ color: dynamicColor }} strokeWidth={2.5} />
            Global Production Fund
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             {/* Global stats render here if needed later */}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}