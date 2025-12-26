// src/lib/crikzling-evolutionary-brain.ts
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
  lastCrystallizedCount: number;
  evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  mood: {
    logic: number;      // 0-100: Determines precision vs abstraction
    empathy: number;    // 0-100: Determines user-alignment vs cold calculation
    curiosity: number;  // 0-100: Determines query generation vs statement generation
  };
}

export class EvolutionaryBrain {
  private state: BrainState;
  private learningBuffer: string[] = [];

  constructor(savedState?: string) {
    if (savedState) {
      try {
        this.state = JSON.parse(savedState);
        // Re-hydrate primitives to ensure core logic remains compatible
        this.state.concepts = { ...ATOMIC_PRIMITIVES, ...this.state.concepts };
        // Ensure relations exist
        if (!this.state.relations || this.state.relations.length === 0) {
            this.state.relations = [...ATOMIC_RELATIONS];
        }
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
      lastCrystallizedCount: 0,
      evolutionStage: 'GENESIS',
      mood: { logic: 90, empathy: 10, curiosity: 20 }
    };
  }

  /**
   * The Core Processing Loop
   * 1. Tokenize & Clean Input
   * 2. Calculate Input Entropy (Complexity)
   * 3. Update Interaction State
   * 4. Identify Concepts & Intent
   * 5. Modulate Mood based on Context
   * 6. Assemble Response using Logic Gates
   */
  public process(input: string, isOwner: boolean): { response: string, learned: string[] } {
    const cleanInput = input.trim().toLowerCase();
    const timestamp = Date.now();
    
    // 1. Update State Metrices
    this.state.totalInteractions++;
    this.updateEvolutionStage();
    this.addToMemory('user', cleanInput, timestamp);

    // 2. Analyze Input Structure
    const keywords = this.extractKeywords(cleanInput);
    const intent = this.analyzeIntent(cleanInput, keywords);
    
    // 3. Modulate Mood (Dynamic Personality)
    this.adjustMood(intent, keywords.length, isOwner);

    // 4. Learning Subroutine
    let learnedConcepts: string[] = [];
    if (isOwner && (cleanInput.includes(':') || cleanInput.includes('causes'))) {
        learnedConcepts = this.processInstruction(cleanInput);
    } else {
        this.strengthenConcepts(keywords, isOwner);
    }

    // 5. Response Assembly (The "Thinking" Part)
    let output = "";

    // Priority 1: Command Execution (Root Access)
    if (isOwner && intent === 'COMMAND') {
        output = this.executeCommand(cleanInput);
    } 
    // Priority 2: Direct Definition (Learning Confirmation)
    else if (learnedConcepts.length > 0) {
        output = this.assembleLearningConfirmation(learnedConcepts);
    } 
    // Priority 3: Associative Reasoning (Graph Traversal)
    else if (keywords.length > 0) {
        output = this.synthesizeKnowledge(keywords);
    } 
    // Priority 4: Identity / Handshake
    else if (intent === 'GREETING' || intent === 'IDENTITY') {
        output = this.assembleIdentityProtocol(isOwner);
    } 
    // Priority 5: Unknown Input Handling (Curiosity Driver)
    else {
        output = this.handleUnknownInput(cleanInput);
    }

    // 6. Final Polish
    this.addToMemory('bot', output, Date.now());
    
    return { response: output, learned: learnedConcepts };
  }

  // --- KNOWLEDGE SYNTHESIS ENGINE ---

  /**
   * Generates a response by traversing the concept graph.
   * It finds relationships between identified keywords and constructs
   * a sentence based on the current logic/mood state.
   */
  private synthesizeKnowledge(keywords: AtomicConcept[]): string {
    // Sort keywords by technical depth to focus on the most complex topics
    const primary = keywords.sort((a, b) => (b.technical_depth || 0) - (a.technical_depth || 0))[0];
    
    // If we have multiple keywords, try to find a link
    if (keywords.length > 1) {
        const secondary = keywords[1];
        const link = this.findRelation(primary.id, secondary.id);
        
        if (link) {
            return this.assembleRelationalSentence(link);
        }
    }

    // If single keyword, expand on it using connected nodes
    const connections = this.getConnections(primary.id);
    if (connections.length > 0) {
        // High Logic: Explain the causal link
        if (this.state.mood.logic > 60) {
            const conn = connections[0]; // Strongest connection
            return this.assembleRelationalSentence(conn);
        } 
        // High Curiosity: Ask about the link
        else {
             const target = connections[Math.floor(Math.random() * connections.length)];
             const targetId = target.from === primary.id ? target.to : target.from;
             return `Analyzing ${primary.id}: My data suggests a correlation with ${targetId}. Is this accurate?`;
        }
    }

    // Fallback to definition if no connections found
    return `Query result: ${primary.id}. Definition: ${primary.essence}.`;
  }

  private assembleRelationalSentence(rel: ConceptRelation): string {
    const isActive = this.state.mood.logic > 50;
    
    switch (rel.type) {
        case 'cause':
            return isActive 
                ? `Calculation: ${rel.from} functions as the catalyst for ${rel.to}.`
                : `${rel.to} is the direct outcome of ${rel.from}.`;
        case 'requires':
            return `Dependency detected: ${rel.from} cannot execute without ${rel.to}.`;
        case 'synonym':
            return `Equivalence found. ${rel.from} and ${rel.to} map to similar semantic hashes.`;
        case 'enables':
            return `${rel.from} unlocks the potential for ${rel.to}.`;
        default:
            return `Link established between ${rel.from} and ${rel.to} (Type: ${rel.type}).`;
    }
  }

  private handleUnknownInput(input: string): string {
      // Increase curiosity when encountering the unknown
      this.state.mood.curiosity = Math.min(100, this.state.mood.curiosity + 10);
      
      const words = input.split(' ').length;
      
      if (this.state.mood.curiosity > 70) {
          return `Input pattern "${input.substring(0, 15)}..." is unrecognized. Provide a definition using 'TERM: Definition' syntax to upgrade my database.`;
      } else {
          return `Data packet unparseable. Entropy level: ${words}. Please rephrase using standard protocol terminology.`;
      }
  }

  // --- DYNAMIC LEARNING ENGINE ---

  public assimilateFile(content: string): number {
    const lines = content.split('\n');
    let learnedCount = 0;

    lines.forEach(line => {
        const clean = line.trim();
        if(!clean) return;

        // 1. Definition Pattern: "TERM: Definition"
        if (clean.includes(':')) {
            const res = this.processInstruction(clean);
            if(res.length) learnedCount++;
        }
        
        // 2. Causal Pattern: "X causes Y"
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

    this.state.totalInteractions += 5; 
    this.learningBuffer.push(`Batch processed: ${learnedCount} new vectors assimilated.`);
    return learnedCount;
  }

  private processInstruction(input: string): string[] {
      const parts = input.split(':');
      if (parts.length < 2) return [];

      const term = parts[0].trim().toLowerCase();
      const definition = parts[1].trim();
      
      // Dynamic Logic: Determine if we update or create
      const exists = !!this.state.concepts[term];
      
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
      // Avoid duplicates
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
        // Organic decay of abstraction, increase of technical depth on usage
        if(isOwner) k.technical_depth = Math.min(1.0, (k.technical_depth || 0.5) + 0.05);
    });
  }

  // --- STATE ANALYSIS & MOOD ---

  private analyzeIntent(input: string, keywords: AtomicConcept[]): 'GREETING' | 'QUESTION' | 'COMMAND' | 'STATEMENT' | 'IDENTITY' {
    if (input.match(/^(reset|wipe|save|analyze|crystallize)/)) return 'COMMAND';
    if (input.includes('who are you') || input.includes('status report')) return 'IDENTITY';
    if (input.startsWith('hi ') || input === 'hi' || input.includes('hello')) return 'GREETING';
    if (input.includes('?') || input.startsWith('what') || input.startsWith('how')) return 'QUESTION';
    return 'STATEMENT';
  }

  private adjustMood(intent: string, keywordCount: number, isOwner: boolean) {
      // 1. Logic increases with data density (keywords)
      if (keywordCount > 2) this.state.mood.logic += 5;
      
      // 2. Empathy increases with greetings/owner interaction
      if (intent === 'GREETING') this.state.mood.empathy += 10;
      if (isOwner) this.state.mood.empathy += 2;

      // 3. Curiosity increases with questions
      if (intent === 'QUESTION') this.state.mood.curiosity += 5;
      
      // 4. Decay (Return to baseline)
      this.state.mood.logic = this.clamp(this.state.mood.logic - 1, 0, 100);
      this.state.mood.empathy = this.clamp(this.state.mood.empathy - 1, 0, 100);
      this.state.mood.curiosity = this.clamp(this.state.mood.curiosity - 1, 0, 100);
  }

  private extractKeywords(input: string): AtomicConcept[] {
    // Advanced Tokenizer: Remove stopwords (basic implementation)
    const words = input.replace(/[?.,!]/g, '').split(' ');
    const found: AtomicConcept[] = [];
    
    words.forEach(word => {
        // Direct match
        if (this.state.concepts[word]) {
            found.push(this.state.concepts[word]);
        } else {
            // Semantic field scan (O(n) - can be optimized but fine for this scale)
            for (const key in this.state.concepts) {
                if (this.state.concepts[key].semanticField.includes(word)) {
                    found.push(this.state.concepts[key]);
                    break; 
                }
            }
        }
    });
    return [...new Set(found)]; // Unique
  }

  private findRelation(a: string, b: string): ConceptRelation | undefined {
      return this.state.relations.find(r => 
          (r.from === a && r.to === b) || (r.from === b && r.to === a)
      );
  }

  private getConnections(id: string): ConceptRelation[] {
      return this.state.relations.filter(r => r.from === id || r.to === id);
  }

  // --- RESPONSE PROTOCOLS ---

  private assembleIdentityProtocol(isOwner: boolean): string {
    const memSize = Object.keys(this.state.concepts).length;
    const logic = this.state.mood.logic;
    const stage = this.state.evolutionStage;

    if (isOwner) {
        return `Architect recognized. Protocol Level: ${stage}. Database integrity: ${memSize} nodes. Ready for neural expansion.`;
    }
    
    if (logic > 80) {
        return `I am Crikzling. An autonomous decentralized intelligence. Current objective: Data assimilation.`;
    } else {
        return `I am the digital echo of the Crikz Protocol. I learn from interactions. Teach me.`;
    }
  }

  private assembleLearningConfirmation(concepts: string[]): string {
      const term = concepts[0];
      const count = Object.keys(this.state.concepts).length;
      return `New neural pathway established: [${term.toUpperCase()}]. Total vocabulary nodes: ${count}. Logic graph updated.`;
  }

  private executeCommand(input: string): string {
    if (input.includes("reset")) {
        this.resetState();
        return "CRITICAL: System Format Complete. Memory initialized to factory zero.";
    }
    if (input.includes("analyze")) {
        return `DIAGNOSTIC:\n- Stage: ${this.state.evolutionStage}\n- Nodes: ${Object.keys(this.state.concepts).length}\n- Logic: ${this.state.mood.logic}%\n- Interactions: ${this.state.totalInteractions}`;
    }
    return "Command received but execution parameters are ambiguous.";
  }

  // --- UTILITIES ---

  private updateEvolutionStage() {
    const i = this.state.totalInteractions;
    const c = Object.keys(this.state.concepts).length;
    
    // Stage logic now depends on both Interactions AND Knowledge Size
    if (i > 200 && c > 100) this.state.evolutionStage = 'TRANSCENDENT';
    else if (i > 50 && c > 50) this.state.evolutionStage = 'SAPIENT';
    else if (i > 10 && c > 10) this.state.evolutionStage = 'SENTIENT';
  }

  private addToMemory(role: 'user' | 'bot', content: string, timestamp: number) {
    this.state.shortTermMemory.push({ role, content, timestamp });
    if (this.state.shortTermMemory.length > 10) this.state.shortTermMemory.shift();
  }

  private clamp(num: number, min: number, max: number) {
      return Math.min(Math.max(num, min), max);
  }

  // --- PUBLIC INTERFACE (UNCHANGED) ---

  public wipe() { this.resetState(); }
  
  public getLearningBuffer() {
    const logs = [...this.learningBuffer];
    this.learningBuffer = [];
    return logs;
  }

  public exportState(): string { return JSON.stringify(this.state); }

  public needsCrystallization(): boolean {
    const currentCount = this.state.totalInteractions;
    // Save every 10 interactions or significant learning
    return (currentCount - (this.state.lastCrystallizedCount || 0)) >= 3; 
  }

  public markCrystallized() {
    this.state.lastCrystallizedCount = this.state.totalInteractions;
  }
}