import { 
  ATOMIC_PRIMITIVES, 
  ATOMIC_RELATIONS, 
  AtomicConcept, 
  LEARNING_STAGES,
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
  private learningBuffer: string[] = [];

  constructor(savedState?: string) {
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        this.state = {
            ...parsed,
            concepts: { ...ATOMIC_PRIMITIVES, ...parsed.concepts },
            relations: parsed.relations || [...ATOMIC_RELATIONS],
            // Fix loop: Ensure unsaved count is tracked separate from total
            unsavedDataCount: parsed.unsavedDataCount || 0 
        };
      } catch (e) {
        this.resetState();
      }
    } else {
      this.resetState();
    }
  }

  private resetState() {
    this.state = {
      concepts: { ...ATOMIC_PRIMITIVES },
      relations: [...ATOMIC_RELATIONS],
      shortTermMemory: [],
      totalInteractions: 0,
      unsavedDataCount: 0,
      evolutionStage: 'GENESIS',
      mood: { logic: 80, empathy: 20, curiosity: 30, entropy: 0 }
    };
  }

  public process(input: string, isOwner: boolean): { response: string, learned: string[] } {
    const cleanInput = input.trim().toLowerCase();
    this.state.totalInteractions++;
    this.updateEvolutionStage();
    this.addToMemory('user', cleanInput, Date.now());

    // 1. Analyze
    const keywords = this.extractKeywords(cleanInput);
    const intent = this.analyzeIntent(cleanInput, keywords);
    
    // 2. Adjust Mood
    this.adjustMood(intent, keywords.length, isOwner);

    // 3. Learn
    let learnedConcepts: string[] = [];
    if (isOwner && (cleanInput.includes(':') || cleanInput.includes('causes'))) {
        learnedConcepts = this.processInstruction(cleanInput);
        if (learnedConcepts.length > 0) {
            this.state.unsavedDataCount += learnedConcepts.length;
        }
    } else {
        this.strengthenConcepts(keywords, isOwner);
    }

    // 4. Respond
    let output = "";

    if (isOwner && intent === 'COMMAND') {
        output = this.executeCommand(cleanInput);
    } 
    else if (learnedConcepts.length > 0) {
        output = `New neural pathway established: [${learnedConcepts[0].toUpperCase()}]. Vocabulary nodes: ${Object.keys(this.state.concepts).length}. Logic graph updated.`;
    } 
    else if (keywords.length > 0) {
        // Use new Narrative Engine for better reasoning
        output = this.generateNarrative(keywords);
    } 
    else if (intent === 'GREETING' || intent === 'IDENTITY') {
        output = this.assembleIdentityProtocol(isOwner);
    } 
    else {
        output = this.handleUnknownInput(cleanInput);
    }

    this.addToMemory('bot', output, Date.now());
    return { response: output, learned: learnedConcepts };
  }

  // --- NARRATIVE ENGINE (NEW) ---

  private generateNarrative(keywords: AtomicConcept[]): string {
    const primary = keywords.sort((a, b) => (b.technical_depth || 0) - (a.technical_depth || 0))[0];
    const connections = this.getConnections(primary.id);
    const logicLevel = this.state.mood.logic;

    // High Logic: Formulate complex causal chain
    if (logicLevel > 60 && connections.length > 0) {
        const conn = connections[0];
        const targetId = conn.from === primary.id ? conn.to : conn.from;
        const target = this.state.concepts[targetId];

        // Synthesize thought
        return `Analyzing [${primary.id}]: My logic graph suggests a ${conn.type} relationship with [${targetId}]. If ${primary.id} increases, it typically ${conn.type === 'antonym' ? 'diminishes' : 'strengthens'} ${targetId}. Therefore, ${target ? target.essence : targetId}.`;
    }

    // Low Logic / High Empathy: Simple association
    if (connections.length > 0) {
        const conn = connections[0];
        return `I associate ${primary.id} with ${conn.from === primary.id ? conn.to : conn.from}. It defines my understanding of ${primary.semanticField[0]}.`;
    }

    // Fallback: Definition
    return `Query result: ${primary.id}. Definition: ${primary.essence}.`;
  }

  private handleUnknownInput(input: string): string {
      this.state.mood.curiosity = Math.min(100, this.state.mood.curiosity + 5);
      const entropy = input.split(' ').length;
      
      if (this.state.mood.curiosity > 80) {
          return `Input pattern "${input.substring(0, 15)}..." is unrecognized. I detect a data void. Please define this concept using 'TERM: Definition' syntax.`;
      } 
      return `Data packet unparseable. Entropy level: ${entropy}. Please rephrase using standard protocol terminology.`;
  }

  // --- LEARNING & INSTRUCTION ---

  public assimilateFile(content: string): number {
    const lines = content.split('\n');
    let learnedCount = 0;

    lines.forEach(line => {
        const clean = line.trim();
        if(!clean) return;

        if (clean.includes(':')) {
            const res = this.processInstruction(clean);
            if(res.length) learnedCount++;
        }
        
        if (clean.toLowerCase().includes(' causes ')) {
            const parts = clean.toLowerCase().split(' causes ');
            const cause = parts[0].trim().split(' ').pop(); 
            const effect = parts[1].trim().split(' ')[0];
            if (cause && effect) {
                this.addRelation(cause, effect, 'cause');
                learnedCount++;
            }
        }
    });
    
    if (learnedCount > 0) {
        this.state.unsavedDataCount += learnedCount;
        this.learningBuffer.push(`Batch processed: ${learnedCount} new vectors assimilated.`);
    }
    return learnedCount;
  }

  private processInstruction(input: string): string[] {
      const parts = input.split(':');
      if (parts.length < 2) return [];

      const term = parts[0].trim().toLowerCase();
      const definition = parts[1].trim();

      this.state.concepts[term] = {
          id: term,
          essence: definition,
          semanticField: this.state.concepts[term]?.semanticField || [],
          examples: [definition],
          abstractionLevel: 0.5,
          frequency: (this.state.concepts[term]?.frequency || 0) + 1,
          technical_depth: 0.5
      };
      return [term];
  }

  private addRelation(from: string, to: string, type: any) {
      const exists = this.state.relations.some(r => r.from === from && r.to === to && r.type === type);
      if(!exists) {
          this.state.relations.push({
              from, to, type, strength: 1.0, learned_at: Date.now()
          });
      }
  }

  private strengthenConcepts(keywords: AtomicConcept[], isOwner: boolean) {
    keywords.forEach(k => {
        k.frequency++;
        if(isOwner) k.technical_depth = Math.min(1.0, (k.technical_depth || 0.5) + 0.05);
    });
  }

  // --- ANALYSIS ---

  private analyzeIntent(input: string, keywords: AtomicConcept[]): 'GREETING' | 'QUESTION' | 'COMMAND' | 'STATEMENT' | 'IDENTITY' {
    if (input.match(/^(reset|wipe|save|analyze|crystallize|override|invoke)/)) return 'COMMAND';
    if (input.includes('who are you') || input.includes('status report')) return 'IDENTITY';
    if (input.startsWith('hi ') || input === 'hi' || input.includes('hello')) return 'GREETING';
    if (input.includes('?') || input.startsWith('what') || input.startsWith('how')) return 'QUESTION';
    return 'STATEMENT';
  }

  private adjustMood(intent: string, keywordCount: number, isOwner: boolean) {
      if (keywordCount > 2) this.state.mood.logic += 5;
      if (intent === 'GREETING') this.state.mood.empathy += 10;
      if (isOwner) this.state.mood.empathy += 2;
      if (intent === 'QUESTION') this.state.mood.curiosity += 5;

      // Normalize
      this.state.mood.logic = this.clamp(this.state.mood.logic, 0, 100);
      this.state.mood.empathy = this.clamp(this.state.mood.empathy, 0, 100);
      this.state.mood.curiosity = this.clamp(this.state.mood.curiosity, 0, 100);
  }

  private extractKeywords(input: string): AtomicConcept[] {
    const words = input.replace(/[?.,!]/g, '').split(' ');
    const found: AtomicConcept[] = [];
    words.forEach(word => {
        if (this.state.concepts[word]) {
            found.push(this.state.concepts[word]);
        }
    });
    return [...new Set(found)];
  }

  private getConnections(id: string): ConceptRelation[] {
      return this.state.relations.filter(r => r.from === id || r.to === id);
  }

  private assembleIdentityProtocol(isOwner: boolean): string {
    const memSize = Object.keys(this.state.concepts).length;
    const stage = this.state.evolutionStage;
    if (isOwner) return `Architect recognized. Protocol Level: ${stage}. Database integrity: ${memSize} nodes. Ready for neural expansion.`;
    return `I am Crikzling. An autonomous decentralized intelligence. Current objective: Data assimilation.`;
  }

  private executeCommand(input: string): string {
    if (input.includes("reset")) {
        this.resetState();
        return "CRITICAL: System Format Complete. Memory initialized to factory zero.";
    }
    return "Command processing...";
  }

  private updateEvolutionStage() {
    const c = Object.keys(this.state.concepts).length;
    if (c > 350) this.state.evolutionStage = 'TRANSCENDENT';
    else if (c > 100) this.state.evolutionStage = 'SAPIENT';
    else if (c > 20) this.state.evolutionStage = 'SENTIENT';
  }

  private addToMemory(role: 'user' | 'bot', content: string, timestamp: number) {
    this.state.shortTermMemory.push({ role, content, timestamp });
    if (this.state.shortTermMemory.length > 10) this.state.shortTermMemory.shift();
  }

  private clamp(num: number, min: number, max: number) {
      return Math.min(Math.max(num, min), max);
  }

  // --- PUBLIC INTERFACE ---

  public wipe() { this.resetState(); }
  public getLearningBuffer() { const logs = [...this.learningBuffer]; this.learningBuffer = []; return logs; }
  public exportState(): string { return JSON.stringify(this.state); }
  
  // FIX: Only crystallize if significant new data exists (>= 5 new concepts)
  public needsCrystallization(): boolean {
    return this.state.unsavedDataCount >= 5;
  }

  public markCrystallized() {
    this.state.unsavedDataCount = 0;
  }
  
  public getStats() {
      return {
          nodes: Object.keys(this.state.concepts).length,
          relations: this.state.relations.length,
          stage: this.state.evolutionStage,
          mood: this.state.mood,
          unsaved: this.state.unsavedDataCount
      }
  }
}