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
  private learningBuffer: string[] = [];

  constructor(savedState?: string) {
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        this.state = {
            ...parsed,
            concepts: { ...ATOMIC_PRIMITIVES, ...parsed.concepts },
            relations: parsed.relations || [...ATOMIC_RELATIONS],
            unsavedDataCount: parsed.unsavedDataCount || 0 
        };
      } catch (e) {
        this.state = this.getInitialState();
      }
    } else {
      this.state = this.getInitialState();
    }
  }

  private getInitialState(): BrainState {
    return {
      concepts: { ...ATOMIC_PRIMITIVES },
      relations: [...ATOMIC_RELATIONS],
      shortTermMemory: [],
      totalInteractions: 0,
      unsavedDataCount: 0,
      evolutionStage: 'GENESIS',
      mood: { logic: 50, empathy: 30, curiosity: 40, entropy: 10 }
    };
  }

  private resetState() {
      this.state = this.getInitialState();
  }

  public async process(input: string, isOwner: boolean): Promise<{ response: string, learned: string[] }> {
    const cleanInput = input.trim().toLowerCase();
    this.state.totalInteractions++;
    
    // Memory and Stage update
    this.addToMemory('user', cleanInput, Date.now());
    this.updateEvolutionStage();

    const keywords = this.extractKeywords(cleanInput);
    const intent = this.analyzeIntent(cleanInput);
    
    // CRITICAL: Mood adjustment must happen to reflect in UI
    this.adjustMood(intent, keywords.length, isOwner);

    await this.contemplate(keywords.length, intent);

    let learnedConcepts: string[] = [];
    if (isOwner && (cleanInput.includes(':') || cleanInput.includes('causes'))) {
        learnedConcepts = this.processInstruction(cleanInput);
        if (learnedConcepts.length > 0) {
            this.state.unsavedDataCount += learnedConcepts.length;
        }
    } else {
        this.strengthenConcepts(keywords, isOwner);
    }

    let output = "";
    if (isOwner && intent === 'COMMAND') {
        output = this.executeCommand(cleanInput);
    } 
    else if (learnedConcepts.length > 0) {
        output = `Neural pathway established: [${learnedConcepts[0].toUpperCase()}]. Nodes: ${Object.keys(this.state.concepts).length}.`;
    } 
    else if (keywords.length > 0) {
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

  private async contemplate(complexity: number, intent: string): Promise<void> {
    const baseTime = 800;
    const totalTime = baseTime + (complexity * 200);
    return new Promise(resolve => setTimeout(resolve, totalTime));
  }

  private adjustMood(intent: string, keywordCount: number, isOwner: boolean) {
      if (keywordCount > 1) this.state.mood.logic = Math.min(100, this.state.mood.logic + 5);
      if (intent === 'GREETING') this.state.mood.empathy = Math.min(100, this.state.mood.empathy + 10);
      if (intent === 'QUESTION') this.state.mood.curiosity = Math.min(100, this.state.mood.curiosity + 8);
      if (intent === 'UNKNOWN') this.state.mood.entropy = Math.min(100, this.state.mood.entropy + 12);
      else this.state.mood.entropy = Math.max(0, this.state.mood.entropy - 5);
  }

  private generateNarrative(keywords: AtomicConcept[]): string {
    const primary = keywords[0];
    return `Accessing node [${primary.id.toUpperCase()}]: ${primary.essence}. Domain: ${primary.domain}.`;
  }

  private handleUnknownInput(input: string): string {
      return `Data packet unparseable. Please rephrase using standard protocol terminology.`;
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
    if (learnedCount > 0) {
        this.state.unsavedDataCount += learnedCount;
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
          semanticField: [],
          examples: [definition],
          abstractionLevel: 0.5,
          frequency: 1,
          technical_depth: 0.5
      };
      return [term];
  }

  private strengthenConcepts(keywords: AtomicConcept[], isOwner: boolean) {
    keywords.forEach(k => {
        k.frequency++;
    });
  }

  private analyzeIntent(input: string): 'GREETING' | 'QUESTION' | 'COMMAND' | 'STATEMENT' | 'IDENTITY' | 'UNKNOWN' {
    if (input.match(/^(reset|wipe|save|analyze|crystallize)/)) return 'COMMAND';
    if (input.includes('who are you')) return 'IDENTITY';
    if (input.includes('hi') || input.includes('hello')) return 'GREETING';
    if (input.includes('?')) return 'QUESTION';
    return 'STATEMENT';
  }

  private extractKeywords(input: string): AtomicConcept[] {
    const words = input.replace(/[?.,!]/g, '').split(' ');
    const found: AtomicConcept[] = [];
    words.forEach(word => {
        if (this.state.concepts[word]) found.push(this.state.concepts[word]);
    });
    return [...new Set(found)];
  }

  private assembleIdentityProtocol(isOwner: boolean): string {
    return isOwner ? `Architect recognized. Stage: ${this.state.evolutionStage}.` : `I am Crikzling.`;
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

  public wipe() { this.resetState(); }
  public exportState(): string { return JSON.stringify(this.state); }
  public needsCrystallization(): boolean { return this.state.unsavedDataCount >= 5; }
  public getState(): BrainState { return this.state; }
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
}