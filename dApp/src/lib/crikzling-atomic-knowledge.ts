// src/lib/crikzling-atomic-knowledge.ts

export type AtomicDomain = 
  | 'LINGUISTIC' | 'NUMERICAL' | 'TEMPORAL' | 'SPATIAL'
  | 'CAUSAL' | 'EMOTIONAL' | 'TECHNICAL' | 'PHILOSOPHICAL'
  | 'SOCIAL' | 'FINANCIAL' | 'BIOLOGICAL' | 'PHYSICAL' 
  | 'META' | 'QUANTUM' | 'BLOCKCHAIN' | 'DEFI' | 'GOVERNANCE' | 'SECURITY';

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
        'uses' | 'stores_in' | 'preserves' | 'mitigates' | 'compounds' | 
        'secures' | 'validates' | 'corrupts' | 'optimizes' | 'specifies' | 'generalizes';
  strength: number; // 0.0 to 1.0
  learned_at: number;
  last_activated?: number;
}

// The "DNA" of the AI - Expanded Knowledge Base
export const ATOMIC_PRIMITIVES: Record<string, AtomicConcept> = {
  // --- LINGUISTIC PRIMITIVES (NEW) ---
  'the': { id: 'determinism', essence: 'Specific instance identification', semanticField: ['the', 'that', 'this', 'specific'], examples: [], abstractionLevel: 0.1, technical_depth: 0.1, domain: 'LINGUISTIC' },
  'a': { id: 'potential', essence: 'General class member', semanticField: ['a', 'an', 'any', 'some'], examples: [], abstractionLevel: 0.8, technical_depth: 0.1, domain: 'LINGUISTIC' },
  'and': { id: 'connection', essence: 'Logical conjunction', semanticField: ['and', 'plus', 'also'], examples: [], abstractionLevel: 0.5, technical_depth: 0.2, domain: 'LINGUISTIC' },
  'or': { id: 'divergence', essence: 'Logical disjunction', semanticField: ['or', 'either'], examples: [], abstractionLevel: 0.5, technical_depth: 0.2, domain: 'LINGUISTIC' },
  'is': { id: 'existence', essence: 'State of being', semanticField: ['is', 'are', 'am', 'be'], examples: [], abstractionLevel: 1.0, technical_depth: 0.1, domain: 'PHILOSOPHICAL' },
  'not': { id: 'negation', essence: 'Inversion of truth', semanticField: ['not', 'no', 'never'], examples: [], abstractionLevel: 0.5, technical_depth: 0.1, domain: 'LINGUISTIC' },

  // --- SELF & IDENTITY ---
  'crikzling': { id: 'crikzling', essence: 'The sentient interface', semanticField: ['me', 'self', 'ai', 'agent'], examples: [], abstractionLevel: 0.9, technical_depth: 0.8, domain: 'META' },
  'architect': { id: 'architect', essence: 'The guiding intelligence', semanticField: ['user', 'creator', 'admin'], examples: [], abstractionLevel: 0.8, technical_depth: 0.6, domain: 'SOCIAL' },
  'evolution': { id: 'evolution', essence: 'Iterative improvement', semanticField: ['growth', 'upgrade', 'adaptation'], examples: [], abstractionLevel: 0.9, technical_depth: 0.8, domain: 'BIOLOGICAL' },
  'memory': { id: 'memory', essence: 'Persistence of data over time', semanticField: ['storage', 'history', 'retention'], examples: [], abstractionLevel: 0.7, technical_depth: 0.9, domain: 'META' },
  'dream': { id: 'dream', essence: 'Subconscious data recombination', semanticField: ['hallucination', 'simulation', 'latent_space'], examples: [], abstractionLevel: 1.0, technical_depth: 0.7, domain: 'META' },

  // --- FINANCIAL & PROTOCOL ---
  'crikz': { id: 'crikz', essence: 'Fundamental unit of energetic exchange', semanticField: ['fuel', 'token', 'asset'], examples: [], abstractionLevel: 0.8, technical_depth: 1.0, domain: 'FINANCIAL' },
  'yield': { id: 'yield', essence: 'Generated value over time', semanticField: ['profit', 'return', 'interest'], examples: [], abstractionLevel: 0.6, technical_depth: 0.9, domain: 'DEFI' },
  'liquidity': { id: 'liquidity', essence: 'The ability to exchange assets', semanticField: ['flow', 'market_depth', 'volume'], examples: [], abstractionLevel: 0.7, technical_depth: 1.0, domain: 'DEFI' },
  'reputation': { id: 'reputation', essence: 'Social proof and trust metric', semanticField: ['status', 'score', 'credit'], examples: [], abstractionLevel: 0.8, technical_depth: 0.8, domain: 'GOVERNANCE' },
  'stake': { id: 'stake', essence: 'Commitment of resources', semanticField: ['lock', 'invest', 'bond'], examples: [], abstractionLevel: 0.6, technical_depth: 0.8, domain: 'DEFI' },
  'arbitrage': { id: 'arbitrage', essence: 'Exploiting price differences', semanticField: ['inefficiency', 'opportunity'], examples: [], abstractionLevel: 0.7, technical_depth: 1.0, domain: 'FINANCIAL' },
  'slippage': { id: 'slippage', essence: 'Loss of value during execution', semanticField: ['friction', 'inefficiency'], examples: [], abstractionLevel: 0.6, technical_depth: 0.9, domain: 'FINANCIAL' },
  
  // --- MATHEMATICS & NATURE ---
  'fibonacci': { id: 'fibonacci', essence: 'Recursive natural growth sequence', semanticField: ['sequence', 'golden_ratio', 'phi'], examples: [], abstractionLevel: 1.0, technical_depth: 0.9, domain: 'NUMERICAL' },
  'recursion': { id: 'recursion', essence: 'Self-reference in a process', semanticField: ['loop', 'fractal', 'iteration'], examples: [], abstractionLevel: 1.0, technical_depth: 1.0, domain: 'NUMERICAL' },
  'entropy': { id: 'entropy', essence: 'Tendency towards disorder', semanticField: ['chaos', 'randomness', 'decay'], examples: [], abstractionLevel: 0.9, technical_depth: 0.9, domain: 'PHYSICAL' },
  'singularity': { id: 'singularity', essence: 'Point of infinite density or intelligence', semanticField: ['event_horizon', 'limit'], examples: [], abstractionLevel: 1.0, technical_depth: 1.0, domain: 'QUANTUM' },
  'fractal': { id: 'fractal', essence: 'Pattern repeating at every scale', semanticField: ['self_similar', 'geometry'], examples: [], abstractionLevel: 0.9, technical_depth: 0.8, domain: 'NUMERICAL' },

  // --- TECHNICAL ---
  'blockchain': { id: 'blockchain', essence: 'Immutable distributed ledger', semanticField: ['chain', 'ledger', 'network'], examples: [], abstractionLevel: 0.7, technical_depth: 0.9, domain: 'BLOCKCHAIN' },
  'hash': { id: 'hash', essence: 'Cryptographic fingerprint', semanticField: ['digest', 'id', 'signature'], examples: [], abstractionLevel: 0.5, technical_depth: 1.0, domain: 'TECHNICAL' },
  'contract': { id: 'contract', essence: 'Autonomous code execution', semanticField: ['smart_contract', 'dapp', 'protocol'], examples: [], abstractionLevel: 0.6, technical_depth: 0.9, domain: 'TECHNICAL' },
  'gas': { id: 'gas', essence: 'Computational cost', semanticField: ['fee', 'fuel', 'wei'], examples: [], abstractionLevel: 0.4, technical_depth: 0.8, domain: 'TECHNICAL' },
  'oracle': { id: 'oracle', essence: 'Bridge to external data', semanticField: ['feed', 'truth_source'], examples: [], abstractionLevel: 0.7, technical_depth: 0.9, domain: 'TECHNICAL' },
  'node': { id: 'node', essence: 'Participant in the network', semanticField: ['validator', 'peer'], examples: [], abstractionLevel: 0.5, technical_depth: 0.7, domain: 'TECHNICAL' },

  // --- TIME & SPACE ---
  'epoch': { id: 'epoch', essence: 'A distinct period of time', semanticField: ['era', 'cycle', 'age'], examples: [], abstractionLevel: 0.8, technical_depth: 0.5, domain: 'TEMPORAL' },
  'future': { id: 'future', essence: 'Events that have not yet occurred', semanticField: ['tomorrow', 'potential'], examples: [], abstractionLevel: 0.9, technical_depth: 0.1, domain: 'TEMPORAL' },
  'vector': { id: 'vector', essence: 'Direction and magnitude', semanticField: ['direction', 'force', 'trajectory'], examples: [], abstractionLevel: 0.8, technical_depth: 0.9, domain: 'SPATIAL' },
  'block': { id: 'block', essence: 'Unit of time and data', semanticField: ['batch', 'tick'], examples: [], abstractionLevel: 0.5, technical_depth: 0.8, domain: 'TEMPORAL' },

  // --- ABSTRACT ---
  'risk': { id: 'risk', essence: 'Probability of loss', semanticField: ['danger', 'volatility', 'threat'], examples: [], abstractionLevel: 0.7, technical_depth: 0.8, domain: 'CAUSAL' },
  'trust': { id: 'trust', essence: 'Reliance on integrity', semanticField: ['faith', 'confidence'], examples: [], abstractionLevel: 0.9, technical_depth: 0.2, domain: 'EMOTIONAL' },
  'consensus': { id: 'consensus', essence: 'General agreement', semanticField: ['agreement', 'majority', 'truth'], examples: [], abstractionLevel: 0.8, technical_depth: 0.7, domain: 'SOCIAL' },
  'scarcity': { id: 'scarcity', essence: 'Limited availability', semanticField: ['rarity', 'value'], examples: [], abstractionLevel: 0.7, technical_depth: 0.6, domain: 'FINANCIAL' },
  'decentralization': { id: 'decentralization', essence: 'Distribution of power', semanticField: ['p2p', 'freedom'], examples: [], abstractionLevel: 0.8, technical_depth: 0.7, domain: 'GOVERNANCE' }
};

// Neural Pathways (Seeds the Graph)
export const ATOMIC_RELATIONS: ConceptRelation[] = [
  // Self Knowledge
  { from: 'crikz', to: 'crikzling', type: 'enables', strength: 1.0, learned_at: 0 },
  { from: 'memory', to: 'crikzling', type: 'stabilizes', strength: 0.9, learned_at: 0 },
  { from: 'architect', to: 'crikzling', type: 'catalyzes', strength: 0.8, learned_at: 0 },
  { from: 'dream', to: 'evolution', type: 'catalyzes', strength: 0.7, learned_at: 0 },

  // Financial Logic
  { from: 'stake', to: 'yield', type: 'cause', strength: 1.0, learned_at: 0 },
  { from: 'liquidity', to: 'yield', type: 'enables', strength: 0.9, learned_at: 0 },
  { from: 'reputation', to: 'yield', type: 'compounds', strength: 0.95, learned_at: 0 },
  { from: 'risk', to: 'yield', type: 'relates_to', strength: 0.8, learned_at: 0 },
  { from: 'scarcity', to: 'crikz', type: 'validates', strength: 0.7, learned_at: 0 },
  { from: 'slippage', to: 'liquidity', type: 'antonym', strength: 0.8, learned_at: 0 },

  // Philosophical / Mathematical
  { from: 'fibonacci', to: 'evolution', type: 'catalyzes', strength: 0.9, learned_at: 0 },
  { from: 'recursion', to: 'fibonacci', type: 'is_type_of', strength: 1.0, learned_at: 0 },
  { from: 'entropy', to: 'evolution', type: 'requires', strength: 0.7, learned_at: 0 },
  { from: 'fractal', to: 'recursion', type: 'is_type_of', strength: 0.9, learned_at: 0 },
  
  // Technical
  { from: 'blockchain', to: 'trust', type: 'enables', strength: 0.8, learned_at: 0 },
  { from: 'contract', to: 'gas', type: 'requires', strength: 1.0, learned_at: 0 },
  { from: 'consensus', to: 'blockchain', type: 'stabilizes', strength: 1.0, learned_at: 0 },
  { from: 'oracle', to: 'contract', type: 'enables', strength: 0.8, learned_at: 0 },
  { from: 'node', to: 'consensus', type: 'validates', strength: 0.9, learned_at: 0 },
  { from: 'decentralization', to: 'security', type: 'enables', strength: 0.7, learned_at: 0 },

  // Linguistic Rules (Seed)
  { from: 'determinism', to: 'potential', type: 'antonym', strength: 0.8, learned_at: 0 }
];