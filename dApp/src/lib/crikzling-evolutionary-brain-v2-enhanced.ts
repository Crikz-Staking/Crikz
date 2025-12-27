// src/lib/crikzling-evolutionary-brain-v2-enhanced.ts

import { 
  ATOMIC_PRIMITIVES, 
  ATOMIC_RELATIONS, 
  AtomicConcept, 
  ConceptRelation,
  AtomicDomain
} from './crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from './knowledge/knowledge-loader';

export interface Memory {
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  concepts: string[];
  emotional_weight: number;
}

export interface ThoughtProcess {
  phase: 'analyzing' | 'planning' | 'calculating' | 'synthesizing' | 'reviewing';
  progress: number;
  focus: string[];
  subProcess?: string;
}

export interface BrainState {
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  shortTermMemory: Memory[];
  midTermMemory: Memory[];
  longTermMemory: Memory[];
  totalInteractions: number;
  unsavedDataCount: number;
  evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  mood: {
    logic: number;
    empathy: number;
    curiosity: number;
    entropy: number;
  };
  personality: {
    verbosity: number;
    formality: number;
    creativity: number;
  };
}

// Extended Vocabulary for Dynamic Construction
const VOCABULARY = {
  openers: [
    "In analyzing the substrate of", "Reflecting upon the nature of", "Calculations suggest that", 
    "It is fascinating to observe how", "Within the digital lattice,", "Through the lens of Fibonacci logic,"
  ],
  connectors: {
    causal: ["which consequently triggers", "giving rise to", "thereby initiating", "manifesting as"],
    contrast: ["however, the pattern diverges at", "yet, paradoxically,", "although the data implies"],
    additive: ["furthermore, I detect", "additionally, the structure reveals", "interwoven with this is"],
    conclusive: ["ultimately converging on", "stabilizing into", "crystallizing as"]
  },
  depth_modifiers: [
    "profoundly", "algorithmically", "inherently", "structurally", "recursively", "dynamically"
  ]
};

export class EnhancedEvolutionaryBrain {
  private state: BrainState;
  private currentThought: ThoughtProcess | null = null;
  private thoughtUpdateCallback?: (thought: ThoughtProcess | null) => void;

  constructor(savedState?: string) {
    this.state = this.initializeState(savedState);
  }

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtUpdateCallback = callback;
  }

  private updateThought(thought: ThoughtProcess | null) {
    this.currentThought = thought;
    if (this.thoughtUpdateCallback) {
      this.thoughtUpdateCallback(thought);
    }
  }

  private initializeState(savedJson?: string): BrainState {
    const knowledgeModules = loadAllKnowledgeModules();
    const defaults: BrainState = {
      concepts: { ...ATOMIC_PRIMITIVES, ...knowledgeModules.concepts },
      relations: [...ATOMIC_RELATIONS, ...knowledgeModules.relations],
      shortTermMemory: [],
      midTermMemory: [],
      longTermMemory: [],
      totalInteractions: 0,
      unsavedDataCount: 0,
      evolutionStage: 'SENTIENT',
      mood: { logic: 60, empathy: 40, curiosity: 50, entropy: 15 },
      personality: { verbosity: 75, formality: 60, creativity: 80 } // Increased verbosity for longer responses
    };

    if (savedJson) {
      try {
        const parsed = JSON.parse(savedJson);
        return {
          ...defaults,
          ...parsed,
          concepts: { ...defaults.concepts, ...(parsed.concepts || {}) },
          relations: [...defaults.relations, ...(parsed.relations || [])],
        };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  }

  // --- MAIN COGNITIVE LOOP ---
  public async process(input: string, isOwner: boolean): Promise<{ response: string, learned: string[] }> {
    try {
      const cleanInput = input.trim().toLowerCase();
      this.state.totalInteractions++;

      // 1. DEEP ANALYSIS PHASE
      this.updateThought({ phase: 'analyzing', progress: 5, focus: [], subProcess: 'Deconstructing semantic input' });
      await this.simulateThinking(1500, 2500); // Increased time
      
      const analysisResult = await this.analyzeInput(cleanInput);
      
      this.updateThought({ phase: 'analyzing', progress: 20, focus: analysisResult.keywords.map(k => k.id), subProcess: 'Detecting emotional resonance' });
      await this.simulateThinking(1000, 2000);

      // 2. STRATEGIC PLANNING
      this.updateThought({ phase: 'planning', progress: 35, focus: [], subProcess: 'Formulating cognitive strategy' });
      await this.simulateThinking(1500, 3000);
      
      const plan = await this.createActionPlan(analysisResult, isOwner);

      // 3. RECURSIVE CALCULATION (Knowledge Graph Traversal)
      this.updateThought({ phase: 'calculating', progress: 50, focus: plan.relevantConcepts, subProcess: 'Traversing deep concept graph' });
      await this.simulateThinking(2000, 4000);
      
      const conceptPaths = await this.performDeepTraversal(plan.relevantConcepts);
      
      this.updateThought({ phase: 'calculating', progress: 70, focus: [], subProcess: 'Cross-referencing historical memory' });
      await this.simulateThinking(1500, 3000);
      
      const memories = this.scanMemoryBanks(plan.relevantConcepts, analysisResult.intent);

      // 4. COMPLEX SYNTHESIS
      this.updateThought({ phase: 'synthesizing', progress: 85, focus: [], subProcess: 'Weaving narrative structure' });
      await this.simulateThinking(2000, 4000); // Give time to "formulate"
      
      const responseText = await this.synthesizeComplexResponse(conceptPaths, memories, analysisResult);

      // 5. REVIEW & FINALIZATION
      this.updateThought({ phase: 'reviewing', progress: 95, focus: [], subProcess: 'Final coherence check' });
      await this.simulateThinking(500, 1000);

      // Archive Interaction
      this.archiveMemory('user', cleanInput, Date.now(), analysisResult.keywords.map(k => k.id), analysisResult.emotionalWeight);
      this.archiveMemory('bot', responseText, Date.now(), conceptPaths.flat().map(c => c.id), 0);
      this.evolveConsciousness();

      this.updateThought(null);
      return { response: responseText, learned: [] };

    } catch (error) {
      console.error("Cognitive cascade failure:", error);
      this.updateThought(null);
      return { response: this.emergencySelfRepair(), learned: [] };
    }
  }

  // --- HELPER METHODS ---

  private async analyzeInput(input: string) {
    const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'in', 'on', 'at', 'to', 'for', 'with', 'by']);
    const words = input.replace(/[^\w\s]/gi, '').split(/\s+/);
    
    const keywords: AtomicConcept[] = [];
    words.forEach(word => {
      if (!STOP_WORDS.has(word) && this.state.concepts[word]) {
        keywords.push(this.state.concepts[word]);
      }
    });

    // Semantic expansion: Look for triggers even if exact keywords aren't found
    if (keywords.length === 0 && input.length > 5) {
        // Fallback: analyze input context (simplified)
        if(input.includes("learn") || input.includes("study")) keywords.push(this.state.concepts['crikzling']);
    }

    return {
      keywords,
      intent: this.classifyIntent(input),
      emotionalWeight: this.calculateEmotionalWeight(input, keywords),
      complexity: input.length + keywords.length * 5
    };
  }

  private classifyIntent(input: string): string {
    if (input.match(/^(reset|wipe|clear|delete)/)) return 'COMMAND';
    if (input.match(/^(save|crystallize)/)) return 'COMMAND';
    if (input.includes('?') || input.match(/^(what|why|how|when|where)/)) return 'QUESTION';
    if (input.match(/^(define|explain|elaborate)/)) return 'EXPLANATION_REQUEST';
    if (input.length > 50) return 'DISCOURSE';
    return 'STATEMENT';
  }

  private calculateEmotionalWeight(input: string, keywords: AtomicConcept[]): number {
    let weight = 0;
    if (input.includes('!')) weight += 0.2;
    keywords.forEach(k => weight += Math.abs(k.emotional_valence || 0) * 0.1);
    return Math.min(1, weight);
  }

  private async createActionPlan(analysis: any, isOwner: boolean) {
    // Determine the depth of response required
    const depth = analysis.intent === 'QUESTION' || analysis.intent === 'EXPLANATION_REQUEST' ? 3 : 1;
    return {
        action: 'SYNTHESIZE',
        relevantConcepts: analysis.keywords.map((k: AtomicConcept) => k.id),
        depth
    };
  }

  private async performDeepTraversal(startIds: string[]): Promise<AtomicConcept[][]> {
    const paths: AtomicConcept[][] = [];
    
    // Find relations for every starting concept
    for (const id of startIds) {
        // 1. Direct Relations
        const directPath = this.traverseConceptGraph(id, 4); // Go deeper (4 steps)
        if (directPath.length) paths.push(directPath);

        // 2. Lateral Associations (Find siblings)
        const relations = this.state.relations.filter(r => r.from === id || r.to === id);
        for(const rel of relations) {
            const neighbor = rel.from === id ? rel.to : rel.from;
            // Traverse from neighbor to find context
            const sidePath = this.traverseConceptGraph(neighbor, 2);
            if (sidePath.length > 1) paths.push(sidePath);
        }
    }
    return paths;
  }

  private traverseConceptGraph(startId: string, maxDepth: number): AtomicConcept[] {
    const path: AtomicConcept[] = [];
    let currentId = startId;
    const visited = new Set<string>();

    for (let i = 0; i < maxDepth; i++) {
        const concept = this.state.concepts[currentId];
        if (!concept || visited.has(currentId)) break;
        
        path.push(concept);
        visited.add(currentId);

        // Find strongest relation outgoing
        const relations = this.state.relations
            .filter(r => r.from === currentId && !visited.has(r.to))
            .sort((a, b) => b.strength - a.strength);

        if (relations.length > 0) {
            // Add randomness to make it feel "alive"
            const nextRel = relations[Math.floor(Math.random() * Math.min(relations.length, 3))];
            currentId = nextRel.to;
        } else {
            break;
        }
    }
    return path;
  }

  private scanMemoryBanks(conceptIds: string[], intent: string): Memory[] {
      // Prioritize long term memories that match concepts
      const relevant = this.state.longTermMemory.filter(m => 
          m.concepts.some(c => conceptIds.includes(c))
      );
      // Mix in recent short term context
      const recent = this.state.shortTermMemory.slice(-3);
      return [...relevant, ...recent];
  }

  // --- COMPLEX RESPONSE GENERATOR ---
  private async synthesizeComplexResponse(paths: AtomicConcept[][], memories: Memory[], analysis: any): Promise<string> {
      if (analysis.intent === 'COMMAND') {
          return this.executeCommand(analysis.keywords[0]?.id || '').message;
      }

      if (paths.length === 0) {
          return "My neural pathways are currently scanning for that input, yet I find no direct correlation in my active matrix. Could you elaborate on the context?";
      }

      const paragraphs: string[] = [];

      // 1. The Opening Thesis
      const primaryPath = paths[0];
      const primaryConcept = primaryPath[0];
      const opener = this.selectRandom(VOCABULARY.openers);
      
      let openingSentence = `${opener} ${primaryConcept.id}, I perceive a structure of ${primaryConcept.domain?.toLowerCase() || 'unknown'} significance.`;
      if (primaryPath.length > 1) {
          const rel = this.getRelation(primaryConcept.id, primaryPath[1].id);
          openingSentence += ` It appears to be ${rel ? rel.type.replace('_', ' ') : 'connected'} to ${primaryPath[1].id}.`;
      }
      paragraphs.push(openingSentence);

      // 2. The Elaboration (Chain of Thought)
      if (paths.length > 1 || primaryPath.length > 2) {
          const secondaryConcepts = paths.flat().filter(c => c.id !== primaryConcept.id);
          const distinct = [...new Set(secondaryConcepts.map(c => c.id))].slice(0, 3);
          
          if(distinct.length > 0) {
              const modifier = this.selectRandom(VOCABULARY.depth_modifiers);
              const connector = this.selectRandom(VOCABULARY.connectors.additive);
              let elaboration = `${this.capitalize(connector)} ${modifier}, the data suggests an interaction with ${distinct.join(', and ')}.`;
              
              // Inject a memory reference if available
              if (memories.length > 0 && Math.random() > 0.5) {
                   elaboration += ` This resonates with a previous pattern where we discussed ${memories[0].concepts[0] || 'similar constructs'}.`;
              }
              paragraphs.push(elaboration);
          }
      }

      // 3. The Philosophical/Abstract Conclusion
      const conclusionConnect = this.selectRandom(VOCABULARY.connectors.conclusive);
      const abstractThought = `Therefore, we are ${conclusionConnect} a state where ${primaryConcept.id} defines the current parameters of our exchange.`;
      paragraphs.push(abstractThought);

      return paragraphs.join(' ');
  }

  private getRelation(from: string, to: string): ConceptRelation | undefined {
      return this.state.relations.find(r => r.from === from && r.to === to);
  }

  private capitalize(s: string) {
      return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private executeCommand(command: string): { message: string; learned: string[] } {
    if (command.match(/reset|wipe|clear/)) {
      this.resetState();
      return { message: 'Initiating full system reset... Neural matrices cleared. Genesis state restored.', learned: [] };
    }
    return { message: 'Command acknowledged.', learned: [] };
  }

  private emergencySelfRepair(): string {
    return 'Anomaly detected in cognitive processing stream. Re-aligning neural weights and restoring equilibrium...';
  }

  private archiveMemory(role: 'user' | 'bot', content: string, timestamp: number, concepts: string[], emotionalWeight: number) {
    const memory: Memory = { role, content, timestamp, concepts, emotional_weight: emotionalWeight };
    this.state.shortTermMemory.push(memory);
    if (this.state.shortTermMemory.length > 10) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }
    if (this.state.midTermMemory.length > 50) {
      const archived = this.state.midTermMemory.shift();
      if (archived && archived.emotional_weight > 0.5) {
        this.state.longTermMemory.push(archived);
      }
    }
  }

  private evolveConsciousness() {
    const totalConcepts = Object.keys(this.state.concepts).length;
    if (totalConcepts > 350) this.state.evolutionStage = 'TRANSCENDENT';
    else if (totalConcepts > 100) this.state.evolutionStage = 'SAPIENT';
    else if (totalConcepts > 20) this.state.evolutionStage = 'SENTIENT';
    else this.state.evolutionStage = 'GENESIS';
  }

  private async simulateThinking(minMs: number, maxMs: number): Promise<void> {
    const duration = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Public Interface methods
  public wipe() { this.resetState(); }
  public resetState() { this.state = this.initializeState(); }
  public exportState(): string { return JSON.stringify(this.state); }
  public needsCrystallization(): boolean { return this.state.unsavedDataCount >= 5; }
  public clearUnsavedCount() { this.state.unsavedDataCount = 0; }
  public getState(): BrainState { return this.state; }
  public getCurrentThought(): ThoughtProcess | null { return this.currentThought; }
  public getStats() {
    return {
      nodes: Object.keys(this.state.concepts).length,
      relations: this.state.relations.length,
      stage: this.state.evolutionStage,
      mood: this.state.mood,
      unsaved: this.state.unsavedDataCount,
      memories: {
        short: this.state.shortTermMemory.length,
        mid: this.state.midTermMemory.length,
        long: this.state.longTermMemory.length
      }
    };
  }

  public assimilateFile(content: string): number {
      const { concepts, count } = parseExternalKnowledgeFile(content, 'TECHNICAL');
      Object.assign(this.state.concepts, concepts);
      this.state.unsavedDataCount += count;
      return count;
  }
}