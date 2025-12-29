// src/lib/knowledge/mathematics.knowledge.ts

export const MATHEMATICS_KNOWLEDGE = `
number := A mathematical object used to count, measure, and label
integer := A whole number that can be positive, negative, or zero
rational_number := A number that can be expressed as a fraction of two integers
irrational_number := A number that cannot be expressed as a simple fraction
real_number := Any number that can be found on the number line
complex_number := A number consisting of a real part and an imaginary part
prime_number := A natural number greater than 1 divisible only by 1 and itself
composite_number := A natural number greater than 1 that is not prime
natural_number := A positive integer used for counting (1, 2, 3, ...)
whole_number := A non-negative integer (0, 1, 2, 3, ...)
even_number := An integer divisible by 2
odd_number := An integer not divisible by 2
fraction := A numerical quantity representing part of a whole
decimal := A number expressed in base-10 notation
percentage := A ratio expressed as a fraction of 100
ratio := A relationship between two numbers showing how many times one contains the other
proportion := An equation stating that two ratios are equal
exponent := A number indicating how many times a base is multiplied by itself
logarithm := The inverse operation to exponentiation
square_root := A value that, when multiplied by itself, gives the original number
equation := A mathematical statement that two expressions are equal
inequality := A relation showing one expression is greater or less than another
variable := A symbol representing an unknown or changing value
constant := A fixed value that does not change
coefficient := A numerical factor in a term of an algebraic expression
polynomial := An expression consisting of variables and coefficients
derivative := The rate of change of a function with respect to a variable
integral := The accumulation of quantities, inverse operation to differentiation
limit := The value a function approaches as the input approaches some value
convergence := The property of approaching a definite limit
divergence := The property of not approaching any finite limit
sequence := An ordered list of numbers
series := The sum of the terms of a sequence
set := A collection of distinct objects
subset := A set whose elements are all contained in another set
union := The set containing all elements from two or more sets
intersection := The set containing only elements common to all sets
probability := The measure of the likelihood of an event occurring
statistics := The science of collecting, analyzing, and interpreting data
mean := The average of a set of numbers
median := The middle value in an ordered set of numbers
mode := The value that appears most frequently in a data set
`;

type RelationType = 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 'catalyzes';

interface KnowledgeRelation {
  from: string;
  to: string;
  type: RelationType;
  strength: number;
}

export const MATHEMATICS_RELATIONS: KnowledgeRelation[] = [
  { from: 'integer', to: 'number', type: 'hyponym', strength: 1.0 },
  { from: 'rational_number', to: 'real_number', type: 'hyponym', strength: 1.0 },
  { from: 'irrational_number', to: 'real_number', type: 'hyponym', strength: 1.0 },
  { from: 'prime_number', to: 'composite_number', type: 'antonym', strength: 0.9 },
  { from: 'even_number', to: 'odd_number', type: 'antonym', strength: 1.0 },
  { from: 'derivative', to: 'integral', type: 'antonym', strength: 0.9 },
  { from: 'convergence', to: 'divergence', type: 'antonym', strength: 1.0 },
  { from: 'logarithm', to: 'exponent', type: 'antonym', strength: 0.9 },
  { from: 'subset', to: 'set', type: 'requires', strength: 1.0 },
  { from: 'union', to: 'set', type: 'requires', strength: 0.9 },
  { from: 'intersection', to: 'set', type: 'requires', strength: 0.9 },
  { from: 'mean', to: 'statistics', type: 'requires', strength: 0.8 },
  { from: 'median', to: 'statistics', type: 'requires', strength: 0.8 },
  { from: 'mode', to: 'statistics', type: 'requires', strength: 0.8 },
];