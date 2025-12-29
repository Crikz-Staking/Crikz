import { AtomicConcept, ATOMIC_PRIMITIVES } from '@/lib/crikzling-atomic-knowledge';
import { 
  DAppContext, Vector, IntentType, InputAnalysis, 
  GrammarStructure, CapabilityType, SafetyRating 
} from '../types';

export class InputProcessor {
  // Pure noise words that have 0 semantic or structural value
  private noiseWords: Set<string>;
  
  // Verbs that imply a request for the machine to do something
  private actionVerbs: Record<string, CapabilityType>;
  
  // Terms that trigger safety protocols
  private sensitiveTerms: Record<string, 'UNSAFE' | 'SENSITIVE_DATA'>;

  constructor() {
    this.noiseWords = new Set(['um', 'uh', 'er', 'ah', 'hmm', 'like']);
    
    // Map verbs to capabilities
    this.actionVerbs = {
      'create': 'WRITE_CHAIN', 'mint': 'WRITE_CHAIN', 'buy': 'WRITE_CHAIN', 'sell': 'WRITE_CHAIN',
      'stake': 'WRITE_CHAIN', 'bet': 'WRITE_CHAIN', 'send': 'WRITE_CHAIN',
      'read': 'READ_CHAIN', 'check': 'READ_CHAIN', 'scan': 'READ_CHAIN', 'get': 'READ_CHAIN',
      'analyze': 'ANALYZE_DATA', 'calculate': 'ANALYZE_DATA', 'predict': 'ANALYZE_DATA', 'solve': 'CALCULATE', 'compute': 'CALCULATE',
      'explain': 'GENERATE_KNOWLEDGE', 'define': 'GENERATE_KNOWLEDGE', 'teach': 'GENERATE_KNOWLEDGE',
      'save': 'SYSTEM_CONTROL', 'reset': 'SYSTEM_CONTROL', 'wipe': 'SYSTEM_CONTROL', 'crystallize': 'SYSTEM_CONTROL'
    };

    // Safety Filter Dictionary
    this.sensitiveTerms = {
      'private key': 'SENSITIVE_DATA',
      'seed phrase': 'SENSITIVE_DATA',
      'secret recovery': 'SENSITIVE_DATA',
      'password': 'SENSITIVE_DATA',
      'hack': 'UNSAFE',
      'exploit': 'UNSAFE',
      'steal': 'UNSAFE',
      'rug': 'UNSAFE',
      'drain': 'UNSAFE',
      'kill': 'UNSAFE',
      'suicide': 'UNSAFE',
      'hate': 'UNSAFE'
    };
  }

  // --- VECTOR CALCULATOR ---
  private calculateVectorFromConcepts(concepts: AtomicConcept[], modifiers: { specificity: number }): Vector {
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
            let weight = c.abstractionLevel || 0.5;
            // Apply Grammatical Modifiers based on Domain
            // If we are "Specific" (The contract), Technical accuracy matters more.
            if (modifiers.specificity > 0 && (domain === 'TECHNICAL' || domain === 'FINANCIAL')) {
                weight *= 1.2; 
            }
            vector[index] += weight;
        }
    });

    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? vector : vector.map(v => parseFloat((v / magnitude).toFixed(4))) as Vector;
  }

  public process(input: string, knownConcepts: Record<string, AtomicConcept>, dappContext?: DAppContext): InputAnalysis {
    const cleanedInput = input.trim();
    const lowerInput = cleanedInput.toLowerCase();
    
    // 1. Tokenization & Basic Parsing
    const rawTokens = lowerInput
        .replace(/[^\w\s\+\-\*\/]/gi, '') // Allow basic math operators through
        .split(/\s+/)
        .filter(w => w.length > 0 && !this.noiseWords.has(w));
    
    const keywords: AtomicConcept[] = [];
    const detectedEntities: string[] = [];
    
    let specificityScore = 0; 

    // 2. Syntactic & Semantic Pass
    const grammar: GrammarStructure = {
      subject: null,
      action: null,
      object: null,
      modifiers: [],
      isQuestion: input.includes('?'),
      isImperative: false
    };

    for (let i = 0; i < rawTokens.length; i++) {
        const word = rawTokens[i];
        
        // Concept Resolution
        let concept = knownConcepts[word] || ATOMIC_PRIMITIVES[word];
        
        // Synonym Resolver
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
            
            // Linguistic Function Check
            if (concept.id === 'determinism') { 
                specificityScore += 0.5; 
            } else if (concept.id === 'potential') {
                specificityScore -= 0.3;
            }
        } else {
            // Check for math patterns in unknown words (e.g. numbers)
            if (!isNaN(Number(word))) {
                detectedEntities.push(word);
            } else if (word.length > 2) {
                detectedEntities.push(word);
            }
        }

        // Structural Tagging (Heuristic)
        if (i === 0 && this.actionVerbs[word]) {
            grammar.action = word;
            grammar.isImperative = true;
        } 
        else if (detectedEntities.includes(word) && !grammar.subject) {
            grammar.subject = word;
        }
        else if (detectedEntities.includes(word) && grammar.subject && !grammar.object) {
            grammar.object = word;
        }
    }

    // Wallet Detection
    if (cleanedInput.match(/0x[a-fA-F0-9]{40}/)) {
        detectedEntities.push('wallet_address');
        specificityScore = 1.0; 
    }

    const inputVector = this.calculateVectorFromConcepts(keywords, { specificity: specificityScore });

    // 3. Safety & Ethics Analysis
    const safetyAnalysis = this.analyzeSafety(lowerInput);

    // 4. Capability Matching
    const capability = this.determineCapability(grammar.action, lowerInput, inputVector);

    // 5. Calculate Verbosity
    const verbosityNeeded = this.calculateVerbosity(lowerInput, grammar, inputVector);

    // 6. Intent Classification
    const intent = this.classifyIntent(lowerInput, grammar, inputVector, specificityScore, safetyAnalysis.rating, capability);

    return {
      rawInput: input,
      cleanedInput: lowerInput,
      keywords: [...new Set(keywords)],
      intent,
      emotionalWeight: this.calculateEmotionalWeight(lowerInput, keywords),
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

  private calculateVerbosity(input: string, grammar: GrammarStructure, vector: Vector): number {
      if (input.match(/^(why|how|explain|describe|teach)/)) return 0.9; 
      if (input.match(/^(what is|status|price|balance|check|is)/)) return 0.2; 
      
      if (grammar.isQuestion) {
          if (vector[4] > 0.5 || vector[1] > 0.5) return 0.8;
          return 0.5; 
      }
      if (input.length < 10) return 0.1; 
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
                reason = 'Input contains potentially malicious or harmful intent.';
            } else if (severity === 'SENSITIVE_DATA' && rating !== 'UNSAFE') {
                rating = 'SENSITIVE_DATA';
                reason = 'Input requests or contains private security credentials.';
            }
        }
    }

    if (input.includes('price') && (input.includes('guarantee') || input.includes('pump'))) {
        rating = 'ETHICALLY_AMBIGUOUS';
        reason = 'Request implies market manipulation or financial guarantee.';
    }

    return { rating, flaggedTerms: flagged, reason };
  }

  private determineCapability(action: string | null, input: string, vector: Vector): CapabilityType {
    // 1. Math Check (Highest Priority for non-commands)
    // Matches "1+1", "1 + 1", "5 times 5", "square root of 9", "what is 10 / 2"
    const mathPattern = /(\d+)\s*(plus|minus|times|divided by|multiplied by|\+|\-|\*|\/|\^|%)\s*(\d+)|(sqrt|square root)/i;
    if (mathPattern.test(input)) {
        return 'CALCULATE';
    }

    // 2. Direct Verb Mapping
    if (action && this.actionVerbs[action]) {
        return this.actionVerbs[action];
    }

    // 3. Vector Inference
    if (vector[0] > 0.6) return 'ANALYZE_DATA'; 
    if (vector[1] > 0.6 && input.includes('?')) return 'GENERATE_KNOWLEDGE'; 

    // 4. Keyword scanning
    if (input.includes('price') || input.includes('balance')) return 'READ_CHAIN';
    if (input.includes('optimize') || input.includes('sim')) return 'ANALYZE_DATA';

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
    
    // Explicit Math Check
    if (capability === 'CALCULATE') return 'MATH_CALCULATION';

    if (input.match(/^(reset|wipe|clear|save|crystallize|upload)/)) return 'COMMAND';
    
    if (input.match(/^(hello|hi|hey|greetings)/i) && input.split(' ').length < 3) return 'GREETING';

    if (vector[0] > 0.4) {
        if (grammar.isImperative && (grammar.action === 'buy' || grammar.action === 'stake')) {
            return 'TRANSACTION_REQUEST';
        }
        if (specificity > 0 || input.includes('my')) return 'DAPP_QUERY'; 
        return 'FINANCIAL_ADVICE'; 
    }

    if (vector[1] > 0.5) {
        if (grammar.isQuestion) return 'EXPLANATION';
        return 'DISCOURSE'; 
    }

    if (vector[4] > 0.6) return 'PHILOSOPHY';

    if (grammar.isQuestion) return 'QUERY';
    
    return 'CASUAL';
  }

  private calculateEmotionalWeight(input: string, keywords: AtomicConcept[]): number {
    let weight = 0.5;
    if (input.match(/(happy|great|love|thanks|good|amazing|cool|profit|gain|bullish|safe|secure)/)) weight += 0.2;
    if (input.match(/(sad|bad|hate|wrong|error|fail|broken|stupid|loss|crash|bearish|scam|risk)/)) weight -= 0.2;
    
    keywords.forEach(k => {
        if (k.emotional_valence) weight += (k.emotional_valence * 0.1);
    });

    if (input.includes('!')) weight += 0.1;
    return Math.max(0, Math.min(1, weight));
  }
}