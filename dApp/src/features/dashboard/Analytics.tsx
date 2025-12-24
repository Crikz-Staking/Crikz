import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { BarChart3, PieChart, TrendingUp, Package, Activity, Globe } from 'lucide-react';
import { ORDER_TYPES } from "@/config/index";
import { formatTokenAmount } from "@/lib/utils";
import { fadeInUp, staggerContainer } from '@/lib/animations';
import type { Order } from '@/types';
import type { Language } from '@/types';

interface AnalyticsProps {
  orders: Order[] | undefined;
  totalReputation: bigint | undefined;
  globalFund?: {
    balance: bigint;
    totalReputation: bigint;
  };
  currentAPR: number;
  dynamicColor: string;
  isUserView?: boolean;
  lang: Language;
}

export default function Analytics({
  orders,
  totalReputation,
  globalFund,
  currentAPR,
  dynamicColor,
  isUserView = false,
  lang
}: AnalyticsProps) {
  
  const t = {
      en: { 
          title: "My Performance",
          protocolTitle: "Protocol Statistics",
          locked: "My Locked",
          globalLocked: "Global TVL",
          globalRep: "Total Protocol Rep",
          avgDur: "Avg Duration",
          apr: "Current APR",
          dist: "Tier Distribution",
          noOrders: "No active orders",
          createFirst: "Create your first order to see analytics",
      },
      sq: { 
          title: "Performanca Ime",
          protocolTitle: "Statistikat e Protokollit",
          locked: "Totali i Kyçur",
          globalLocked: "TVL Globale",
          globalRep: "Reputacioni Total",
          avgDur: "Kohëzgjatja Mesatare",
          apr: "APR Aktuale",
          dist: "Shpërndarja e Niveleve",
          noOrders: "Asnjë urdhër aktiv",
          createFirst: "Krijoni urdhërin tuaj të parë për të parë analitikën",
      }
  }[lang];

  const analytics = useMemo(() => {
    // Default Empty State
    const stats = {
      userLocked: 0n,
      averageDuration: 0,
      tierDistribution: [] as { tier: string; count: number; percentage: number; color: string }[],
    };

    if (orders && orders.length > 0) {
      stats.userLocked = orders.reduce((sum, order) => sum + order.amount, 0n);
      stats.averageDuration = orders.reduce((sum, order) => sum + Number(order.duration), 0) / orders.length / 86400;

      const tierCounts = new Map<number, number>();
      orders.forEach((order) => {
        tierCounts.set(order.orderType, (tierCounts.get(order.orderType) || 0) + 1);
      });

      const colors = ['#FFA500', '#FFB733', '#00D4FF', '#10B981', '#A78BFA', '#F59E0B', '#FB7185'];
      stats.tierDistribution = Array.from(tierCounts.entries()).map(([tierIndex, count]) => ({
        tier: ORDER_TYPES[tierIndex].name,
        count,
        percentage: (count / orders.length) * 100,
        color: colors[tierIndex]
      }));
    }

    return stats;
  }, [orders]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
      
      {/* 1. Protocol Stats Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
            <Globe size={20} className="text-primary-500"/> {t.protocolTitle}
        </h2>
        <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-4 rounded-xl border border-white/10">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">{t.globalLocked}</div>
                <div className="text-2xl font-black text-white">
                    {globalFund ? formatTokenAmount(formatEther(globalFund.balance)) : '---'} <span className="text-xs text-gray-600">CRIKZ</span>
                </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-white/10">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">{t.globalRep}</div>
                <div className="text-2xl font-black text-accent-cyan">
                    {globalFund ? formatTokenAmount(formatEther(globalFund.totalReputation)) : '---'}
                </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-white/10">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">{t.apr}</div>
                <div className="text-2xl font-black text-accent-emerald">
                    {currentAPR.toFixed(3)}%
                </div>
            </div>
        </motion.div>
      </div>

      <div className="border-t border-white/5 my-4"></div>

      {/* 2. User Stats Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">{t.title}</h2>
        <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: t.locked, value: formatTokenAmount(formatEther(analytics.userLocked)), suffix: 'CRIKZ', icon: Package, color: dynamicColor },
            { label: t.avgDur, value: analytics.averageDuration.toFixed(0), suffix: lang === 'en' ? 'Days' : 'Ditë', icon: Activity, color: '#00D4FF' },
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
        <motion.div variants={fadeInUp} className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-background-elevated mt-6">
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
      </div>
    </motion.div>
  );
}