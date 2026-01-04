// src/lib/brain/types.ts

export type AIProvider = 'groq' | 'openrouter' | 'google';

export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  limitInfo: string;
}

// Simplified Memory Interface
export interface Memory {
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: number;
}

export interface DAppContext {
  user_balance?: bigint;
  active_orders_count?: number;
  total_reputation?: bigint;
  global_total_reputation?: bigint;
  // FIX: Added this property to solve TS2339
  wallet_address?: string; 
}

export type ActionType = 'RESPOND_NATURAL' | 'RESPOND_DAPP';

export interface ActionPlan {
  type: ActionType;
  requiresBlockchain: boolean;
  priority: number;
  reasoning: string;
}

// Keep for compatibility if other files import it, but we won't use complex logic
export interface BrainState {
  longTermMemory: Memory[];
}