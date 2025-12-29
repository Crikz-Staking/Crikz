import { AtomicConcept, ConceptRelation } from '../crikzling-atomic-knowledge';

export type EvolutionStage = 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
export type Vector = [number, number, number, number, number, number];

export type PersonaArchetype = 'ANALYST' | 'MYSTIC' | 'GUARDIAN' | 'GLITCH' | 'OPERATOR';

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

// --- HIERARCHICAL STRUCTURES ---
export interface ConceptCluster {
  id: string;
  centerConcept: string; // The "Topic"
  relatedNodes: string[]; // The "Details"
  strength: number;       // How tight is this cluster?
  lastActivated: number;
}

// --- MULTI-HEAD ATTENTION ---
export interface AttentionState {
  semanticFocus: string | null;  // What are we talking about? (e.g., "yield")
  emotionalFocus: string | null; // What do we feel? (e.g., "anxiety")
  goalFocus: string | null;      // What do we want? (e.g., "teach")
  workingCluster: ConceptCluster | null; // Current abstract thought
}

export interface BrainState {
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  activationMap: Record<string, number>; 
  
  // NOTE: attentionFocus removed, replaced by attentionState
  attentionState: AttentionState;       
  generatedClusters: ConceptCluster[]; 

  shortTermMemory: Memory[];
  midTermMemory: Memory[];
  longTermMemory: Memory[];
  blockchainMemories: BlockchainMemory[];
  
  evolutionStage: EvolutionStage;
  currentArchetype: PersonaArchetype; 
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

export interface ThoughtProcess {
  phase: 'perception' | 'spreading_activation' | 'clustering' | 'criticism' | 'strategy' | 'generation' | 'dreaming' | 'introspection' | 'web_crawling';
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

export interface LogicPath {
  nodes: string[];
  relations: string[];
  strength: number;
}

export interface SimulationResult {
  scenario: string;
  outcomeValue: number;
  riskLevel: number;
  recommendation: string;
  logicPath?: LogicPath;
}

export interface DeepThoughtCycle {
  cycleIndex: number;
  focusConcepts: string[];
  retrievedMemories: Memory[];
  newAssociations: string[];
  simResult: SimulationResult | null;
}

export type IntentType = 
  | 'COMMAND' | 'QUERY' | 'PHILOSOPHY' | 'CASUAL' | 'TEACHING' 
  | 'FINANCIAL_ADVICE' | 'UNKNOWN' | 'GREETING' | 'EXPLANATION' 
  | 'DAPP_QUERY' | 'DISCOURSE' | 'NARRATIVE_ANALYSIS' | 'SYSTEM' 
  | 'WEB_SYNC' | 'TRANSACTION_REQUEST' | 'SECURITY_ALERT'
  | 'MATH_CALCULATION';

export type CapabilityType = 
  | 'NONE' | 'READ_CHAIN' | 'WRITE_CHAIN' | 'ANALYZE_DATA' 
  | 'GENERATE_KNOWLEDGE' | 'SYSTEM_CONTROL' | 'EXTERNAL_IO'
  | 'CALCULATE' | 'INFER_RELATIONSHIP';

export type SafetyRating = 'SAFE' | 'UNSAFE' | 'ETHICALLY_AMBIGUOUS' | 'SENSITIVE_DATA';

export type ActionType = 'RESPOND_NATURAL' | 'RESPOND_DAPP' | 'EXECUTE_COMMAND_RESET' | 'EXECUTE_COMMAND_SAVE' | 'SUGGEST_ACTION' | 'REFUSE_UNSAFE' | 'RESPOND_LOGICAL_INFERENCE';

export interface ActionPlan {
  type: ActionType;
  requiresBlockchain: boolean;
  priority: number;
  reasoning: string;
  context?: any;
}

export interface GrammarStructure {
  subject: string | null;
  action: string | null; 
  object: string | null; 
  modifiers: string[];
  isQuestion: boolean;
  isImperative: boolean; 
  tense: 'PAST' | 'PRESENT' | 'FUTURE';
}

export interface InputAnalysis {
  rawInput: string;
  cleanedInput: string;
  keywords: AtomicConcept[];
  intent: IntentType;
  emotionalWeight: number;
  sentiment: number;
  complexity: number;
  detectedEntities: string[];
  inputVector: Vector;
  grammar: GrammarStructure;
  requestedCapability: CapabilityType;
  verbosityNeeded: number; 
  safety: {
    rating: SafetyRating;
    flaggedTerms: string[];
    reason?: string;
  };
}

export interface DAppIntegratedState {
  hasActiveOrders: boolean;
  totalReputation: string;
  availableYield: string;
  fundBalance: string;
  orders: any[];
}

export interface IntegratedContext {
  input: InputAnalysis;
  actionPlan: ActionPlan;
  memories: Memory[];
  blockchainHistory: BlockchainMemory[];
  dappState: DAppIntegratedState | null;
  deepContext: DeepThoughtCycle[];
  brainStats: {
    evolutionStage: string;
    unsavedCount: number;
    drives: InternalDrives;
    attentionState: AttentionState; // Corrected: Uses attentionState, not currentFocus
    currentArchetype: PersonaArchetype;
  };
  computationResult?: string | number | null;
  inferredLogic?: string; 
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