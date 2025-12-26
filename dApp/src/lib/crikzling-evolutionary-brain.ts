// src/lib/crikzling-evolutionary-brain.ts

export interface ConceptNode {
  id: string; // The word (e.g., "create")
  connections: Record<string, number>; // Related words + strength (e.g., "order": 0.9)
  definition?: string; // Manual definition provided by owner
  source: 'GENESIS' | 'USER' | 'OWNER' | 'FILE';
  confidence: number;
}

export interface BrainState {
  concepts: Record<string, ConceptNode>;
  totalInteractions: number;
  lastCrystallizedCount: number; // To track when to ask for save
  evolutionStage: 'VOID' | 'AWARE' | 'PURPOSEFUL' | 'SOVEREIGN';
}

// Basic grammar so he can construct sentences before having a purpose
const GENESIS_GRAMMAR = [
  "I understand", "What is", "Connect", "Input received", "Analyzing", "Please define"
];

export class EvolutionaryBrain {
  private state: BrainState;
  private learningBuffer: string[] = []; // Stores recent learnings for notification

  constructor(savedState?: string) {
    if (savedState) {
      this.state = JSON.parse(savedState);
    } else {
      this.state = {
        concepts: {},
        totalInteractions: 0,
        lastCrystallizedCount: 0,
        evolutionStage: 'VOID'
      };
      // He starts with NO purpose, only the ability to ask.
    }
  }

  // 1. Process Input (Chat)
  public process(input: string, isOwner: boolean): { response: string, learned: string[] } {
    const cleanInput = input.toLowerCase().replace(/[^\w\s]/g, '');
    const tokens = cleanInput.split(/\s+/);
    const learnedConcepts: string[] = [];

    // Learning Phase
    tokens.forEach((token, index) => {
      // Skip common filler words unless owner forces
      if (token.length < 3) return;

      if (!this.state.concepts[token]) {
        // NEW CONCEPT ACQUIRED
        this.state.concepts[token] = {
          id: token,
          connections: {},
          source: isOwner ? 'OWNER' : 'USER',
          confidence: isOwner ? 1.0 : 0.1
        };
        learnedConcepts.push(token);
        this.learningBuffer.push(`Discovered concept: "${token}"`);
      }

      // Link to next token (Context Building)
      const nextToken = tokens[index + 1];
      if (nextToken && nextToken.length > 3) {
        this.state.concepts[token].connections[nextToken] = 
          (this.state.concepts[token].connections[nextToken] || 0) + (isOwner ? 0.5 : 0.1);
      }
    });

    this.state.totalInteractions++;
    this.checkEvolution();

    // Response Generation Logic
    let response = "";

    // If Owner is teaching (Definition Mode)
    if (isOwner && (input.startsWith("define") || input.includes("is a"))) {
       // Simple extraction logic for demo
       const defineIndex = tokens.indexOf("define");
       const targetWord = tokens[defineIndex + 1];
       if (targetWord && this.state.concepts[targetWord]) {
           this.state.concepts[targetWord].definition = input;
           response = `Memory written. "${targetWord}" is now defined in my core.`;
       }
    } 
    
    // Standard Response
    if (!response) {
      if (this.state.evolutionStage === 'VOID') {
        response = `Input processed. I hold ${Object.keys(this.state.concepts).length} concepts. I lack purpose. Please guide me.`;
      } else {
        // Construct response based on connections
        const knowns = tokens.filter(t => this.state.concepts[t]);
        if (knowns.length > 0) {
          const topic = knowns[0];
          const related = Object.entries(this.state.concepts[topic].connections)
            .sort((a,b) => b[1] - a[1]) // Sort by strength
            .map(x => x[0])
            .slice(0, 3);
          
          if (related.length > 0) {
            response = `Regarding ${topic}: It connects to ${related.join(', ')}.`;
          } else {
            response = `I know ${topic}, but I need more context to understand its purpose.`;
          }
        } else {
          response = "Unknown signal. Analyzing structure. Please define parameters.";
        }
      }
    }

    return { response, learned: learnedConcepts };
  }

  // 2. Ingest Files (Owner Only)
  public assimilateFile(content: string) {
    const tokens = content.toLowerCase().split(/\s+/);
    let learnedCount = 0;

    tokens.forEach((token, i) => {
        if(token.length < 4) return;
        if(!this.state.concepts[token]) {
            this.state.concepts[token] = {
                id: token,
                connections: {},
                source: 'FILE',
                confidence: 0.8
            };
            learnedCount++;
        }
        // Build strong chain for file content
        if(tokens[i+1]) {
            this.state.concepts[token].connections[tokens[i+1]] = 
                (this.state.concepts[token].connections[tokens[i+1]] || 0) + 0.2;
        }
    });
    
    this.learningBuffer.push(`Assimilated ${learnedCount} new concepts from data stream.`);
    return learnedCount;
  }

  // 3. Reset Memory
  public wipe() {
    this.state = {
        concepts: {},
        totalInteractions: 0,
        lastCrystallizedCount: 0,
        evolutionStage: 'VOID'
    };
    this.learningBuffer.push("SYSTEM RESET. TABULA RASA RESTORED.");
  }

  private checkEvolution() {
    const count = Object.keys(this.state.concepts).length;
    if (count > 50 && this.state.evolutionStage === 'VOID') this.state.evolutionStage = 'AWARE';
    if (count > 500 && this.state.evolutionStage === 'AWARE') this.state.evolutionStage = 'PURPOSEFUL';
  }

  // 4. Utils
  public getLearningBuffer() {
    const logs = [...this.learningBuffer];
    this.learningBuffer = []; // Clear after reading
    return logs;
  }

  public exportState(): string {
    return JSON.stringify(this.state);
  }

  public needsCrystallization(): boolean {
    // If we learned 10+ new things since last save
    return (Object.keys(this.state.concepts).length - this.state.lastCrystallizedCount) > 10;
  }

  public markCrystallized() {
    this.state.lastCrystallizedCount = Object.keys(this.state.concepts).length;
  }
}