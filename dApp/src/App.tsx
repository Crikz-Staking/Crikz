// src/App.tsx
import React, { useState } from 'react';
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
import type { TabType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const { address, isConnected } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { themeColor, gradientColors } = useTheme();

  // Contract data
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
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] selection:bg-[#FFD700] selection:text-black">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(10, 10, 10, 0.95)',
            color: themeColor,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
            fontFamily: 'var(--font-mono)',
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

      {/* Floating Island Header */}
      <header className="sticky top-6 z-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card px-6 py-4 flex justify-between items-center rounded-2xl border border-white/5 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%)`
                }}
              >
                <span className="text-xl font-black text-black">Φ</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black tracking-tighter leading-none">
                  CRIKZ
                  <span style={{ color: themeColor }} className="ml-1">PROTOCOL</span>
                </h1>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-0.5">
                  Fibonacci Production System
                </p>
              </div>
            </div>

            <div>
              <ConnectButton
                chainStatus="icon"
                showBalance={{
                  smallScreen: false,
                  largeScreen: true,
                }}
              />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-12">
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <Hero key="hero" themeColor={themeColor} />
          ) : (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              {/* Stats Overview */}
              <section>
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
              </section>

              {/* Navigation & Content Area */}
              <section className="space-y-6">
                <NavigationTabs
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  themeColor={themeColor}
                />

                <AnimatePresence mode="wait">
                  {activeTab === 'create' && (
                    <OrderCreation
                      key="create"
                      balance={balance}
                      productionFund={productionFund}
                      onCreateOrder={(amount, orderType) => createOrder(amount, orderType, allowance)}
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
                      onFundPool={(amount) => fundPool(amount, allowance)}
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
              </section>
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