// src/components/TierCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Award } from 'lucide-react';
import type { TierInfo } from '../types';

interface TierCardProps {
  tier: TierInfo;
  isSelected: boolean;
  onClick: () => void;
  themeColor: string;
}

export default function TierCard({ tier, isSelected, onClick, themeColor }: TierCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer p-4 rounded-xl border-2 transition-all relative overflow-hidden group"
      style={{
        background: isSelected ? `${themeColor}15` : 'rgba(0, 0, 0, 0.3)',
        borderColor: isSelected ? themeColor : 'rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Background Glow */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            background: `radial-gradient(circle, ${themeColor} 0%, transparent 70%)`
          }}
        />
      )}

      <div className="relative z-10 space-y-3">
        {/* Duration */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          <span>{tier.days} Days</span>
        </div>

        {/* Name */}
        <div className="text-lg font-black">{tier.name}</div>

        {/* Multiplier */}
        <div className="flex items-center gap-2">
          <Award size={14} style={{ color: themeColor }} />
          <span className="text-sm font-bold" style={{ color: themeColor }}>
            {tier.multiplier}x REP
          </span>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            layoutId="selectedTier"
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ background: themeColor }}
          />
        )}
      </div>
    </motion.div>
  );
}