import { AtomicConcept, ConceptRelation } from '../crikzling-atomic-knowledge';

export interface BrainState {
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  shortTermMemory: Memory[];
  midTermMemory: Memory[];
  longTermMemory: Memory[];
  evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  mood: MoodState;
  totalInteractions: number;
  unsavedDataCount: number;
  lastCrystallization: number;
}

export interface MoodState {
  logic: number;     // 0-100
  empathy: number;   // 0-100
  curiosity: number; // 0-100
  entropy: number;   // 0-100 (Randomness factor)
}

export interface Memory {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  concepts: string[]; // IDs of active concepts
  semanticVector?: number[]; // Simplified embedding simulation
  emotional_weight: number;
  access_count: number; // For forgetting curve
}

export interface ThoughtProcess {
  phase: 'analyzing' | 'associating' | 'planning' | 'synthesizing' | 'reviewing';
  progress: number;
  focus: string[];
  subProcess?: string;
  activeNodes?: string[]; // For UI visualization
}

export interface CognitiveAnalysis {
  keywords: AtomicConcept[];
  intent: IntentType;
  emotionalWeight: number;
  complexity: number;
  detectedDomain: string;
}

export type IntentType = 'COMMAND' | 'QUERY' | 'PHILOSOPHY' | 'CASUAL' | 'TEACHING' | 'UNKNOWN';

export interface ActionPlan {
  action: 'SYNTHESIZE' | 'EXECUTE_COMMAND' | 'REFLECT' | 'LEARN';
  targetConcepts: string[];
  depth: number;
  tone: 'ANALYTICAL' | 'EMPATHETIC' | 'ABSTRACT' | 'INSTRUCTIVE';
}