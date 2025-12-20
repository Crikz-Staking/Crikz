// src/App.tsx
import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBlockNumber } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Hero from './components/Hero';
import StatsPanel from './components/StatsPanel';
import OrderCreation from './components/OrderCreation';
import ActiveOrders from './components/ActiveOrders';
import ProductionFund from './components/ProductionFund';
import Analytics from './components/Analytics';
import ParticleBackground from './components/ParticleBackground';
import NavigationTabs from './components/NavigationTabs';
import TransactionModal from './components/TransactionModal';

// Hooks
import { useContractData } from './hooks/useContractData';
import { useContractWrite } from './hooks/useContractWrite';
import { useTheme } from './hooks/useTheme';

// Types
export type TabType = 'create' | 'orders' | 'fund' | 'analytics';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const { address, isConnected } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { themeColor, gradientColors } = useTheme();

  // Contract data
  const {
    balance,
    activeOrders,
    totalReputation,
    pendingYield,
    productionFund,
    currentAPR,
    refetchAll,
    isLoading
  } = useContractData(address, blockNumber);

  // Contract interactions
  const {
    createOrder,
    completeOrder,
    claimYield,
    fundPool,
    isPending,
    txHash,
    txStatus
  } = useContractWrite(refetchAll);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 20, 40, 0.95)',
            color: themeColor,
            border: `1px solid ${themeColor}40`,
            backdropFilter: 'blur(10px)',
            fontFamily: 'monospace',
            fontWeight: '500'
          },
          success: {
            iconTheme: {
              primary: themeColor,
              secondary: '#000',
            },
          },
        }}
      />

      {/* Background Effects */}
      <ParticleBackground />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%)`
                }}
              >
                <span className="text-2xl font-black">Φ</span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  CRIKZ<span style={{ color: themeColor }}>PROTOCOL</span>
                </h1>
                <p className="text-xs text-gray-400">Fibonacci Production System</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ConnectButton
                chainStatus="icon"
                showBalance={{
                  smallScreen: false,
                  largeScreen: true,
                }}
              />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <Hero themeColor={themeColor} />
          ) : (
            <motion.div
              key="connected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Stats Overview */}
              <StatsPanel
                balance={balance}
                totalReputation={totalReputation}
                pendingYield={pendingYield}
                activeOrdersCount={activeOrders?.length || 0}
                currentAPR={currentAPR}
                onClaimYield={claimYield}
                isPending={isPending}
                themeColor={themeColor}
                isLoading={isLoading}
              />

              {/* Navigation Tabs */}
              <NavigationTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                themeColor={themeColor}
              />

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'create' && (
                  <OrderCreation
                    key="create"
                    balance={balance}
                    onCreateOrder={createOrder}
                    isPending={isPending}
                    themeColor={themeColor}
                    gradientColors={gradientColors}
                  />
                )}

                {activeTab === 'orders' && (
                  <ActiveOrders
                    key="orders"
                    orders={activeOrders}
                    onCompleteOrder={completeOrder}
                    isPending={isPending}
                    themeColor={themeColor}
                    isLoading={isLoading}
                  />
                )}

                {activeTab === 'fund' && (
                  <ProductionFund
                    key="fund"
                    productionFund={productionFund}
                    onFundPool={fundPool}
                    isPending={isPending}
                    themeColor={themeColor}
                    gradientColors={gradientColors}
                  />
                )}

                {activeTab === 'analytics' && (
                  <Analytics
                    key="analytics"
                    orders={activeOrders}
                    totalReputation={totalReputation}
                    productionFund={productionFund}
                    currentAPR={currentAPR}
                    themeColor={themeColor}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isPending}
        txHash={txHash}
        status={txStatus}
        themeColor={themeColor}
      />
    </div>
  );
}