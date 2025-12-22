// src/components/Dashboard.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContractData } from '../hooks/useContractData';
import { useContractWrite } from '../hooks/useContractWrite';

// Components
import StatsPanel from './StatsPanel';
import NavigationTabs from './NavigationTabs';
import OrderCreation from './OrderCreation';
import ActiveOrders from './ActiveOrders';
import Analytics from './Analytics';
import TransactionModal from './TransactionModal';
import type { TabType } from '../types';
import type { Language } from '../App';

interface DashboardProps {
  dynamicColor: string;
  lang: Language;
}

export default function Dashboard({ dynamicColor, lang }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  
  const {
    balance,
    allowance,
    activeOrders,
    totalReputation,
    pendingYield,
    productionFund,
    currentAPR,
    refetchAll,
    isLoading
  } = useContractData();

  const {
    createOrder,
    completeOrder,
    claimYield,
    isPending,
    txHash,
    txStatus
  } = useContractWrite(refetchAll);

  const commonProps = {
    isPending,
    dynamicColor,
    lang
  };

  return (
    <div className="space-y-8 w-full">
      {/* 1. High-Level Protocol Stats */}
      <section className="relative z-10">
        <StatsPanel
          balance={balance}
          totalReputation={totalReputation}
          pendingYield={pendingYield}
          activeOrdersCount={activeOrders?.length || 0}
          currentAPR={currentAPR}
          onClaimYield={claimYield}
          isLoading={isLoading}
          {...commonProps}
        />
      </section>

      {/* 2. Main Interface Area */}
      <section className="flex flex-col gap-6">
        <NavigationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dynamicColor={dynamicColor}
          lang={lang}
        />

        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <OrderCreation
                  balance={balance}
                  productionFund={productionFund}
                  onCreateOrder={(amount, orderType) => createOrder(amount, orderType, allowance)}
                  {...commonProps}
                />
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <ActiveOrders
                  orders={activeOrders}
                  onCompleteOrder={completeOrder}
                  isLoading={isLoading}
                  {...commonProps}
                />
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Analytics
                  orders={activeOrders}
                  totalReputation={totalReputation}
                  productionFund={productionFund}
                  currentAPR={currentAPR}
                  isUserView={true} // Restricts to user only
                  {...commonProps}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 3. Global Transaction Monitor */}
      <TransactionModal
        isOpen={isPending || txStatus === 'success' || txStatus === 'error'}
        txHash={txHash}
        status={txStatus as 'idle' | 'pending' | 'success' | 'error'} // <--- FIXED TYPE CASTING
        dynamicColor={dynamicColor}
      />
    </div>
  );
}