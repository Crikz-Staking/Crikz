import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageOpen, Clock, Coins } from 'lucide-react';
import OrderCard from './OrderCard';
import { Order } from '@/types';

interface ActiveOrdersProps {
  orders: Order[];
  onCompleteOrder: (index: number) => void;
  isPending: boolean;
  isLoading: boolean;
  dynamicColor: string;
}

type SortType = 'time' | 'amount';

export default function ActiveOrders({ 
  orders, 
  onCompleteOrder, 
  isPending, 
  dynamicColor 
}: ActiveOrdersProps) {
  const [sortType, setSortType] = useState<SortType>('time');

  // Mapped with original index to ensure "onComplete" hits the right contract ID
  // Sorting is done on the client side
  const sortedOrders = orders
    .map((order, originalIndex) => ({ ...order, originalIndex }))
    .sort((a, b) => {
        if (sortType === 'time') {
            const endA = BigInt(a.startTime) + BigInt(a.duration);
            const endB = BigInt(b.startTime) + BigInt(b.duration);
            return Number(endA - endB); // Ascending (soonest first)
        } else {
            return Number(b.amount - a.amount); // Descending (largest first)
        }
    });

  if (orders.length === 0) {
    return (
      <div className="glass-card p-20 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <PackageOpen size={40} className="text-gray-600" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">No Active Production</h3>
        <p className="text-gray-500 max-w-sm">
          You don't have any active orders. Use the creation panel to lock tokens and start earning reputation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Sorting Controls */}
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Production Queue</h3>
            <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                <button 
                    onClick={() => setSortType('time')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortType === 'time' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Clock size={12} /> Time Remaining
                </button>
                <button 
                    onClick={() => setSortType('amount')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortType === 'amount' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Coins size={12} /> Amount Staked
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
                {sortedOrders.map((orderWrapper) => (
                <OrderCard 
                    key={`${orderWrapper.startTime}-${orderWrapper.originalIndex}`} 
                    order={orderWrapper} 
                    index={orderWrapper.originalIndex} // Pass original index for contract call
                    onComplete={onCompleteOrder}
                    isPending={isPending}
                    dynamicColor={dynamicColor}
                />
                ))}
            </AnimatePresence>
        </div>
    </div>
  );
}