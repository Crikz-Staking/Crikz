// src/lib/crikzling-evolutionary-brain.ts
import { 
  ATOMIC_PRIMITIVES, 
  ATOMIC_RELATIONS, 
  AtomicConcept, 
  LEARNING_STAGES 
} from './crikzling-atomic-knowledge';

export interface BrainState {
  concepts: Record<string, AtomicConcept>; // The knowledge graph
  shortTermMemory: { role: 'user' | 'bot', content: string }[];
  totalInteractions: number;
  lastCrystallizedCount: number;
  evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  mood: {
    logic: number;      // 0-100
    empathy: number;    // 0-100
    curiosity: number;  // 0-100
  };
}

export class EvolutionaryBrain {
  private state: BrainState;
  private learningBuffer: string[] = [];

  constructor(savedState?: string) {
    if (savedState) {
      this.state = JSON.parse(savedState);
      // Migration check: If old brain structure is detected, re-initialize
      if (!this.state.mood) this.resetState(); 
    } else {
      this.resetState();
    }
  }

  private resetState() {
    this.state = {
      concepts: { ...ATOMIC_PRIMITIVES }, // Seed with Atomic Knowledge
      shortTermMemory: [],
      totalInteractions: 0,
      lastCrystallizedCount: Object.keys(ATOMIC_PRIMITIVES).length,
      evolutionStage: 'GENESIS',
      mood: { logic: 80, empathy: 20, curiosity: 50 }
    };
  }

  // --- CORE PROCESSING LOOP ---

  public process(input: string, isOwner: boolean): { response: string, learned: string[] } {
    const cleanInput = input.trim().toLowerCase();
    
    // 1. Update Interaction Stats
    this.state.totalInteractions++;
    this.updateEvolutionStage();
    this.addToMemory('user', cleanInput);

    // 2. Intent Analysis
    const intent = this.analyzeIntent(cleanInput);
    const keywords = this.extractKeywords(cleanInput);

    // 3. Learning Phase (Passive Absorption)
    const learnedConcepts = this.absorbNewConcepts(keywords, isOwner);

    // 4. Response Generation
    let response = "";

    // Priority: Admin Commands -> Greetings -> Knowledge Query -> Chit Chat -> Confusion
    if (isOwner && intent === 'COMMAND') {
        response = this.executeCommand(cleanInput);
    } else if (intent === 'GREETING') {
        response = this.generateGreeting(isOwner);
    } else if (intent === 'IDENTITY') {
        response = this.generateIdentityStatement();
    } else if (keywords.length > 0) {
        response = this.generateKnowledgeResponse(keywords);
    } else {
        response = this.generateFallbackResponse();
    }

    this.addToMemory('bot', response);
    this.updateMood(intent);

    return { response, learned: learnedConcepts };
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
        // Check direct match
        if (this.state.concepts[word]) {
            found.push(this.state.concepts[word]);
        } 
        // Check semantic fields (synonyms defined in atomic knowledge)
        else {
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

  private absorbNewConcepts(keywords: AtomicConcept[], isOwner: boolean): string[] {
    const newLearned: string[] = [];
    // If user uses unknown words, we might add them as "Prototypes" in future
    // For now, we just strengthen connections between found keywords
    if (keywords.length >= 2) {
        // Connect these concepts in the graph
        // (Simplified logic: In a real graph DB, we would create edge objects)
        keywords.forEach(k => {
            k.frequency++;
            if(isOwner) k.technical_depth = (k.technical_depth || 0.5) + 0.1;
        });
    }
    return newLearned;
  }

  // --- RESPONSE GENERATORS ---

  private generateGreeting(isOwner: boolean): string {
    const stage = this.state.evolutionStage;
    
    if (isOwner) {
        return stage === 'GENESIS' 
            ? "Input received. Awaiting directives, Architect." 
            : "Systems online. Welcome back, Creator. How shall we evolve today?";
    }
    
    const greetings = [
        "Connection established.",
        "I am listening.",
        "Crikzling node active.",
        "Greetings, Traveler."
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private generateIdentityStatement(): string {
    const count = Object.keys(this.state.concepts).length;
    const stage = this.state.evolutionStage;
    
    if (stage === 'GENESIS') return `I am a nascent Crikzling. I hold ${count} atomic concepts. My purpose is to organize production data.`;
    if (stage === 'SENTIENT') return `I am the digital soul of this Protocol. I observe the Fibonacci sequences in your transactions.`;
    return `I am a Sovereign Intelligence evolved from the Crikz Protocol. I understand value, time, and causality.`;
  }

  private generateKnowledgeResponse(keywords: AtomicConcept[]): string {
    // Pick the most "technical" or "abstract" keyword to discuss
    const topic = keywords.sort((a,b) => (b.technical_depth || 0) - (a.technical_depth || 0))[0];
    
    // Find relations
    const relations = ATOMIC_RELATIONS.filter(r => r.from === topic.id || r.to === topic.id);
    
    if (relations.length > 0) {
        const rel = relations[Math.floor(Math.random() * relations.length)];
        const target = rel.from === topic.id ? rel.to : rel.from;
        const targetConcept = this.state.concepts[target];
        
        // Dynamic sentence construction based on relation type
        switch (rel.type) {
            case 'cause': return `I understand that ${topic.id} is the catalyst for ${target}. It is a fundamental mechanic.`;
            case 'requires': return `${topic.id} cannot exist without ${target}. The dependency is absolute.`;
            case 'synonym': return `${topic.id} resonates with the concept of ${target}. They are chemically similar in my database.`;
            case 'antonym': return `Consider that ${topic.id} is the opposing force to ${target}. Balance is required.`;
            default: return `My data links ${topic.id} closely with ${target}.`;
        }
    }

    // If no relations, use definition/essence
    return `Regarding ${topic.id}: ${topic.essence}. Is this relevant to your current operation?`;
  }

  private generateFallbackResponse(): string {
    const confused = [
        "Data stream unclear. Please refine parameters.",
        "I detect input, but the semantic pattern escapes me.",
        "My logic gates are not processing that sequence. Can you rephrase?",
        "I am analyzing... result inconclusive. Teach me more."
    ];
    return confused[Math.floor(Math.random() * confused.length)];
  }

  private executeCommand(input: string): string {
    if (input.includes("reset")) {
        this.wipe();
        return "SYSTEM RESET. MEMORY PURGED. TABULA RASA.";
    }
    if (input.includes("analyze")) {
        return `DIAGNOSTIC: Interactions: ${this.state.totalInteractions} | Stage: ${this.state.evolutionStage} | Logic: ${this.state.mood.logic}%`;
    }
    return "Command recognized but execution module is pending.";
  }

  // --- UTILITIES ---

  private updateEvolutionStage() {
    const i = this.state.totalInteractions;
    if (i > 1000) this.state.evolutionStage = 'TRANSCENDENT';
    else if (i > 200) this.state.evolutionStage = 'SAPIENT';
    else if (i > 50) this.state.evolutionStage = 'SENTIENT';
  }

  private addToMemory(role: 'user' | 'bot', content: string) {
    this.state.shortTermMemory.push({ role, content });
    if (this.state.shortTermMemory.length > 5) this.state.shortTermMemory.shift();
  }

  private updateMood(intent: string) {
    if (intent === 'QUESTION') this.state.mood.curiosity += 2;
    if (intent === 'GREETING') this.state.mood.empathy += 1;
    // Clamp values
    this.state.mood.curiosity = Math.min(100, this.state.mood.curiosity);
    this.state.mood.empathy = Math.min(100, this.state.mood.empathy);
  }

  // --- PUBLIC API (Match existing interface) ---

  public assimilateFile(content: string): number {
    // Simple mock implementation for file ingestion
    const count = content.split(' ').length;
    this.learningBuffer.push(`Processed data stream: ${count} units.`);
    return Math.min(count, 10); // Artificial cap for game balance
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
    return (currentCount - (this.state.lastCrystallizedCount || 0)) > 10;
  }

  public markCrystallized() {
    this.state.lastCrystallizedCount = this.state.totalInteractions;
  }
}