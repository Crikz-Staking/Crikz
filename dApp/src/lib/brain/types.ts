// src/lib/brain/types.ts

export type AIProvider = 'groq' | 'openrouter' | 'google';

export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  limitInfo: string;
}

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
  wallet_address?: string; 
}

export type ActionType = 'RESPOND_NATURAL' | 'RESPOND_DAPP';

export interface ActionPlan {
  type: ActionType;
  requiresBlockchain: boolean;
  priority: number;
  reasoning: string;
}

// --- LEGACY TYPES RESTORED FOR DASHBOARD COMPATIBILITY ---

export interface InternalDrives {
  curiosity: number;   
  stability: number;   
  efficiency: number;  
  social: number;      
  energy: number;      
}

export type Vector = [number, number, number, number, number, number];

export interface CognitiveLogEntry {
  id: string;
  timestamp: number;
  type: 'INTERACTION' | 'SYSTEM' | 'WEB_SYNC'; 
  input: string; 
  output: string; 
  intent?: string;
  dappContext?: any; 
  actionPlan?: ActionPlan;   
}

export interface BrainState {
  longTermMemory: Memory[];
  drives: InternalDrives; // Kept for dashboard
}