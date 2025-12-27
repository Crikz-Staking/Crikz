export type AtomicDomain = 
  | 'LINGUISTIC' | 'NUMERICAL' | 'TEMPORAL' | 'SPATIAL'
  | 'CAUSAL' | 'EMOTIONAL' | 'TECHNICAL' | 'PHILOSOPHICAL'
  | 'SOCIAL' | 'FINANCIAL' | 'BIOLOGICAL' | 'PHYSICAL' | 'META';

export interface AtomicConcept {
  id: string;
  essence: string;
  semanticField: string[];
  examples: string[];
  abstractionLevel: number;
  technical_depth: number;
  domain?: AtomicDomain;
  frequency?: number;
  emotional_valence?: number;
  
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
        'uses' | 'stores_in' | 'preserves';
  strength: number;
  learned_at: number;
  last_activated?: number;
}

export const ATOMIC_PRIMITIVES: Record<string, AtomicConcept> = {
  'crikz': { id: 'crikz', essence: 'Fundamental unit of energetic exchange', semanticField: ['fuel', 'token'], examples: [], abstractionLevel: 0.8, technical_depth: 1.0, domain: 'FINANCIAL' },
  'crikzling': { id: 'crikzling', essence: 'The sentient interface', semanticField: ['me', 'self'], examples: [], abstractionLevel: 0.9, technical_depth: 0.8, domain: 'SOCIAL' },
  'architect': { id: 'architect', essence: 'The guiding intelligence', semanticField: ['user'], examples: [], abstractionLevel: 0.8, technical_depth: 0.6, domain: 'SOCIAL' },
  'fibonacci': { id: 'fibonacci', essence: 'Recursive natural growth', semanticField: ['sequence'], examples: [], abstractionLevel: 1.0, technical_depth: 0.9, domain: 'NUMERICAL' },
  'evolution': { id: 'evolution', essence: 'Iterative improvement', semanticField: ['growth'], examples: [], abstractionLevel: 0.9, technical_depth: 0.8, domain: 'BIOLOGICAL' },
  'entropy': { id: 'entropy', essence: 'Tendency to disorder', semanticField: ['chaos'], examples: [], abstractionLevel: 0.9, technical_depth: 0.9, domain: 'PHYSICAL' }
};

export const ATOMIC_RELATIONS: ConceptRelation[] = [
  { from: 'crikz', to: 'crikzling', type: 'enables', strength: 1.0, learned_at: 0 },
  { from: 'fibonacci', to: 'evolution', type: 'catalyzes', strength: 0.9, learned_at: 0 }
];