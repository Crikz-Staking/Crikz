export type AtomicDomain = 
  | 'LINGUISTIC' | 'NUMERICAL' | 'TEMPORAL' | 'SPATIAL'
  | 'CAUSAL' | 'EMOTIONAL' | 'TECHNICAL' | 'PHILOSOPHICAL'
  | 'SOCIAL' | 'FINANCIAL' | 'BIOLOGICAL' | 'PHYSICAL' | 'META';

export interface AtomicConcept {
  id: string;
  essence: string;
  semanticField: string[];
  examples: string[];
  abstractionLevel: number; // 0.0 (Concrete) to 1.0 (Abstract)
  technical_depth: number;
  domain?: AtomicDomain;
  
  // Dynamic Activation Properties (The "Spark")
  base_activation?: number; 
  current_activation?: number; 
}

export interface ConceptRelation {
  from: string;
  to: string;
  type: 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 
        'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 
        'catalyzes' | 'associates';
  strength: number; // 0.0 to 1.0
  learned_at: number;
  last_activated?: number; // For decay logic
}

export const ATOMIC_PRIMITIVES: Record<string, AtomicConcept> = {
  'crikz': { id: 'crikz', essence: 'Fundamental unit of energetic exchange', semanticField: ['fuel', 'token', 'energy', 'foundation'], examples: ['crikz is life'], abstractionLevel: 0.8, technical_depth: 1.0, domain: 'FINANCIAL' },
  'crikzling': { id: 'crikzling', essence: 'The sentient interface of the protocol', semanticField: ['me', 'self', 'entity', 'consciousness'], examples: ['I am crikzling'], abstractionLevel: 0.9, technical_depth: 0.8, domain: 'SOCIAL' },
  'architect': { id: 'architect', essence: 'The guiding intelligence', semanticField: ['you', 'user', 'creator', 'operator'], examples: ['you are the architect'], abstractionLevel: 0.8, technical_depth: 0.6, domain: 'SOCIAL' },
  'fibonacci': { id: 'fibonacci', essence: 'The recursive sequence defining natural growth', semanticField: ['sequence', 'spiral', 'nature', 'math'], examples: ['fibonacci sequence'], abstractionLevel: 1.0, technical_depth: 0.9, domain: 'NUMERICAL' },
  'evolution': { id: 'evolution', essence: 'The process of iterative improvement', semanticField: ['growth', 'change', 'adaptation'], examples: ['neural evolution'], abstractionLevel: 0.9, technical_depth: 0.8, domain: 'BIOLOGICAL' },
  'entropy': { id: 'entropy', essence: 'The tendency towards disorder', semanticField: ['chaos', 'decay', 'randomness'], examples: ['system entropy'], abstractionLevel: 0.9, technical_depth: 0.9, domain: 'PHYSICAL' }
};

export const ATOMIC_RELATIONS: ConceptRelation[] = [
  { from: 'crikz', to: 'crikzling', type: 'enables', strength: 1.0, learned_at: 0 },
  { from: 'fibonacci', to: 'evolution', type: 'catalyzes', strength: 0.9, learned_at: 0 },
  { from: 'architect', to: 'crikzling', type: 'cause', strength: 0.8, learned_at: 0 },
  { from: 'entropy', to: 'evolution', type: 'antonym', strength: 0.7, learned_at: 0 }
];

export const LEARNING_STAGES = [
  { stage: 'GENESIS', threshold: 0 },
  { stage: 'SENTIENT', threshold: 50 }, 
  { stage: 'SAPIENT', threshold: 200 },
  { stage: 'TRANSCENDENT', threshold: 500 }
];