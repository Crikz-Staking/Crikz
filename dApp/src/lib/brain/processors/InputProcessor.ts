import { AtomicConcept } from '@/lib/crikzling-atomic-knowledge';
import { DAppContext } from '../types'; // FIXED IMPORT

export interface InputAnalysis {
  rawInput: string;
  cleanedInput: string;
  keywords: AtomicConcept[];
  intent: string;
  emotionalWeight: number;
  complexity: number;
  detectedEntities: string[];
}

export class InputProcessor {
  private stopWords: Set<string>;

  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'in', 'on', 'at', 'to', 
      'for', 'with', 'by', 'from', 'as', 'of', 'are', 'was', 'were', 'i', 'my', 'you',
      'hello', 'hi', 'hey'
    ]);
  }

  // Levenshtein Distance for Fuzzy Matching
  private getDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  public process(input: string, knownConcepts: Record<string, AtomicConcept>, dappContext?: DAppContext): InputAnalysis {
    const cleanedInput = input.trim().toLowerCase();
    const words = cleanedInput.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 0);
    
    // 1. Fuzzy Concept Extraction
    const keywords: AtomicConcept[] = [];
    const detectedEntities: string[] = [];
    const conceptKeys = Object.keys(knownConcepts);

    words.forEach((word) => {
      if (this.stopWords.has(word)) return;

      // Exact match
      if (knownConcepts[word]) {
        keywords.push(knownConcepts[word]);
        detectedEntities.push(word);
        return;
      }

      // Fuzzy match (allow 1 error for words > 4 chars)
      if (word.length > 4) {
        for (const key of conceptKeys) {
          if (Math.abs(key.length - word.length) > 1) continue;
          const dist = this.getDistance(word, key);
          if (dist <= 1) {
            keywords.push(knownConcepts[key]);
            detectedEntities.push(key); // Normalize to the correct concept
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

    // 3. Advanced Intent Classification
    const intent = this.classifyIntent(cleanedInput, keywords);

    // 4. Sentiment Analysis (Rule-based)
    const emotionalWeight = this.calculateEmotionalWeight(cleanedInput);

    return {
      rawInput: input,
      cleanedInput,
      keywords: [...new Set(keywords)], // Remove duplicates
      intent,
      emotionalWeight,
      complexity: (words.length * 0.1) + (keywords.length * 0.2),
      detectedEntities
    };
  }

  private classifyIntent(input: string, keywords: AtomicConcept[]): string {
    if (input.match(/^(reset|wipe|clear|save|crystallize)/)) return 'COMMAND';
    if (input.match(/^(hello|hi|hey|good morning|greetings)/i) && keywords.length === 0) return 'GREETING';
    
    // Financial Advice Detection
    if (input.includes('should i') || input.includes('recommend') || input.includes('strategy') || input.includes('profit')) {
      return 'FINANCIAL_ADVICE';
    }

    if (input.includes('?') || input.match(/^(what|why|how|when|where|who)/)) return 'QUERY';
    if (input.match(/^(explain|define|tell me about)/)) return 'EXPLANATION';
    
    // DApp Specific
    if (keywords.some(k => ['yield', 'reputation', 'stake', 'order'].includes(k.id))) return 'DAPP_QUERY';
    
    return 'DISCOURSE';
  }

  private calculateEmotionalWeight(input: string): number {
    let weight = 0.5;
    const boosters = ['love', 'great', 'amazing', 'perfect', 'thanks', 'cool', 'wow'];
    const dampeners = ['hate', 'bad', 'wrong', 'error', 'slow', 'fail', 'stupid'];
    
    boosters.forEach(w => { if(input.includes(w)) weight += 0.1; });
    dampeners.forEach(w => { if(input.includes(w)) weight -= 0.15; });
    
    if (input.includes('!')) weight += 0.05;
    return Math.max(0, Math.min(1, weight));
  }
}