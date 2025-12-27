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
  inputVector: Vector; // NEW: The mathematical meaning of the input
}

export class InputProcessor {
  private stopWords: Set<string>;

  // Keyword maps to dimensions: [Fin, Tech, Soc, Time, Abs, Risk]
  private dimensionMap: Record<string, Vector> = {
    'profit': [1, 0, 0, 0, 0, 0.5],
    'yield': [1, 0.2, 0, 0.3, 0, 0.2],
    'money': [1, 0, 0.5, 0, 0, 0],
    'code': [0, 1, 0, 0, 0.2, 0],
    'blockchain': [0.3, 1, 0.2, 0, 0.5, 0],
    'community': [0, 0.1, 1, 0, 0.2, 0],
    'reputation': [0.2, 0, 1, 0.1, 0.3, 0],
    'wait': [0, 0, 0, 1, 0, 0],
    'long': [0.1, 0, 0, 1, 0, 0.3],
    'future': [0, 0.2, 0, 1, 0.5, 0.5],
    'fibonacci': [0, 0.5, 0, 0.2, 1, 0],
    'entropy': [0, 0.2, 0, 0.5, 1, 0.8],
    'risk': [0.8, 0, 0, 0, 0, 1],
    'safe': [0.5, 0, 0, 0, 0, -0.5]
  };

  constructor() {
    this.stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'in', 'to', 'for', 'of', 'i', 'you']);
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

    words.forEach(word => {
      // Direct match in map
      if (this.dimensionMap[word]) {
        vector = vector.map((v, i) => v + this.dimensionMap[word][i]) as Vector;
        count++;
      } else {
        // Fuzzy match in map
        for (const key in this.dimensionMap) {
          if (this.getDistance(word, key) <= 1) {
            vector = vector.map((v, i) => v + this.dimensionMap[key][i]) as Vector;
            count++;
            break;
          }
        }
      }
    });

    if (count === 0) return [0,0,0,0,0,0];
    // Normalize (Average)
    return vector.map(v => parseFloat((v / count).toFixed(2))) as Vector;
  }

  public process(input: string, knownConcepts: Record<string, AtomicConcept>, dappContext?: DAppContext): InputAnalysis {
    const cleanedInput = input.trim().toLowerCase();
    const words = cleanedInput.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 0);
    
    // 1. Concept Extraction
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
      if (word.length > 4) {
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

    // 2. DApp Context Injection
    if (dappContext) {
      if (cleanedInput.includes('status') || cleanedInput.includes('report')) {
         if (!keywords.find(k => k.id === 'production_order')) keywords.push(knownConcepts['production_order'] || { id: 'production_order' } as any);
      }
    }

    // 3. Symbolic Vectorization
    const inputVector = this.calculateVector(words);

    return {
      rawInput: input,
      cleanedInput,
      keywords: [...new Set(keywords)],
      intent: this.classifyIntent(cleanedInput, keywords),
      emotionalWeight: this.calculateEmotionalWeight(cleanedInput),
      complexity: (words.length * 0.1) + (keywords.length * 0.2),
      detectedEntities,
      inputVector // Attached vector
    };
  }

  private classifyIntent(input: string, keywords: AtomicConcept[]): string {
    if (input.match(/^(reset|wipe|clear|save|crystallize)/)) return 'COMMAND';
    if (input.match(/^(hello|hi|hey|good morning|greetings)/i) && keywords.length === 0) return 'GREETING';
    if (input.includes('should i') || input.includes('recommend') || input.includes('strategy') || input.includes('profit')) return 'FINANCIAL_ADVICE';
    if (input.includes('?') || input.match(/^(what|why|how|when|where|who)/)) return 'QUERY';
    if (input.match(/^(explain|define|tell me about)/)) return 'EXPLANATION';
    if (keywords.some(k => ['yield', 'reputation', 'stake', 'order'].includes(k.id))) return 'DAPP_QUERY';
    return 'DISCOURSE';
  }

  private calculateEmotionalWeight(input: string): number {
    let weight = 0.5;
    if (input.match(/(love|great|amazing|thanks|cool)/)) weight += 0.2;
    if (input.match(/(bad|wrong|fail|stupid|hate)/)) weight -= 0.2;
    if (input.includes('!')) weight += 0.1;
    return Math.max(0, Math.min(1, weight));
  }
}