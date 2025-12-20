// src/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useBlockNumber 
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Box, Layers, Clock, Award, TrendingUp, 
  Wallet, Activity, DollarSign, Lock, Zap,
  Factory, Package, Globe, Crown
} from 'lucide-react';

import { 
  CRIKZ_TOKEN_ADDRESS, 
  CRIKZ_TOKEN_ABI, 
  ORDER_TYPES,
  WAD,
  calculatePendingYield,
  formatTimeRemaining,
  getOrderStatus,
  BASE_APR
} from './config';

// ==================== TYPES ====================
interface Order {
  amount: bigint;
  reputation: bigint;
  orderType: number;
  startTime: bigint;
  duration: bigint;
}

interface ProductionFund {
  balance: bigint;
  totalReputation: bigint;
  accumulatedYieldPerReputation: bigint;
  lastUpdateTime: bigint;
}

// ==================== MAIN APP ====================
export default function App() {
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState(2);
  const [activeTab, setActiveTab] = useState<'orders' | 'create' | 'fund'>('create');
  const [themeColor, setThemeColor] = useState('#00ff88');

  const { address: walletAddress, isConnected } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // ==================== CONTRACT READS ====================
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [walletAddress || '0x0000000000000000000000000000000000000000'],
    query: { enabled: isConnected }
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'allowance',
    args: [walletAddress || '0x0000000000000000000000000000000000000000', CRIKZ_TOKEN_ADDRESS],
    query: { enabled: isConnected }
  });

  const { data: activeOrders, refetch: refetchOrders } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'getActiveOrders',
    args: [walletAddress || '0x0000000000000000000000000000000000000000'],
    query: { enabled: isConnected }
  }) as { data: Order[] | undefined; refetch: () => void };

  const { data: totalReputation } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'totalCreatorReputation',
    args: [walletAddress || '0x0000000000000000000000000000000000000000'],
    query: { enabled: isConnected }
  });

  const { data: yieldDebt } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'creatorYieldDebt',
    args: [walletAddress || '0x0000000000000000000000000000000000000000'],
    query: { enabled: isConnected }
  });

  const { data: productionFund, refetch: refetchFund } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'productionFund',
    query: { enabled: true }
  }) as { data: ProductionFund | undefined; refetch: () => void };

  const { data: totalSupply } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'totalSupply'
  });

  // ==================== CONTRACT WRITES ====================
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // ==================== CALCULATIONS ====================
  const pendingYield = useMemo(() => {
    if (!totalReputation || !productionFund || !yieldDebt) return 0n;
    return calculatePendingYield(
      totalReputation as bigint,
      productionFund.accumulatedYieldPerReputation,
      yieldDebt as bigint
    );
  }, [totalReputation, productionFund, yieldDebt]);

  const currentAPR = useMemo(() => {
    if (!productionFund || productionFund.totalReputation === 0n) return 0;
    return BASE_APR;
  }, [productionFund]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Transaction successful!');
      refetchBalance();
      refetchAllowance();
      refetchOrders();
      refetchFund();
      setAmount('');
    }
  }, [isConfirmed]);

  useEffect(() => {
    const interval = setInterval(() => {
      const hue = (Date.now() / 50) % 360;
      setThemeColor(`hsl(${hue}, 100%, 50%)`);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (blockNumber) {
      refetchOrders();
      refetchFund();
    }
  }, [blockNumber]);

  // ==================== HANDLERS ====================
  const handleCreateOrder = async () => {
    try {
      const val = parseEther(amount || '0');
      if (val === 0n) {
        toast.error('Please enter an amount');
        return;
      }

      if (!allowance || allowance < val) {
        writeContract({
          address: CRIKZ_TOKEN_ADDRESS,
          abi: CRIKZ_TOKEN_ABI,
          functionName: 'approve',
          args: [CRIKZ_TOKEN_ADDRESS, val]
        });
        toast.loading('Approving tokens...');
      } else {
        writeContract({
          address: CRIKZ_TOKEN_ADDRESS,
          abi: CRIKZ_TOKEN_ABI,
          functionName: 'createOrder',
          args: [val, selectedTier]
        });
        toast.loading('Creating production order...');
      }
    } catch (error) {
      toast.error('Invalid amount');
    }
  };

  const handleCompleteOrder = async (index: number) => {
    writeContract({
      address: CRIKZ_TOKEN_ADDRESS,
      abi: CRIKZ_TOKEN_ABI,
      functionName: 'completeOrder',
      args: [BigInt(index)]
    });
    toast.loading('Completing order...');
  };

  const handleClaimYield = async () => {
    writeContract({
      address: CRIKZ_TOKEN_ADDRESS,
      abi: CRIKZ_TOKEN_ABI,
      functionName: 'claimYield'
    });
    toast.loading('Claiming yield...');
  };

  const handleFundPool = async (fundAmount: string) => {
    try {
      const val = parseEther(fundAmount || '0');
      if (val === 0n) {
        toast.error('Please enter an amount');
        return;
      }

      if (!allowance || allowance < val) {
        writeContract({
          address: CRIKZ_TOKEN_ADDRESS,
          abi: CRIKZ_TOKEN_ABI,
          functionName: 'approve',
          args: [CRIKZ_TOKEN_ADDRESS, val]
        });
        toast.loading('Approving tokens...');
      } else {
        writeContract({
          address: CRIKZ_TOKEN_ADDRESS,
          abi: CRIKZ_TOKEN_ABI,
          functionName: 'fundProductionPool',
          args: [val]
        });
        toast.loading('Funding production pool...');
      }
    } catch (error) {
      toast.error('Invalid amount');
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(0,20,10,0.95)',
            color: themeColor,
            border: `1px solid ${themeColor}`,
            fontFamily: 'monospace'
          }
        }} 
      />

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 10px ${themeColor}20; }
          50% { box-shadow: 0 0 30px ${themeColor}40; }
        }
        .tier-card:hover {
          border-color: ${themeColor} !important;
          background: ${themeColor}15 !important;
        }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b" style={{ borderColor: `${themeColor}30` }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Box size={32} color={themeColor} className="animate-pulse-glow" />
            <h1 className="text-2xl tracking-wider">
              CRIKZ<span style={{ color: themeColor }} className="font-black">Φ</span>
            </h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Activity size={80} color={themeColor} style={{ opacity: 0.3 }} />
            <h2 className="text-3xl font-light">Connect Wallet to Begin</h2>
            <p style={{ color: themeColor }}>Access the Crikz Protocol Production System</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: STATS */}
            <aside className="glass rounded-xl p-6 space-y-6">
              <h3 className="text-lg flex items-center gap-2" style={{ color: themeColor }}>
                <Wallet size={20} /> Your Portfolio
              </h3>
              
              <StatCard 
                label="Balance" 
                value={balance ? formatEther(balance) : '0'} 
                icon={DollarSign}
                color={themeColor}
              />
              
              <StatCard 
                label="Total Reputation" 
                value={totalReputation ? formatEther(totalReputation) : '0'} 
                icon={Award}
                color="#00d4ff"
              />
              
              <StatCard 
                label="Pending Yield" 
                value={formatEther(pendingYield)} 
                icon={TrendingUp}
                color="#ffaa00"
              />
              
              <StatCard 
                label="Active Orders" 
                value={activeOrders?.length.toString() || '0'} 
                icon={Factory}
                color="#ff00e6"
              />
              
              <button
                onClick={handleClaimYield}
                disabled={pendingYield === 0n || isPending}
                className="w-full btn-primary py-3 px-4 rounded-lg font-bold disabled:opacity-30"
                style={{ background: pendingYield > 0n ? themeColor : '#333', color: '#000' }}
              >
                CLAIM YIELD
              </button>
            </aside>

            {/* MIDDLE: INTERACTION */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TABS */}
              <div className="flex gap-2">
                {(['create', 'orders', 'fund'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 py-3 px-4 rounded-lg transition-all"
                    style={{
                      background: activeTab === tab ? `${themeColor}20` : 'transparent',
                      border: `1px solid ${activeTab === tab ? themeColor : '#333'}`,
                      color: activeTab === tab ? '#fff' : '#666'
                    }}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* CREATE ORDER */}
              {activeTab === 'create' && (
                <div className="glass rounded-xl p-6 space-y-6">
                  <h2 className="text-xl">Create Production Order</h2>
                  
                  {/* TIER SELECTION */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ORDER_TYPES.map((tier) => (
                      <div
                        key={tier.index}
                        onClick={() => setSelectedTier(tier.index)}
                        className="tier-card cursor-pointer p-4 rounded-lg border-2 transition-all"
                        style={{
                          background: selectedTier === tier.index ? `${themeColor}20` : 'rgba(20,20,20,0.6)',
                          borderColor: selectedTier === tier.index ? themeColor : '#333'
                        }}
                      >
                        <div className="text-xs text-gray-400">{tier.days} Days</div>
                        <div className="text-lg font-bold">{tier.name}</div>
                        <div className="text-sm" style={{ color: themeColor }}>
                          {tier.multiplier}x Rep
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AMOUNT INPUT */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Amount</span>
                      <span 
                        className="cursor-pointer" 
                        style={{ color: themeColor }}
                        onClick={() => balance && setAmount(formatEther(balance))}
                      >
                        MAX: {balance ? parseFloat(formatEther(balance)).toFixed(2) : '0'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="input-custom w-full px-4 py-3"
                    />
                  </div>

                  {/* INFO */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-black/50 rounded-lg">
                      <div className="text-xs text-gray-400">Duration</div>
                      <div className="text-lg">{ORDER_TYPES[selectedTier].days} Days</div>
                    </div>
                    <div className="p-3 bg-black/50 rounded-lg">
                      <div className="text-xs text-gray-400">Reputation</div>
                      <div className="text-lg">{ORDER_TYPES[selectedTier].multiplier}x</div>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateOrder}
                    disabled={!amount || isPending}
                    className="w-full btn-primary py-4 px-6 rounded-lg font-black text-lg"
                    style={{ background: amount ? themeColor : '#333' }}
                  >
                    {isPending ? 'PROCESSING...' : 'CREATE ORDER'}
                  </button>
                </div>
              )}

              {/* ACTIVE ORDERS */}
              {activeTab === 'orders' && (
                <div className="glass rounded-xl p-6 space-y-4">
                  <h2 className="text-xl">Active Production Orders</h2>
                  
                  {!activeOrders || activeOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Package size={60} className="mx-auto mb-4 opacity-30" />
                      <p>No active orders</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeOrders.map((order, index) => {
                        const status = getOrderStatus(order.startTime, order.duration);
                        const tierInfo = ORDER_TYPES[order.orderType];
                        
                        return (
                          <div 
                            key={index} 
                            className="p-4 bg-black/50 rounded-lg border"
                            style={{ borderColor: status.isUnlocked ? themeColor : '#333' }}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-bold text-lg">{tierInfo.name}</div>
                                <div className="text-sm text-gray-400">
                                  {formatEther(order.amount)} CRIKZ
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-400">Reputation</div>
                                <div className="font-bold" style={{ color: themeColor }}>
                                  {parseFloat(formatEther(order.reputation)).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>{status.progress}%</span>
                              </div>
                              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-500"
                                  style={{ 
                                    width: `${status.progress}%`,
                                    background: status.isUnlocked ? themeColor : '#666'
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock size={16} />
                                <span>
                                  {status.isUnlocked ? 'Ready!' : formatTimeRemaining(status.timeRemaining)}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCompleteOrder(index)}
                                disabled={!status.isUnlocked || isPending}
                                className="py-2 px-4 rounded-lg font-bold disabled:opacity-30 transition-all"
                                style={{ 
                                  background: status.isUnlocked ? themeColor : '#333',
                                  color: '#000'
                                }}
                              >
                                {status.isUnlocked ? 'COMPLETE' : 'LOCKED'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* FUND POOL */}
              {activeTab === 'fund' && (
                <FundPoolPanel 
                  productionFund={productionFund}
                  themeColor={themeColor}
                  onFund={handleFundPool}
                  isPending={isPending}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ==================== COMPONENTS ====================
function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="border-l-2 pl-4" style={{ borderColor: `${color}40` }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} color={color} />
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ textShadow: `0 0 15px ${color}40` }}>
        {parseFloat(value).toFixed(2)}
      </div>
    </div>
  );
}

function FundPoolPanel({ productionFund, themeColor, onFund, isPending }: any) {
  const [fundAmount, setFundAmount] = useState('');

  return (
    <div className="glass rounded-xl p-6 space-y-6">
      <h2 className="text-xl">Production Fund</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-black/50 rounded-lg">
          <div className="text-xs text-gray-400">Fund Balance</div>
          <div className="text-xl font-bold" style={{ color: themeColor }}>
            {productionFund ? formatEther(productionFund.balance) : '0'}
          </div>
        </div>
        <div className="p-4 bg-black/50 rounded-lg">
          <div className="text-xs text-gray-400">Total Reputation</div>
          <div className="text-xl font-bold" style={{ color: '#00d4ff' }}>
            {productionFund ? formatEther(productionFund.totalReputation) : '0'}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-400">Fund Amount</label>
        <input
          type="text"
          value={fundAmount}
          onChange={(e) => setFundAmount(e.target.value)}
          placeholder="0.00"
          className="input-custom w-full px-4 py-3"
        />
      </div>

      <button
        onClick={() => onFund(fundAmount)}
        disabled={!fundAmount || isPending}
        className="w-full btn-primary py-4 px-6 rounded-lg font-black text-lg"
        style={{ background: fundAmount ? themeColor : '#333' }}
      >
        {isPending ? 'PROCESSING...' : 'FUND POOL'}
      </button>
    </div>
  );
}