// src/types/index.ts

export interface Order {
  amount: bigint;
  reputation: bigint;
  orderType: number;
  startTime: bigint;
  duration: bigint;
}

export interface ProductionFund {
  balance: bigint;
  totalReputation: bigint;
  accumulatedYieldPerReputation: bigint;
  lastUpdateTime: bigint;
}

export interface OrderStatus {
  isUnlocked: boolean;
  timeRemaining: number;
  progress: number;
  unlockTime: bigint;
}

export interface TierInfo {
  index: number;
  days: number;
  multiplier: number;
  name: string;
  description: string;
}

export type TabType = 'create' | 'orders' | 'fund' | 'analytics';

export interface TransactionStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
}