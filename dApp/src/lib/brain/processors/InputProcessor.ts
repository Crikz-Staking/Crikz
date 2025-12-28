// src/lib/brain/processors/InputProcessor.ts

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
  inputVector: Vector; 
}

export class InputProcessor {
  private stopWords: Set<string>;

  private dimensionMap: Record<string, Vector> = {
    // Financial
    'profit': [1.0, 0, 0, 0, 0, 0.2], 'yield': [1.0, 0.2, 0, 0.3, 0, 0.1],
    'loss': [1.0, 0, 0, 0, 0, 0.9], 'stake': [0.9, 0.4, 0, 0.5, 0, 0.1],
    'price': [1.0, 0, 0, 0, 0, 0.3], 'wallet': [0.9, 0.2, 0, 0, 0, 0.1],
    
    // Technical
    'code': [0, 1.0, 0, 0, 0.2, 0], 'blockchain': [0.2, 1.0, 0.2, 0, 0.5, 0],
    'contract': [0.3, 1.0, 0.1, 0, 0.4, 0], 'function': [0, 1.0, 0, 0, 0.6, 0],

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

    words.forEach(word => {
      // Direct or Fuzzy Match
      let match: Vector | null = this.dimensionMap[word] || null;
      
      if (match) {
        vector = vector.map((v, i) => v + match![i]) as Vector;
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

    // Concept Extraction
    words.forEach((word) => {
      if (knownConcepts[word]) {
        keywords.push(knownConcepts[word]);
        detectedEntities.push(word);
      }
    });

    // Detect Contextual Entity
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

  private classifyIntent(input: string, keywords: AtomicConcept[], vector: Vector): string {
    if (input.match(/^(reset|wipe|clear|save|crystallize)/)) return 'COMMAND';
    if (input.match(/^(hello|hi|hey)/i) && keywords.length === 0) return 'GREETING';
    
    // Abstract thought detection
    if (vector[4] > 0.6) return 'PHILOSOPHY'; 
    if (vector[0] > 0.6) return 'FINANCIAL_ADVICE';
    
    if (input.includes('?')) return 'QUERY';
    return 'DISCOURSE';
  }

  private calculateEmotionalWeight(input: string): number {
    let weight = 0.5;
    if (input.match(/(happy|great|love|thanks|good)/)) weight += 0.2;
    if (input.match(/(sad|bad|hate|wrong|error|fail)/)) weight -= 0.2;
    if (input.includes('!')) weight += 0.1;
    return Math.max(0, Math.min(1, weight));
  }
}