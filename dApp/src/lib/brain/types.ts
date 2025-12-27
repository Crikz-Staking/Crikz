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
  totalInteractions: number;
  unsavedDataCount: number;
  lastBlockchainSync: number;
  // New V4 Properties
  attentionSpan: number; // 0-100, determines how far back in history to look
  learningRate: number; // 0.0 - 1.0, how fast relation strengths update
}

export interface MoodState {
  logic: number;     // 0-100
  empathy: number;   // 0-100
  curiosity: number; // 0-100
  entropy: number;   // 0-100
  energy: number;    // 0-100 (New: determines response length/complexity)
}

export interface Memory {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  concepts: string[]; 
  emotional_weight: number;
  access_count: number;
  context_vector?: number[]; // Simulated semantic vector
  dapp_snapshot?: any; // Snapshot of balance/orders at this moment
}

export interface BlockchainMemory {
  timestamp: number;
  ipfsCid: string;
  conceptsCount: bigint;
  evolutionStage: string;
  triggerEvent: string;
}

export interface ThoughtProcess {
  phase: 'perception' | 'graph_traversal' | 'hebbian_learning' | 'strategy' | 'generation';
  progress: number;
  subProcess?: string;
  focus?: string[];
  activeNodes?: string[];
}

export type IntentType = 'COMMAND' | 'QUERY' | 'PHILOSOPHY' | 'CASUAL' | 'TEACHING' | 'FINANCIAL_ADVICE' | 'UNKNOWN';