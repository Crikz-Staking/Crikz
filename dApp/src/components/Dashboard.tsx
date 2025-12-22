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
import ProductionFund from './ProductionFund';
import Analytics from './Analytics';
import TransactionModal from './TransactionModal';

import type { TabType } from '../types';

interface DashboardProps {
  dynamicColor: string;
}

export default function Dashboard({ dynamicColor }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('create');

  // Unified Data Hook
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

  // Unified Write Hook
  const {
    createOrder,
    completeOrder,
    claimYield,
    fundPool,
    isPending,
    txHash,
    txStatus
  } = useContractWrite(refetchAll);

  // Common Props for sub-components
  const commonProps = {
    isPending,
    dynamicColor,
  };

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
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
                  // Logic to check allowance before creating order can be handled inside useContractWrite or here
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

            {activeTab === 'fund' && (
              <motion.div
                key="fund"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <ProductionFund
                  productionFund={productionFund}
                  onFundPool={(amount) => fundPool(amount, allowance)}
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
        status={txStatus}
        dynamicColor={dynamicColor}
      />
    </div>
  );
}