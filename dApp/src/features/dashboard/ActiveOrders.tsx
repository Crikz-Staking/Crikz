import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageOpen } from 'lucide-react';
import OrderCard from './OrderCard';
import { Order } from '@/types';

interface ActiveOrdersProps {
  orders: Order[];
  onCompleteOrder: (index: number) => void; // FIXED: Correct prop name
  isPending: boolean;
  isLoading: boolean;
  dynamicColor: string;
}

export default function ActiveOrders({ 
  orders, 
  onCompleteOrder, // FIXED: Use correct prop name
  isPending, 
  dynamicColor 
}: ActiveOrdersProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {orders.map((order, idx) => (
          <OrderCard 
            key={`${order.startTime}-${idx}`} 
            order={order} 
            index={idx} 
            onComplete={onCompleteOrder} // FIXED
            isPending={isPending}
            dynamicColor={dynamicColor}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}