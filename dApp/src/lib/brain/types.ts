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
  attentionSpan: number;
  learningRate: number;
}

export interface MoodState {
  logic: number;
  empathy: number;
  curiosity: number;
  entropy: number;
  energy: number;
}

export interface Memory {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  concepts: string[]; 
  emotional_weight: number;
  access_count: number;
  context_vector?: number[];
  dapp_context?: DAppContext; // Renamed to match usage in CognitiveProcessor
}

export interface BlockchainMemory {
  timestamp: number;
  ipfsCid: string;
  conceptsCount: bigint;
  evolutionStage: string;
  triggerEvent: string;
}

export interface ThoughtProcess {
  phase: 'perception' | 'graph_traversal' | 'hebbian_learning' | 'strategy' | 'generation' | 'analyzing' | 'associating' | 'planning' | 'synthesizing' | 'reviewing'; // Merged types
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

export type IntentType = 'COMMAND' | 'QUERY' | 'PHILOSOPHY' | 'CASUAL' | 'TEACHING' | 'FINANCIAL_ADVICE' | 'UNKNOWN' | 'GREETING' | 'EXPLANATION' | 'DAPP_QUERY' | 'DISCOURSE' | 'STATEMENT';