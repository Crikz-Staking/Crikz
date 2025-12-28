import { AtomicConcept } from '@/lib/crikzling-atomic-knowledge';
import { DAppContext, Vector } from '../types';

export interface InputAnalysis {
  rawInput: string;
  cleanedInput: string;
  keywords: AtomicConcept[];
  intent: string;
  emotionalWeight: number;
  complexity: number;
  detectedEntities: string[];
  inputVector: Vector; // [Financial, Technical, Social, Temporal, Abstract, Risk]
}

export class InputProcessor {
  private stopWords: Set<string>;

  // Dimensions: [Financial, Technical, Social, Temporal, Abstract, Risk]
  private dimensionMap: Record<string, Vector> = {
    // Financial
    'profit': [1.0, 0, 0, 0, 0, 0.2], 'yield': [1.0, 0.2, 0, 0.3, 0, 0.1],
    'loss': [1.0, 0, 0, 0, 0, 0.9], 'stake': [0.9, 0.4, 0, 0.5, 0, 0.1], // Increased weight
    'price': [1.0, 0, 0, 0, 0, 0.3], 'wallet': [0.9, 0.2, 0, 0, 0, 0.1],
    
    // Technical
    'code': [0, 1.0, 0, 0, 0.2, 0], 'blockchain': [0.2, 1.0, 0.2, 0, 0.5, 0],
    'robot': [0, 0.8, 0, 0, 0.5, 0], 'machine': [0, 0.8, 0, 0, 0.2, 0],
    'block': [0.1, 0.8, 0, 0, 0.3, 0], // Reduced Financial weight for generic "block"

    // Social / Governance / Cooperation
    'community': [0, 0.1, 1.0, 0, 0.2, 0], 'friend': [0, 0, 1.0, 0, 0.5, 0],
    'together': [0, 0, 1.0, 0, 0.5, 0], 'share': [0, 0, 0.9, 0, 0.4, 0],
    'help': [0, 0, 0.8, 0, 0.2, 0], 'agreement': [0, 0.1, 0.8, 0, 0.4, 0],

    // Temporal / Growth
    'wait': [0, 0, 0, 1.0, 0, 0], 'time': [0, 0, 0, 1.0, 0.5, 0],
    'grow': [0.3, 0, 0, 0.8, 0.5, 0], 'seed': [0.2, 0, 0, 0.9, 0.6, 0],
    'then': [0, 0, 0, 0.5, 0, 0], 'finally': [0, 0, 0, 0.8, 0, 0],

    // Abstract / Logic / Causality
    'if': [0, 0.5, 0, 0, 1.0, 0], 'cause': [0, 0.3, 0, 0, 1.0, 0],
    'learn': [0, 0.2, 0.3, 0.4, 0.9, 0], 'try': [0, 0, 0, 0, 0.8, 0.2],
    'know': [0, 0.1, 0, 0, 0.8, 0], 'pattern': [0, 0.3, 0, 0, 0.9, 0],
    'hidden': [0, 0, 0, 0, 0.7, 0.3], 'found': [0, 0, 0, 0, 0.6, 0]
  };

  private modifiers: Record<string, number> = {
    'very': 1.5, 'high': 1.5, 'low': 0.5, 'not': -1.0, 'no': -1.0
  };

  constructor() {
    this.stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'in', 'to', 'for', 'of', 'i', 'you', 'it', 'that', 'he', 'she', 'they', 'was', 'had']);
  }

  // Levenshtein Distance
  private getDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
    return matrix[b.length][a.length];
  }

  private calculateVector(words: string[]): Vector {
    let vector: Vector = [0, 0, 0, 0, 0, 0];
    let count = 0;
    let currentMod = 1.0;

    words.forEach(word => {
      if (this.modifiers[word]) {
        currentMod = this.modifiers[word];
        return;
      }

      let match: Vector | null = null;
      if (this.dimensionMap[word]) {
        match = this.dimensionMap[word];
      } else {
        // STRICTER FUZZY MATCHING: Only fuzzy match if word is long (prevents stack/snack mixups)
        if (word.length > 5) {
            for (const key in this.dimensionMap) {
            if (Math.abs(key.length - word.length) > 1) continue;
            if (this.getDistance(word, key) <= 1) {
                match = this.dimensionMap[key];
                break;
            }
            }
        }
      }

      if (match) {
        vector = vector.map((v, i) => v + (match![i] * currentMod)) as Vector;
        count++;
        currentMod = 1.0;
      }
    });

    if (count === 0) return [0,0,0,0,0,0];
    return vector.map(v => parseFloat((v / Math.max(1, count)).toFixed(2))) as Vector;
  }

  public process(input: string, knownConcepts: Record<string, AtomicConcept>, dappContext?: DAppContext): InputAnalysis {
    const cleanedInput = input.trim().toLowerCase();
    const words = cleanedInput.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 0);
    
    const keywords: AtomicConcept[] = [];
    const detectedEntities: string[] = [];
    const conceptKeys = Object.keys(knownConcepts);

    words.forEach((word) => {
      if (this.stopWords.has(word)) return;
      
      if (knownConcepts[word]) {
        keywords.push(knownConcepts[word]);
        detectedEntities.push(word);
        return;
      }
      
      // Strict fuzzy matching for concepts
      if (word.length > 5) {
        for (const key of conceptKeys) {
          if (Math.abs(key.length - word.length) > 1) continue;
          if (this.getDistance(word, key) <= 1) {
            keywords.push(knownConcepts[key]);
            detectedEntities.push(key);
            break;
          }
        }
      }
    });

    if (cleanedInput.match(/0x[a-fA-F0-9]{40}/)) detectedEntities.push('wallet_address');
    
    // Inject DApp context only if words strongly suggest it
    if (dappContext && (cleanedInput.includes('yield') || cleanedInput.includes('order'))) {
       if (!keywords.find(k => k.id === 'production_order') && knownConcepts['production_order']) {
           keywords.push(knownConcepts['production_order']);
       }
    }

    const inputVector = this.calculateVector(words);

    return {
      rawInput: input,
      cleanedInput,
      keywords: [...new Set(keywords)],
      intent: this.classifyIntent(cleanedInput, keywords, inputVector),
      emotionalWeight: this.calculateEmotionalWeight(cleanedInput),
      complexity: (words.length * 0.1) + (keywords.length * 0.2),
      detectedEntities,
      inputVector
    };
  }

  private classifyIntent(input: string, keywords: AtomicConcept[], vector: Vector): string {
    if (input.match(/^(reset|wipe|clear|save|crystallize)/)) return 'COMMAND';
    if (input.match(/^(hello|hi|hey)/i) && keywords.length === 0) return 'GREETING';
    
    // NARRATIVE DETECTION: Look for story markers
    if (input.length > 50 && (input.includes('once') || input.includes('then') || input.includes('finally') || input.includes('learned'))) {
        return 'NARRATIVE_ANALYSIS';
    }

    // Explicit Financial Keywords override vector
    if (input.includes('price') || input.includes('buy') || input.includes('sell') || input.includes('invest')) {
        return 'FINANCIAL_ADVICE';
    }

    // Vector-Based
    if (vector[0] > 0.7) return 'FINANCIAL_ADVICE'; // Strict threshold
    if (vector[4] > 0.6) return 'PHILOSOPHY'; // Abstract
    if (vector[2] > 0.6) return 'SOCIAL_ANALYSIS';

    if (input.includes('?')) return 'QUERY';
    
    return 'DISCOURSE';
  }

  private calculateEmotionalWeight(input: string): number {
    let weight = 0.5;
    if (input.match(/(happy|strong|good|right|love|great)/)) weight += 0.2;
    if (input.match(/(cry|hurt|sad|bad|wrong|fail)/)) weight -= 0.2;
    if (input.includes('!')) weight += 0.1;
    return Math.max(0, Math.min(1, weight));
  }
}