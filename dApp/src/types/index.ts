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

// NFT Types
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes: Array<{ trait_type: string; value: string }>; // FIXED
  collection?: string;
  mimeType?: string;
}

export interface NFTItem extends NFTMetadata {
  id: bigint;
  uri: string;
  owner?: string;
}

export interface MarketItem extends NFTItem {
  price: bigint;
  seller: string;
  nftContract: string;
  isActive: boolean;
  tokenId: bigint; // FIXED: Added missing property
}

// FIXED: Removed invalid code
export interface Listing {
  seller: `0x${string}`;
  nftContract: `0x${string}`;
  tokenId: bigint;
  price: bigint;
}

// Navigation Types
export type MainSection = 'active' | 'passive' | 'tools';
export type ActiveView = 'dashboard' | 'nft';
export type PassiveView = 'learning' | 'analytics' | 'games' | 'audio' | 'video';
export type ToolCategory = 'files' | 'crypto' | 'dev' | 'security';
export type Language = 'en' | 'sq';
export type DashboardTab = 'create' | 'orders' | 'analytics';