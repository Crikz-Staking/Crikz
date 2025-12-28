import { AtomicConcept, ATOMIC_PRIMITIVES } from '@/lib/crikzling-atomic-knowledge';
import { DAppContext, Vector, IntentType, InputAnalysis } from '../types';

export class InputProcessor {
  private stopWords: Set<string>;

  constructor() {
    this.stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'in', 'to', 'for', 'of', 'it', 'that', 'was', 'i', 'am', 'are']);
  }

  private calculateVectorFromConcepts(concepts: AtomicConcept[]): Vector {
    const vector: Vector = [0, 0, 0, 0, 0, 0];
    
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
            vector[index] += c.abstractionLevel || 0.5;
        }
    });

    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? vector : vector.map(v => parseFloat((v / magnitude).toFixed(4))) as Vector;
  }

  public process(input: string, knownConcepts: Record<string, AtomicConcept>, dappContext?: DAppContext): InputAnalysis {
    const cleanedInput = input.trim().toLowerCase();
    const tokens = cleanedInput.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 0 && !this.stopWords.has(w));
    
    const keywords: AtomicConcept[] = [];
    const detectedEntities: string[] = [];

    tokens.forEach((token) => {
      const directMatch = knownConcepts[token];
      if (directMatch) {
          keywords.push(directMatch);
          detectedEntities.push(token);
      } else {
          const primitiveMatch = ATOMIC_PRIMITIVES[token];
          if (primitiveMatch) {
              keywords.push(primitiveMatch);
              detectedEntities.push(token);
          }
      }
    });

    if (cleanedInput.match(/0x[a-fA-F0-9]{40}/)) detectedEntities.push('wallet_address');

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
    if (input.match(/^(reset|wipe|clear|save|crystallize|upload)/)) return 'COMMAND';
    if (input.match(/^(hello|hi|hey|greetings)/i)) return 'GREETING';
    
    if (vector[0] > 0.5) return 'FINANCIAL_ADVICE'; 
    if (vector[1] > 0.6) return 'EXPLANATION';      
    if (vector[4] > 0.6) return 'PHILOSOPHY';       
    
    if (input.includes('?') || input.match(/^(what|how|why|when|who)/)) return 'QUERY';
    
    if (input.includes('price') || input.includes('apr') || input.includes('yield')) return 'DAPP_QUERY';

    return 'DISCOURSE';
  }

  private calculateEmotionalWeight(input: string, keywords: AtomicConcept[]): number {
    let weight = 0.5;
    
    if (input.match(/(happy|great|love|thanks|good|amazing|cool|profit|gain)/)) weight += 0.2;
    if (input.match(/(sad|bad|hate|wrong|error|fail|broken|stupid|loss|crash)/)) weight -= 0.2;
    
    keywords.forEach(k => {
        if (k.emotional_valence) weight += (k.emotional_valence * 0.1);
    });

    if (input.includes('!')) weight += 0.1;
    
    return Math.max(0, Math.min(1, weight));
  }
}