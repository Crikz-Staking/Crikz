import { AtomicConcept, ConceptRelation } from '../crikzling-atomic-knowledge';

// --- CORE TYPES ---

export type EvolutionStage = 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';

// 6 Dimensions: [Financial, Technical, Social, Temporal, Abstract, Risk]
// Values usually range from 0.0 to 1.0 (or -1.0 to 1.0 for Risk)
export type Vector = [number, number, number, number, number, number];

export interface BrainState {
  // Knowledge Graph
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  
  // Memory Stores
  shortTermMemory: Memory[];
  midTermMemory: Memory[];
  longTermMemory: Memory[];
  blockchainMemories: BlockchainMemory[]; // Immutable history
  
  // Cognitive State
  evolutionStage: EvolutionStage;
  mood: MoodState;
  activeGoals: Goal[]; 
  
  // Metrics
  totalInteractions: number;
  unsavedDataCount: number;
  lastBlockchainSync: number;
  attentionSpan: number; // in seconds
  learningRate: number;  // 0.0 to 1.0
}

export interface MoodState {
  logic: number;      // 0-100: Influences Analytical responses
  empathy: number;    // 0-100: Influences Emotional connection
  curiosity: number;  // 0-100: Drives Question generation
  entropy: number;    // 0-100: Drives "Dreaming" and randomness
  energy: number;     // 0-100: Processing power budget
  confidence: number; // 0-100: Assertiveness of advice
}

export interface Memory {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  concepts: string[]; 
  vector: Vector; // Semantic position in thought space
  emotional_weight: number;
  access_count: number;
  dapp_context?: DAppContext;
}

export interface Goal {
  id: string;
  type: 'MAXIMIZE_YIELD' | 'BUILD_REPUTATION' | 'LEARN_CONCEPTS' | 'EXPLORE_NFT' | 'PROTECT_CAPITAL';
  progress: number; // 0-100
  priority: number; // 1-10
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
  phase: 'perception' | 'vectorization' | 'simulation' | 'strategy' | 'generation' | 'dreaming';
  progress: number; // 0-100
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
  riskLevel: number; // 0.0 (Safe) to 1.0 (Rekt)
  recommendation: string;
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
  | 'DISCOURSE';