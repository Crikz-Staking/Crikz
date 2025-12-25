import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Award, CheckCircle } from 'lucide-react';
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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative overflow-hidden group flex flex-col justify-between min-h-[120px] ${isSelected ? 'bg-opacity-20' : 'hover:border-white/20'}`}
      style={{
        backgroundColor: isSelected ? `${dynamicColor}10` : 'rgba(0,0,0,0.2)',
        borderColor: isSelected ? dynamicColor : 'rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex justify-between items-start">
          <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-500'}`}>
              Tier {tier.index}
          </span>
          {isSelected && <CheckCircle size={16} style={{ color: dynamicColor }} />}
      </div>

      <div className="my-2">
          <div className="text-sm font-bold text-white leading-tight mb-1">{tier.name}</div>
      </div>

      <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-gray-300 text-xs">
            <Clock size={12} /> <span className="font-mono font-bold">{tier.days}d</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: isSelected ? dynamicColor : '#9ca3af' }}>
            <Award size={12} /> <span>{tier.multiplier}x</span>
          </div>
      </div>
    </motion.div>
  );
}