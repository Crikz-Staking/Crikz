import { AtomicConcept, ATOMIC_PRIMITIVES } from '@/lib/crikzling-atomic-knowledge';
import { DAppContext, Vector, IntentType, InputAnalysis } from '../types'; // Import InputAnalysis from types

// Re-export for compatibility with older imports
export type { InputAnalysis };

export class InputProcessor {
  private stopWords: Set<string>;

  constructor() {
    this.stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'in', 'to', 'for', 'of', 'it', 'that', 'was', 'i', 'am', 'are']);
  }

  /**
   * Generates a 6-dimensional vector based on the semantic domain of detected keywords.
   * Vector Indexes: [Financial, Technical, Social, Temporal, Abstract, Risk]
   */
  private calculateVectorFromConcepts(concepts: AtomicConcept[]): Vector {
    const vector: Vector = [0, 0, 0, 0, 0, 0];
    
    // Weights for mapping domains to vector indices
    const domainMap: Record<string, number> = {
        'FINANCIAL': 0, 'DEFI': 0,
        'TECHNICAL': 1, 'BLOCKCHAIN': 1, 'COMPUTER': 1,
        'SOCIAL': 2, 'LINGUISTIC': 2,
        'TEMPORAL': 3,
        'META': 4, 'PHILOSOPHICAL': 4, 'NUMERICAL': 4,
        'CAUSAL': 5, 'SECURITY': 5
    };

    if (concepts.length === 0) return vector;

    concepts.forEach(c => {
        const domain = c.domain || 'META';
        const index = domainMap[domain];
        if (index !== undefined) {
            // Add weight based on abstraction level (higher abstraction = stronger signal)
            vector[index] += c.abstractionLevel || 0.5;
        }
    });

    // Normalize vector (Unit Vector)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? vector : vector.map(v => parseFloat((v / magnitude).toFixed(4))) as Vector;
  }

  public process(input: string, knownConcepts: Record<string, AtomicConcept>, dappContext?: DAppContext): InputAnalysis {
    const cleanedInput = input.trim().toLowerCase();
    // Remove punctuation
    const tokens = cleanedInput.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 0 && !this.stopWords.has(w));
    
    const keywords: AtomicConcept[] = [];
    const detectedEntities: string[] = [];

    // 1. Concept Extraction
    tokens.forEach((token) => {
      // Check against dynamic knowledge base
      const directMatch = knownConcepts[token];
      if (directMatch) {
          keywords.push(directMatch);
          detectedEntities.push(token);
      } else {
          // Check against static primitives if not found in dynamic graph
          const primitiveMatch = ATOMIC_PRIMITIVES[token];
          if (primitiveMatch) {
              keywords.push(primitiveMatch);
              detectedEntities.push(token);
          }
      }
    });

    // 2. Pattern Matching for Specific Entities
    if (cleanedInput.match(/0x[a-fA-F0-9]{40}/)) detectedEntities.push('wallet_address');

    // 3. Vector Calculation
    const inputVector = this.calculateVectorFromConcepts(keywords);

    return {
      rawInput: input,
      cleanedInput,
      keywords: [...new Set(keywords)],
      intent: this.classifyIntent(cleanedInput, keywords, inputVector),
      emotionalWeight: this.calculateEmotionalWeight(cleanedInput, keywords),
      complexity: (tokens.length * 0.1) + (keywords.length * 0.2),
      detectedEntities,
      inputVector
    };
  }

  private classifyIntent(input: string, keywords: AtomicConcept[], vector: Vector): IntentType {
    // Explicit Command Overrides
    if (input.match(/^(reset|wipe|clear|save|crystallize|upload)/)) return 'COMMAND';
    if (input.match(/^(hello|hi|hey|greetings)/i)) return 'GREETING';
    
    // Vector-based classification
    if (vector[0] > 0.5) return 'FINANCIAL_ADVICE'; // High Financial signal
    if (vector[1] > 0.6) return 'EXPLANATION';      // High Technical signal
    if (vector[4] > 0.6) return 'PHILOSOPHY';       // High Abstract signal
    
    // Keyword fallback
    if (input.includes('?') || input.match(/^(what|how|why|when|who)/)) return 'QUERY';
    
    // DApp specific checks
    if (input.includes('price') || input.includes('apr') || input.includes('yield')) return 'DAPP_QUERY';

    return 'DISCOURSE';
  }

  private calculateEmotionalWeight(input: string, keywords: AtomicConcept[]): number {
    let weight = 0.5;
    
    // 1. Lexical Analysis
    if (input.match(/(happy|great|love|thanks|good|amazing|cool|profit|gain)/)) weight += 0.2;
    if (input.match(/(sad|bad|hate|wrong|error|fail|broken|stupid|loss|crash)/)) weight -= 0.2;
    
    // 2. Concept Valence (if defined in primitives)
    keywords.forEach(k => {
        if (k.emotional_valence) weight += (k.emotional_valence * 0.1);
    });

    // 3. Punctuation Intensity
    if (input.includes('!')) weight += 0.1;
    
    return Math.max(0, Math.min(1, weight));
  }
}