// src/components/OrderCard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Package, Award } from 'lucide-react';
import { formatTokenAmount, formatTimeRemaining, formatDate } from '@/utils/formatters';
import { getOrderStatus } from '@/utils/calculations';
import { ORDER_TYPES } from '@/config';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  index: number;
  onComplete: (index: number) => void;
  isPending: boolean;
  dynamicColor: string;
}

export default function OrderCard({ order, index, onComplete, isPending, dynamicColor }: OrderCardProps) {
  const [status, setStatus] = useState(getOrderStatus(order.startTime, order.duration));

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getOrderStatus(order.startTime, order.duration));
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  const tier = ORDER_TYPES[order.orderType];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5 border border-white/5 relative overflow-hidden group"
    >
      {/* Progress Bar Background */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
        <motion.div 
          className="h-full"
          style={{ backgroundColor: dynamicColor }}
          initial={{ width: 0 }}
          animate={{ width: `${status.progress}%` }}
        />
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg text-primary-400">
            <Package size={20} />
          </div>
          <div>
            <h4 className="font-bold text-white">{tier.name}</h4>
            <p className="text-xs text-gray-500">Order #{index + 1}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Reputation</div>
          <div className="font-mono font-black text-accent-cyan">
            +{formatTokenAmount(order.reputation)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-white/5 rounded-lg">
          <span className="text-[10px] text-gray-500 uppercase block mb-1">Staked</span>
          <span className="font-bold text-sm text-gray-200">{formatTokenAmount(order.amount)} CRKZ</span>
        </div>
        <div className="p-3 bg-white/5 rounded-lg">
          <span className="text-[10px] text-gray-500 uppercase block mb-1">Unlocks On</span>
          <span className="font-bold text-sm text-gray-200">{formatDate(status.unlockTime)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
            <Clock size={10} /> Time Remaining
          </span>
          <span className={`font-mono font-bold ${status.isUnlocked ? 'text-emerald-400' : 'text-gray-300'}`}>
            {status.isUnlocked ? 'COMPLETE' : formatTimeRemaining(status.timeRemaining)}
          </span>
        </div>

        <button
          onClick={() => onComplete(index)}
          disabled={!status.isUnlocked || isPending}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2
            ${status.isUnlocked 
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50' 
              : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'}
          `}
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 size={16} />
              Finalize
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}