// src/lib/crikzling-atomic-knowledge.ts

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
}

export interface ConceptRelation {
  from: string;
  to: string;
  type: 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'cause' | 'effect' | 'requires' | 'enables';
  strength: number;
  learned_at: number;
}

export const ATOMIC_PRIMITIVES: Record<string, AtomicConcept> = {
  // === CORE IDENTITY (NEW) ===
  'crikz': {
    id: 'crikz',
    essence: 'Fundamental unit of energy and fuel',
    semanticField: ['fuel', 'token', 'energy', 'unit', 'foundation'],
    examples: ['crikz is fuel', 'crikz seed'],
    abstractionLevel: 0.8,
    frequency: 1,
    technical_depth: 1.0
  },
  'learning': {
    id: 'learning',
    essence: 'Mapping new keywords to primitives',
    semanticField: ['education', 'training', 'mapping', 'expansion', 'input'],
    examples: ['data causes learning', 'learning curve'],
    abstractionLevel: 0.6,
    frequency: 1,
    technical_depth: 0.7
  },
  'growth': {
    id: 'growth',
    essence: 'Numerical increase in crystallized concepts',
    semanticField: ['increase', 'expansion', 'scaling', 'progress'],
    opposites: ['decay', 'shrinkage'],
    examples: ['growth is visible', 'interactions cause growth'],
    abstractionLevel: 0.5,
    frequency: 1,
    technical_depth: 0.5
  },
  'upgrade': {
    id: 'upgrade',
    essence: 'Transition between evolution stages',
    semanticField: ['improve', 'evolve', 'update', 'transition', 'better'],
    examples: ['upgrade to sentient', 'system upgrade'],
    abstractionLevel: 0.6,
    frequency: 1,
    technical_depth: 0.8
  },

  // === NUMBERS ===
  'zero': {
    id: 'zero',
    essence: 'Absence of quantity; neutral element',
    semanticField: ['nothing', 'null', 'empty', 'void'],
    opposites: ['infinity'],
    examples: ['0 tokens'],
    abstractionLevel: 0.3,
    frequency: 0,
    technical_depth: 0.9
  },
  'one': {
    id: 'one',
    essence: 'Unity; singularity',
    semanticField: ['unity', 'single', 'alone'],
    opposites: ['many'],
    examples: ['1 token'],
    abstractionLevel: 0.2,
    frequency: 0,
    technical_depth: 0.9
  },
  'infinity': {
    id: 'infinity',
    essence: 'Unbounded quantity',
    semanticField: ['endless', 'unlimited', 'eternal'],
    opposites: ['zero', 'finite'],
    examples: ['infinite loop'],
    abstractionLevel: 0.9,
    frequency: 0,
    technical_depth: 0.95
  },

  // === TIME ===
  'now': {
    id: 'now',
    essence: 'Present moment; block.timestamp',
    semanticField: ['present', 'current', 'immediate'],
    opposites: ['past', 'future'],
    examples: ['right now'],
    abstractionLevel: 0.4,
    frequency: 0,
    technical_depth: 0.5
  },

  // === CAUSALITY ===
  'cause': {
    id: 'cause',
    essence: 'Origin of effect',
    semanticField: ['reason', 'source', 'trigger', 'catalyst'],
    opposites: ['effect'],
    examples: ['transaction causes state change'],
    abstractionLevel: 0.7,
    frequency: 0,
    technical_depth: 0.8
  },
  'effect': {
    id: 'effect',
    essence: 'Result of cause',
    semanticField: ['result', 'outcome', 'consequence'],
    opposites: ['cause'],
    examples: ['price effect'],
    abstractionLevel: 0.7,
    frequency: 0,
    technical_depth: 0.8
  },

  // === ACTIONS ===
  'create': {
    id: 'create',
    essence: 'Bring into existence',
    semanticField: ['make', 'generate', 'produce', 'mint'],
    opposites: ['destroy'],
    examples: ['create order'],
    abstractionLevel: 0.4,
    frequency: 0,
    technical_depth: 0.7
  },
  'destroy': {
    id: 'destroy',
    essence: 'Remove from existence',
    semanticField: ['delete', 'remove', 'burn'],
    opposites: ['create'],
    examples: ['burn tokens'],
    abstractionLevel: 0.4,
    frequency: 0,
    technical_depth: 0.7
  },

  // === BLOCKCHAIN ===
  'transaction': {
    id: 'transaction',
    essence: 'State change request',
    semanticField: ['tx', 'operation', 'execution'],
    examples: ['send transaction'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.95
  },
  'gas': {
    id: 'gas',
    essence: 'Computational cost',
    semanticField: ['fee', 'cost', 'fuel', 'gwei'],
    examples: ['gas price'],
    abstractionLevel: 0.6,
    frequency: 0,
    technical_depth: 0.95
  },

  // === FIBONACCI/CRIKZ ===
  'fibonacci': {
    id: 'fibonacci',
    essence: 'Mathematical sequence sum of previous two',
    semanticField: ['golden ratio', 'phi', 'sequence', 'spiral'],
    examples: ['1, 1, 2, 3, 5, 8...'],
    abstractionLevel: 0.7,
    frequency: 0,
    technical_depth: 0.85
  },
  'reputation': {
    id: 'reputation',
    essence: 'Earned credibility',
    semanticField: ['credibility', 'influence', 'weight'],
    examples: ['reputation score'],
    abstractionLevel: 0.6,
    frequency: 0,
    technical_depth: 0.8
  },
  'yield': {
    id: 'yield',
    essence: 'Generated return',
    semanticField: ['return', 'reward', 'income', 'apr'],
    examples: ['yield farming'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.85
  },
  'order': {
    id: 'order',
    essence: 'Committed position',
    semanticField: ['position', 'stake', 'commitment'],
    examples: ['create order'],
    abstractionLevel: 0.4,
    frequency: 0,
    technical_depth: 0.9
  },
  'tier': {
    id: 'tier',
    essence: 'Hierarchical level',
    semanticField: ['level', 'rank', 'category'],
    examples: ['tier 0'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.75
  }
};

export const ATOMIC_RELATIONS: ConceptRelation[] = [
  { from: 'crikz', to: 'fuel', type: 'synonym', strength: 0.9, learned_at: 0 },
  { from: 'crikz', to: 'production', type: 'cause', strength: 1.0, learned_at: 0 },
  { from: 'learning', to: 'upgrade', type: 'cause', strength: 0.9, learned_at: 0 },
  { from: 'interactions', to: 'growth', type: 'cause', strength: 0.8, learned_at: 0 },
  { from: 'gas', to: 'transaction', type: 'requires', strength: 1.0, learned_at: 0 },
  { from: 'order', to: 'reputation', type: 'cause', strength: 0.95, learned_at: 0 },
  { from: 'reputation', to: 'yield', type: 'enables', strength: 0.9, learned_at: 0 },
  { from: 'tier', to: 'fibonacci', type: 'requires', strength: 0.8, learned_at: 0 }
];

export const LEARNING_STAGES = [
  { stage: 'GENESIS', threshold: 0 },
  { stage: 'SENTIENT', threshold: 10 }, 
  { stage: 'SAPIENT', threshold: 50 },
  { stage: 'TRANSCENDENT', threshold: 200 }
];