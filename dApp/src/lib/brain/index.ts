import { BrainState, ThoughtProcess, MoodState } from './types';
import { MemoryModule } from './memory-module';
import { KnowledgeModule } from './knowledge-module';
import { CognitiveModule } from './cognitive-module';
import { NarrativeModule } from './narrative-module';

export class CrikzlingBrain {
  // Sub-modules
  private memory: MemoryModule;
  private knowledge: KnowledgeModule;
  private cognitive: CognitiveModule;
  private narrative: NarrativeModule;

  // State
  private mood: MoodState;
  private evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  private thoughtCallback?: (t: ThoughtProcess | null) => void;

  constructor(savedJson?: string) {
    let parsed: Partial<BrainState> = {};
    if (savedJson) {
        try { parsed = JSON.parse(savedJson); } catch (e) { console.error("Corrupt brain state"); }
    }

    this.memory = new MemoryModule(parsed);
    this.knowledge = new KnowledgeModule(parsed);
    this.cognitive = new CognitiveModule();
    this.narrative = new NarrativeModule();

    this.mood = parsed.mood || { logic: 60, empathy: 40, curiosity: 50, entropy: 10 };
    this.evolutionStage = parsed.evolutionStage || 'GENESIS';
  }

  public setThoughtUpdateCallback(cb: (t: ThoughtProcess | null) => void) {
    this.thoughtCallback = cb;
  }

  private updateThought(phase: ThoughtProcess['phase'], progress: number, subProcess: string, focus: string[] = []) {
    if (this.thoughtCallback) this.thoughtCallback({ phase, progress, subProcess, focus });
  }

  public async process(input: string, isOwner: boolean): Promise<{ response: string }> {
    
    // 1. ANALYZE (Cognitive)
    this.updateThought('analyzing', 10, 'Deconstructing semantic input');
    await this.think(500, 1000);
    const analysis = this.cognitive.analyze(input, this.knowledge);
    
    this.updateThought('analyzing', 25, `Detected Intent: ${analysis.intent}`, analysis.keywords.map(k => k.id));
    await this.think(500, 1000);

    // 2. PLAN (Strategy)
    this.updateThought('planning', 35, 'Formulating cognitive strategy');
    const plan = this.cognitive.plan(analysis, this.evolutionStage);

    // Handle Commands
    if (plan.action === 'EXECUTE_COMMAND') {
       if (input.includes('reset')) {
           this.wipe();
           return { response: "System Reset Initiated. Memory core formatting... Genesis state restored." };
       }
    }

    // 3. SPREADING ACTIVATION (Knowledge)
    // This is the "Spark" that travels through the graph
    this.updateThought('associating', 50, 'Spreading neural activation', plan.targetConcepts);
    await this.think(1000, 2000);
    
    const activationMap = this.knowledge.activateNetwork(plan.targetConcepts);
    const activeConceptIds = Object.keys(activationMap);

    // 4. MEMORY LOOKUP (Context)
    this.updateThought('associating', 70, 'Vectorizing memory retrieval', activeConceptIds.slice(0, 3));
    const memories = this.memory.retrieveAssociative(activeConceptIds);
    await this.think(800, 1500);

    // 5. SYNTHESIZE (Narrative)
    this.updateThought('synthesizing', 85, 'Weaving linguistic topology');
    const response = this.narrative.constructResponse(activationMap, memories, plan.tone);
    await this.think(1000, 2000);

    // 6. LEARNING (Hebbian Update)
    this.updateThought('reviewing', 95, 'Reinforcing neural pathways');
    this.knowledge.reinforceConnections(plan.targetConcepts); // Wire input concepts together
    this.memory.archiveInteraction('user', input, plan.targetConcepts, analysis.emotionalWeight);
    this.memory.archiveInteraction('bot', response, activeConceptIds.slice(0, 5), 0);
    this.evolve(); // Check for level up

    this.updateThought('reviewing', 100, 'Finalizing output');
    await this.think(200, 500);
    
    if (this.thoughtCallback) this.thoughtCallback(null);

    return { response };
  }

  private evolve() {
    const stats = this.getStats();
    if (stats.nodes > 500) this.evolutionStage = 'TRANSCENDENT';
    else if (stats.nodes > 200) this.evolutionStage = 'SAPIENT';
    else if (stats.nodes > 50) this.evolutionStage = 'SENTIENT';
  }

  private async think(min: number, max: number) {
      await new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
  }

  public exportState(): string {
    const state: BrainState = {
        ...this.memory.exportState(),
        ...this.knowledge.exportState(),
        mood: this.mood,
        evolutionStage: this.evolutionStage,
        totalInteractions: 0,
        unsavedDataCount: this.knowledge.unsavedCount,
        lastCrystallization: Date.now()
    };
    return JSON.stringify(state);
  }

  public wipe() {
      this.memory = new MemoryModule();
      this.knowledge = new KnowledgeModule();
      this.evolutionStage = 'GENESIS';
  }

  public assimilateFile(content: string): number {
      // Advanced: Add concepts from file to knowledge graph
      // For now, we simulate adding nodes. 
      // In a real implementation, we'd parse definitions "term := def"
      const dummyCount = Math.floor(content.length / 50);
      this.knowledge.addKnowledge({}, dummyCount); 
      return dummyCount;
  }

  public needsCrystallization() { return this.knowledge.unsavedCount > 5; }
  public clearUnsavedCount() { this.knowledge.unsavedCount = 0; }
  
  public getStats() {
      return {
          ...this.memory.getStats(),
          ...this.knowledge.getStats(),
          stage: this.evolutionStage,
          mood: this.mood,
          unsaved: this.knowledge.unsavedCount
      };
  }

  public getState() { return JSON.parse(this.exportState()); }
}