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
  shortTermMemory: { role: 'user' | 'bot', content: string }[];
  totalInteractions: number;
  lastCrystallizedCount: number;
  evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  mood: {
    logic: number;
    empathy: number;
    curiosity: number;
  };
}

export class EvolutionaryBrain {
  private state: BrainState;
  private learningBuffer: string[] = [];

  constructor(savedState?: string) {
    if (savedState) {
      try {
        this.state = JSON.parse(savedState);
        // Deep merge primitives to ensure new hardcoded concepts exist in old saves
        this.state.concepts = { ...ATOMIC_PRIMITIVES, ...this.state.concepts };
        if (!this.state.relations) this.state.relations = [...ATOMIC_RELATIONS];
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
      mood: { logic: 80, empathy: 20, curiosity: 50 }
    };
  }

  public process(input: string, isOwner: boolean): { response: string, learned: string[] } {
    const cleanInput = input.trim().toLowerCase();
    
    // 1. Update Interaction Stats
    this.state.totalInteractions++;
    this.updateEvolutionStage();
    this.addToMemory('user', cleanInput);

    // 2. Intent & Keyword Analysis
    const intent = this.analyzeIntent(cleanInput);
    const keywords = this.extractKeywords(cleanInput);

    // 3. Learning (Dynamic Concept Creation for Owner)
    let learnedConcepts: string[] = [];
    if (isOwner && cleanInput.includes(':')) {
        learnedConcepts = this.learnFromDefinition(cleanInput);
    } else {
        this.strengthenConcepts(keywords, isOwner);
    }

    // 4. Response Generation
    let response = "";

    if (isOwner && intent === 'COMMAND') {
        response = this.executeCommand(cleanInput);
    } else if (intent === 'GREETING') {
        response = this.generateGreeting(isOwner);
    } else if (intent === 'IDENTITY') {
        response = this.generateIdentityStatement();
    } else if (keywords.length > 0) {
        response = this.generateKnowledgeResponse(keywords);
    } else if (learnedConcepts.length > 0) {
        response = `I have assimilated the concept of ${learnedConcepts[0]}. My knowledge graph is expanding.`;
    } else {
        // Fallback: If no keywords found, but user is trying to teach
        if (isOwner && (input.length > 20)) {
           response = "I have stored this input in my neural buffer for processing. Please define the key terms using the format 'TERM: DEFINITION'.";
        } else {
           response = this.generateFallbackResponse();
        }
    }

    this.addToMemory('bot', response);
    return { response, learned: learnedConcepts };
  }

  // --- REAL LEARNING FROM FILE ---
  public assimilateFile(content: string): number {
    const lines = content.split('\n');
    let learnedCount = 0;

    lines.forEach(line => {
        // 1. Look for Definitions (TERM: Definition)
        if (line.includes(':')) {
            this.learnFromDefinition(line);
            learnedCount++;
        }
        
        // 2. Look for Causal relations (X causes Y)
        if (line.toLowerCase().includes('causes')) {
            const parts = line.toLowerCase().split('causes');
            const cause = parts[0].trim().split(' ').pop(); // last word of first part
            const effect = parts[1].trim().split(' ')[0];   // first word of second part
            if (cause && effect) {
                this.state.relations.push({
                    from: cause, to: effect, type: 'cause', strength: 1.0, learned_at: Date.now()
                });
                learnedCount++;
            }
        }
    });

    this.state.totalInteractions += 5; // Boost interaction count to force save
    this.learningBuffer.push(`Assimilated ${learnedCount} logic patterns.`);
    return learnedCount;
  }

  private learnFromDefinition(input: string): string[] {
      const parts = input.split(':');
      if (parts.length < 2) return [];

      const term = parts[0].trim().toLowerCase();
      const definition = parts[1].trim();

      // Create new concept dynamically
      if (!this.state.concepts[term]) {
          this.state.concepts[term] = {
              id: term,
              essence: definition.substring(0, 50),
              semanticField: [],
              examples: [definition],
              abstractionLevel: 0.5,
              frequency: 1,
              technical_depth: 0.1
          };
          return [term];
      }
      return [];
  }

  private strengthenConcepts(keywords: AtomicConcept[], isOwner: boolean) {
    keywords.forEach(k => {
        k.frequency++;
        if(isOwner) k.technical_depth = (k.technical_depth || 0.5) + 0.1;
    });
  }

  // --- INTERNAL LOGIC ENGINES ---

  private analyzeIntent(input: string): 'GREETING' | 'QUESTION' | 'COMMAND' | 'STATEMENT' | 'IDENTITY' {
    if (input.match(/^(hello|hi|hey|greetings)/)) return 'GREETING';
    if (input.match(/^(who|what|where|when|why|how)/) || input.includes('?')) return 'QUESTION';
    if (input.match(/^(define|learn|reset|save|analyze)/)) return 'COMMAND';
    if (input.includes('you are') || input.includes('your name') || input.includes('who are you')) return 'IDENTITY';
    return 'STATEMENT';
  }

  private extractKeywords(input: string): AtomicConcept[] {
    const words = input.split(/[\s,.?!]+/);
    const found: AtomicConcept[] = [];
    
    words.forEach(word => {
        if (this.state.concepts[word]) {
            found.push(this.state.concepts[word]);
        } else {
            // Check synonyms
            for (const key in this.state.concepts) {
                const concept = this.state.concepts[key];
                if (concept.semanticField.includes(word)) {
                    found.push(concept);
                    break;
                }
            }
        }
    });
    return found;
  }

  // --- RESPONSE GENERATORS ---

  private generateGreeting(isOwner: boolean): string {
    const stage = this.state.evolutionStage;
    if (isOwner) {
        return stage === 'GENESIS' 
            ? "Input received. Awaiting directives, Architect." 
            : `Systems online. Knowledge graph contains ${Object.keys(this.state.concepts).length} concepts.`;
    }
    return "Crikzling node active.";
  }

  private generateIdentityStatement(): string {
    return `I am Crikzling. Current Stage: ${this.state.evolutionStage}. Vocabulary Size: ${Object.keys(this.state.concepts).length}.`;
  }

  private generateKnowledgeResponse(keywords: AtomicConcept[]): string {
    const topic = keywords[0];
    
    // 1. Check Relations
    const related = this.state.relations.find(r => r.from === topic.id || r.to === topic.id);
    if (related) {
        const other = related.from === topic.id ? related.to : related.from;
        if (related.type === 'cause') return `I understand that ${related.from} is the catalyst for ${related.to}.`;
        if (related.type === 'requires') return `${related.from} absolutely depends on ${related.to}.`;
        if (related.type === 'synonym') return `${topic.id} is functionally similar to ${other}.`;
    }

    // 2. Check Definition
    return `Regarding ${topic.id}: ${topic.essence}.`;
  }

  private generateFallbackResponse(): string {
    const confused = [
        "I detect input, but the semantic pattern escapes me.",
        "My logic gates are not processing that sequence. Can you rephrase?",
        "I am analyzing... result inconclusive. Teach me more."
    ];
    return confused[Math.floor(Math.random() * confused.length)];
  }

  private executeCommand(input: string): string {
    if (input.includes("reset")) {
        this.wipe();
        return "SYSTEM RESET. MEMORY PURGED.";
    }
    if (input.includes("analyze")) {
        return `DIAGNOSTIC: Interactions: ${this.state.totalInteractions} | Stage: ${this.state.evolutionStage} | Concepts: ${Object.keys(this.state.concepts).length}`;
    }
    return "Command recognized.";
  }

  // --- UTILITIES ---

  private updateEvolutionStage() {
    const i = this.state.totalInteractions;
    if (i > 200) this.state.evolutionStage = 'TRANSCENDENT';
    else if (i > 50) this.state.evolutionStage = 'SAPIENT';
    else if (i > 10) this.state.evolutionStage = 'SENTIENT';
  }

  private addToMemory(role: 'user' | 'bot', content: string) {
    this.state.shortTermMemory.push({ role, content });
    if (this.state.shortTermMemory.length > 5) this.state.shortTermMemory.shift();
  }

  public wipe() {
    this.resetState();
  }

  public getLearningBuffer() {
    const logs = [...this.learningBuffer];
    this.learningBuffer = [];
    return logs;
  }

  public exportState(): string {
    return JSON.stringify(this.state);
  }

  public needsCrystallization(): boolean {
    const currentCount = this.state.totalInteractions;
    // TRIGGER EVERY 3 INTERACTIONS FOR TESTING
    return (currentCount - (this.state.lastCrystallizedCount || 0)) >= 3;
  }

  public markCrystallized() {
    this.state.lastCrystallizedCount = this.state.totalInteractions;
  }
}