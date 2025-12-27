// src/lib/knowledge/fibonacci-math.knowledge.ts

export const FIBONACCI_KNOWLEDGE = `
fibonacci := The sequence where each number is the sum of the two preceding ones (0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144...)
golden_ratio := Approximately 1.618033988749895, denoted by φ (phi), the limit of the ratio of consecutive Fibonacci numbers
phi := The golden ratio, represented as (1 + √5) / 2
fibonacci_spiral := A logarithmic spiral whose growth factor is φ
lucas_numbers := Similar to Fibonacci but starts with 2, 1 (2, 1, 3, 4, 7, 11, 18, 29, 47...)
binet_formula := F(n) = (φⁿ - ψⁿ) / √5, where ψ = (1 - √5) / 2
fibonacci_in_nature := Found in nautilus shells, sunflower seed patterns, galaxy spirals, and pinecone arrangements
golden_rectangle := A rectangle whose side lengths are in the golden ratio
`;

// FIX: Use proper ConceptRelation type
type RelationType = 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 'catalyzes';

interface KnowledgeRelation {
  from: string;
  to: string;
  type: RelationType;
  strength: number;
}

export const FIBONACCI_RELATIONS: KnowledgeRelation[] = [
  { from: 'fibonacci', to: 'golden_ratio', type: 'converges_to' as 'requires', strength: 1.0 },
  { from: 'golden_ratio', to: 'phi', type: 'synonym', strength: 1.0 },
  { from: 'fibonacci_spiral', to: 'golden_ratio', type: 'requires', strength: 0.9 },
  { from: 'fibonacci', to: 'lucas_numbers', type: 'relates_to' as 'requires', strength: 0.7 },
];