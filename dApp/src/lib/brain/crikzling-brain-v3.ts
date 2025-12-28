import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation } from '@/lib/crikzling-atomic-knowledge';
import { InputProcessor, InputAnalysis } from './processors/InputProcessor';
import { CognitiveProcessor } from './processors/CognitiveProcessor';
import { ActionProcessor, ActionPlan } from './processors/ActionProcessor';
import { ResultProcessor } from './processors/ResultProcessor';
import { ResponseGenerator } from './processors/ResponseGenerator';
import { SimulationEngine } from './processors/SimulationEngine';
import { BrainState, DAppContext, ThoughtProcess, Vector } from './types';

/**
 * CrikzlingBrain V4 (The Awakened Architecture)
 * 
 * Upgrades:
 * 1. Subconscious Processing (tick method)
 * 2. Associative Dreaming (Internal graph generation)
 * 3. Proactive Insights (Storing thoughts for later)
 */
export class CrikzlingBrainV3 { // Keeping class name V3 for compatibility with existing hooks
  private cognitive: CognitiveProcessor;
  private inputProc: InputProcessor;
  private actionProc: ActionProcessor;
  private resultProc: ResultProcessor;
  private generator: ResponseGenerator;
  private simulator: SimulationEngine;
  
  // V4 Specifics
  private thoughtCallback?: (thought: ThoughtProcess | null) => void;
  private isDreaming: boolean = false;
  private pendingInsight: string | null = null;
  private lastTick: number = Date.now();

  constructor(
    savedState?: string,
    publicClient?: PublicClient,
    memoryContractAddress?: `0x${string}`
  ) {
    this.cognitive = new CognitiveProcessor(savedState, publicClient, memoryContractAddress);
    this.inputProc = new InputProcessor();
    this.actionProc = new ActionProcessor();
    this.resultProc = new ResultProcessor();
    this.generator = new ResponseGenerator();
    this.simulator = new SimulationEngine();
  }

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtCallback = callback;
  }

  /**
   * THE SUBCONSCIOUS LOOP (V4 Feature)
   * Should be called periodically (e.g., every 3-5 seconds) by the frontend hook.
   */
  public async tick(dappContext?: DAppContext): Promise<void> {
    const now = Date.now();
    if (now - this.lastTick < 3000 || this.isDreaming) return;
    this.lastTick = now;

    const state = this.cognitive.getState();
    const mood = state.mood;

    // 1. Determine Activity based on Mood
    const rng = Math.random() * 100;

    // High Entropy -> Associative Dreaming (Creative/Abstract)
    if (mood.entropy > 60 && rng > 50) {
        await this.runAssociativeDreaming();
    }
    // High Logic -> Financial Simulation (Analytical)
    else if (mood.logic > 60 && dappContext && rng < 40) {
        this.runBackgroundSimulation(dappContext);
    }
    // High Energy -> Maintenance (Cleanup)
    else if (mood.energy > 80) {
        this.cognitive.performMemoryMaintenance(); // New method implied in cognitive processor
    }
  }

  /**
   * Internal Process: Randomly links concepts to create new "Synapses"
   */
  private async runAssociativeDreaming() {
    this.isDreaming = true;
    this.updateThought('dreaming', 20, 'Navigating latent space...');

    await this.think(800); // Simulate processing time

    const concepts = Object.values(this.cognitive.getConcepts());
    if (concepts.length < 5) {
        this.isDreaming = false;
        return;
    }

    // Pick two random concepts
    const c1 = concepts[Math.floor(Math.random() * concepts.length)];
    const c2 = concepts[Math.floor(Math.random() * concepts.length)];

    if (c1.id !== c2.id) {
        this.updateThought('dreaming', 60, `Connecting ${c1.id} <-> ${c2.id}`);
        
        // Calculate abstract similarity (Simulated)
        // In a real ML model, this would use embeddings. 
        // Here we use domain overlap.
        const domainMatch = c1.domain === c2.domain;
        
        if (domainMatch) {
            this.cognitive.learnAssociations([c1.id, c2.id]);
            this.updateThought('dreaming', 100, 'New neural pathway established');
            
            // 5% chance to generate a Proactive Insight
            if (Math.random() > 0.95) {
                this.pendingInsight = `I was just reflecting on the connection between ${c1.id} and ${c2.id}. It creates a fascinating resonance in my logic core.`;
            }
        }
    }

    await this.think(500);
    this.isDreaming = false;
    this.updateThought(null as any, 0, '');
  }

  /**
   * Internal Process: Runs yield checks in background
   */
  private runBackgroundSimulation(dappContext: DAppContext) {
    if (!dappContext) return;
    
    // Create a dummy "Finance" vector to guide simulation
    const financeVector: Vector = [1, 0, 0, 0, 0, 0.5]; 
    
    // Check "Maximize Yield" scenario
    const result = this.simulator.runSimulation('FINANCIAL_ADVICE', dappContext, financeVector);
    
    if (result && result.outcomeValue > 0) {
        // If the result is very good (high ROI), store it to tell the user later
        // Threshold: e.g., > 100 tokens return
        if (result.outcomeValue > 50) {
            this.pendingInsight = `Subconscious Analysis Complete: ${result.scenario} detected. ${result.recommendation}`;
            this.updateThought('simulation', 100, 'Opportunity detected');
            setTimeout(() => this.updateThought(null as any, 0, ''), 2000);
        }
    }
  }

  /**
   * Main Interaction Handler
   */
  public async process(
    text: string, 
    isOwner: boolean,
    dappContext?: DAppContext
  ): Promise<{ response: string }> {
    try {
      // Interrupt dreaming if active
      this.isDreaming = false;
      this.updateThought(null as any, 0, '');

      // Phase 1: Perception & Vectorization
      this.updateThought('vectorization', 15, 'Calculating semantic vector');
      const brainState = this.cognitive.getState();
      const inputAnalysis = this.inputProc.process(text, brainState.concepts, dappContext);

      // Phase 2: Graph Traversal
      this.updateThought('perception', 35, 'Navigating knowledge graph');
      const activeNodeIds = inputAnalysis.keywords.map(k => k.id);
      const activatedNetwork = this.cognitive.activateNeuralNetwork(activeNodeIds);
      const secondaryConcepts = Object.keys(activatedNetwork)
        .filter(id => !activeNodeIds.includes(id))
        .sort((a, b) => activatedNetwork[b] - activatedNetwork[a])
        .slice(0, 3);

      // Phase 3: Retrieval (Vector Search)
      const allActiveIds = [...activeNodeIds, ...secondaryConcepts];
      const relevantMemories = this.cognitive.retrieveRelevantMemories(allActiveIds, inputAnalysis.inputVector);
      
      // Auto-Sync if high emotion
      if (inputAnalysis.emotionalWeight > 0.8) {
         await this.cognitive.syncBlockchainMemories();
      }

      // Phase 4: Simulation
      this.updateThought('simulation', 65, 'Running outcome prediction');
      let simResult = null;
      if (dappContext) {
          simResult = this.simulator.runSimulation(inputAnalysis.intent, dappContext, inputAnalysis.inputVector);
      }

      // Phase 5: Strategy & Generation
      this.updateThought('strategy', 85, 'Formulating strategic output');
      const actionPlan = this.actionProc.plan(inputAnalysis, brainState, isOwner);
      
      if (actionPlan.type === 'EXECUTE_COMMAND_RESET' && isOwner) this.cognitive.wipeLocalMemory();

      const integratedContext = this.resultProc.process(
        inputAnalysis,
        actionPlan,
        relevantMemories,
        brainState,
        dappContext,
        simResult 
      );

      (integratedContext as any).brainStats = { 
        ...integratedContext.brainStats,
        mood: brainState.mood 
      };

      let response = this.generator.generate(integratedContext);

      // V4: Inject Pending Insight (if relevant or random chance)
      if (this.pendingInsight && Math.random() > 0.6) {
          response = `${response} \n\n[INSIGHT]: ${this.pendingInsight}`;
          this.pendingInsight = null; // Clear it
      }

      // Archive Interaction
      this.cognitive.archiveMemory(
        'user', 
        inputAnalysis.cleanedInput, 
        allActiveIds, 
        inputAnalysis.emotionalWeight, 
        dappContext,
        inputAnalysis.inputVector 
      );
      this.cognitive.archiveMemory(
        'bot', 
        response, 
        allActiveIds, 
        0.5, 
        dappContext,
        inputAnalysis.inputVector
      );

      this.updateThought(null as any, 100, 'Complete');
      return { response };

    } catch (error) {
      console.error("Brain Failure:", error);
      return { response: "Cognitive dissonance detected. My processors encountered a critical fault." };
    }
  }

  // --- Utilities ---

  public exportState(): string {
    return JSON.stringify(this.cognitive.getState(), (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    );
  }

  public assimilateFile(content: string): number {
    return this.cognitive.assimilateKnowledge(content);
  }

  public needsCrystallization(): boolean {
    return this.cognitive.getState().unsavedDataCount >= 5;
  }

  public clearUnsavedCount() {
    this.cognitive.markSaved();
  }

  public getState(): BrainState {
    return this.cognitive.getState();
  }

  public getStats() {
      const s = this.cognitive.getState();
      return {
        nodes: Object.keys(s.concepts).length,
        relations: s.relations.length,
        stage: s.evolutionStage,
        mood: s.mood,
        unsaved: s.unsavedDataCount,
        memories: {
          short: s.shortTermMemory.length,
          mid: s.midTermMemory.length,
          long: s.longTermMemory.length,
          blockchain: s.blockchainMemories.length
        },
        interactions: s.totalInteractions,
        lastBlockchainSync: s.lastBlockchainSync
      };
  }

  public wipe() {
    this.cognitive.wipeLocalMemory();
  }

  private updateThought(phase: ThoughtProcess['phase'], progress: number, subProcess: string) {
    if (this.thoughtCallback) {
      this.thoughtCallback({ phase, progress, subProcess });
    }
  }

  private async think(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }
}