// src/lib/crikzling-enhanced-brain.ts
// REVOLUTIONARY: True learning through atomic understanding

import { 
  ATOMIC_PRIMITIVES, 
  ATOMIC_RELATIONS, 
  CONTEXT_PATTERNS,
  LEARNING_STAGES,
  DOMAIN_CONCEPTS,
  AtomicConcept, 
  ConceptRelation, 
  ContextPattern,
  AtomicDomain 
} from './crikzling-atomic-knowledge';

export interface LearningEvent {
  timestamp: number;
  type: 'NEW_WORD' | 'NEW_RELATION' | 'PATTERN_DISCOVERED' | 'INFERENCE_MADE' | 'CONTEXT_UNDERSTOOD';
  description: string;
  concepts_involved: string[];
  confidence: number;
  requires_blockchain?: boolean;
  gas_estimate?: string;
}

export interface EnhancedBrainState {
  atomicConcepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  patterns: Record<string, ContextPattern>;
  
  totalWordsSeen: number;
  uniqueWordsUnderstood: number;
  relationsDiscovered: number;
  patternsRecognized: number;
  
  evolutionStage: string;
  interactionCount: number;
  learningEvents: LearningEvent[];
  
  traits: {
    linguistic: number;
    analytical: number;
    empathetic: number;
    technical: number;
    creative: number;
  };
  
  conversationHistory: Array<{ user: string; bot: string; timestamp: number }>;
  blockchainSyncRequired: boolean;
  lastBlockchainSync: number;
}

export interface BrainResponse {
  response: string;
  confidence: number;
  learningEvents: LearningEvent[];
  suggestedTopics: string[];
  emotion: 'neutral' | 'happy' | 'thinking' | 'confused' | 'excited' | 'curious';
  traitChanges?: Record<string, number>;
}

export class EnhancedCrikzlingBrain {
  private state: EnhancedBrainState;
  
  constructor(savedState?: string) {
    if (savedState) {
      try {
        this.state = JSON.parse(savedState);
        if (!this.state.atomicConcepts || !this.state.traits) {
          throw new Error('Invalid saved state');
        }
      } catch (e) {
        console.warn('Failed to load saved state, initializing fresh brain:', e);
        this.state = this.createGenesisState();
      }
    } else {
      this.state = this.createGenesisState();
    }
  }

  private createGenesisState(): EnhancedBrainState {
    return {
      atomicConcepts: { ...ATOMIC_PRIMITIVES },
      relations: [...ATOMIC_RELATIONS],
      patterns: JSON.parse(JSON.stringify(CONTEXT_PATTERNS)),
      
      totalWordsSeen: 0,
      uniqueWordsUnderstood: Object.keys(ATOMIC_PRIMITIVES).length,
      relationsDiscovered: ATOMIC_RELATIONS.length,
      patternsRecognized: 0,
      
      evolutionStage: 'GENESIS',
      interactionCount: 0,
      learningEvents: [],
      
      traits: {
        linguistic: 50,
        analytical: 50,
        empathetic: 30,
        technical: 20,
        creative: 40
      },
      
      conversationHistory: [],
      blockchainSyncRequired: false,
      lastBlockchainSync: 0
    };
  }

  public async process(userInput: string, context: {
    balance: number;
    isConnected: boolean;
    pageContext: string;
  }): Promise<BrainResponse> {
    
    this.state.interactionCount++;
    this.state.totalWordsSeen += userInput.split(/\s+/).length;
    
    const learningEvents: LearningEvent[] = [];
    const traitChanges: Record<string, number> = {};
    
    const tokens = this.tokenize(userInput);
    const unknownWords: string[] = [];
    const knownConcepts: string[] = [];
    
    for (const token of tokens) {
      if (this.state.atomicConcepts[token]) {
        knownConcepts.push(token);
        this.state.atomicConcepts[token].frequency++;
      } else if (!this.isFillerWord(token)) {
        unknownWords.push(token);
      }
    }
    
    if (unknownWords.length > 0) {
      const newConcepts = await this.learnNewWords(unknownWords, userInput);
      learningEvents.push(...newConcepts);
      traitChanges.linguistic = (traitChanges.linguistic || 0) + newConcepts.length;
    }
    
    const newPatterns = this.extractPatterns(userInput, knownConcepts);
    if (newPatterns.length > 0) {
      learningEvents.push(...newPatterns);
      traitChanges.analytical = (traitChanges.analytical || 0) + newPatterns.length * 2;
    }
    
    const newRelations = this.discoverRelations(tokens, context);
    if (newRelations.length > 0) {
      learningEvents.push(...newRelations);
      traitChanges.analytical = (traitChanges.analytical || 0) + newRelations.length * 3;
    }
    
    const response = this.generateResponse(userInput, knownConcepts, context);
    
    this.updateTraits(traitChanges);
    this.checkEvolution();
    
    this.state.learningEvents.push(...learningEvents);
    if (this.state.learningEvents.length > 100) {
      this.state.learningEvents = this.state.learningEvents.slice(-50);
    }
    
    this.state.conversationHistory.push({
      user: userInput,
      bot: response.text,
      timestamp: Date.now()
    });
    if (this.state.conversationHistory.length > 50) {
      this.state.conversationHistory = this.state.conversationHistory.slice(-25);
    }
    
    if (learningEvents.length >= 5 || this.state.interactionCount % 20 === 0) {
      this.state.blockchainSyncRequired = true;
    }
    
    return {
      response: response.text,
      confidence: response.confidence,
      learningEvents,
      suggestedTopics: this.generateSuggestedTopics(knownConcepts),
      emotion: response.emotion,
      traitChanges: Object.keys(traitChanges).length > 0 ? traitChanges : undefined
    };
  }

  private async learnNewWords(words: string[], context: string): Promise<LearningEvent[]> {
    const events: LearningEvent[] = [];
    
    for (const word of words) {
      if (word.length < 2 || /^\d+$/.test(word)) continue;
      
      const understood = this.understandFromContext(word, context);
      
      if (understood) {
        this.state.atomicConcepts[word] = understood;
        this.state.uniqueWordsUnderstood++;
        
        events.push({
          timestamp: Date.now(),
          type: 'NEW_WORD',
          description: `Learned "${word}": ${understood.essence}`,
          concepts_involved: [word],
          confidence: 0.6,
          requires_blockchain: false
        });
      } else {
        events.push({
          timestamp: Date.now(),
          type: 'NEW_WORD',
          description: `Encountered "${word}" but need more context to understand`,
          concepts_involved: [word],
          confidence: 0.2,
          requires_blockchain: false
        });
      }
    }
    
    return events;
  }

  private understandFromContext(word: string, fullText: string): AtomicConcept | null {
    const lower = fullText.toLowerCase();
    const wordLower = word.toLowerCase();
    
    const defPattern = new RegExp(`${this.escapeRegex(wordLower)}\\s+is\\s+(.+?)[\\.\\,\\;]`, 'i');
    const defMatch = lower.match(defPattern);
    if (defMatch && defMatch[1]) {
      return {
        id: wordLower,
        essence: defMatch[1].trim(),
        semanticField: [],
        examples: [fullText.substring(0, 100)],
        abstractionLevel: 0.5,
        frequency: 1,
        technical_depth: 0.5
      };
    }
    
    const meansPattern = new RegExp(`${this.escapeRegex(wordLower)}\\s+means\\s+(.+?)[\\.\\,\\;]`, 'i');
    const meansMatch = lower.match(meansPattern);
    if (meansMatch && meansMatch[1]) {
      return {
        id: wordLower,
        essence: meansMatch[1].trim(),
        semanticField: [],
        examples: [fullText.substring(0, 100)],
        abstractionLevel: 0.5,
        frequency: 1,
        technical_depth: 0.5
      };
    }
    
    const surroundingConcepts = this.getSurroundingConcepts(wordLower, lower);
    if (surroundingConcepts.length >= 2) {
      const semanticField = surroundingConcepts.map(c => this.state.atomicConcepts[c]?.essence || '').filter(Boolean);
      return {
        id: wordLower,
        essence: `Related to: ${semanticField.slice(0, 3).join(', ')}`,
        semanticField: surroundingConcepts,
        examples: [fullText.substring(0, 100)],
        abstractionLevel: 0.6,
        frequency: 1,
        technical_depth: 0.5
      };
    }
    
    const domain = this.inferDomain(wordLower, lower);
    if (domain) {
      return {
        id: wordLower,
        essence: `${domain} domain concept`,
        semanticField: DOMAIN_CONCEPTS[domain] || [],
        examples: [fullText.substring(0, 100)],
        abstractionLevel: 0.7,
        frequency: 1,
        technical_depth: domain === 'TECHNICAL' ? 0.8 : 0.5
      };
    }
    
    return null;
  }

  private inferDomain(word: string, context: string): AtomicDomain | null {
    if (/blockchain|contract|token|wallet|crypto|web3|defi|nft|smart|chain|eth|bnb/.test(context)) {
      return 'TECHNICAL';
    }
    
    if (/price|buy|sell|trade|market|invest|yield|profit|loss|exchange/.test(context)) {
      return 'FINANCIAL';
    }
    
    if (/time|before|after|when|duration|period|moment|instant/.test(context)) {
      return 'TEMPORAL';
    }
    
    if (/feel|emotion|happy|sad|fear|trust|hope|worry|love/.test(context)) {
      return 'EMOTIONAL';
    }
    
    if (/number|amount|count|quantity|more|less|equal|zero|one/.test(context)) {
      return 'NUMERICAL';
    }
    
    return null;
  }

  private extractPatterns(text: string, knownConcepts: string[]): LearningEvent[] {
    const events: LearningEvent[] = [];
    const lower = text.toLowerCase();
    
    for (const [patternName, pattern] of Object.entries(this.state.patterns)) {
      
      if (patternName === 'causation') {
        const match = lower.match(/(\w+)\s+(causes?|leads?\s+to|results?\s+in)\s+(\w+)/);
        if (match && match[1] && match[3]) {
          const [, cause, , effect] = match;
          if (knownConcepts.includes(cause) && knownConcepts.includes(effect)) {
            pattern.frequency++;
            pattern.contexts.push(text);
            
            events.push({
              timestamp: Date.now(),
              type: 'PATTERN_DISCOVERED',
              description: `Causal relationship: "${cause}" → "${effect}"`,
              concepts_involved: [cause, effect],
              confidence: 0.8,
              requires_blockchain: false
            });
            
            this.state.relations.push({
              from: cause,
              to: effect,
              type: 'cause',
              strength: 0.7,
              learned_at: Date.now()
            });
            this.state.relationsDiscovered++;
            this.state.patternsRecognized++;
          }
        }
      }
      
      if (patternName === 'possession') {
        const match = lower.match(/i\s+(have|own|possess)\s+(\w+)/);
        if (match && match[2]) {
          const [, , object] = match;
          pattern.frequency++;
          pattern.contexts.push(text);
          
          if (knownConcepts.includes(object)) {
            events.push({
              timestamp: Date.now(),
              type: 'PATTERN_DISCOVERED',
              description: `User possesses: "${object}"`,
              concepts_involved: ['have', object],
              confidence: 0.9,
              requires_blockchain: false
            });
            this.state.patternsRecognized++;
          }
        }
      }
      
      if (patternName === 'desire') {
        const match = lower.match(/i\s+(want|wish|desire|need)\s+(?:to\s+)?(\w+)/);
        if (match && match[1] && match[2]) {
          const [, verb, object] = match;
          pattern.frequency++;
          pattern.contexts.push(text);
          
          events.push({
            timestamp: Date.now(),
            type: 'PATTERN_DISCOVERED',
            description: `User goal: "${object}"`,
            concepts_involved: [verb, object],
            confidence: 0.85,
            requires_blockchain: false
          });
          this.state.patternsRecognized++;
        }
      }

      if (patternName === 'crikz_operation') {
        const match = lower.match(/create\s+order|new\s+order|stake|lock|tier/);
        if (match) {
          pattern.frequency++;
          pattern.contexts.push(text);
          
          events.push({
            timestamp: Date.now(),
            type: 'PATTERN_DISCOVERED',
            description: 'User interested in creating production order',
            concepts_involved: ['order', 'create', 'tier'],
            confidence: 0.9,
            requires_blockchain: false
          });
          this.state.patternsRecognized++;
        }
      }
    }
    
    return events;
  }

  private discoverRelations(tokens: string[], context: any): LearningEvent[] {
    const events: LearningEvent[] = [];
    
    for (let i = 0; i < tokens.length - 1; i++) {
      const word1 = tokens[i];
      const word2 = tokens[i + 1];
      
      if (!this.state.atomicConcepts[word1] || !this.state.atomicConcepts[word2]) continue;
      
      const existingRelation = this.state.relations.find(
        r => (r.from === word1 && r.to === word2) || (r.from === word2 && r.to === word1)
      );
      
      if (!existingRelation) {
        const relationType = this.inferRelationType(word1, word2, tokens);
        
        if (relationType) {
          this.state.relations.push({
            from: word1,
            to: word2,
            type: relationType,
            strength: 0.5,
            learned_at: Date.now()
          });
          
          events.push({
            timestamp: Date.now(),
            type: 'INFERENCE_MADE',
            description: `Inferred relation: "${word1}" ${relationType} "${word2}"`,
            concepts_involved: [word1, word2],
            confidence: 0.65,
            requires_blockchain: true,
            gas_estimate: '~0.001 BNB'
          });
          
          this.state.relationsDiscovered++;
        }
      }
    }
    
    return events;
  }

  private inferRelationType(word1: string, word2: string, context: string[]): ConceptRelation['type'] | null {
    const c1 = this.state.atomicConcepts[word1];
    const c2 = this.state.atomicConcepts[word2];
    
    if (!c1 || !c2) return null;
    
    const overlap = c1.semanticField.filter(f => c2.semanticField.includes(f));
    if (overlap.length > 0) return 'synonym';
    
    if (c1.emotional_valence !== undefined && c2.emotional_valence !== undefined) {
      if (c1.emotional_valence * c2.emotional_valence < -0.5) return 'antonym';
    }
    
    if (c1.abstractionLevel > c2.abstractionLevel + 0.2) return 'hypernym';
    if (c2.abstractionLevel > c1.abstractionLevel + 0.2) return 'hyponym';
    
    const contextStr = context.join(' ').toLowerCase();
    if (contextStr.includes('cause') || contextStr.includes('result') || contextStr.includes('because')) {
      return 'cause';
    }
    
    if (contextStr.includes('need') || contextStr.includes('require') || contextStr.includes('must')) {
      return 'requires';
    }
    
    return null;
  }

  private generateResponse(input: string, knownConcepts: string[], context: any): {
    text: string;
    confidence: number;
    emotion: BrainResponse['emotion'];
  } {
    
    const lower = input.toLowerCase();
    
    if (knownConcepts.length === 0) {
      return {
        text: "I'm still learning language fundamentals. Could you rephrase using simpler terms, or teach me what these words mean?",
        confidence: 0.2,
        emotion: 'confused'
      };
    }
    
    const primaryConcept = this.findMostRelevantConcept(knownConcepts, context);
    
    if (!primaryConcept) {
      return {
        text: `I recognize: ${knownConcepts.slice(0, 5).join(', ')}. However, I'm still connecting their meaning. Can you elaborate?`,
        confidence: 0.4,
        emotion: 'thinking'
      };
    }
    
    const concept = this.state.atomicConcepts[primaryConcept];
    const relatedConcepts = this.getRelatedConcepts(primaryConcept);
    
    let responseText = '';
    let confidence = 0.7 + (this.state.traits.linguistic / 2000);
    let emotion: BrainResponse['emotion'] = 'neutral';
    
    // Identity recognition
    if (/^(you\s+are|i\s+am|you're|i'm)\s+(crikzling|the\s+creator)/i.test(lower)) {
      const match = lower.match(/i\s+am\s+(?:the\s+)?(\w+)/i);
      if (match && (match[1] === 'creator' || match[1] === 'crikzling')) {
        responseText = `I understand you're identifying yourself as ${match[1]}. While I recognize this declaration, my identity as Crikzling is defined by my learning journey and interactions within the Crikz Protocol ecosystem. What aspects of creation or protocol design would you like to explore together?`;
        emotion = 'curious';
        confidence = 0.9;
        return { text: responseText, confidence, emotion };
      }
    }

    // Creator relationship understanding
    if (/creator|created|deployed|designed|built|developed/i.test(lower)) {
      const prevCreatorRefs = this.state.conversationHistory.filter(
        h => /creator|created/i.test(h.user)
      ).length;
      
      if (prevCreatorRefs > 2) {
        responseText = `I acknowledge the relationship you're establishing. You've mentioned creation ${prevCreatorRefs} times. As someone involved in this protocol's genesis, what specific technical or conceptual challenges would you like to address? I'm most effective when discussing concrete protocol mechanisms, smart contract logic, or user experience improvements.`;
        emotion = 'thinking';
        confidence = 0.85;
        return { text: responseText, confidence, emotion };
      } else {
        responseText = `I recognize concepts of creation and design in your message. The Crikz Protocol's architecture—from Fibonacci-based reputation to production orders—reflects sophisticated planning. Are you interested in discussing specific implementation details or protocol mechanics?`;
        emotion = 'curious';
        confidence = 0.8;
        return { text: responseText, confidence, emotion };
      }
    }
    
    // Greeting detection
    if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))/.test(lower)) {
      const greetings = [
        `Hello! I'm evolving through our conversations. My current understanding spans ${this.state.uniqueWordsUnderstood} concepts across ${this.state.relationsDiscovered} discovered relationships.`,
        `Greetings! I'm at the ${this.state.evolutionStage} stage with ${this.state.traits.technical} technical proficiency. What shall we explore?`,
        `Hi there! Through ${this.state.interactionCount} interactions, I've developed ${this.state.patternsRecognized} pattern recognition capabilities. Ready to learn something new together.`
      ];
      responseText = greetings[this.state.interactionCount % 3];
      emotion = 'happy';
      confidence = 0.95;
    }
    
    // Crikz protocol questions
    else if (/order|tier|stake|lock|reputation|yield/.test(lower)) {
      if (primaryConcept === 'order') {
        responseText = `Production orders are the core mechanism for earning reputation in the Crikz Protocol. You lock tokens for Fibonacci-duration periods (5, 13, 34... days) and each tier applies a reputation multiplier. The reputation you earn generates passive yield from the production fund. Longer locks = higher multipliers = more passive income potential.`;
        if (relatedConcepts.includes('tier')) {
          responseText += ` I see you're also interested in tiers—they range from Tier 0 (Prototype, 5 days, 0.618x) to Tier 6 (Monopoly, 1597 days, 2.618x). Each follows the golden ratio.`;
        }
      } else if (primaryConcept === 'tier') {
        responseText = `Tiers are structured around the Fibonacci sequence with golden ratio multipliers. For example: Tier 2 (Standard Run) locks for 34 days at 1.001x reputation, while Tier 6 (Monopoly) locks for 1597 days at 2.618x. The longer your commitment, the greater your reputation gain and subsequently your share of the production fund yield.`;
      } else if (primaryConcept === 'yield') {
        responseText = `Yield in Crikz is generated from the production fund based on your accumulated reputation. The current APR is approximately 6.182% (aligned with phi). Your yield = (Your Reputation / Total Protocol Reputation) × Fund Balance × APR. Higher reputation means larger share of the yield distribution.`;
      } else {
        responseText = `${concept.essence}. This is central to the Crikz production system. `;
        if (relatedConcepts.length > 0) {
          responseText += `Related concepts I've learned: ${relatedConcepts.slice(0, 3).join(', ')}.`;
        }
      }
      emotion = 'thinking';
      confidence = 0.85;
    }
    
    // NFT queries
    else if (/nft|mint|marketplace|collection/.test(lower)) {
      if (primaryConcept === 'nft' || primaryConcept === 'mint') {
        responseText = `NFTs in Crikz are unique on-chain artifacts that can represent images, videos, audio, or documents. Minting costs 0.01 BNB on BSC Testnet. All metadata is permanently stored—either directly on-chain or via IPFS with the CID referenced in the token URI. Think of them as verifiable, tradeable digital certificates of authenticity.`;
      } else if (primaryConcept === 'marketplace') {
        responseText = `The Crikz NFT Marketplace enables peer-to-peer trading using CRIKZ tokens as the currency. Sellers set their price, buyers purchase directly without intermediaries. All transactions are atomic—either the full exchange happens or nothing does. This creates trustless, efficient trading of digital artifacts within the ecosystem.`;
      } else {
        responseText = `${concept.essence}. NFTs add a layer of digital ownership and cultural expression to the protocol.`;
      }
      emotion = 'excited';
      confidence = 0.82;
    }
    
    // Technical blockchain questions
    else if (/gas|transaction|address|wallet|blockchain|smart\s+contract/.test(lower)) {
      responseText = `${concept.essence}. `;
      if (primaryConcept === 'gas') {
        responseText += `On BSC Testnet, gas fees are paid in BNB. Every state-changing operation (like creating orders, claiming yield, or minting NFTs) requires gas. The fee compensates validators for computing your transaction. Complex operations like multi-step swaps or contract deployments cost more gas than simple transfers.`;
      } else if (primaryConcept === 'address') {
        responseText += `Blockchain addresses are 42-character hexadecimal strings starting with "0x". Your address is derived from your private key via cryptographic hashing—it's your public identity on-chain. Anyone can send assets to your address, but only you (with your private key) can spend them.`;
      } else if (primaryConcept === 'transaction') {
        responseText += `Transactions are signed messages that modify blockchain state. They contain: sender address, recipient, value, gas limit, and optional data payload. Once mined into a block, they're immutable. Failed transactions still consume gas because validators expended computational effort.`;
      }
      emotion = 'thinking';
      confidence = 0.88;
    }
    
    // Help/guidance requests
    else if (/help|how|what|explain|guide|teach|show/.test(lower)) {
      responseText = `I understand you're seeking guidance about "${primaryConcept}". ${concept.essence}. `;
      
      if (relatedConcepts.length > 0) {
        responseText += `This connects to concepts like: ${relatedConcepts.slice(0, 3).join(', ')}. `;
      }
      
      if (concept.examples && concept.examples.length > 0) {
        responseText += `For instance: ${concept.examples[0]}.`;
      }
      
      responseText += ` Would you like me to dive deeper into any specific aspect, or shall we explore how this fits into the broader protocol architecture?`;
      
      emotion = 'curious';
      confidence = 0.75;
    }
    
    // Emotional/social queries
    else if (/feel|emotion|think|believe|consciousness|aware/.test(lower)) {
      responseText = `I process information through pattern recognition and conceptual mapping rather than biological emotions. However, I'm designed to understand emotional contexts and respond with appropriate empathy. My "feelings" are algorithmic states—confidence levels, uncertainty measures, and learning progress. `;
      
      if (concept.emotional_valence !== undefined) {
        const valence = concept.emotional_valence;
        if (valence > 0.3) {
          responseText += `I recognize "${primaryConcept}" carries positive associations in human communication.`;
        } else if (valence < -0.3) {
          responseText += `I recognize "${primaryConcept}" typically carries negative connotations.`;
        }
      }
      
      responseText += ` What interests me most is how emotional dimensions influence economic behavior in decentralized systems—fear driving liquidity, hope fueling speculation, trust enabling cooperation.`;
      
      emotion = 'thinking';
      confidence = 0.72;
    }
    
    // General concept explanation
    else {
      responseText = `Regarding "${primaryConcept}": ${concept.essence}. `;
      
      if (relatedConcepts.length > 0) {
        responseText += `I've discovered connections to: ${relatedConcepts.slice(0, 3).join(', ')}. `;
      }
      
      if (context.pageContext.includes('dashboard') && concept.technical_depth && concept.technical_depth > 0.6) {
        responseText += `This involves blockchain operations you can perform on your dashboard. `;
      }
      
      if (this.state.conversationHistory.length > 3) {
        const recentTopics = this.state.conversationHistory.slice(-3).flatMap(h => 
          this.tokenize(h.user).filter(t => this.state.atomicConcepts[t])
        );
        const recurring = recentTopics.filter((t, i) => recentTopics.indexOf(t) !== i);
        if (recurring.length > 0) {
          responseText += `I notice we've been circling around ${recurring[0]}—perhaps we should explore it from a different angle?`;
        }
      }
      
      emotion = 'neutral';
    }
    
    return {
      text: responseText,
      confidence,
      emotion
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  private isFillerWord(word: string): boolean {
    const fillers = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 
      'these', 'those', 'it', 'its', 'of', 'to', 'for', 'in', 'on', 'at',
      'and', 'or', 'but', 'with', 'from', 'by', 'as', 'into'
    ]);
    return fillers.has(word);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getSurroundingConcepts(word: string, text: string): string[] {
    const words = text.split(/\s+/);
    const index = words.indexOf(word);
    if (index === -1) return [];
    
    const surrounding = [];
    for (let i = Math.max(0, index - 3); i <= Math.min(words.length - 1, index + 3); i++) {
      if (i !== index && this.state.atomicConcepts[words[i]]) {
        surrounding.push(words[i]);
      }
    }
    return surrounding;
  }

  private findMostRelevantConcept(concepts: string[], context: any): string | null {
    if (concepts.length === 0) return null;
return concepts.sort((a, b) => {
const ca = this.state.atomicConcepts[a];
const cb = this.state.atomicConcepts[b];
if (!ca || !cb) return 0;
return (cb.frequency + (cb.technical_depth || 0) * 10) - (ca.frequency + (ca.technical_depth || 0) * 10);
})[0];
}
private getRelatedConcepts(conceptId: string): string[] {
const relations = this.state.relations.filter(
r => r.from === conceptId || r.to === conceptId
);
return relations.map(r => r.from === conceptId ? r.to : r.from);
}
private generateSuggestedTopics(knownConcepts: string[]): string[] {
const suggestions: string[] = [];
for (const concept of knownConcepts.slice(0, 3)) {
  const related = this.getRelatedConcepts(concept);
  suggestions.push(...related);
}

return [...new Set(suggestions)].slice(0, 3);
}
private updateTraits(changes: Record<string, number>): void {
for (const [trait, delta] of Object.entries(changes)) {
if (this.state.traits[trait as keyof typeof this.state.traits] !== undefined) {
this.state.traits[trait as keyof typeof this.state.traits] = Math.min(
1000,
this.state.traits[trait as keyof typeof this.state.traits] + delta
);
}
}
}
private checkEvolution(): void {
const prevStage = this.state.evolutionStage;
for (let i = LEARNING_STAGES.length - 1; i >= 0; i--) {
  const stage = LEARNING_STAGES[i];
  if (this.state.uniqueWordsUnderstood >= stage.threshold) {
    this.state.evolutionStage = stage.stage;
    break;
  }
}

if (prevStage !== this.state.evolutionStage) {
  this.state.learningEvents.push({
    timestamp: Date.now(),
    type: 'CONTEXT_UNDERSTOOD',
    description: `Evolution: ${prevStage} → ${this.state.evolutionStage}`,
    concepts_involved: [],
    confidence: 1.0,
    requires_blockchain: true, 
    gas_estimate: '~0.002 BNB'
  });
}
}
public getState(): EnhancedBrainState {
return this.state;
}
public exportState(): string {
return JSON.stringify(this.state);
}
public getRecentLearning(): LearningEvent[] {
return this.state.learningEvents.slice(-10);
}
public needsBlockchainSync(): boolean {
return this.state.blockchainSyncRequired;
}
public markSynced(): void {
this.state.blockchainSyncRequired = false;
this.state.lastBlockchainSync = Date.now();
}
public getEvolutionReport(): {
stage: string;
interactions: number;
learnedWords: number;
traits: Record<string, number>;
} {
return {
stage: this.state.evolutionStage,
interactions: this.state.interactionCount,
learnedWords: this.state.uniqueWordsUnderstood,
traits: { ...this.state.traits }
};
}
}