// src/types/index.ts

export interface Order {
  amount: bigint;
  reputation: bigint;
  orderType: number;
  startTime: bigint;
  duration: bigint;
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
  description?: string;
}

export interface TransactionStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
}

// Navigation & Global Types
export type DashboardTab = 'create' | 'orders' | 'analytics';
export type ViewMode = 'dashboard' | 'learning' | 'nft' | 'games';
export type Language = 'en' | 'sq';