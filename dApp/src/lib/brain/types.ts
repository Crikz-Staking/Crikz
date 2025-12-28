import { AtomicConcept, ConceptRelation } from '../crikzling-atomic-knowledge';

// --- CORE TYPES ---

export type EvolutionStage = 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';

// 6 Dimensions: [Financial, Technical, Social, Temporal, Abstract, Risk]
export type Vector = [number, number, number, number, number, number];

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
  
  // Connectivity & Stamina
  connectivity: {
    isConnected: boolean;      
    bandwidthUsage: number;    
    stamina: number;           
    lastWebSync: number;
  };
}

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

// --- LOGGING & DEBUGGING ---

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
  
  // NEW FIELDS FOR DEEP ANALYSIS
  dappContext?: DAppContext; // Snapshot of wallet/protocol state
  actionPlan?: ActionPlan;   // The decision logic output
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
  phase: 'perception' | 'spreading_activation' | 'simulation' | 'strategy' | 'generation' | 'dreaming' | 'introspection' | 'web_crawling';
  progress: number;
  subProcess?: string;
  focus?: string[];
  activeNodes?: string[];
}

export interface DeepThoughtCycle {
  cycleIndex: number;
  focusConcepts: string[];
  retrievedMemories: Memory[];
  newAssociations: string[];
  simResult: SimulationResult | null;
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

// Moved from ActionProcessor to avoid circular deps
export type ActionType = 
  | 'RESPOND_NATURAL' 
  | 'RESPOND_DAPP' 
  | 'EXECUTE_COMMAND_RESET' 
  | 'EXECUTE_COMMAND_SAVE'
  | 'SUGGEST_ACTION';

export interface ActionPlan {
  type: ActionType;
  requiresBlockchain: boolean;
  priority: number;
  reasoning: string;
  context?: any;
}