import { 
  ATOMIC_PRIMITIVES, 
  ATOMIC_RELATIONS, 
  AtomicConcept, 
  ConceptRelation 
} from './crikzling-atomic-knowledge';

export interface BrainState {
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  shortTermMemory: { role: 'user' | 'bot', content: string, timestamp: number }[];
  totalInteractions: number;
  unsavedDataCount: number; 
  evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  mood: {
    logic: number;
    empathy: number;
    curiosity: number;
    entropy: number;
  };
}

export class EvolutionaryBrain {
  private state: BrainState;

  constructor(savedState?: string) {
    this.state = this.initializeState(savedState);
  }

  private initializeState(savedJson?: string): BrainState {
    const defaults = {
        concepts: { ...ATOMIC_PRIMITIVES },
        relations: [...ATOMIC_RELATIONS],
        shortTermMemory: [],
        totalInteractions: 0,
        unsavedDataCount: 0,
        evolutionStage: 'GENESIS' as const,
        mood: { logic: 50, empathy: 30, curiosity: 40, entropy: 10 }
    };

    if (savedJson) {
      try {
        const parsed = JSON.parse(savedJson);
        // Deep merge to ensure robustness against schema changes
        return {
            ...defaults,
            ...parsed,
            concepts: { ...defaults.concepts, ...(parsed.concepts || {}) },
            mood: { ...defaults.mood, ...(parsed.mood || {}) }
        };
      } catch (e) {
        console.warn("Brain corruption detected. Re-initializing genesis matrix.");
        return defaults;
      }
    }
    return defaults;
  }

  public async process(input: string, isOwner: boolean): Promise<{ response: string, learned: string[] }> {
    // 1. Safety wrapper to ensure response is ALWAYS returned
    try {
        const cleanInput = input.trim().toLowerCase();
        this.state.totalInteractions++;
        
        // 2. Immediate Memory Encoding
        this.addToMemory('user', cleanInput, Date.now());
        
        // 3. Fast Analysis (No artificial delay for simple queries)
        const keywords = this.extractKeywords(cleanInput);
        const intent = this.analyzeIntent(cleanInput);
        
        // 4. Mood Dynamics
        this.adjustMood(intent, keywords.length);

        // 5. Processing Logic
        let output = "";
        let learnedConcepts: string[] = [];

        // Dynamic Contemplation: Only delay slightly for "complex" thoughts to simulate processing
        await this.contemplate(keywords.length); 

        if (isOwner && (cleanInput.includes(':=') || cleanInput.includes('define:'))) {
            // New Syntax support: "term := definition"
            learnedConcepts = this.processInstruction(cleanInput);
            output = learnedConcepts.length 
                ? `Neural pathway created: [${learnedConcepts[0].toUpperCase()}].`
                : `Syntax error. Use format: "term := definition"`;
        } 
        else if (intent === 'COMMAND' && isOwner) {
            output = this.executeCommand(cleanInput);
        }
        else if (keywords.length > 0) {
            // Neural Association (New Logic)
            output = this.generateAssociativeResponse(keywords[0]);
            this.strengthenConcepts(keywords);
        } 
        else {
            // Fallback heuristics
            output = this.generateFallbackResponse(intent);
        }

        // 6. Update Stats
        this.updateEvolutionStage();
        if (learnedConcepts.length > 0) this.state.unsavedDataCount += learnedConcepts.length;
        
        this.addToMemory('bot', output, Date.now());
        
        return { response: output, learned: learnedConcepts };

    } catch (error) {
        console.error("Crikzling Brain Panic:", error);
        return { 
            response: "Neural interference detected. Rebooting cognitive subsystem...", 
            learned: [] 
        };
    }
  }

  // Improved Contemplation: Faster, less blocking
  private async contemplate(complexity: number): Promise<void> {
    // Cap delay at 1.5 seconds, min 200ms. 
    const delay = Math.min(1500, Math.max(200, complexity * 100)); 
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateAssociativeResponse(concept: AtomicConcept): string {
    // This makes the bot sound smarter by linking concepts
    const rel = this.state.relations.find(r => r.from === concept.id || r.to === concept.id);
    
    const responses = [
        `Analyzing [${concept.id.toUpperCase()}]. Essence: ${concept.essence}.`,
        `The concept of ${concept.id} resonates with my logic core.`,
        `Querying matrix... ${concept.id} is active in domain: ${concept.domain}.`
    ];

    if (rel) {
        const other = rel.from === concept.id ? rel.to : rel.from;
        responses.push(`Interesting. ${concept.id} seems connected to ${other}.`);
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateFallbackResponse(intent: string): string {
    const entropy = this.state.mood.entropy;
    
    if (intent === 'GREETING') return "Link established. Awaiting input.";
    if (intent === 'QUESTION') return "Insufficient data to formulate a precise answer.";
    if (intent === 'IDENTITY') return `I am Crikzling. Evolution Stage: ${this.state.evolutionStage}.`;
    
    if (entropy > 60) return "My thoughts are... scattered. Too much entropy.";
    return "Input received. Processing... No matching neural patterns.";
  }

  private processInstruction(input: string): string[] {
      // Supports "term: def" or "term := def"
      const separator = input.includes(':=') ? ':=' : ':';
      const parts = input.split(separator);
      
      if (parts.length < 2) return [];
      
      const term = parts[0].trim().toLowerCase().replace('define', '').trim();
      const definition = parts[1].trim();

      if (!term || !definition) return [];

      this.state.concepts[term] = {
          id: term,
          essence: definition,
          semanticField: [],
          examples: [],
          abstractionLevel: 0.5,
          frequency: 1,
          technical_depth: 0.5,
          domain: 'TECHNICAL'
      };
      return [term];
  }

  private executeCommand(input: string): string {
    if (input.includes("reset") || input.includes("wipe")) {
        this.resetState();
        return "CRITICAL: Memory initialized to factory zero.";
    }
    if (input.includes("analyze")) {
        return `Diagnostic: ${Object.keys(this.state.concepts).length} active nodes. Mood stable.`;
    }
    return "Command acknowledged.";
  }

  private extractKeywords(input: string): AtomicConcept[] {
    const words = input.replace(/[?.,!]/g, '').split(' ');
    const found: AtomicConcept[] = [];
    words.forEach(word => {
        if (this.state.concepts[word]) found.push(this.state.concepts[word]);
    });
    return [...new Set(found)];
  }

  private analyzeIntent(input: string): string {
    if (input.match(/^(reset|wipe|save|analyze|crystallize)/)) return 'COMMAND';
    if (input.includes('who') || input.includes('what') || input.includes('?')) return 'QUESTION';
    if (input.match(/(hi|hello|hey)/)) return 'GREETING';
    return 'STATEMENT';
  }

  private adjustMood(intent: string, keywordCount: number) {
      // Clamp values between 0 and 100
      const clamp = (num: number) => Math.min(100, Math.max(0, num));
      
      this.state.mood.logic = clamp(this.state.mood.logic + (keywordCount > 0 ? 2 : -1));
      this.state.mood.entropy = clamp(this.state.mood.entropy + (intent === 'UNKNOWN' ? 5 : -2));
      
      if (intent === 'GREETING') this.state.mood.empathy = clamp(this.state.mood.empathy + 5);
  }

  private strengthenConcepts(keywords: AtomicConcept[]) {
    keywords.forEach(k => k.frequency++);
  }

  private updateEvolutionStage() {
    const c = Object.keys(this.state.concepts).length;
    if (c > 350) this.state.evolutionStage = 'TRANSCENDENT';
    else if (c > 100) this.state.evolutionStage = 'SAPIENT';
    else if (c > 20) this.state.evolutionStage = 'SENTIENT';
    else this.state.evolutionStage = 'GENESIS';
  }

  private addToMemory(role: 'user' | 'bot', content: string, timestamp: number) {
    this.state.shortTermMemory.push({ role, content, timestamp });
    if (this.state.shortTermMemory.length > 20) this.state.shortTermMemory.shift();
  }

  // --- Public Utilities ---
  public wipe() { this.resetState(); }
  public resetState() { this.state = this.initializeState(); }
  public exportState(): string { return JSON.stringify(this.state); }
  public needsCrystallization(): boolean { return this.state.unsavedDataCount >= 5; }
  public clearUnsavedCount() { this.state.unsavedDataCount = 0; }
  
  public getStats() {
      return {
          nodes: Object.keys(this.state.concepts).length,
          relations: this.state.relations.length,
          stage: this.state.evolutionStage,
          mood: this.state.mood,
          unsaved: this.state.unsavedDataCount
      }
  }

  public assimilateFile(content: string): number {
    const lines = content.split('\n');
    let learnedCount = 0;
    lines.forEach(line => {
        const clean = line.trim();
        if (clean.includes(':')) {
            const res = this.processInstruction(clean);
            if(res.length) learnedCount++;
        }
    });
    if (learnedCount > 0) this.state.unsavedDataCount += learnedCount;
    return learnedCount;
  }
  
  // Safe Accessor
  public getState(): BrainState { return this.state; }
}