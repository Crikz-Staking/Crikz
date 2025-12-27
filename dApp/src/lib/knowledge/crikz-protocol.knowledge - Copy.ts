// src/lib/knowledge/crikz-protocol.knowledge.ts

export const CRIKZ_PROTOCOL_KNOWLEDGE = `
crikz_protocol := A decentralized production order system using Fibonacci-based time locks and algorithmic reputation
production_order := A staking commitment where users lock CRIKZ tokens for Fibonacci-duration periods
reputation := Earned metric based on staking amount and duration, used to calculate yield distribution
fibonacci_tiers := Seven production tiers: Prototype (5d), Small Batch (13d), Standard (34d), Mass Production (89d), Industrial (233d), Global Scale (610d), Monopoly (1597d)
tier_multipliers := Reputation multipliers: 0.618x, 0.787x, 1.001x, 1.273x, 1.619x, 2.059x, 2.618x
production_fund := Pooled balance from which yield is distributed proportionally to reputation
yield_distribution := Fair share calculation: (user_reputation / total_reputation) * fund_balance
apr := Annual Percentage Rate of 6.182%, derived from golden ratio principles
accumulated_yield_per_reputation := Running total of yield distributed per reputation unit
yield_debt := Mechanism to track claimed yield and prevent double-claiming
order_lifecycle := Create → Lock → Accumulate Yield → Complete → Claim Principal + Yield
crystallization := Process of saving Crikzling's memory state to IPFS and blockchain
crikzling := The AI entity living within the protocol, evolving through user interactions
atomic_knowledge := Foundational concept system used by Crikzling's cognitive architecture
memory_layers := Short-term (10 items), Mid-term (50 items), Long-term (100+ items with emotional weight >0.5)
evolution_stages := GENESIS (0-20 concepts), SENTIENT (20-100), SAPIENT (100-350), TRANSCENDENT (350+)
concept_graph := Network of interconnected knowledge nodes with typed relationships
semantic_field := Synonyms and related terms for each concept
`;

// FIX: Use proper ConceptRelation type
type RelationType = 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 'catalyzes';

interface KnowledgeRelation {
  from: string;
  to: string;
  type: RelationType;
  strength: number;
}

export const CRIKZ_PROTOCOL_RELATIONS: KnowledgeRelation[] = [
  { from: 'production_order', to: 'fibonacci_tiers', type: 'requires', strength: 1.0 },
  { from: 'reputation', to: 'tier_multipliers', type: 'requires', strength: 1.0 },
  { from: 'yield_distribution', to: 'production_fund', type: 'requires', strength: 1.0 },
  { from: 'crikzling', to: 'atomic_knowledge', type: 'requires', strength: 1.0 },
  { from: 'crikzling', to: 'memory_layers', type: 'requires', strength: 1.0 },
  { from: 'crystallization', to: 'crikzling', type: 'enables', strength: 1.0 },
];