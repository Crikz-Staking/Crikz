import React from 'react';
import { motion } from 'framer-motion';
import { Info, ShieldCheck, Zap, Globe, Cpu, Layers } from 'lucide-react';

export default function About({ dynamicColor }: { dynamicColor: string }) {
  const features = [
    {
      icon: Zap,
      title: "Fibonacci Production",
      desc: "A unique staking mechanism based on the Golden Ratio (φ). Lock tokens for Fibonacci-sequence durations to earn yield and algorithmic reputation."
    },
    {
      icon: Layers,
      title: "Algorithmic Reputation",
      desc: "Reputation is not bought, it is earned. Your on-chain actions, production history, and contribution longevity determine your protocol weight."
    },
    {
      icon: Globe,
      title: "Decentralized Media",
      desc: "Censorship-resistant content distribution via IPFS. Publish audio and video content that lives forever on the blockchain."
    },
    {
      icon: Cpu,
      title: "Neural Governance",
      desc: "The Crikzling AI acts as a protocol architect, analyzing data and assisting users, bridging the gap between complex DeFi and human intent."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-primary-500 mb-4"
        >
          <Info size={16} /> Protocol Manifesto
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tight"
        >
          CRIKZ <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-amber-700">PROTOCOL</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          An experimental decentralized application built on BSC Testnet, merging mathematical precision with gamified finance.
        </motion.p>
      </div>

      {/* Mission Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated hover:border-primary-500/30 transition-colors group"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <feat.icon size={28} style={{ color: dynamicColor }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
            <p className="text-gray-400 leading-relaxed text-sm">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Technical Specs */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="glass-card p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-background-elevated to-black/50"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
              <ShieldCheck className="text-emerald-500" /> Verified Architecture
            </h3>
            <p className="text-gray-400 text-sm max-w-md">
              The protocol operates on the Binance Smart Chain (Testnet). All contracts are verified, open-source, and designed with standard security patterns (ReentrancyGuard, Ownable).
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-3xl font-black text-white">BSC</div>
              <div className="text-xs font-bold text-gray-500 uppercase">Network</div>
            </div>
            <div className="w-px bg-white/10 h-12" />
            <div className="text-center">
              <div className="text-3xl font-black text-white">97</div>
              <div className="text-xs font-bold text-gray-500 uppercase">Chain ID</div>
            </div>
            <div className="w-px bg-white/10 h-12" />
            <div className="text-center">
              <div className="text-3xl font-black text-white">v2.2</div>
              <div className="text-xs font-bold text-gray-500 uppercase">Version</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="text-center text-xs text-gray-600 font-mono pt-10 pb-20">
        Designed & Engineered by the Crikz Team. © 2025.
      </div>
    </div>
  );
}