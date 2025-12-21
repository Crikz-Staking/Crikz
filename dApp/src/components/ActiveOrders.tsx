// src/components/ActiveOrders.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import OrderCard from './OrderCard';
import LoadingSpinner from './LoadingSpinner';
import { fadeInUp, staggerContainer } from '../utils/animations';
import type { Order } from '../types';interface ActiveOrdersProps {
orders: Order[] | undefined;
onCompleteOrder: (index: number) => void;
isPending: boolean;
themeColor: string;
isLoading: boolean;
}export default function ActiveOrders({
orders,
onCompleteOrder,
isPending,
themeColor,
isLoading
}: ActiveOrdersProps) {
if (isLoading) {
return (
<div className="glass-card p-8 rounded-3xl border border-white/10 min-h-[400px] flex items-center justify-center">
<LoadingSpinner color={themeColor} />
</div>
);
}return (
<motion.div
variants={staggerContainer}
initial="hidden"
animate="visible"
className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 space-y-6"
>
{/* Header */}
<div className="flex items-center justify-between">
<div>
<h2 className="text-3xl font-black mb-2">Active Production Orders</h2>
<p className="text-gray-400 text-sm">
{orders?.length || 0} order{orders?.length !== 1 ? 's' : ''} in production
</p>
</div>
</div>  {/* Orders List */}
  <AnimatePresence mode="popLayout">
    {!orders || orders.length === 0 ? (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="flex flex-col items-center justify-center py-20 text-gray-500"
      >
        <Package size={80} className="mb-6 opacity-20" />
        <p className="text-xl font-bold mb-2">No Active Orders</p>
        <p className="text-sm">Create your first production order to get started</p>
      </motion.div>
    ) : (
      <motion.div variants={staggerContainer} className="space-y-4">
        {orders.map((order, index) => (
          <OrderCard
            key={`${order.startTime}-${index}`}
            order={order}
            index={index}
            onComplete={() => onCompleteOrder(index)}
            isPending={isPending}
            themeColor={themeColor}
          />
        ))}
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
);
}
