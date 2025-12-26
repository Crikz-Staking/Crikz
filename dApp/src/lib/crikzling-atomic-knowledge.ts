// src/lib/crikzling-atomic-knowledge.ts
// REVOLUTIONARY: Atomic-level understanding system for true learning

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

export interface ContextPattern {
  pattern: string;
  frequency: number;
  contexts: string[];
  extracted_relations: ConceptRelation[];
}

// ==========================================
// ATOMIC KNOWLEDGE: FUNDAMENTAL BUILDING BLOCKS
// ==========================================

export const ATOMIC_PRIMITIVES: Record<string, AtomicConcept> = {
  // === NUMBERS (Foundation of Math/Finance) ===
  'zero': {
    id: 'zero',
    essence: 'Absence of quantity; neutral element; origin point',
    etymology: 'Arabic: sifr (empty)',
    semanticField: ['nothing', 'null', 'empty', 'void', 'absence'],
    opposites: ['infinity', 'something'],
    examples: ['0 tokens', 'no balance', 'empty set'],
    abstractionLevel: 0.3,
    frequency: 0,
    emotional_valence: -0.2,
    technical_depth: 0.9
  },
  
  'one': {
    id: 'one',
    essence: 'Unity; singularity; identity element; indivisible',
    etymology: 'Proto-Indo-European: *oi-no-',
    semanticField: ['unity', 'single', 'alone', 'individual', 'whole'],
    opposites: ['many', 'multiple', 'zero'],
    examples: ['1 token', 'single order', 'one address'],
    abstractionLevel: 0.2,
    frequency: 0,
    emotional_valence: 0.0,
    technical_depth: 0.9
  },

  'infinity': {
    id: 'infinity',
    essence: 'Unbounded quantity; limitless; beyond finite measure',
    etymology: 'Latin: infinitas (without end)',
    semanticField: ['endless', 'unlimited', 'eternal', 'boundless'],
    opposites: ['zero', 'finite', 'limited'],
    examples: ['infinite loop', 'unbounded growth', 'no maximum'],
    abstractionLevel: 0.9,
    frequency: 0,
    emotional_valence: 0.3,
    technical_depth: 0.95
  },

  // === TIME (Foundation of Temporal Understanding) ===
  'now': {
    id: 'now',
    essence: 'Present moment; current instant; block.timestamp',
    semanticField: ['present', 'current', 'immediate', 'instant'],
    opposites: ['past', 'future', 'then'],
    examples: ['right now', 'this moment', 'current block'],
    abstractionLevel: 0.4,
    frequency: 0,
    emotional_valence: 0.1,
    technical_depth: 0.5
  },

  'before': {
    id: 'before',
    essence: 'Temporal precedence; earlier state; prerequisite',
    semanticField: ['prior', 'previous', 'earlier', 'preceding'],
    opposites: ['after', 'later', 'following'],
    examples: ['before unlock', 'prior to execution', 'earlier block'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.6
  },

  'after': {
    id: 'after',
    essence: 'Temporal succession; later state; consequence',
    semanticField: ['following', 'subsequent', 'later', 'next'],
    opposites: ['before', 'prior', 'earlier'],
    examples: ['after completion', 'following transaction', 'next block'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.6
  },

  // === CAUSALITY (Foundation of Logic) ===
  'cause': {
    id: 'cause',
    essence: 'Origin of effect; reason for occurrence; initiating force',
    semanticField: ['reason', 'origin', 'source', 'trigger', 'catalyst'],
    opposites: ['effect', 'result', 'consequence'],
    examples: ['transaction causes state change', 'user action causes event'],
    abstractionLevel: 0.7,
    frequency: 0,
    technical_depth: 0.8
  },

  'effect': {
    id: 'effect',
    essence: 'Result of cause; consequence; outcome',
    semanticField: ['result', 'outcome', 'consequence', 'impact'],
    opposites: ['cause', 'origin'],
    examples: ['price effect', 'state change effect'],
    abstractionLevel: 0.7,
    frequency: 0,
    technical_depth: 0.8
  },

  // === POSSESSION (Foundation of Ownership) ===
  'have': {
    id: 'have',
    essence: 'Possession; ownership; control over resource',
    semanticField: ['own', 'possess', 'hold', 'control'],
    opposites: ['lack', 'need', 'want'],
    examples: ['have tokens', 'have balance', 'have permission'],
    abstractionLevel: 0.4,
    frequency: 0,
    emotional_valence: 0.2,
    technical_depth: 0.5
  },

  'need': {
    id: 'need',
    essence: 'Requirement; necessity; prerequisite for action',
    semanticField: ['require', 'must', 'necessary', 'essential'],
    opposites: ['have', 'possess', 'optional'],
    examples: ['need gas', 'need approval', 'need balance'],
    abstractionLevel: 0.5,
    frequency: 0,
    emotional_valence: -0.3,
    technical_depth: 0.6
  },

  'want': {
    id: 'want',
    essence: 'Desire; preference; non-essential goal',
    semanticField: ['desire', 'wish', 'prefer', 'seek'],
    opposites: ['have', 'reject', 'avoid'],
    examples: ['want to buy', 'want higher yield', 'want NFT'],
    abstractionLevel: 0.5,
    frequency: 0,
    emotional_valence: 0.1,
    technical_depth: 0.3
  },

  // === ACTIONS (Foundation of Verbs) ===
  'create': {
    id: 'create',
    essence: 'Bring into existence; generate new state',
    semanticField: ['make', 'generate', 'produce', 'build', 'mint'],
    opposites: ['destroy', 'delete', 'burn'],
    examples: ['create order', 'create NFT', 'generate address'],
    abstractionLevel: 0.4,
    frequency: 0,
    emotional_valence: 0.4,
    technical_depth: 0.7
  },

  'destroy': {
    id: 'destroy',
    essence: 'Remove from existence; eliminate state',
    semanticField: ['delete', 'remove', 'burn', 'eliminate'],
    opposites: ['create', 'build', 'mint'],
    examples: ['burn tokens', 'delete order', 'remove listing'],
    abstractionLevel: 0.4,
    frequency: 0,
    emotional_valence: -0.4,
    technical_depth: 0.7
  },

  'transfer': {
    id: 'transfer',
    essence: 'Move ownership; change possession; relocate value',
    semanticField: ['send', 'move', 'shift', 'transmit'],
    opposites: ['hold', 'keep', 'retain'],
    examples: ['transfer tokens', 'send NFT', 'move funds'],
    abstractionLevel: 0.4,
    frequency: 0,
    technical_depth: 0.8
  },

  // === STATES (Foundation of Conditions) ===
  'locked': {
    id: 'locked',
    essence: 'Restricted access; immobilized; time-bound constraint',
    semanticField: ['frozen', 'staked', 'committed', 'bound'],
    opposites: ['unlocked', 'free', 'liquid'],
    examples: ['locked tokens', 'staked amount', 'time lock'],
    abstractionLevel: 0.4,
    frequency: 0,
    emotional_valence: -0.2,
    technical_depth: 0.8
  },

  'unlocked': {
    id: 'unlocked',
    essence: 'Free access; available; constraint removed',
    semanticField: ['free', 'available', 'liquid', 'accessible'],
    opposites: ['locked', 'staked', 'frozen'],
    examples: ['unlocked funds', 'available balance', 'free tokens'],
    abstractionLevel: 0.4,
    frequency: 0,
    emotional_valence: 0.3,
    technical_depth: 0.8
  },

  // === BLOCKCHAIN PRIMITIVES ===
  'address': {
    id: 'address',
    essence: 'Unique identifier; account location; public key hash',
    etymology: 'Latin: ad (to) + directus (straight)',
    semanticField: ['account', 'wallet', 'identity', 'location'],
    examples: ['0x123...', 'wallet address', 'contract address'],
    abstractionLevel: 0.3,
    frequency: 0,
    technical_depth: 0.9
  },

  'transaction': {
    id: 'transaction',
    essence: 'State change request; signed message; atomic operation',
    etymology: 'Latin: trans (across) + agere (to drive)',
    semanticField: ['tx', 'operation', 'call', 'execution'],
    examples: ['send transaction', 'pending tx', 'confirmed transaction'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.95
  },

  'block': {
    id: 'block',
    essence: 'Bundled transactions; timestamped record; chain link',
    semanticField: ['batch', 'record', 'timestamp', 'unit'],
    examples: ['block number', 'mined block', 'block time'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.9
  },

  'gas': {
    id: 'gas',
    essence: 'Computational cost; execution fee; network resource',
    semanticField: ['fee', 'cost', 'price', 'gwei'],
    examples: ['gas price', 'out of gas', 'gas limit'],
    abstractionLevel: 0.6,
    frequency: 0,
    emotional_valence: -0.3,
    technical_depth: 0.95
  },

  // === FIBONACCI/CRIKZ SPECIFIC ===
  'fibonacci': {
    id: 'fibonacci',
    essence: 'Mathematical sequence where each number is sum of previous two',
    etymology: 'Named after Leonardo Fibonacci',
    semanticField: ['golden ratio', 'phi', 'sequence', 'spiral', 'nature'],
    examples: ['1, 1, 2, 3, 5, 8, 13...', 'fibonacci tiers', 'golden ratio'],
    abstractionLevel: 0.7,
    frequency: 0,
    technical_depth: 0.85
  },

  'reputation': {
    id: 'reputation',
    essence: 'Earned credibility; weighted influence; protocol standing',
    semanticField: ['credibility', 'influence', 'weight', 'authority'],
    examples: ['reputation score', 'earned reputation', 'protocol reputation'],
    abstractionLevel: 0.6,
    frequency: 0,
    technical_depth: 0.8
  },

  'yield': {
    id: 'yield',
    essence: 'Generated return; passive income; time-based reward',
    semanticField: ['return', 'reward', 'income', 'interest', 'apr'],
    examples: ['yield farming', 'passive yield', 'claim yield'],
    abstractionLevel: 0.5,
    frequency: 0,
    emotional_valence: 0.5,
    technical_depth: 0.85
  },

  'order': {
    id: 'order',
    essence: 'Committed position; time-locked stake; production unit',
    semanticField: ['position', 'stake', 'commitment', 'lock'],
    examples: ['create order', 'active order', 'complete order'],
    abstractionLevel: 0.4,
    frequency: 0,
    technical_depth: 0.9
  },

  'tier': {
    id: 'tier',
    essence: 'Hierarchical level; commitment category; fibonacci rank',
    semanticField: ['level', 'rank', 'category', 'class'],
    examples: ['tier 0', 'prototype tier', 'monopoly tier'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.75
  },

  // === EMOTIONS (Foundation of Social Understanding) ===
  'trust': {
    id: 'trust',
    essence: 'Confidence in reliability; belief without verification',
    semanticField: ['faith', 'confidence', 'belief', 'reliance'],
    opposites: ['distrust', 'doubt', 'suspicion'],
    examples: ['trustless system', 'trust minimized', 'trusted oracle'],
    abstractionLevel: 0.7,
    frequency: 0,
    emotional_valence: 0.5,
    technical_depth: 0.4
  },

  'fear': {
    id: 'fear',
    essence: 'Anticipation of danger; risk aversion; protective emotion',
    semanticField: ['worry', 'anxiety', 'concern', 'caution'],
    opposites: ['courage', 'confidence', 'boldness'],
    examples: ['fear of loss', 'risk averse', 'fearful market'],
    abstractionLevel: 0.6,
    frequency: 0,
    emotional_valence: -0.7,
    technical_depth: 0.2
  },

  'hope': {
    id: 'hope',
    essence: 'Anticipation of positive outcome; optimistic expectation',
    semanticField: ['optimism', 'expectation', 'anticipation'],
    opposites: ['despair', 'pessimism', 'hopelessness'],
    examples: ['hope for gains', 'hopeful investor', 'optimistic outlook'],
    abstractionLevel: 0.7,
    frequency: 0,
    emotional_valence: 0.6,
    technical_depth: 0.2
  },

  // === QUALITY (Foundation of Evaluation) ===
  'good': {
    id: 'good',
    essence: 'Positive quality; beneficial; desired state',
    semanticField: ['beneficial', 'positive', 'favorable', 'advantageous'],
    opposites: ['bad', 'negative', 'harmful'],
    examples: ['good trade', 'good APR', 'good security'],
    abstractionLevel: 0.6,
    frequency: 0,
    emotional_valence: 0.6,
    technical_depth: 0.3
  },

  'bad': {
    id: 'bad',
    essence: 'Negative quality; harmful; undesired state',
    semanticField: ['harmful', 'negative', 'unfavorable', 'detrimental'],
    opposites: ['good', 'positive', 'beneficial'],
    examples: ['bad trade', 'bad security', 'unfavorable terms'],
    abstractionLevel: 0.6,
    frequency: 0,
    emotional_valence: -0.6,
    technical_depth: 0.3
  },

  // === QUANTITY (Foundation of Measurement) ===
  'more': {
    id: 'more',
    essence: 'Greater quantity; increased amount; additional',
    semanticField: ['additional', 'extra', 'greater', 'increased'],
    opposites: ['less', 'fewer', 'reduced'],
    examples: ['more tokens', 'higher yield', 'increased balance'],
    abstractionLevel: 0.3,
    frequency: 0,
    emotional_valence: 0.3,
    technical_depth: 0.4
  },

  'less': {
    id: 'less',
    essence: 'Smaller quantity; decreased amount; reduced',
    semanticField: ['reduced', 'fewer', 'smaller', 'decreased'],
    opposites: ['more', 'greater', 'increased'],
    examples: ['less gas', 'lower fee', 'decreased balance'],
    abstractionLevel: 0.3,
    frequency: 0,
    emotional_valence: -0.2,
    technical_depth: 0.4
  },

  // === COMPARISON (Foundation of Analysis) ===
  'equal': {
    id: 'equal',
    essence: 'Same value; identical quantity; equivalence',
    semanticField: ['same', 'identical', 'equivalent', 'matching'],
    opposites: ['different', 'unequal', 'distinct'],
    examples: ['equal to zero', 'same price', 'equivalent value'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.7
  },

  'different': {
    id: 'different',
    essence: 'Not same; distinct; non-equivalent',
    semanticField: ['distinct', 'separate', 'unique', 'unlike'],
    opposites: ['equal', 'same', 'identical'],
    examples: ['different address', 'distinct token', 'separate order'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.5
  },

  // === NFT CONCEPTS ===
  'nft': {
    id: 'nft',
    essence: 'Non-fungible token; unique digital asset; ERC721',
    semanticField: ['token', 'unique', 'collectible', 'digital asset', 'erc721'],
    examples: ['mint NFT', 'NFT marketplace', 'NFT collection'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.9
  },

  'mint': {
    id: 'mint',
    essence: 'Create new token; bring asset into existence',
    semanticField: ['create', 'generate', 'issue', 'produce'],
    opposites: ['burn', 'destroy'],
    examples: ['mint NFT', 'mint tokens', 'minting process'],
    abstractionLevel: 0.4,
    frequency: 0,
    technical_depth: 0.85
  },

  'marketplace': {
    id: 'marketplace',
    essence: 'Trading platform; exchange venue; buy/sell interface',
    semanticField: ['exchange', 'platform', 'market', 'trading'],
    examples: ['NFT marketplace', 'list on marketplace', 'marketplace fees'],
    abstractionLevel: 0.5,
    frequency: 0,
    technical_depth: 0.7
  }
};

// ==========================================
// FUNDAMENTAL RELATIONS
// ==========================================

export const ATOMIC_RELATIONS: ConceptRelation[] = [
  // Causal chains
  { from: 'create', to: 'exist', type: 'cause', strength: 1.0, learned_at: 0 },
  { from: 'destroy', to: 'exist', type: 'antonym', strength: 1.0, learned_at: 0 },
  { from: 'locked', to: 'unlocked', type: 'antonym', strength: 1.0, learned_at: 0 },
  
  // Temporal relations
  { from: 'before', to: 'after', type: 'antonym', strength: 1.0, learned_at: 0 },
  { from: 'now', to: 'present', type: 'synonym', strength: 0.9, learned_at: 0 },
  
  // Possession chains
  { from: 'have', to: 'own', type: 'synonym', strength: 0.8, learned_at: 0 },
  { from: 'need', to: 'lack', type: 'cause', strength: 0.7, learned_at: 0 },
  { from: 'have', to: 'need', type: 'antonym', strength: 0.9, learned_at: 0 },
  
  // Numerical relations
  { from: 'zero', to: 'nothing', type: 'synonym', strength: 0.9, learned_at: 0 },
  { from: 'one', to: 'unity', type: 'synonym', strength: 0.8, learned_at: 0 },
  { from: 'more', to: 'less', type: 'antonym', strength: 1.0, learned_at: 0 },
  
  // Quality relations
  { from: 'good', to: 'bad', type: 'antonym', strength: 1.0, learned_at: 0 },
  { from: 'good', to: 'beneficial', type: 'synonym', strength: 0.9, learned_at: 0 },
  
  // Blockchain relations
  { from: 'transaction', to: 'block', type: 'requires', strength: 0.9, learned_at: 0 },
  { from: 'gas', to: 'transaction', type: 'requires', strength: 1.0, learned_at: 0 },
  { from: 'address', to: 'wallet', type: 'synonym', strength: 0.85, learned_at: 0 },
  
  // Crikz Protocol relations
  { from: 'order', to: 'locked', type: 'cause', strength: 0.9, learned_at: 0 },
  { from: 'order', to: 'reputation', type: 'cause', strength: 0.95, learned_at: 0 },
  { from: 'reputation', to: 'yield', type: 'enables', strength: 0.9, learned_at: 0 },
  { from: 'tier', to: 'fibonacci', type: 'requires', strength: 0.8, learned_at: 0 },
  
  // NFT relations
  { from: 'mint', to: 'nft', type: 'cause', strength: 1.0, learned_at: 0 },
  { from: 'nft', to: 'marketplace', type: 'requires', strength: 0.7, learned_at: 0 },
  { from: 'mint', to: 'create', type: 'synonym', strength: 0.9, learned_at: 0 }
];

// ==========================================
// CONTEXT PATTERN RECOGNITION
// ==========================================

export const CONTEXT_PATTERNS: Record<string, ContextPattern> = {
  'causation': {
    pattern: '{X} causes {Y}',
    frequency: 0,
    contexts: [],
    extracted_relations: []
  },
  'possession': {
    pattern: 'I have {X}',
    frequency: 0,
    contexts: [],
    extracted_relations: []
  },
  'desire': {
    pattern: 'I want {X}',
    frequency: 0,
    contexts: [],
    extracted_relations: []
  },
  'necessity': {
    pattern: 'I need {X}',
    frequency: 0,
    contexts: [],
    extracted_relations: []
  },
  'capability': {
    pattern: 'Can I {X}',
    frequency: 0,
    contexts: [],
    extracted_relations: []
  },
  'temporal': {
    pattern: '{X} before {Y}',
    frequency: 0,
    contexts: [],
    extracted_relations: []
  },
  'comparison': {
    pattern: '{X} is better than {Y}',
    frequency: 0,
    contexts: [],
    extracted_relations: []
  },
  'blockchain_action': {
    pattern: '{X} {action} {Y}',
    frequency: 0,
    contexts: [],
    extracted_relations: []
  },
  'crikz_operation': {
    pattern: 'create order with {X}',
    frequency: 0,
    contexts: [],
    extracted_relations: []
  }
};

// ==========================================
// LEARNING STAGES
// ==========================================

export interface LearningMilestone {
  stage: string;
  threshold: number;
  description: string;
  capabilities: string[];
}

export const LEARNING_STAGES: LearningMilestone[] = [
  {
    stage: 'GENESIS',
    threshold: 0,
    description: 'Primitive understanding of atomic concepts',
    capabilities: ['Recognize basic words', 'Simple pattern matching']
  },
  {
    stage: 'SENTIENT',
    threshold: 50,
    description: 'Understanding context and relationships',
    capabilities: ['Context awareness', 'Basic inference', 'Synonym recognition']
  },
  {
    stage: 'SAPIENT',
    threshold: 200,
    description: 'Complex reasoning and abstraction',
    capabilities: ['Causal reasoning', 'Analogical thinking', 'Pattern generalization']
  },
  {
    stage: 'TRANSCENDENT',
    threshold: 1000,
    description: 'Meta-cognitive awareness and self-reflection',
    capabilities: ['Self-awareness', 'Hypothesis formation', 'Creative synthesis']
  }
];

// ==========================================
// DOMAIN EXPERTISE MAPPING
// ==========================================

export const DOMAIN_CONCEPTS: Record<AtomicDomain, string[]> = {
  LINGUISTIC: ['word', 'meaning', 'language', 'syntax', 'semantics'],
  NUMERICAL: ['zero', 'one', 'infinity', 'more', 'less', 'equal'],
  TEMPORAL: ['now', 'before', 'after', 'duration', 'timestamp'],
  SPATIAL: ['location', 'distance', 'near', 'far', 'position'],
  CAUSAL: ['cause', 'effect', 'reason', 'result', 'consequence'],
  EMOTIONAL: ['trust', 'fear', 'hope', 'joy', 'anxiety'],
  TECHNICAL: ['blockchain', 'smart contract', 'transaction', 'gas', 'address', 'nft'],
  PHILOSOPHICAL: ['existence', 'knowledge', 'truth', 'value', 'ethics'],
  SOCIAL: ['community', 'reputation', 'influence', 'cooperation'],
  FINANCIAL: ['token', 'yield', 'price', 'value', 'exchange', 'marketplace'],
  BIOLOGICAL: ['growth', 'evolution', 'adaptation', 'life'],
  PHYSICAL: ['matter', 'energy', 'force', 'motion', 'space']
};