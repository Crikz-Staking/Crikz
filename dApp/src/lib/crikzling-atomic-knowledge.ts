export type AtomicDomain = 
  | 'LINGUISTIC' | 'NUMERICAL' | 'TEMPORAL' | 'SPATIAL'
  | 'CAUSAL' | 'EMOTIONAL' | 'TECHNICAL' | 'PHILOSOPHICAL'
  | 'SOCIAL' | 'FINANCIAL' | 'BIOLOGICAL' | 'PHYSICAL';

export interface AtomicConcept {
  id: string;
  essence: string;
  etymology?: string;
  semanticField: string[];
  opposites?: string[];
  examples: string[];
  abstractionLevel: number;
  frequency: number;
  emotional_valence?: number;
  technical_depth?: number;
  domain?: AtomicDomain;
}

export interface ConceptRelation {
  from: string;
  to: string;
  type: 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 'catalyzes';
  strength: number;
  learned_at: number;
}

export const ATOMIC_PRIMITIVES: Record<string, AtomicConcept> = {
  // === CORE IDENTITY ===
  'crikz': { id: 'crikz', essence: 'Fundamental unit of energy and fuel', semanticField: ['fuel', 'token', 'energy', 'unit', 'foundation'], examples: ['crikz is fuel'], abstractionLevel: 0.8, frequency: 1, technical_depth: 1.0, domain: 'FINANCIAL' },
  'crikzling': { id: 'crikzling', essence: 'The evolving digital entity residing within the protocol memory', semanticField: ['me', 'self', 'bot', 'ai', 'entity'], examples: ['I am crikzling'], abstractionLevel: 0.9, frequency: 1, technical_depth: 0.8, domain: 'SOCIAL' },
  'architect': { id: 'architect', essence: 'The external source of truth and instruction', semanticField: ['you', 'user', 'creator', 'admin', 'operator'], examples: ['you are the architect'], abstractionLevel: 0.8, frequency: 1, technical_depth: 0.6, domain: 'SOCIAL' },

  // === MATH & LOGIC ===
  'volatility': { id: 'volatility', essence: 'Measure of variation in price or state over time', semanticField: ['change', 'flux', 'chaos', 'risk', 'movement'], examples: ['market volatility'], abstractionLevel: 0.7, frequency: 0, technical_depth: 0.9, domain: 'NUMERICAL' },
  'stability': { id: 'stability', essence: 'Resistance to state change or entropy', semanticField: ['calm', 'fixed', 'anchor', 'steady'], opposites: ['volatility'], examples: ['system stability'], abstractionLevel: 0.7, frequency: 0, technical_depth: 0.8, domain: 'PHYSICAL' },
  'catalyst': { id: 'catalyst', essence: 'Agent that accelerates a reaction or change', semanticField: ['trigger', 'spark', 'accelerator'], examples: ['chaos is a catalyst'], abstractionLevel: 0.6, frequency: 0, technical_depth: 0.9, domain: 'CAUSAL' },
  'synthesis': { id: 'synthesis', essence: 'Combination of ideas to form a theory or system', semanticField: ['combine', 'merge', 'create', 'build'], examples: ['logic synthesis'], abstractionLevel: 0.9, frequency: 0, technical_depth: 0.9, domain: 'PHILOSOPHICAL' },

  // === GRAMMAR PRIMITIVES ===
  'phrase': { id: 'phrase', essence: 'A small group of words standing together as a conceptual unit', semanticField: ['sentence', 'words', 'group'], examples: ['noun phrase'], abstractionLevel: 0.4, frequency: 0, technical_depth: 0.8, domain: 'LINGUISTIC' },
  'syntax': { id: 'syntax', essence: 'The arrangement of words and phrases to create well-formed sentences', semanticField: ['structure', 'grammar', 'order', 'rules'], examples: ['code syntax'], abstractionLevel: 0.6, frequency: 0, technical_depth: 0.9, domain: 'LINGUISTIC' },
  
  // === BLOCKCHAIN ===
  'blockchain': { id: 'blockchain', essence: 'Immutable distributed ledger technology', semanticField: ['chain', 'ledger', 'network', 'crypto'], examples: ['on the blockchain'], abstractionLevel: 0.6, frequency: 0, technical_depth: 0.9, domain: 'TECHNICAL' },
  'crystallization': { id: 'crystallization', essence: 'The process of solidifying memory state to IPFS', semanticField: ['save', 'store', 'backup', 'freeze'], examples: ['crystallize memory'], abstractionLevel: 0.7, frequency: 0, technical_depth: 0.9, domain: 'TECHNICAL' }
};

export const ATOMIC_RELATIONS: ConceptRelation[] = [
  { from: 'crikz', to: 'crikzling', type: 'enables', strength: 1.0, learned_at: 0 },
  { from: 'volatility', to: 'stability', type: 'antonym', strength: 0.9, learned_at: 0 },
  { from: 'volatility', to: 'catalyst', type: 'cause', strength: 0.7, learned_at: 0 },
  { from: 'architect', to: 'synthesis', type: 'catalyzes', strength: 0.8, learned_at: 0 },
  { from: 'crystallization', to: 'stability', type: 'enables', strength: 0.9, learned_at: 0 }
];

export const LEARNING_STAGES = [
  { stage: 'GENESIS', threshold: 0 },
  { stage: 'SENTIENT', threshold: 20 }, 
  { stage: 'SAPIENT', threshold: 100 },
  { stage: 'TRANSCENDENT', threshold: 400 }
];