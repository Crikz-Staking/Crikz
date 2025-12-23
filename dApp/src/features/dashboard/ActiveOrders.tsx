import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ADDED: Filter import
import { Package, Clock, CheckCircle2, AlertCircle, Filter } from 'lucide-react';

// Components & Utils
import OrderCard from './OrderCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
// FIXED: Import correct animation variant
import { staggerContainer, fadeInUp } from '@/utils/animations';
import type { Order } from '@/types';

interface ActiveOrdersProps {
  orders: Order[] | undefined;
  onCompleteOrder: (index: number) => void;
  isPending: boolean;
  dynamicColor: string;
  isLoading: boolean;
}

export default function ActiveOrders({
  orders,
  onCompleteOrder,
  isPending,
  dynamicColor,
  isLoading
}: ActiveOrdersProps) {
  const [filter, setFilter] = React.useState<'all' | 'locked' | 'unlocked'>('all');

  const filteredOrders = React.useMemo(() => {
    if (!orders) return [];
    
    const now = BigInt(Math.floor(Date.now() / 1000));
    
    if (filter === 'locked') {
      return orders.filter((order) => now < order.startTime + order.duration).map((order) => ({ order, originalIndex: orders.indexOf(order) }));
    } else if (filter === 'unlocked') {
      return orders.filter((order) => now >= order.startTime + order.duration).map((order) => ({ order, originalIndex: orders.indexOf(order) }));
    }
    
    return orders.map((order, idx) => ({ order, originalIndex: idx }));
  }, [orders, filter]);

  if (isLoading) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-white/10 min-h-[400px] flex items-center justify-center">
        <LoadingSpinner color={dynamicColor} size={60} />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 bg-background-elevated"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black mb-2 text-white">
            Active Production
          </h2>
          <p className="text-sm text-gray-300 font-medium">
            {orders?.length || 0} order{orders?.length !== 1 ? 's' : ''} currently in production
          </p>
        </div>

        {/* Filter */}
        {orders && orders.length > 0 && (
          <div className="flex items-center gap-3 bg-background-surface p-1.5 rounded-xl border border-white/10">
            <Filter size={18} className="text-gray-400 ml-2" />
            <div className="flex gap-1">
              {(['all', 'locked', 'unlocked'] as const).map((f) => (
                <motion.button
                  key={f}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(f)}
                  className="px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all"
                  style={{
                    background: filter === f ? dynamicColor : 'transparent',
                    color: filter === f ? '#000' : '#9ca3af',
                  }}
                >
                  {f}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <AnimatePresence mode="popLayout">
        {!orders || orders.length === 0 ? (
          <motion.div
            key="empty"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col items-center justify-center py-24 text-gray-400"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="bg-white/5 p-6 rounded-full mb-6"
            >
              <Package size={60} className="opacity-50" strokeWidth={1.5} />
            </motion.div>
            <p className="text-xl font-bold mb-2 text-white">No Active Orders</p>
            <p className="text-sm font-medium">Create your first production order to get started</p>
          </motion.div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            key="no-filter-results"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col items-center justify-center py-20 text-gray-400"
          >
            <Package size={60} className="mb-6 opacity-30" />
            <p className="text-lg font-bold mb-2 text-white">No {filter} orders</p>
            <p className="text-sm">Try a different filter</p>
          </motion.div>
        ) : (
          <motion.div 
            key="orders-list"
            variants={staggerContainer} 
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {filteredOrders.map(({ order, originalIndex }) => (
              <OrderCard
                key={`${order.startTime}-${originalIndex}`}
                order={order}
                index={originalIndex}
                onComplete={() => onCompleteOrder(originalIndex)}
                isPending={isPending}
                dynamicColor={dynamicColor}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}