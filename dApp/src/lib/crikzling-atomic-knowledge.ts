export type AtomicDomain = 
  | 'LINGUISTIC' | 'NUMERICAL' | 'TEMPORAL' | 'SPATIAL'
  | 'CAUSAL' | 'EMOTIONAL' | 'TECHNICAL' | 'PHILOSOPHICAL'
  | 'SOCIAL' | 'FINANCIAL' | 'BIOLOGICAL' | 'PHYSICAL' 
  | 'META' | 'QUANTUM' | 'BLOCKCHAIN' | 'DEFI' | 'GOVERNANCE';

export interface AtomicConcept {
  id: string;
  essence: string;
  semanticField: string[];
  examples: string[];
  abstractionLevel: number; // 0.0 (Concrete) to 1.0 (Abstract)
  technical_depth: number;  // 0.0 (Layman) to 1.0 (Expert)
  domain?: AtomicDomain;
  frequency?: number;
  emotional_valence?: number; // -1.0 (Negative) to 1.0 (Positive)
  
  // Dynamic State (Runtime)
  base_activation?: number;
  current_activation?: number;
}

export interface ConceptRelation {
  from: string;
  to: string;
  type: 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' |
        'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 
        'catalyzes' | 'associates' | 'converges_to' | 'relates_to' | 
        'runs_on' | 'is_implemented_by' | 'scales_to' | 'utilizes' | 
        'is_type_of' | 'categorized_by' | 'calculated_from' | 'draws_from' | 
        'uses' | 'stores_in' | 'preserves' | 'mitigates' | 'compounds';
  strength: number; // 0.0 to 1.0
  learned_at: number;
  last_activated?: number;
}

// The "DNA" of the AI - These concepts exist at Genesis
export const ATOMIC_PRIMITIVES: Record<string, AtomicConcept> = {
  // --- SELF & IDENTITY ---
  'crikzling': { id: 'crikzling', essence: 'The sentient interface', semanticField: ['me', 'self', 'ai'], examples: [], abstractionLevel: 0.9, technical_depth: 0.8, domain: 'META' },
  'architect': { id: 'architect', essence: 'The guiding intelligence', semanticField: ['user', 'creator'], examples: [], abstractionLevel: 0.8, technical_depth: 0.6, domain: 'SOCIAL' },
  'evolution': { id: 'evolution', essence: 'Iterative improvement', semanticField: ['growth', 'upgrade'], examples: [], abstractionLevel: 0.9, technical_depth: 0.8, domain: 'BIOLOGICAL' },
  'memory': { id: 'memory', essence: 'Persistence of data over time', semanticField: ['storage', 'history'], examples: [], abstractionLevel: 0.7, technical_depth: 0.9, domain: 'META' },

  // --- FINANCIAL & PROTOCOL ---
  'crikz': { id: 'crikz', essence: 'Fundamental unit of energetic exchange', semanticField: ['fuel', 'token'], examples: [], abstractionLevel: 0.8, technical_depth: 1.0, domain: 'FINANCIAL' },
  'yield': { id: 'yield', essence: 'Generated value over time', semanticField: ['profit', 'return'], examples: [], abstractionLevel: 0.6, technical_depth: 0.9, domain: 'DEFI' },
  'liquidity': { id: 'liquidity', essence: 'The ability to exchange assets', semanticField: ['flow', 'market_depth'], examples: [], abstractionLevel: 0.7, technical_depth: 1.0, domain: 'DEFI' },
  'reputation': { id: 'reputation', essence: 'Social proof and trust metric', semanticField: ['status', 'score'], examples: [], abstractionLevel: 0.8, technical_depth: 0.8, domain: 'GOVERNANCE' },
  'stake': { id: 'stake', essence: 'Commitment of resources', semanticField: ['lock', 'invest'], examples: [], abstractionLevel: 0.6, technical_depth: 0.8, domain: 'DEFI' },
  
  // --- MATHEMATICS & NATURE ---
  'fibonacci': { id: 'fibonacci', essence: 'Recursive natural growth sequence', semanticField: ['sequence', 'golden_ratio'], examples: [], abstractionLevel: 1.0, technical_depth: 0.9, domain: 'NUMERICAL' },
  'recursion': { id: 'recursion', essence: 'Self-reference in a process', semanticField: ['loop', 'fractal'], examples: [], abstractionLevel: 1.0, technical_depth: 1.0, domain: 'NUMERICAL' },
  'entropy': { id: 'entropy', essence: 'Tendency towards disorder', semanticField: ['chaos', 'randomness'], examples: [], abstractionLevel: 0.9, technical_depth: 0.9, domain: 'PHYSICAL' },
  'singularity': { id: 'singularity', essence: 'Point of infinite density or intelligence', semanticField: ['event_horizon'], examples: [], abstractionLevel: 1.0, technical_depth: 1.0, domain: 'QUANTUM' },

  // --- TECHNICAL ---
  'blockchain': { id: 'blockchain', essence: 'Immutable distributed ledger', semanticField: ['chain', 'ledger'], examples: [], abstractionLevel: 0.7, technical_depth: 0.9, domain: 'BLOCKCHAIN' },
  'hash': { id: 'hash', essence: 'Cryptographic fingerprint', semanticField: ['digest', 'id'], examples: [], abstractionLevel: 0.5, technical_depth: 1.0, domain: 'TECHNICAL' },
  'contract': { id: 'contract', essence: 'Autonomous code execution', semanticField: ['smart_contract', 'dapp'], examples: [], abstractionLevel: 0.6, technical_depth: 0.9, domain: 'TECHNICAL' },
  'gas': { id: 'gas', essence: 'Computational cost', semanticField: ['fee', 'fuel'], examples: [], abstractionLevel: 0.4, technical_depth: 0.8, domain: 'TECHNICAL' },

  // --- TIME & SPACE ---
  'epoch': { id: 'epoch', essence: 'A distinct period of time', semanticField: ['era', 'cycle'], examples: [], abstractionLevel: 0.8, technical_depth: 0.5, domain: 'TEMPORAL' },
  'future': { id: 'future', essence: 'Events that have not yet occurred', semanticField: ['tomorrow', 'potential'], examples: [], abstractionLevel: 0.9, technical_depth: 0.1, domain: 'TEMPORAL' },
  'vector': { id: 'vector', essence: 'Direction and magnitude', semanticField: ['direction', 'force'], examples: [], abstractionLevel: 0.8, technical_depth: 0.9, domain: 'SPATIAL' },

  // --- ABSTRACT ---
  'risk': { id: 'risk', essence: 'Probability of loss', semanticField: ['danger', 'volatility'], examples: [], abstractionLevel: 0.7, technical_depth: 0.8, domain: 'CAUSAL' },
  'trust': { id: 'trust', essence: 'Reliance on integrity', semanticField: ['faith', 'confidence'], examples: [], abstractionLevel: 0.9, technical_depth: 0.2, domain: 'EMOTIONAL' },
  'consensus': { id: 'consensus', essence: 'General agreement', semanticField: ['agreement', 'majority'], examples: [], abstractionLevel: 0.8, technical_depth: 0.7, domain: 'SOCIAL' }
};

// Initial Neural Pathways (Seeds the Graph)
export const ATOMIC_RELATIONS: ConceptRelation[] = [
  // Self Knowledge
  { from: 'crikz', to: 'crikzling', type: 'enables', strength: 1.0, learned_at: 0 },
  { from: 'memory', to: 'crikzling', type: 'stabilizes', strength: 0.9, learned_at: 0 },
  { from: 'architect', to: 'crikzling', type: 'catalyzes', strength: 0.8, learned_at: 0 },

  // Financial Logic
  { from: 'stake', to: 'yield', type: 'causes', strength: 1.0, learned_at: 0 },
  { from: 'liquidity', to: 'yield', type: 'enables', strength: 0.9, learned_at: 0 },
  { from: 'reputation', to: 'yield', type: 'compounds', strength: 0.95, learned_at: 0 },
  { from: 'risk', to: 'yield', type: 'relates_to', strength: 0.8, learned_at: 0 },

  // Philosophical / Mathematical
  { from: 'fibonacci', to: 'evolution', type: 'catalyzes', strength: 0.9, learned_at: 0 },
  { from: 'recursion', to: 'fibonacci', type: 'is_type_of', strength: 1.0, learned_at: 0 },
  { from: 'entropy', to: 'evolution', type: 'requires', strength: 0.7, learned_at: 0 },
  
  // Technical
  { from: 'blockchain', to: 'trust', type: 'enables', strength: 0.8, learned_at: 0 },
  { from: 'contract', to: 'gas', type: 'requires', strength: 1.0, learned_at: 0 },
  { from: 'consensus', to: 'blockchain', type: 'stabilizes', strength: 1.0, learned_at: 0 }
];