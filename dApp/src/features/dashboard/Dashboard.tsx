import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';

// Dashboard Internal Components
import StatsPanel from './StatsPanel';
import OrderCreation from './OrderCreation';
import ActiveOrders from './ActiveOrders';
import Analytics from './Analytics';
import NavigationTabs from './NavigationTabs';

// Hooks & Types (Using Aliases)
import { useContractData } from '@/hooks/useContractData';
import { useContractWrite } from '@/hooks/useContractWrite';
import { Language } from '@/App';

interface DashboardProps {
  dynamicColor: string;
  lang: Language;
}

export type DashboardTab = 'create' | 'orders' | 'analytics';

export default function Dashboard({ dynamicColor, lang }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('create');
  const { address } = useAccount();
  
  // Data Fetching
  const { 
    orders, 
    totalReputation, 
    isLoading 
  } = useContractData();

  // Contract Actions
  const { 
    createOrder, 
    completeOrder, 
    claimYield, 
    isPending 
  } = useContractWrite();

  return (
    <div className="space-y-8 pb-20">
      {/* Top Stats Overview */}
      <StatsPanel
        userReputation={totalReputation}
        onClaimYield={claimYield}
        isPending={isPending}
        dynamicColor={dynamicColor}
        lang={lang}
      />

      {/* Navigation */}
      <NavigationTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        dynamicColor={dynamicColor}
        lang={lang}
        orderCount={orders?.length || 0}
      />

      {/* Main Content Area */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <OrderCreation 
                onConfirm={createOrder}
                isPending={isPending}
                dynamicColor={dynamicColor}
                lang={lang}
              />
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ActiveOrders 
                orders={orders}
                onCompleteOrder={completeOrder}
                isPending={isPending}
                isLoading={isLoading}
                dynamicColor={dynamicColor}
              />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Analytics 
                orders={orders}
                totalReputation={totalReputation}
                currentAPR={6.182} // Base Protocol APR
                dynamicColor={dynamicColor}
                isUserView={true}
                lang={lang}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}