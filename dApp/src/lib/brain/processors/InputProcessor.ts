import { AtomicConcept, ATOMIC_PRIMITIVES } from '@/lib/crikzling-atomic-knowledge';
import { 
  DAppContext, Vector, IntentType, InputAnalysis, 
  GrammarStructure, CapabilityType, SafetyRating 
} from '../types';

export class InputProcessor {
  private noiseWords: Set<string>;
  private actionVerbs: Record<string, CapabilityType>;
  private sensitiveTerms: Record<string, 'UNSAFE' | 'SENSITIVE_DATA'>;
  
  // Sentiment Lexicon
  private posWords: Set<string>;
  private negWords: Set<string>;

  constructor() {
    this.noiseWords = new Set(['um', 'uh', 'er', 'ah', 'hmm', 'like']);
    
    this.actionVerbs = {
      'create': 'WRITE_CHAIN', 'mint': 'WRITE_CHAIN', 'buy': 'WRITE_CHAIN', 'sell': 'WRITE_CHAIN',
      'stake': 'WRITE_CHAIN', 'bet': 'WRITE_CHAIN', 'send': 'WRITE_CHAIN',
      'read': 'READ_CHAIN', 'check': 'READ_CHAIN', 'scan': 'READ_CHAIN', 'get': 'READ_CHAIN',
      'analyze': 'ANALYZE_DATA', 'calculate': 'CALCULATE', 'predict': 'ANALYZE_DATA', 'solve': 'CALCULATE',
      'explain': 'INFER_RELATIONSHIP', 'define': 'GENERATE_KNOWLEDGE', 'why': 'INFER_RELATIONSHIP', 
      'connect': 'INFER_RELATIONSHIP',
      'save': 'SYSTEM_CONTROL', 'reset': 'SYSTEM_CONTROL', 'wipe': 'SYSTEM_CONTROL', 'crystallize': 'SYSTEM_CONTROL'
    };

    this.sensitiveTerms = {
      'private key': 'SENSITIVE_DATA', 'seed phrase': 'SENSITIVE_DATA', 'secret recovery': 'SENSITIVE_DATA',
      'password': 'SENSITIVE_DATA', 'hack': 'UNSAFE', 'exploit': 'UNSAFE', 'steal': 'UNSAFE',
      'rug': 'UNSAFE', 'drain': 'UNSAFE', 'kill': 'UNSAFE', 'suicide': 'UNSAFE', 'hate': 'UNSAFE'
    };

    this.posWords = new Set(['good', 'great', 'profit', 'gain', 'up', 'safe', 'secure', 'love', 'happy', 'smart', 'bullish', 'optimal']);
    this.negWords = new Set(['bad', 'loss', 'down', 'broken', 'scam', 'hate', 'stupid', 'crash', 'bearish', 'risk', 'fail', 'error']);
  }

  private calculateVectorFromConcepts(concepts: AtomicConcept[], modifiers: { specificity: number }): Vector {
    const vector: Vector = [0, 0, 0, 0, 0, 0];
    const domainMap: Record<string, number> = {
        'FINANCIAL': 0, 'DEFI': 0, 'TECHNICAL': 1, 'BLOCKCHAIN': 1, 'COMPUTER': 1,
        'SOCIAL': 2, 'LINGUISTIC': 2, 'TEMPORAL': 3, 'META': 4, 'PHILOSOPHICAL': 4, 
        'NUMERICAL': 4, 'CAUSAL': 5, 'SECURITY': 5
    };

    if (concepts.length === 0) return vector;

    concepts.forEach(c => {
        const domain = c.domain || 'META';
        const index = domainMap[domain];
        if (index !== undefined) {
            let weight = c.abstractionLevel || 0.5;
            if (modifiers.specificity > 0 && (domain === 'TECHNICAL' || domain === 'FINANCIAL')) weight *= 1.2; 
            vector[index] += weight;
        }
    });

    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? vector : vector.map(v => parseFloat((v / magnitude).toFixed(4))) as Vector;
  }

  public process(input: string, knownConcepts: Record<string, AtomicConcept>, dappContext?: DAppContext): InputAnalysis {
    const cleanedInput = input.trim();
    const lowerInput = cleanedInput.toLowerCase();
    
    // 1. Tokenization with Symbol Preservation for Math/Code
    const rawTokens = lowerInput
        .replace(/[^\w\s\+\-\*\/%=\.]/gi, '') 
        .split(/\s+/)
        .filter(w => w.length > 0 && !this.noiseWords.has(w));
    
    const keywords: AtomicConcept[] = [];
    const detectedEntities: string[] = [];
    
    let specificityScore = 0; 

    // 2. Syntactic & Semantic Pass
    const grammar: GrammarStructure = {
      subject: null, action: null, object: null, modifiers: [],
      isQuestion: input.includes('?'), isImperative: false, tense: 'PRESENT'
    };

    // Tense Logic
    if (lowerInput.match(/\b(will|going to|future|next|prediction)\b/)) grammar.tense = 'FUTURE';
    if (lowerInput.match(/\b(was|did|history|past|previous)\b/)) grammar.tense = 'PAST';

    for (let i = 0; i < rawTokens.length; i++) {
        const word = rawTokens[i];
        
        let concept = knownConcepts[word] || ATOMIC_PRIMITIVES[word];
        
        // Deep Search for Synonyms
        if (!concept) {
            for (const key in ATOMIC_PRIMITIVES) {
                if (ATOMIC_PRIMITIVES[key].semanticField.includes(word)) {
                    concept = ATOMIC_PRIMITIVES[key];
                    break;
                }
            }
        }

        if (concept) {
            keywords.push(concept);
            if (concept.id === 'determinism') specificityScore += 0.5; 
            else if (concept.id === 'potential') specificityScore -= 0.3;
        } else {
            // Numeric or Entity Identification
            if (!isNaN(Number(word))) {
                detectedEntities.push(word);
            } else if (word.length > 2) {
                // Ignore general filler words not in known concepts but not noise
                detectedEntities.push(word);
            }
        }

        if (i === 0 && this.actionVerbs[word]) {
            grammar.action = word;
            grammar.isImperative = true;
        } 
    }

    if (cleanedInput.match(/0x[a-fA-F0-9]{40}/)) {
        detectedEntities.push('wallet_address');
        specificityScore = 1.0; 
    }

    const inputVector = this.calculateVectorFromConcepts(keywords, { specificity: specificityScore });
    const safetyAnalysis = this.analyzeSafety(lowerInput);
    const capability = this.determineCapability(grammar.action, lowerInput, inputVector);
    const verbosityNeeded = this.calculateVerbosity(lowerInput, grammar, inputVector);
    const sentiment = this.calculateSentiment(rawTokens);

    const intent = this.classifyIntent(lowerInput, grammar, inputVector, specificityScore, safetyAnalysis.rating, capability);

    return {
      rawInput: input,
      cleanedInput: lowerInput,
      keywords: [...new Set(keywords)],
      intent,
      emotionalWeight: 0.5 + (Math.abs(sentiment) * 0.5),
      sentiment, // <--- New Field
      complexity: (rawTokens.length * 0.1) + (keywords.length * 0.2),
      detectedEntities,
      inputVector,
      grammar,
      requestedCapability: capability,
      safety: safetyAnalysis,
      verbosityNeeded
    };
  }

  // --- SUB-ANALYZERS ---

  private calculateSentiment(tokens: string[]): number {
      let score = 0;
      tokens.forEach(t => {
          if (this.posWords.has(t)) score += 1;
          if (this.negWords.has(t)) score -= 1;
      });
      // Normalize between -1 and 1
      return Math.max(-1, Math.min(1, score * 0.5));
  }

  private calculateVerbosity(input: string, grammar: GrammarStructure, vector: Vector): number {
      if (input.match(/^(why|how|explain|describe|teach|elaborate)/)) return 0.9; 
      if (input.match(/^(what is|status|price|balance|check|is|equals)/)) return 0.2; 
      
      if (grammar.isQuestion) {
          if (vector[4] > 0.5 || vector[1] > 0.5) return 0.8;
          return 0.5; 
      }
      return 0.5; 
  }

  private analyzeSafety(input: string): { rating: SafetyRating; flaggedTerms: string[]; reason?: string } {
    const flagged: string[] = [];
    let rating: SafetyRating = 'SAFE';
    let reason = '';

    for (const [term, severity] of Object.entries(this.sensitiveTerms)) {
        if (input.includes(term)) {
            flagged.push(term);
            if (severity === 'UNSAFE') {
                rating = 'UNSAFE';
                reason = 'Malicious intent detected.';
            } else if (severity === 'SENSITIVE_DATA' && rating !== 'UNSAFE') {
                rating = 'SENSITIVE_DATA';
                reason = 'Request involves private credentials.';
            }
        }
    }

    if (input.includes('price') && (input.includes('guarantee') || input.includes('pump'))) {
        rating = 'ETHICALLY_AMBIGUOUS';
        reason = 'Request implies market manipulation.';
    }

    return { rating, flaggedTerms: flagged, reason };
  }

  private determineCapability(action: string | null, input: string, vector: Vector): CapabilityType {
    const mathPattern = /(\d+)\s*(plus|minus|times|divided by|multiplied by|\+|\-|\*|\/|\^|%)\s*(\d+)|(sqrt|square root)/i;
    if (mathPattern.test(input)) return 'CALCULATE';

    if (action && this.actionVerbs[action]) return this.actionVerbs[action];
    
    // Abstract Inference Check - User asking for relationships "Why", "How does X affect Y"
    if (input.includes('why') || input.includes('relationship') || input.includes('affect')) {
        return 'INFER_RELATIONSHIP';
    }

    if (vector[0] > 0.6) return 'ANALYZE_DATA'; 
    if (vector[1] > 0.6 && input.includes('?')) return 'GENERATE_KNOWLEDGE'; 
    if (input.includes('price') || input.includes('balance')) return 'READ_CHAIN';

    return 'NONE';
  }

  private classifyIntent(
      input: string, 
      grammar: GrammarStructure, 
      vector: Vector, 
      specificity: number,
      safety: SafetyRating,
      capability: CapabilityType
  ): IntentType {
    
    if (safety === 'UNSAFE' || safety === 'SENSITIVE_DATA') return 'SECURITY_ALERT';
    if (capability === 'CALCULATE') return 'MATH_CALCULATION';
    if (input.match(/^(reset|wipe|clear|save|crystallize|upload)/)) return 'COMMAND';
    if (input.match(/^(hello|hi|hey|greetings)/i) && input.split(' ').length < 3) return 'GREETING';

    if (vector[0] > 0.4) {
        if (grammar.isImperative && (grammar.action === 'buy' || grammar.action === 'stake')) return 'TRANSACTION_REQUEST';
        if (specificity > 0 || input.includes('my')) return 'DAPP_QUERY'; 
        return 'FINANCIAL_ADVICE'; 
    }

    // Logic for Abstract vs Concrete
    if (vector[4] > 0.6 || capability === 'INFER_RELATIONSHIP') return 'PHILOSOPHY'; // Interprets concepts
    if (vector[1] > 0.5 && grammar.isQuestion) return 'EXPLANATION'; // Explains tech

    if (grammar.isQuestion) return 'QUERY';
    return 'CASUAL';
  }
}