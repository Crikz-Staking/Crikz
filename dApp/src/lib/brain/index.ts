import { BrainState, ThoughtProcess, MoodState } from './types';
import { MemoryModule } from './memory-module';
import { KnowledgeModule, parseExternalKnowledgeFile } from './knowledge-module';
import { CognitiveModule } from './cognitive-module';
import { NarrativeModule } from './narrative-module';

export class CrikzlingBrain {
  private memory: MemoryModule;
  private knowledge: KnowledgeModule;
  private cognitive: CognitiveModule;
  private narrative: NarrativeModule;
  
  private mood: MoodState;
  private evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  private thoughtCallback?: (t: ThoughtProcess | null) => void;

  constructor(savedJson?: string) {
    let parsed: Partial<BrainState> = {};
    if (savedJson) {
        try { parsed = JSON.parse(savedJson); } catch (e) { console.error("Corrupt brain state, initializing fresh."); }
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

  /**
   * The Main Processing Loop
   */
  public async process(input: string, isOwner: boolean): Promise<{ response: string }> {
    try {
      // 1. ANALYZE (Cognitive)
      this.updateThought('analyzing', 10, 'Deconstructing semantic input');
      await this.think(400, 800);
      
      const analysis = this.cognitive.analyze(input, this.knowledge);
      
      this.updateThought('analyzing', 25, `Detected Intent: ${analysis.intent}`, analysis.keywords.map(k => k.id));
      await this.think(300, 600);

      // 2. PLAN (Strategy)
      this.updateThought('planning', 35, 'Formulating cognitive strategy');
      const plan = this.cognitive.plan(analysis, this.evolutionStage);

      // --- COMMAND OVERRIDES ---
      if (analysis.intent === 'COMMAND') {
         if (input.includes('reset') || input.includes('wipe')) {
             if (!isOwner) return { response: "Access Denied. Only the Architect may initiate a neural reset." };
             this.wipe();
             return { response: "Protocol override accepted. System Reset Initiated... Genesis state restored." };
         }
         if (input.includes('status')) {
             return { response: `Systems Nominal. Stage: ${this.evolutionStage}. Concepts: ${this.getStats().nodes}.` };
         }
      }

      // 3. SPREADING ACTIVATION (Knowledge)
      this.updateThought('associating', 50, 'Spreading neural activation', plan.targetConcepts);
      await this.think(600, 1200);
      
      const activationMap = this.knowledge.activateNetwork(plan.targetConcepts);
      const activeConceptIds = Object.keys(activationMap);

      // 4. MEMORY LOOKUP (Context)
      this.updateThought('associating', 70, 'Vectorizing memory retrieval', activeConceptIds.slice(0, 3));
      const memories = this.memory.retrieveAssociative(activeConceptIds);
      await this.think(500, 1000);

      // 5. SYNTHESIZE (Narrative)
      this.updateThought('synthesizing', 85, 'Weaving linguistic topology');
      const response = this.narrative.constructResponse(activationMap, memories, plan.tone);
      await this.think(800, 1500);

      // 6. LEARNING (Hebbian Update)
      this.updateThought('reviewing', 95, 'Reinforcing neural pathways');
      this.knowledge.reinforceConnections(plan.targetConcepts); 
      this.memory.archiveInteraction('user', input, plan.targetConcepts, analysis.emotionalWeight);
      this.memory.archiveInteraction('bot', response, activeConceptIds.slice(0, 5), 0);
      this.evolve(); 

      this.updateThought('reviewing', 100, 'Finalizing output');
      await this.think(200, 400);
      
      if (this.thoughtCallback) this.thoughtCallback(null);
      return { response };

    } catch (error) {
      console.error("Brain Process Error", error);
      return { response: "My thought process was interrupted by a cognitive anomaly. Please rephrase." };
    }
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
      const { concepts, count } = parseExternalKnowledgeFile(content);
      this.knowledge.addKnowledge(concepts, count); 
      return count;
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