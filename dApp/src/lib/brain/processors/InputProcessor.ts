import { AtomicConcept } from '@/lib/crikzling-atomic-knowledge';
import { DAppContext } from '../crikzling-brain-v3';

export interface InputAnalysis {
  rawInput: string;
  cleanedInput: string;
  keywords: AtomicConcept[];
  intent: IntentType;
  emotionalWeight: number;
  complexity: number;
}

export type IntentType = 'GREETING' | 'COMMAND' | 'QUERY' | 'EXPLANATION' | 'DAPP_QUERY' | 'DISCOURSE' | 'STATEMENT' | 'UNKNOWN';

export class InputProcessor {
  private stopWords: Set<string>;

  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'in', 'on', 'at', 'to', 
      'for', 'with', 'by', 'from', 'as', 'of', 'are', 'was', 'were', 'i', 'my', 'you'
    ]);
  }

  public process(input: string, knownConcepts: Record<string, AtomicConcept>, dappContext?: DAppContext): InputAnalysis {
    const cleanedInput = input.trim().toLowerCase();
    const words = cleanedInput.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 0);
    
    // 1. Extract Keywords & Concepts
    const keywords: AtomicConcept[] = [];
    words.forEach((word) => {
      if (!this.stopWords.has(word) && knownConcepts[word]) {
        keywords.push(knownConcepts[word]);
      }
    });

    // 2. Contextual Keyword Injection (DApp Awareness)
    if (dappContext) {
      ['order', 'reputation', 'yield', 'balance', 'stake', 'fund'].forEach((term) => {
        if (knownConcepts[term] && cleanedInput.includes(term) && !keywords.find(k => k.id === term)) {
          keywords.push(knownConcepts[term]);
        }
      });
    }

    // 3. Classify Intent
    const intent = this.classifyIntent(cleanedInput);

    // 4. Emotional Analysis
    const emotionalWeight = this.calculateEmotionalWeight(cleanedInput);

    // 5. Complexity Score
    const complexity = (words.length * 0.1) + (keywords.length * 0.2);

    return {
      rawInput: input,
      cleanedInput,
      keywords,
      intent,
      emotionalWeight,
      complexity
    };
  }

  private classifyIntent(input: string): IntentType {
    if (input.match(/^(reset|wipe|clear|save|crystallize)/)) return 'COMMAND';
    if (input.match(/^(hello|hi|hey|good morning|greetings)/i)) return 'GREETING';
    if (input.includes('?') || input.match(/^(what|why|how|when|where|who)/)) return 'QUERY';
    if (input.match(/^(explain|define|tell me about)/)) return 'EXPLANATION';
    if (input.match(/(order|stake|yield|reputation|balance|fund|mint)/)) return 'DAPP_QUERY';
    if (input.length > 50) return 'DISCOURSE';
    return 'STATEMENT';
  }

  private calculateEmotionalWeight(input: string): number {
    let weight = 0.5; // Base neutral
    if (input.includes('!')) weight += 0.2;
    if (input.includes('?')) weight += 0.1;
    if (input.match(/(love|great|amazing|wonderful|thanks|good)/)) weight += 0.2;
    if (input.match(/(bad|terrible|hate|angry|wrong|error|fail)/)) weight -= 0.3;
    return Math.max(0, Math.min(1, weight));
  }
}