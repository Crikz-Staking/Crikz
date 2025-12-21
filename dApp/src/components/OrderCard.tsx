// src/components/OrderCard.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { Clock, Award, Package, Unlock } from 'lucide-react';
import { ORDER_TYPES } from '../config';
import { getOrderStatus } from '../utils/calculations';
import { formatTimeRemaining, formatTokenAmount } from '../utils/formatters';
import { fadeInUp } from '../utils/animations';
import type { Order } from '../types';

interface OrderCardProps {
  order: Order;
  index: number;
  onComplete: () => void;
  isPending: boolean;
  themeColor: string;
}

export default function OrderCard({ order, index, onComplete, isPending, themeColor }: OrderCardProps) {
  const [status, setStatus] = useState(getOrderStatus(order.startTime, order.duration));
  const tierInfo = ORDER_TYPES[order.orderType];

  // Update status every second
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getOrderStatus(order.startTime, order.duration));
    }, 1000);
    return () => clearInterval(interval);
  }, [order]);

  return (
    <motion.div
      variants={fadeInUp}
      layout
      className="p-6 rounded-2xl border-2 transition-all relative overflow-hidden group"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderColor: status.isUnlocked ? `${themeColor}60` : 'rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${themeColor} 0%, transparent 100%)`
        }}
      />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `${themeColor}20`,
                color: themeColor
              }}
            >
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black mb-1">{tierInfo.name}</h3>
              <p className="text-sm text-gray-400">{tierInfo.description}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Amount</div>
            <div className="text-2xl font-black">
              {formatTokenAmount(formatEther(order.amount))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-black/40 rounded-xl">
          <div>
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Award size={12} />
              Reputation
            </div>
            <div className="text-lg font-bold" style={{ color: '#00d4ff' }}>
              {formatTokenAmount(formatEther(order.reputation))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Clock size={12} />
              Duration
            </div>
            <div className="text-lg font-bold">{tierInfo.days}d</div>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Clock size={12} />
              {status.isUnlocked ? 'Status' : 'Remaining'}
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: status.isUnlocked ? themeColor : undefined }}
            >
              {status.isUnlocked ? 'Ready!' : formatTimeRemaining(status.timeRemaining)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Production Progress</span>
            <span>{status.progress}%</span>
          </div>
          <div className="h-3 bg-black/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${status.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                background: status.isUnlocked
                  ? `linear-gradient(90deg, ${themeColor}, ${themeColor}80)`
                  : 'linear-gradient(90deg, #666, #444)'
              }}
            />
          </div>
        </div>

        {/* Complete Button */}
        <motion.button
          onClick={onComplete}
          disabled={!status.isUnlocked || isPending}
          whileHover={status.isUnlocked ? { scale: 1.02 } : {}}
          whileTap={status.isUnlocked ? { scale: 0.98 } : {}}
          className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: status.isUnlocked ? themeColor : '#333',
            color: status.isUnlocked ? '#000' : '#666'
          }}
        >
          {status.isUnlocked ? (
            <>
              <Unlock size={20} />
              <span>COMPLETE ORDER</span>
            </>
          ) : (
            <>
              <Clock size={20} />
              <span>LOCKED</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}