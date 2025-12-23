// src/components/Hero.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Shield,
  Lock
} from 'lucide-react';

interface HeroProps {
  dynamicColor: string;
}

export default function Hero({ dynamicColor }: HeroProps) {
  const features = [
    { icon: Sparkles, title: 'Fibonacci Tiers', desc: '7 production levels', color: '#FFA500' },
    { icon: TrendingUp, title: '6.182% APR', desc: 'Continuous yield', color: '#10B981' },
    { icon: Shield, title: 'Reputation System', desc: 'Build influence', color: '#A78BFA' },
    { icon: Lock, title: 'Time-Locked', desc: '5-1597 days', color: '#00D4FF' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col items-center justify-center min-h-[75vh] gap-8 text-center py-12"
    >
      {/* Phi Symbol */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1, type: 'spring' }}
        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${dynamicColor}30 0%, ${dynamicColor}10 100%)`,
          boxShadow: `0 0 60px ${dynamicColor}30`
        }}
      >
        <motion.span
          className="text-6xl sm:text-7xl font-black"
          style={{ color: dynamicColor }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Φ
        </motion.span>
      </motion.div>

      {/* Heading */}
      <div className="space-y-4 max-w-3xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-2">
            <span className="text-gradient">CRIKZ</span>
            <br />
            <span className="text-primary-500">PROTOCOL</span>
          </h1>
          
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="h-1 w-24 mx-auto rounded-full"
            style={{ background: dynamicColor }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg sm:text-xl text-gray-400 font-light"
        >
          Fibonacci-Powered Production Order System
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed"
        >
          Lock tokens in production orders, earn reputation-based yields
        </motion.p>
      </div>

      {/* Feature Cards - Compact */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl px-4"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="glass-card p-4 rounded-xl border border-white/10 group"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform"
              style={{ background: `${feature.color}20` }}
            >
              <feature.icon size={20} style={{ color: feature.color }} />
            </div>
            
            <h3 className="font-bold text-sm mb-1">{feature.title}</h3>
            <p className="text-xs text-gray-400">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}