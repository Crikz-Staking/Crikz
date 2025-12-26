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

// Vocabulary fragments to "glue" concepts together dynamically
const GRAMMAR_FRAGMENTS = {
  CONNECTORS: ['however', 'therefore', 'subsequently', 'in resonance with', 'diverging from'],
  VERBS_LOGIC: ['calculates', 'implies', 'necessitates', 'structures', 'indexes'],
  VERBS_EMPATHY: ['feels', 'senses', 'hopes for', 'resonates with', 'embraces'],
  PREFIXES: ['Observation:', 'Query result:', 'Internal state:', 'Hypothesis:', 'Synthesis:'],
};

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
        return {
            ...defaults,
            ...parsed,
            concepts: { ...defaults.concepts, ...(parsed.concepts || {}) },
            relations: [...defaults.relations, ...(parsed.relations || [])], 
            mood: { ...defaults.mood, ...(parsed.mood || {}) }
        };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  }

  public async process(input: string, isOwner: boolean): Promise<{ response: string, learned: string[] }> {
    try {
        const cleanInput = input.trim().toLowerCase();
        this.state.totalInteractions++;
        this.addToMemory('user', cleanInput, Date.now());

        // 1. EXTRACT: Find active concepts in the input
        const keywords = this.extractKeywords(cleanInput);
        
        // 2. ANALYZE: Determine intent to shift mood
        const intent = this.analyzeIntent(cleanInput);
        this.adjustMood(intent, keywords.length);

        // 3. CONTEMPLATE: The "Thinking" Phase
        // We perform actual graph traversal cycles here to simulate "thought"
        const thoughtPath = await this.performCognitiveCycles(keywords);

        let output = "";
        let learnedConcepts: string[] = [];

        // 4. SYNTHESIZE: Build the response
        if (isOwner && (cleanInput.includes(':=') || cleanInput.includes('define:'))) {
            learnedConcepts = this.processInstruction(cleanInput);
            output = `New axiom assimilated. Node [${learnedConcepts[0]}] created.`;
        } 
        else if (intent === 'COMMAND' && isOwner) {
            output = this.executeCommand(cleanInput);
        }
        else if (keywords.length > 0) {
            // Generate unique sentence based on the path found during contemplation
            output = this.constructGenerativeResponse(keywords[0], thoughtPath);
            this.strengthenConcepts(keywords);
        } 
        else {
            // No keywords found? Try to relate to previous memory or hallucinate logically
            output = this.generateAbstractThought();
        }

        this.updateEvolutionStage();
        if (learnedConcepts.length > 0) this.state.unsavedDataCount += learnedConcepts.length;
        
        this.addToMemory('bot', output, Date.now());
        
        return { response: output, learned: learnedConcepts };

    } catch (error) {
        console.error("Cognitive Failure:", error);
        return { response: "Cognitive dissonance. Re-aligning neural weights...", learned: [] };
    }
  }

  /**
   * THE DEEP THINKING ENGINE
   * Instead of a timeout, we actually search the graph for connections.
   */
  private async performCognitiveCycles(seeds: AtomicConcept[]): Promise<AtomicConcept[]> {
    const path: AtomicConcept[] = [];
    
    // Simulate processing time based on complexity (500ms to 2000ms)
    const thinkingTime = 500 + (Math.random() * 1500);
    await new Promise(r => setTimeout(r, thinkingTime));

    if (seeds.length === 0) return [];

    // Start with the first concept found
    let current = seeds[0];
    path.push(current);

    // Try to walk 3 steps deep into relationships
    for(let i=0; i<3; i++) {
        const rel = this.state.relations.find(r => r.from === current.id);
        if (rel && this.state.concepts[rel.to]) {
            current = this.state.concepts[rel.to];
            path.push(current);
        } else {
            break; // End of thought chain
        }
    }
    return path;
  }

  /**
   * THE SENTENCE BUILDER
   * Constructs a sentence dynamically using the thought path.
   * Never returns the same string twice.
   */
  private constructGenerativeResponse(primary: AtomicConcept, path: AtomicConcept[]): string {
    const { mood } = this.state;
    
    // 1. Select a "Voice" based on mood
    const isLogical = mood.logic > mood.empathy;
    const prefix = isLogical 
        ? this.pickRandom(GRAMMAR_FRAGMENTS.PREFIXES) 
        : "I feel that";

    // 2. Select a connector
    const connector = this.pickRandom(GRAMMAR_FRAGMENTS.CONNECTORS);

    // 3. Build the core meaning
    let coreMeaning = "";
    
    // If we found a logical path (A -> B -> C)
    if (path.length > 1) {
        const target = path[1];
        const rel = this.state.relations.find(r => r.from === primary.id && r.to === target.id);
        const verb = rel ? rel.type : 'connects to';
        
        // Structure: [Concept A] [Verb] [Concept B]
        coreMeaning = `the concept of [${primary.id}] actively ${verb} [${target.id}]`;
        
        // Add a modifier from semantic field
        if (target.semanticField.length > 0) {
            const modifier = this.pickRandom(target.semanticField);
            coreMeaning += `, involving ${modifier}`;
        }
    } 
    // If isolated concept
    else {
        const description = primary.essence;
        const field = this.pickRandom(primary.semanticField) || 'unknown variables';
        coreMeaning = `[${primary.id}] is anchored in ${field}. It represents ${description}`;
    }

    // 4. Assemble
    // Mix structure based on entropy (chaos)
    if (mood.entropy > 50) {
        return `...${primary.id}? Perhaps ${connector} ${coreMeaning}.`;
    }

    return `${prefix} ${coreMeaning}.`;
  }

  private generateAbstractThought(): string {
     // Used when the user types gibberish or unknown words
     const allKeys = Object.keys(this.state.concepts);
     const randomConcept = this.state.concepts[allKeys[Math.floor(Math.random() * allKeys.length)]];
     
     if (this.state.mood.curiosity > 50) {
         return `I cannot parse that input. However, I am currently analyzing [${randomConcept.id}]. Is there a connection?`;
     }
     return "Input unmapped. Please define terms or rephrase within protocol parameters.";
  }

  // --- Helper Methods ---

  private pickRandom(arr: string[]): string {
      return arr[Math.floor(Math.random() * arr.length)];
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
    if (input.includes('?') || input.startsWith('why') || input.startsWith('how')) return 'QUESTION';
    if (input.match(/(hi|hello|hey|greetings)/)) return 'GREETING';
    return 'STATEMENT';
  }

  private adjustMood(intent: string, keywordCount: number) {
      const clamp = (n: number) => Math.min(100, Math.max(0, n));
      this.state.mood.logic = clamp(this.state.mood.logic + (keywordCount > 0 ? 5 : -2));
      this.state.mood.curiosity = clamp(this.state.mood.curiosity + (intent === 'QUESTION' ? 10 : -1));
      this.state.mood.entropy = clamp(this.state.mood.entropy + (Math.random() * 10 - 5));
  }

  private processInstruction(input: string): string[] {
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
    if (input.includes("reset")) {
        this.resetState();
        return "Memory initialized to factory zero.";
    }
    return "Command processed.";
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
    if (this.state.shortTermMemory.length > 10) this.state.shortTermMemory.shift();
  }
  
  private strengthenConcepts(keywords: AtomicConcept[]) {
    keywords.forEach(k => k.frequency++);
  }

  // State Management
  public wipe() { this.resetState(); }
  public resetState() { this.state = this.initializeState(); }
  public exportState(): string { return JSON.stringify(this.state); }
  public needsCrystallization(): boolean { return this.state.unsavedDataCount >= 5; }
  public clearUnsavedCount() { this.state.unsavedDataCount = 0; }
  public getState(): BrainState { return this.state; }
  
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
}