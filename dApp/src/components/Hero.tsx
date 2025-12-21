// src/components/Hero.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, Shield } from 'lucide-react';

interface HeroProps {
  themeColor: string;
}

export default function Hero({ themeColor }: HeroProps) {
  const features = [
    {
      icon: Zap,
      title: 'Fibonacci-Based Tiers',
      description: '7 production tiers with golden ratio multipliers'
    },
    {
      icon: TrendingUp,
      title: '6.182% APR Yield',
      description: 'Earn passive income on locked orders'
    },
    {
      icon: Shield,
      title: 'Reputation System',
      description: 'Build reputation through production commitments'
    },
    {
      icon: Activity,
      title: 'Time-Locked Orders',
      description: 'From 5 days to 1597 days lock periods'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[70vh] gap-8 text-center"
    >
      {/* Main Logo */}
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="relative"
      >
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center text-6xl font-black"
          style={{
            background: `linear-gradient(135deg, ${themeColor}40 0%, ${themeColor}10 100%)`,
            boxShadow: `0 0 60px ${themeColor}40, 0 0 120px ${themeColor}20`
          }}
        >
          Φ
        </div>
      </motion.div>

      {/* Heading */}
      <div className="space-y-4 max-w-3xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-black tracking-tighter"
        >
          CRIKZ
          <span
            style={{ color: themeColor }}
            className="block md:inline md:ml-4"
          >
            PROTOCOL
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-400 font-light"
        >
          Fibonacci-Powered Production Order System
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-500 max-w-2xl mx-auto"
        >
          Lock tokens in production orders, earn reputation-based yields, and participate
          in a mathematically elegant DeFi protocol built on golden ratio principles.
        </motion.p>
      </div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl mt-12"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass-card p-6 rounded-2xl border border-white/10 backdrop-blur-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <feature.icon
              size={32}
              className="mb-4 mx-auto"
              style={{ color: themeColor }}
            />
            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-400">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-8"
      >
        <p className="text-gray-400 flex items-center gap-2 text-sm">
          <Activity size={16} style={{ color: themeColor }} />
          Connect your wallet to begin
        </p>
      </motion.div>
    </motion.div>
  );
}