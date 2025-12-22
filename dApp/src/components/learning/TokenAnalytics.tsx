// src/components/learning/TokenAnalytics.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Users, Clock, Calendar } from 'lucide-react';
import { formatTokenAmount } from '../../utils/formatters';

interface TokenAnalyticsProps {
  dynamicColor: string;
}

export default function TokenAnalytics({ dynamicColor }: TokenAnalyticsProps) {
  // Mock Data for the chart
  const priceHistory = [1.2, 1.5, 1.3, 1.8, 2.4, 2.1, 2.9, 3.5, 3.2, 4.1];
  const maxPrice = Math.max(...priceHistory);
  
  // Create SVG path for the chart
  const points = priceHistory.map((price, i) => {
    const x = (i / (priceHistory.length - 1)) * 100;
    const y = 100 - (price / maxPrice) * 100;
    return `${x},${y}`;
  }).join(' ');

  const events = [
    { date: '2023-11-01', title: 'Genesis Block', desc: 'Protocol deployed on BSC Testnet', type: 'milestone' },
    { date: '2024-01-15', title: 'Liquidity Locked', desc: 'Initial LP tokens burned', type: 'security' },
    { date: '2024-03-20', title: 'V2 Upgrade', desc: 'Introduced Fibonacci Tiers', type: 'upgrade' },
    { date: '2024-06-12', title: 'Community Governance', desc: 'DAO voting enabled', type: 'governance' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Circulating Supply', value: '14,230,000', icon: Activity },
          { label: 'Market Cap', value: '$42,500,000', icon: TrendingUp },
          { label: 'Total Holders', value: '1,234', icon: Users },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl border border-white/10 bg-background-elevated"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase">{stat.label}</span>
              <stat.icon size={16} style={{ color: dynamicColor }} />
            </div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* 2. Price Chart Area */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={20} style={{ color: dynamicColor }} />
            Performance History
          </h3>
          <div className="flex gap-2">
            {['1D', '1W', '1M', '1Y', 'ALL'].map(t => (
              <button key={t} className="px-3 py-1 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>
        
        {/* Simple SVG Chart */}
        <div className="h-64 w-full relative">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {/* Gradient Def */}
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={dynamicColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={dynamicColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area */}
            <path 
              d={`M 0,100 L 0,${100 - (priceHistory[0]/maxPrice)*100} ${points.split(' ').map((p,i) => `L ${p}`).join(' ')} L 100,100 Z`}
              fill="url(#chartGradient)"
            />
            
            {/* Line */}
            <motion.path 
              d={`M ${points.split(' ').join(' L ')}`}
              fill="none"
              stroke={dynamicColor}
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </svg>
          
          {/* Y-Axis Labels (Simulated) */}
          <div className="absolute top-0 right-0 h-full flex flex-col justify-between text-[10px] text-gray-500 py-2">
            <span>$4.50</span>
            <span>$2.25</span>
            <span>$0.00</span>
          </div>
        </div>
      </motion.div>

      {/* 3. Historical Timeline */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Clock size={20} style={{ color: dynamicColor }} />
          Protocol Timeline
        </h3>
        
        <div className="relative border-l-2 border-white/10 ml-3 space-y-8 py-2">
          {events.map((event, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (index * 0.1) }}
              className="relative pl-8"
            >
              {/* Dot */}
              <div 
                className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-background"
                style={{ background: dynamicColor }}
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">{event.title}</span>
                <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                  <Calendar size={12} /> {event.date}
                </span>
              </div>
              <p className="text-sm text-gray-400">{event.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}