// src/components/TierCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Award, CheckCircle } from 'lucide-react';
// FIX: Correct import path
import type { TierInfo } from '@/types';

interface TierCardProps {
  tier: TierInfo;
  isSelected: boolean;
  onClick: () => void;
  dynamicColor: string;
}

export default function TierCard({ tier, isSelected, onClick, dynamicColor }: TierCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer p-4 rounded-xl border-2 transition-all relative overflow-hidden group"
      style={{
        background: isSelected ? `${dynamicColor}15` : 'rgba(26, 26, 36, 0.4)',
        borderColor: isSelected ? dynamicColor : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isSelected ? `0 0 30px ${dynamicColor}30, 0 8px 16px rgba(0,0,0,0.3)` : 'none'
      }}
    >
      {/* Glow Effect */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 opacity-20 blur-xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            background: `radial-gradient(circle, ${dynamicColor} 0%, transparent 70%)`
          }}
        />
      )}

      <div className="relative z-10 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
            Tier {tier.index}
          </div>
          
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <CheckCircle size={14} style={{ color: dynamicColor }} />
            </motion.div>
          )}
        </div>

        {/* Name */}
        <div className="text-base font-black leading-tight" style={{ color: isSelected ? dynamicColor : undefined }}>
          {tier.name}
        </div>

        {/* Stats */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock size={10} />
            <span>{tier.days}d</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: isSelected ? dynamicColor : '#888' }}>
            <Award size={10} />
            <span className="font-bold">{tier.multiplier}x</span>
          </div>
        </div>

        {/* Progress Bar (Selected) */}
        {isSelected && (
          <motion.div
            layoutId="selectedTier"
            className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
            style={{ background: dynamicColor }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
    </motion.div>
  );
}