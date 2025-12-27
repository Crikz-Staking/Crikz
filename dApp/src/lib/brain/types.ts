import { AtomicConcept, ConceptRelation } from '../crikzling-atomic-knowledge';

export interface BrainState {
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  shortTermMemory: Memory[];
  midTermMemory: Memory[];
  longTermMemory: Memory[];
  blockchainMemories: BlockchainMemory[];
  evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  mood: MoodState;
  activeGoals: Goal[]; // NEW: Track what the user is trying to achieve
  totalInteractions: number;
  unsavedDataCount: number;
  lastBlockchainSync: number;
  attentionSpan: number;
  learningRate: number;
}

export interface MoodState {
  logic: number;
  empathy: number;
  curiosity: number;
  entropy: number;
  energy: number;
  confidence: number; // NEW: Affects how assertive the advice is
}

// 6 Dimensions: [Financial, Technical, Social, Temporal, Abstract, Risk]
export type Vector = [number, number, number, number, number, number];

export interface Memory {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  concepts: string[]; 
  vector: Vector; // NEW: Semantic position in thought space
  emotional_weight: number;
  access_count: number;
  dapp_context?: DAppContext;
}

export interface Goal {
  id: string;
  type: 'MAXIMIZE_YIELD' | 'BUILD_REPUTATION' | 'LEARN_CONCEPTS' | 'EXPLORE_NFT';
  progress: number; // 0-100
  priority: number;
}

export interface BlockchainMemory {
  timestamp: number;
  ipfsCid: string;
  conceptsCount: bigint;
  evolutionStage: string;
  triggerEvent: string;
}

export interface ThoughtProcess {
  phase: 'perception' | 'vectorization' | 'simulation' | 'strategy' | 'generation' | 'dreaming';
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

export type IntentType = 'COMMAND' | 'QUERY' | 'PHILOSOPHY' | 'CASUAL' | 'TEACHING' | 'FINANCIAL_ADVICE' | 'UNKNOWN' | 'GREETING' | 'EXPLANATION' | 'DAPP_QUERY' | 'DISCOURSE' | 'STATEMENT';