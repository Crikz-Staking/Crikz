// src/components/learning/TokenAnalytics.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Language } from '../../App';

interface TokenAnalyticsProps {
  dynamicColor: string;
  lang: Language;
}

export default function TokenAnalytics({ dynamicColor, lang }: TokenAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('1M');
  const [dataType, setDataType] = useState<'price' | 'orders' | 'withdraws'>('price');

  const t = {
    en: { 
      perf: "Token Performance", 
      supply: "Circulating Supply", 
      cap: "Market Cap", 
      holders: "Total Holders",
      price: "Price Action",
      orders: "Production Orders",
      withdraws: "Withdrawals"
    },
    sq: { 
      perf: "Performanca e Tokenit", 
      supply: "Furnizimi në Qarkullim", 
      cap: "Kapitali i Tregut", 
      holders: "Mbajtësit Total",
      price: "Çmimi",
      orders: "Urdhërat e Prodhimit",
      withdraws: "Tërheqjet"
    }
  }[lang];

  // Mock data simulation based on selections
  const getChartData = () => {
    // Just simple variants for visual feedback
    if (dataType === 'price') return [1.2, 1.5, 1.3, 1.8, 2.4, 2.1, 2.9, 3.5, 3.2, 4.1];
    if (dataType === 'orders') return [10, 15, 25, 20, 40, 35, 50, 65, 60, 80];
    return [5, 4, 6, 8, 5, 10, 12, 8, 15, 10]; // withdraws
  };

  const data = getChartData();
  const maxVal = Math.max(...data);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (val / maxVal) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      {/* 1. Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t.supply, value: '14,230,000', icon: Activity, trend: '+2.4%' },
          { label: t.cap, value: '$42,500,000', icon: TrendingUp, trend: '+5.1%' },
          { label: t.holders, value: '1,234', icon: Users, trend: '+12' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            className="glass-card p-6 rounded-2xl border border-white/10 bg-background-elevated"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase">{stat.label}</span>
              <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                {stat.trend} <ArrowUpRight size={10} />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* 2. Interactive Chart Area */}
      <motion.div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          
          {/* Data Type Selector */}
          <div className="flex gap-2 p-1 bg-black/20 rounded-xl">
            {[
              { id: 'price', label: t.price }, 
              { id: 'orders', label: t.orders }, 
              { id: 'withdraws', label: t.withdraws }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setDataType(type.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  dataType === type.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-1">
            {['1W', '1M', '3M', '1Y', 'ALL'].map(range => (
              <button 
                key={range} 
                onClick={() => setTimeRange(range)}
                className={`w-10 h-8 rounded-lg text-xs font-bold transition-colors ${
                  timeRange === range ? 'bg-primary-500/20 text-primary-500 border border-primary-500/30' : 'bg-white/5 text-gray-500'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        {/* Chart Visualization */}
        <div className="h-72 w-full relative">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={dynamicColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={dynamicColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path 
              d={`M 0,100 L 0,${100 - (data[0]/maxVal)*100} ${points.split(' ').map((p,i) => `L ${p}`).join(' ')} L 100,100 Z`}
              fill="url(#chartGradient)"
            />
            <motion.path 
              key={dataType} // Triggers animation on change
              d={`M ${points.split(' ').join(' L ')}`}
              fill="none"
              stroke={dynamicColor}
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </svg>
          
          {/* Y-Axis Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-px bg-white/5 border-t border-dashed border-white/5" />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}