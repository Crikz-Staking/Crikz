// src/lib/brain/types.ts

export type EvolutionStage = 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
export type Vector = [number, number, number, number, number, number];

export interface InternalDrives {
  curiosity: number;   
  stability: number;   
  efficiency: number;  
  social: number;      
  energy: number;      
}

export interface Memory {
  id: string;
  role: 'user' | 'bot' | 'system'; 
  content: string;
  timestamp: number;
  // Vector embedding for RAG (384 dimensions for all-MiniLM-L6-v2)
  embedding?: number[]; 
  // Legacy vector for UI stats (6 dimensions)
  vector: Vector; 
  emotional_weight: number;
  dapp_context?: any;
}

export interface BrainState {
  evolutionStage: EvolutionStage;
  totalInteractions: number;
  unsavedDataCount: number;
  
  // Connectivity stats for the UI
  connectivity: {
    isConnected: boolean;      
    bandwidthUsage: number;    
    stamina: number;           
    lastWebSync: number;
  };

  // Legacy support for UI components that expect these
  drives: InternalDrives;
  longTermMemory: Memory[];
}

export interface DAppContext {
  user_balance?: bigint;
  active_orders_count?: number;
  total_reputation?: bigint;
  pending_yield?: bigint;
  global_fund_balance?: bigint;
  global_total_reputation?: bigint;
}

export type ActionType = 'RESPOND_NATURAL' | 'RESPOND_DAPP' | 'EXECUTE_COMMAND_SAVE';

export interface ActionPlan {
  type: ActionType;
  requiresBlockchain: boolean;
  priority: number;
  reasoning: string;
  context?: any;
}

export interface CognitiveLogEntry {
  id: string;
  timestamp: number;
  type: 'INTERACTION' | 'SYSTEM' | 'WEB_SYNC'; 
  input: string; 
  output: string; 
  intent?: string;
  // UI Visualizers expect these
  vectors: {
    input: Vector;
    response: Vector; 
  };
  thoughtCycles: any[]; // Kept for UI compatibility
  dappContext?: DAppContext; 
  actionPlan?: ActionPlan;   
}