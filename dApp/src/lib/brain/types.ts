// src/lib/brain/types.ts

import { AtomicConcept, ConceptRelation } from '../crikzling-atomic-knowledge';

// --- CORE TYPES ---

export type EvolutionStage = 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';

// 6 Dimensions: [Financial, Technical, Social, Temporal, Abstract, Risk]
export type Vector = [number, number, number, number, number, number];

export interface BrainState {
  // Knowledge Graph
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  
  // Neural State (New)
  activationMap: Record<string, number>; // Current energy of every concept (0.0 to 1.0)
  attentionFocus: string | null;        // What specific concept is he focused on?
  
  // Memory Stores
  shortTermMemory: Memory[];
  midTermMemory: Memory[];
  longTermMemory: Memory[];
  blockchainMemories: BlockchainMemory[];
  
  // Cognitive State
  evolutionStage: EvolutionStage;
  drives: InternalDrives; // Replaces simple Mood
  activeGoals: Goal[]; 
  
  // Metrics
  totalInteractions: number;
  unsavedDataCount: number;
  lastBlockchainSync: number;
  learningRate: number;
}

export interface InternalDrives {
  curiosity: number;   // Decays over time, refills on new info. High = Asks questions.
  stability: number;   // Decays on high entropy/risk. High = Calm. Low = Anxious.
  efficiency: number;  // Desire to optimize yield/gas.
  social: number;      // Desire to interact.
  energy: number;      // Processing budget.
}

export interface Memory {
  id: string;
  role: 'user' | 'bot' | 'subconscious'; // Added 'subconscious' for internal thoughts
  content: string;
  timestamp: number;
  concepts: string[]; 
  vector: Vector; 
  emotional_weight: number;
  access_count: number;
  dapp_context?: DAppContext;
}

export interface Goal {
  id: string;
  type: 'MAXIMIZE_YIELD' | 'BUILD_REPUTATION' | 'LEARN_CONCEPTS' | 'EXPLORE_NFT' | 'PROTECT_CAPITAL';
  progress: number;
  priority: number;
}

export interface BlockchainMemory {
  timestamp: number;
  ipfsCid: string;
  conceptsCount: bigint;
  evolutionStage: string;
  triggerEvent: string;
}

// --- PROCESSOR TYPES ---

export interface InputAnalysis {
  rawInput: string;
  cleanedInput: string;
  keywords: AtomicConcept[];
  intent: IntentType;
  emotionalWeight: number;
  complexity: number;
  detectedEntities: string[];
  inputVector: Vector;
}

export interface ThoughtProcess {
  phase: 'perception' | 'spreading_activation' | 'simulation' | 'strategy' | 'generation' | 'dreaming' | 'introspection';
  progress: number;
  subProcess?: string;
  focus?: string[];
  activeNodes?: string[];
}

export interface DAppContext {
  user_balance?: bigint;
  active_orders_count?: number;
  total_reputation?: bigint;
  pending_yield?: bigint;
  global_fund_balance?: bigint;
  current_block?: bigint;
}

export interface SimulationResult {
  scenario: string;
  outcomeValue: number;
  riskLevel: number;
  recommendation: string;
}

export interface IntegratedContext {
  input: InputAnalysis;
  actionPlan: any;
  memories: Memory[];
  dappState: any;
  simulation?: SimulationResult | null;
  brainStats: {
    evolutionStage: string;
    unsavedCount: number;
    drives: InternalDrives;
    currentFocus: string | null;
  };
}

export type IntentType = 
  | 'COMMAND' 
  | 'QUERY' 
  | 'PHILOSOPHY' 
  | 'CASUAL' 
  | 'TEACHING' 
  | 'FINANCIAL_ADVICE' 
  | 'UNKNOWN' 
  | 'GREETING' 
  | 'EXPLANATION' 
  | 'DAPP_QUERY' 
  | 'DISCOURSE'
  | 'NARRATIVE_ANALYSIS';