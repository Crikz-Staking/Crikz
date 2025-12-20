// src/config.ts
import { createConfig, http } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// ==================== ENVIRONMENT VARIABLES ====================
export const CRIKZ_TOKEN_ADDRESS = (import.meta.env.VITE_CRIKZ_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const PANCAKESWAP_ROUTER = (import.meta.env.VITE_PANCAKESWAP_ROUTER || '0xD99D1c33F9fC3444f8101754aBC46c52416550D1') as `0x${string}`;
export const TRUSTED_FORWARDER = (import.meta.env.VITE_TRUSTED_FORWARDER || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_EXPECTED_CHAIN_ID) || 97;
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'cdf8dadd25a1999d03bcb554e82147f8';

// ==================== CONTRACT ABIS ====================

// Crikz Token ABI (ERC20 + Custom Functions)
export const CRIKZ_TOKEN_ABI = [
  // ERC20 Standard
  { name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'allowance', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'approve', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { name: 'transfer', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  
  // Crikz Protocol Functions
  { name: 'createOrder', inputs: [{ name: 'amount', type: 'uint256' }, { name: 'orderType', type: 'uint8' }], outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { name: 'completeOrder', inputs: [{ name: 'index', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { name: 'claimYield', inputs: [], outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { name: 'fundProductionPool', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable', type: 'function' },
  
  // View Functions
  { name: 'getActiveOrders', inputs: [{ type: 'address' }], outputs: [{ type: 'tuple[]', components: [
    { name: 'amount', type: 'uint256' },
    { name: 'reputation', type: 'uint256' },
    { name: 'orderType', type: 'uint8' },
    { name: 'startTime', type: 'uint256' },
    { name: 'duration', type: 'uint256' }
  ]}], stateMutability: 'view', type: 'function' },
  { name: 'totalCreatorReputation', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'creatorYieldDebt', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'productionFund', inputs: [], outputs: [{ 
    type: 'tuple',
    components: [
      { name: 'balance', type: 'uint256' },
      { name: 'totalReputation', type: 'uint256' },
      { name: 'accumulatedYieldPerReputation', type: 'uint256' },
      { name: 'lastUpdateTime', type: 'uint256' }
    ]
  }], stateMutability: 'view', type: 'function' },
  { name: 'orderTypes', inputs: [{ type: 'uint256' }], outputs: [{ 
    type: 'tuple',
    components: [
      { name: 'lockDuration', type: 'uint256' },
      { name: 'reputationMultiplier', type: 'uint256' },
      { name: 'name', type: 'string' }
    ]
  }], stateMutability: 'view', type: 'function' },
  { name: 'lpPair', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  
  // Admin Functions
  { name: 'pause', inputs: [], outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { name: 'unpause', inputs: [], outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { name: 'setLPPairAddress', inputs: [{ type: 'address' }], outputs: [], stateMutability: 'nonpayable', type: 'function' },
  
  // Events
  { name: 'OrderCreated', type: 'event', inputs: [
    { name: 'creator', type: 'address', indexed: true },
    { name: 'amount', type: 'uint256', indexed: false },
    { name: 'orderType', type: 'uint8', indexed: false },
    { name: 'timestamp', type: 'uint256', indexed: false }
  ]},
  { name: 'OrderCompleted', type: 'event', inputs: [
    { name: 'creator', type: 'address', indexed: true },
    { name: 'amount', type: 'uint256', indexed: false },
    { name: 'orderType', type: 'uint8', indexed: false },
    { name: 'timestamp', type: 'uint256', indexed: false }
  ]},
  { name: 'YieldClaimed', type: 'event', inputs: [
    { name: 'creator', type: 'address', indexed: true },
    { name: 'amount', type: 'uint256', indexed: false },
    { name: 'timestamp', type: 'uint256', indexed: false }
  ]},
] as const;

// ==================== ORDER TYPES ====================
export const ORDER_TYPES = [
  { index: 0, days: 5, multiplier: 0.618, name: "Prototype", description: "Quick test production run" },
  { index: 1, days: 13, multiplier: 0.787, name: "Small Batch", description: "Limited production cycle" },
  { index: 2, days: 34, multiplier: 1.001, name: "Standard Run", description: "Regular production order" },
  { index: 3, days: 89, multiplier: 1.273, name: "Mass Production", description: "High volume output" },
  { index: 4, days: 233, multiplier: 1.619, name: "Industrial", description: "Large-scale manufacturing" },
  { index: 5, days: 610, multiplier: 2.059, name: "Global Scale", description: "Worldwide distribution" },
  { index: 6, days: 1597, multiplier: 2.618, name: "Monopoly", description: "Market dominance" },
] as const;

// ==================== WAGMI CONFIGURATION ====================
export const wagmiConfig = getDefaultConfig({
  appName: 'Crikz Protocol',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
});

// ==================== CONSTANTS ====================
export const WAD = BigInt(1e18);
export const MIN_ORDER_AMOUNT = BigInt(10) * WAD;

// APR Configuration (6.182% from ProductionDistributor.sol)
export const BASE_APR = 6.182; // 6.182%
export const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate expected yield for an order
 */
export function calculateExpectedYield(
  amount: bigint,
  orderTypeIndex: number,
  fundBalance: bigint,
  totalReputation: bigint
): bigint {
  if (totalReputation === 0n || fundBalance === 0n) return 0n;
  
  const orderType = ORDER_TYPES[orderTypeIndex];
  const multiplier = BigInt(Math.floor(orderType.multiplier * 1000));
  const reputation = (amount * multiplier) / 1000n;
  
  // Calculate yield based on 6.182% APR
  const durationInSeconds = BigInt(orderType.days * 24 * 60 * 60);
  const yieldGenerated = (fundBalance * durationInSeconds * 6182n) / (100000n * BigInt(SECONDS_PER_YEAR));
  
  // Calculate share based on reputation
  const yieldPerReputation = (yieldGenerated * WAD) / totalReputation;
  const expectedYield = (reputation * yieldPerReputation) / WAD;
  
  return expectedYield;
}

/**
 * Calculate pending yield for a user
 */
export function calculatePendingYield(
  reputation: bigint,
  accumulatedYieldPerReputation: bigint,
  yieldDebt: bigint
): bigint {
  const totalProduct = (reputation * accumulatedYieldPerReputation) / WAD;
  if (totalProduct <= yieldDebt) return 0n;
  return totalProduct - yieldDebt;
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Unlocked';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Get order status
 */
export function getOrderStatus(startTime: bigint, duration: bigint): {
  isUnlocked: boolean;
  timeRemaining: number;
  progress: number;
} {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const unlockTime = startTime + duration;
  const isUnlocked = now >= unlockTime;
  
  const timeRemaining = isUnlocked ? 0 : Number(unlockTime - now);
  const elapsed = now - startTime;
  const progress = duration > 0n ? Math.min(Number((elapsed * 100n) / duration), 100) : 0;
  
  return { isUnlocked, timeRemaining, progress };
}