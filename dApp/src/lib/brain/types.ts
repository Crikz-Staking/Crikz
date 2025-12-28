import { AtomicConcept, ConceptRelation } from '../crikzling-atomic-knowledge';

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
  role: 'user' | 'bot' | 'subconscious' | 'system'; 
  content: string;
  timestamp: number;
  concepts: string[]; 
  vector: Vector; 
  emotional_weight: number;
  access_count: number;
  dapp_context?: any;
}

export interface Goal {
  id: string;
  type: string;
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

export interface BrainState {
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  activationMap: Record<string, number>; 
  attentionFocus: string | null;        
  shortTermMemory: Memory[];
  midTermMemory: Memory[];
  longTermMemory: Memory[];
  blockchainMemories: BlockchainMemory[];
  evolutionStage: EvolutionStage;
  drives: InternalDrives; 
  activeGoals: Goal[]; 
  totalInteractions: number;
  unsavedDataCount: number;
  lastBlockchainSync: number;
  learningRate: number;
  connectivity: {
    isConnected: boolean;      
    bandwidthUsage: number;    
    stamina: number;           
    lastWebSync: number;
  };
}

// Processor Types
export interface ThoughtProcess {
  phase: 'perception' | 'spreading_activation' | 'simulation' | 'strategy' | 'generation' | 'dreaming' | 'introspection' | 'web_crawling';
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
  global_total_reputation?: bigint;
  current_block?: bigint;
}

export interface SimulationResult {
  scenario: string;
  outcomeValue: number;
  riskLevel: number;
  recommendation: string;
}

export interface DeepThoughtCycle {
  cycleIndex: number;
  focusConcepts: string[];
  retrievedMemories: Memory[];
  newAssociations: string[];
  simResult: SimulationResult | null;
}

export type IntentType = 'COMMAND' | 'QUERY' | 'PHILOSOPHY' | 'CASUAL' | 'TEACHING' | 'FINANCIAL_ADVICE' | 'UNKNOWN' | 'GREETING' | 'EXPLANATION' | 'DAPP_QUERY' | 'DISCOURSE' | 'NARRATIVE_ANALYSIS' | 'SYSTEM' | 'WEB_SYNC';

export type ActionType = 'RESPOND_NATURAL' | 'RESPOND_DAPP' | 'EXECUTE_COMMAND_RESET' | 'EXECUTE_COMMAND_SAVE' | 'SUGGEST_ACTION';

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
  type: 'INTERACTION' | 'DREAM' | 'SYSTEM' | 'WEB_SYNC'; 
  input: string; 
  output: string; 
  intent: IntentType;
  emotionalShift: number; 
  activeNodes: string[]; 
  vectors: {
    input: Vector;
    response: Vector; 
  };
  thoughtCycles: DeepThoughtCycle[]; 
  executionTimeMs: number;
  dappContext?: DAppContext; 
  actionPlan?: ActionPlan;   
}