import { AtomicConcept } from '@/lib/crikzling-atomic-knowledge';
import { DAppContext, Vector, IntentType } from '../types';

export interface InputAnalysis {
  rawInput: string;
  cleanedInput: string;
  keywords: AtomicConcept[];
  intent: IntentType;
  emotionalWeight: number;
  complexity: number;
  detectedEntities: string[];
  inputVector: Vector; 
}

export class InputProcessor {
  private stopWords: Set<string>;

  // Improved mapping with partial matching logic
  private dimensionMap: Record<string, Vector> = {
    // Financial
    'profit': [1.0, 0, 0, 0, 0, 0.2], 'yield': [1.0, 0.2, 0, 0.3, 0, 0.1],
    'earn': [0.9, 0, 0, 0, 0, 0], 'money': [0.8, 0, 0, 0, 0, 0],
    'loss': [1.0, 0, 0, 0, 0, 0.9], 'stake': [0.9, 0.4, 0, 0.5, 0, 0.1],
    
    // Technical
    'code': [0, 1.0, 0, 0, 0.2, 0], 'chain': [0.2, 1.0, 0.2, 0, 0.5, 0],
    'contract': [0.2, 1.0, 0, 0, 0.3, 0], 'gas': [0.5, 0.8, 0, 0, 0, 0],
    
    // Social / Identity
    'who': [0, 0, 1.0, 0, 0.5, 0], 'you': [0, 0, 1.0, 0, 0.5, 0],
    'hello': [0, 0, 1.0, 0, 0, 0], 'help': [0, 0, 0.8, 0, 0.2, 0],

    // Abstract / Logic
    'why': [0, 0.2, 0, 0, 1.0, 0], 'how': [0, 0.5, 0, 0, 0.8, 0],
    'think': [0, 0.2, 0, 0, 1.0, 0], 'dream': [0, 0, 0, 0.2, 1.0, 0]
  };

  constructor() {
    this.stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'in', 'to', 'for', 'of', 'it', 'that', 'was']);
  }

  private calculateVector(words: string[]): Vector {
    let vector: Vector = [0, 0, 0, 0, 0, 0];
    let count = 0;

    const keys = Object.keys(this.dimensionMap);

    words.forEach(word => {
      // Improved: Check for partial matches (e.g. "profits" matches "profit")
      const matchedKey = keys.find(k => word.includes(k) || k.includes(word));
      
      if (matchedKey) {
        const vec = this.dimensionMap[matchedKey];
        vector = vector.map((v, i) => v + vec[i]) as Vector;
        count++;
      }
    });

    if (count === 0) return [0,0,0,0,0,0];
    // Normalize
    return vector.map(v => parseFloat((v / Math.max(1, count)).toFixed(2))) as Vector;
  }

  public process(input: string, knownConcepts: Record<string, AtomicConcept>, dappContext?: DAppContext): InputAnalysis {
    const cleanedInput = input.trim().toLowerCase();
    const words = cleanedInput.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 0 && !this.stopWords.has(w));
    
    const keywords: AtomicConcept[] = [];
    const detectedEntities: string[] = [];

    words.forEach((word) => {
      // Improved: Fuzzy match for concepts
      const conceptKey = Object.keys(knownConcepts).find(k => k.includes(word) || word.includes(k));
      if (conceptKey) {
        keywords.push(knownConcepts[conceptKey]);
        detectedEntities.push(word);
      }
    });

    if (cleanedInput.match(/0x[a-fA-F0-9]{40}/)) detectedEntities.push('wallet_address');

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

  private classifyIntent(input: string, keywords: AtomicConcept[], vector: Vector): IntentType {
    if (input.match(/^(reset|wipe|clear|save|crystallize)/)) return 'COMMAND';
    // Improved Greeting Detection
    if (input.match(/^(hello|hi|hey|greetings)/i)) return 'GREETING';
    
    // Vector-based classification (Mock logic replaced with Vector thresholds)
    if (vector[4] > 0.6) return 'PHILOSOPHY'; // High Abstract
    if (vector[0] > 0.6 || input.includes('price') || input.includes('apr')) return 'FINANCIAL_ADVICE'; // High Financial
    
    if (input.includes('?')) return 'QUERY';
    return 'DISCOURSE';
  }

  private calculateEmotionalWeight(input: string): number {
    let weight = 0.5;
    // Expanded sentiment list
    if (input.match(/(happy|great|love|thanks|good|amazing|cool)/)) weight += 0.2;
    if (input.match(/(sad|bad|hate|wrong|error|fail|broken|stupid)/)) weight -= 0.2;
    if (input.includes('!')) weight += 0.1;
    return Math.max(0, Math.min(1, weight));
  }
}