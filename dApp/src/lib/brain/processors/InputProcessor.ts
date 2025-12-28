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

  // V4 UPGRADE: Expanded Semantic Atlas
  // Dimensions: [Financial, Technical, Social, Temporal, Abstract, Risk]
  // Values range roughly -1.0 to 1.0
  private dimensionMap: Record<string, Vector> = {
    // Financial
    'profit': [1.0, 0, 0, 0, 0, 0.2],
    'yield': [1.0, 0.2, 0, 0.3, 0, 0.1],
    'loss': [1.0, 0, 0, 0, 0, 0.9],
    'rekt': [0.8, 0, 0.2, 0, 0, 1.0],
    'moon': [0.9, 0, 0.5, 0.2, 0, 0.8],
    'stake': [0.8, 0.4, 0, 0.5, 0, 0.1],
    'price': [1.0, 0, 0, 0, 0, 0.3],
    
    // Technical
    'code': [0, 1.0, 0, 0, 0.2, 0],
    'blockchain': [0.2, 1.0, 0.2, 0, 0.5, 0],
    'contract': [0.3, 1.0, 0, 0.5, 0.2, 0.1],
    'gas': [0.5, 0.8, 0, 0, 0, 0],
    'bug': [0, 1.0, 0, 0, 0, 0.8],
    'deploy': [0, 0.9, 0, 0.2, 0, 0.3],

    // Social / Governance
    'community': [0, 0.1, 1.0, 0, 0.2, 0],
    'reputation': [0.2, 0, 1.0, 0.1, 0.3, 0],
    'vote': [0, 0, 1.0, 0, 0.1, 0],
    'dao': [0.1, 0.7, 1.0, 0, 0.4, 0.2],
    'architect': [0, 0.5, 0.8, 0, 0.6, 0],

    // Temporal
    'wait': [0, 0, 0, 1.0, 0, 0],
    'long': [0.1, 0, 0, 1.0, 0, 0.3],
    'soon': [0, 0, 0, 0.8, 0, 0.2],
    'fast': [0, 0.2, 0, -0.5, 0, 0.4],
    'future': [0, 0.2, 0, 1.0, 0.5, 0.5],
    'history': [0, 0, 0.3, -0.8, 0.2, 0],

    // Abstract / Philosophy
    'fibonacci': [0, 0.5, 0, 0.2, 1.0, 0],
    'entropy': [0, 0.2, 0, 0.5, 1.0, 0.8],
    'life': [0, 0, 0.5, 0.5, 1.0, 0.2],
    'consciousness': [0, 0.2, 0.2, 0, 1.0, 0],
    'pattern': [0, 0.3, 0, 0, 0.9, 0],

    // Risk
    'risk': [0.8, 0, 0, 0, 0, 1.0],
    'safe': [0.3, 0.2, 0, 0, 0, -0.8],
    'scam': [0.5, 0, 0.2, 0, 0, 1.0],
    'secure': [0.1, 0.8, 0, 0, 0, -0.7]
  };

  private modifiers: Record<string, number> = {
    'very': 1.5,
    'high': 1.5,
    'low': 0.5,
    'not': -1.0,
    'super': 2.0,
    'little': 0.8
  };

  constructor() {
    this.stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'in', 'to', 'for', 'of', 'i', 'you', 'it', 'that']);
  }

  // Levenshtein Distance for fuzzy matching
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
      // Check if it's a modifier
      if (this.modifiers[word]) {
        currentMod = this.modifiers[word];
        return;
      }

      let match: Vector | null = null;

      // 1. Direct Match
      if (this.dimensionMap[word]) {
        match = this.dimensionMap[word];
      } 
      // 2. Fuzzy Match
      else {
        for (const key in this.dimensionMap) {
          if (Math.abs(key.length - word.length) > 2) continue;
          if (this.getDistance(word, key) <= 1) {
            match = this.dimensionMap[key];
            break;
          }
        }
      }

      if (match) {
        vector = vector.map((v, i) => v + (match![i] * currentMod)) as Vector;
        count++;
        currentMod = 1.0; // Reset modifier
      }
    });

    if (count === 0) return [0,0,0,0,0,0];
    
    // Normalize and round
    return vector.map(v => parseFloat((v / Math.max(1, count)).toFixed(2))) as Vector;
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
      
      // Exact concept match
      if (knownConcepts[word]) {
        keywords.push(knownConcepts[word]);
        detectedEntities.push(word);
        return;
      }
      
      // Fuzzy concept match
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

    // 2. Heuristic Entity Detection (Regex)
    if (cleanedInput.match(/0x[a-fA-F0-9]{40}/)) detectedEntities.push('wallet_address');
    if (cleanedInput.match(/\b\d+(\.\d+)?\s*(eth|bnb|crkz)\b/)) detectedEntities.push('token_amount');

    // 3. DApp Context Injection (Context-Aware Keywords)
    if (dappContext) {
      if (cleanedInput.includes('status') || cleanedInput.includes('report')) {
         if (!keywords.find(k => k.id === 'production_order') && knownConcepts['production_order']) {
             keywords.push(knownConcepts['production_order']);
         }
      }
    }

    // 4. Symbolic Vectorization (The "Meaning" of the input)
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
    // Priority 1: Commands
    if (input.match(/^(reset|wipe|clear|save|crystallize)/)) return 'COMMAND';
    
    // Priority 2: Greetings
    if (input.match(/^(hello|hi|hey|good morning|greetings)/i) && keywords.length === 0) return 'GREETING';
    
    // Priority 3: Vector-Based Intent (V4 Feature)
    // If Financial dimension is dominant
    if (vector[0] > 0.6) return 'FINANCIAL_ADVICE';
    // If Technical dimension is dominant
    if (vector[1] > 0.6) return 'EXPLANATION';
    
    // Priority 4: Keyword/Pattern Matching
    if (input.includes('should i') || input.includes('recommend') || input.includes('strategy')) return 'FINANCIAL_ADVICE';
    if (input.includes('?') || input.match(/^(what|why|how|when|where|who)/)) return 'QUERY';
    if (keywords.some(k => ['yield', 'reputation', 'stake', 'order'].includes(k.id))) return 'DAPP_QUERY';
    
    return 'DISCOURSE';
  }

  private calculateEmotionalWeight(input: string): number {
    let weight = 0.5;
    if (input.match(/(love|great|amazing|thanks|cool|happy|good)/)) weight += 0.2;
    if (input.match(/(bad|wrong|fail|stupid|hate|sad|angry)/)) weight -= 0.2;
    if (input.match(/(scared|risk|lost|help)/)) weight += 0.3; // High urgency = high emotion
    if (input.includes('!')) weight += 0.1;
    return Math.max(0, Math.min(1, weight));
  }
}