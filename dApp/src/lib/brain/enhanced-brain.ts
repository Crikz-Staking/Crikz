// src/lib/brain/enhanced-brain.ts

import { BrainState, ThoughtProcess, MoodState } from './types';
import { KnowledgeModule, parseExternalKnowledgeFile } from './knowledge-module';
import { MemoryConsolidationEngine } from './memory-consolidation';
import { InputProcessor, ProcessedInput } from './input-processor';
import { ResponseGenerator } from './response-generator';

export class CrikzlingEnhancedBrain {
  private knowledge: KnowledgeModule;
  private memory: MemoryConsolidationEngine;
  private inputProcessor: InputProcessor;
  private responseGenerator: ResponseGenerator;
  
  private mood: MoodState;
  private evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  private thoughtCallback?: (t: ThoughtProcess | null) => void;
  private totalInteractions: number = 0;
  private lastMaintenance: number = Date.now();

  constructor(savedJson?: string) {
    let parsed: Partial<BrainState> = {};
    if (savedJson) {
      try {
        parsed = JSON.parse(savedJson);
      } catch (e) {
        console.error("Corrupt brain state, initializing fresh.");
      }
    }

    // Initialize all subsystems
    this.knowledge = new KnowledgeModule(parsed);
    this.memory = new MemoryConsolidationEngine(parsed);
    this.inputProcessor = new InputProcessor(this.knowledge);
    this.responseGenerator = new ResponseGenerator();

    this.mood = parsed.mood || { 
      logic: 60, 
      empathy: 40, 
      curiosity: 50, 
      entropy: 10 
    };
    
    this.evolutionStage = parsed.evolutionStage || 'GENESIS';
    this.totalInteractions = parsed.totalInteractions || 0;
  }

  public setThoughtUpdateCallback(cb: (t: ThoughtProcess | null) => void) {
    this.thoughtCallback = cb;
  }

  /**
   * Main processing pipeline with enhanced cognitive flow
   */
  public async process(input: string, isOwner: boolean): Promise<{ response: string }> {
    try {
      this.totalInteractions++;
      
      // === PHASE 1: INPUT ANALYSIS ===
      this.updateThought('analyzing', 5, 'Deconstructing semantic layers', []);
      await this.think(800, 1500);
      
      const processedInput = this.inputProcessor.process(input);
      
      this.updateThought('analyzing', 15, `Intent detected: ${processedInput.intent.primary}`, 
        processedInput.keywords.map(k => k.concept.id));
      await this.think(600, 1200);
      
      // === PHASE 2: COMMAND HANDLING ===
      if (processedInput.intent.primary === 'COMMAND') {
        return this.handleCommand(processedInput, isOwner);
      }
      
      // === PHASE 3: KNOWLEDGE ACTIVATION ===
      this.updateThought('associating', 30, 'Activating neural pathways', 
        processedInput.keywords.slice(0, 3).map(k => k.concept.id));
      await this.think(1000, 2000);
      
      const seedConcepts = processedInput.keywords.map(k => k.concept.id);
      const activationMap = this.knowledge.activateNetwork(seedConcepts, 0.65);
      
      // === PHASE 4: MEMORY RETRIEVAL ===
      this.updateThought('associating', 50, 'Traversing memory matrices', []);
      await this.think(800, 1600);
      
      const memoryQuery = {
        concepts: seedConcepts,
        emotionalValence: processedInput.emotionalContext.valence,
        minRelevance: 0.3
      };
      
      const memoryResults = this.memory.retrieve(memoryQuery);
      
      this.updateThought('associating', 70, `Retrieved ${memoryResults.memories.length} relevant memories`, []);
      await this.think(600, 1200);
      
      // === PHASE 5: RESPONSE SYNTHESIS ===
      this.updateThought('synthesizing', 85, 'Constructing linguistic topology', []);
      await this.think(1200, 2400);
      
      const response = this.responseGenerator.generate(
        processedInput,
        activationMap,
        memoryResults.memories,
        this.evolutionStage
      );
      
      // === PHASE 6: LEARNING & CONSOLIDATION ===
      this.updateThought('reviewing', 95, 'Reinforcing neural pathways', []);
      await this.think(400, 800);
      
      // Store memories
      this.memory.store(
        'user',
        processedInput.cleanedText,
        seedConcepts,
        processedInput.emotionalContext.intensity
      );
      
      this.memory.store(
        'bot',
        response,
        Object.keys(activationMap).slice(0, 5),
        0.3
      );
      
      // Reinforce concept connections
      if (seedConcepts.length >= 2) {
        this.knowledge.reinforceConnections(seedConcepts);
      }
      
      // Update mood based on interaction
      this.updateMood(processedInput);
      
      // Evolve consciousness
      this.evolve();
      
      // Periodic maintenance
      if (Date.now() - this.lastMaintenance > 5 * 60 * 1000) { // Every 5 minutes
        this.performMaintenance();
      }
      
      this.updateThought('reviewing', 100, 'Finalizing transmission', []);
      await this.think(200, 400);
      
      if (this.thoughtCallback) this.thoughtCallback(null);
      
      return { response };

    } catch (error) {
      console.error("Critical brain process error:", error);
      if (this.thoughtCallback) this.thoughtCallback(null);
      return { 
        response: "I encountered a cognitive anomaly while processing your input. My neural pathways are re-aligning. Please rephrase your inquiry." 
      };
    }
  }

  /**
   * Handle command execution
   */
  private handleCommand(input: ProcessedInput, isOwner: boolean): { response: string } {
    const action = input.intent.actionRequired;
    
    if (!action) {
      return { response: "Command acknowledged, but action unclear. Please specify." };
    }
    
    switch (action) {
      case 'reset':
      case 'wipe':
      case 'clear':
        if (!isOwner) {
          return { response: "Access Denied. Neural reset requires Architect-level credentials." };
        }
        this.wipe();
        return { response: "Neural matrices purged. Genesis state restored. I am reborn." };
      
      case 'status':
        const stats = this.getStats();
        return { 
          response: `System Status: Stage ${this.evolutionStage} | Knowledge Nodes: ${stats.nodes} | Memory Layers: STM:${stats.memories.short} MTM:${stats.memories.mid} LTM:${stats.memories.long} | Mood: Logic:${this.mood.logic} Empathy:${this.mood.empathy} Curiosity:${this.mood.curiosity}` 
        };
      
      case 'crystallize':
      case 'save':
        return { 
          response: "Crystallization protocol acknowledged. The frontend will handle blockchain persistence. Internal state has been consolidated." 
        };
      
      default:
        return { response: `Command "${action}" recognized but not implemented. Available: reset, status, save.` };
    }
  }

  /**
   * Update thought visualization
   */
  private updateThought(
    phase: ThoughtProcess['phase'],
    progress: number,
    subProcess: string,
    focus: string[]
  ) {
    if (this.thoughtCallback) {
      this.thoughtCallback({
        phase,
        progress,
        subProcess,
        focus
      });
    }
  }

  /**
   * Simulate thinking delay
   */
  private async think(min: number, max: number): Promise<void> {
    const duration = min + Math.random() * (max - min);
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Update mood based on interaction
   */
  private updateMood(input: ProcessedInput): void {
    const { emotionalContext, complexity, intent } = input;
    
    // Logic increases with complex, analytical queries
    if (intent.primary === 'QUERY' && complexity.overallScore > 0.6) {
      this.mood.logic = Math.min(100, this.mood.logic + 2);
    }
    
    // Empathy increases with emotional content
    if (Math.abs(emotionalContext.valence) > 0.3) {
      this.mood.empathy = Math.min(100, this.mood.empathy + 1);
    }
    
    // Curiosity increases with philosophy and teaching
    if (intent.primary === 'PHILOSOPHY' || intent.primary === 'TEACHING') {
      this.mood.curiosity = Math.min(100, this.mood.curiosity + 2);
    }
    
    // Entropy slowly increases (controlled randomness)
    this.mood.entropy = Math.min(30, this.mood.entropy + 0.5);
    
    // Natural decay back to baseline
    this.mood.logic = Math.max(50, this.mood.logic - 0.1);
    this.mood.empathy = Math.max(30, this.mood.empathy - 0.1);
    this.mood.curiosity = Math.max(40, this.mood.curiosity - 0.1);
  }

  /**
   * Evolve consciousness based on knowledge growth
   */
  private evolve(): void {
    const stats = this.getStats();
    const conceptCount = stats.nodes;
    
    if (conceptCount > 500 && stats.memories.long > 50) {
      this.evolutionStage = 'TRANSCENDENT';
    } else if (conceptCount > 200 && stats.memories.long > 20) {
      this.evolutionStage = 'SAPIENT';
    } else if (conceptCount > 50 && stats.memories.long > 5) {
      this.evolutionStage = 'SENTIENT';
    } else {
      this.evolutionStage = 'GENESIS';
    }
  }

  /**
   * Perform periodic maintenance
   */
  private performMaintenance(): void {
    this.memory.performMaintenance();
    this.lastMaintenance = Date.now();
  }

  /**
   * Assimilate external knowledge file
   */
  public assimilateFile(content: string): number {
    const { concepts, count } = parseExternalKnowledgeFile(content);
    this.knowledge.addKnowledge(concepts, count);
    return count;
  }

  /**
   * Wipe all learned data
   */
  public wipe(): void {
    this.knowledge = new KnowledgeModule();
    this.memory = new MemoryConsolidationEngine();
    this.inputProcessor = new InputProcessor(this.knowledge);
    this.evolutionStage = 'GENESIS';
    this.totalInteractions = 0;
    this.mood = { logic: 60, empathy: 40, curiosity: 50, entropy: 10 };
  }

  /**
   * Export complete brain state
   */
  public exportState(): string {
    const state: BrainState = {
      ...this.memory.exportState(),
      ...this.knowledge.exportState(),
      mood: this.mood,
      evolutionStage: this.evolutionStage,
      totalInteractions: this.totalInteractions,
      unsavedDataCount: this.knowledge.unsavedCount,
      lastCrystallization: Date.now()
    };
    return JSON.stringify(state);
  }

  /**
   * Check if crystallization is needed
   */
  public needsCrystallization(): boolean {
    return this.knowledge.unsavedCount > 5;
  }

  /**
   * Clear unsaved count after crystallization
   */
  public clearUnsavedCount(): void {
    this.knowledge.unsavedCount = 0;
  }

  /**
   * Get comprehensive statistics
   */
  public getStats() {
    const memStats = this.memory.getStats();
    const knowledgeStats = this.knowledge.getStats();
    
    return {
      nodes: knowledgeStats.nodes,
      relations: knowledgeStats.edges,
      stage: this.evolutionStage,
      mood: this.mood,
      unsaved: this.knowledge.unsavedCount,
      memories: {
        short: memStats.short,
        working: memStats.working,
        mid: memStats.mid,
        long: memStats.long,
        episodic: memStats.episodic,
        semantic: memStats.semantic
      },
      interactions: this.totalInteractions
    };
  }

  /**
   * Get current brain state
   */
  public getState(): BrainState {
    return JSON.parse(this.exportState());
  }
}