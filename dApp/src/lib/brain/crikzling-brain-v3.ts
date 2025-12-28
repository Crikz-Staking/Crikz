// src/lib/brain/crikzling-brain-v3.ts

import { PublicClient } from 'viem';
import { InputProcessor, InputAnalysis } from './processors/InputProcessor';
import { CognitiveProcessor } from './processors/CognitiveProcessor';
import { ActionProcessor, ActionPlan } from './processors/ActionProcessor';
import { ResultProcessor } from './processors/ResultProcessor';
import { ResponseGenerator } from './processors/ResponseGenerator';
import { SimulationEngine } from './processors/SimulationEngine';
import { NarrativeModule } from './narrative-module';
import { BrainState, DAppContext, ThoughtProcess } from './types';

export class CrikzlingBrainV3 { 
  private cognitive: CognitiveProcessor;
  private inputProc: InputProcessor;
  private actionProc: ActionProcessor;
  private resultProc: ResultProcessor;
  private generator: ResponseGenerator;
  private simulator: SimulationEngine;
  private narrative: NarrativeModule;
  
  private thoughtCallback?: (thought: ThoughtProcess | null) => void;
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
    this.narrative = new NarrativeModule();
  }

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtCallback = callback;
  }

  /**
   * THE SUBCONSCIOUS HEARTBEAT
   * Runs independently of user input.
   */
  public async tick(dappContext?: DAppContext): Promise<void> {
    const now = Date.now();
    // Throttle to 2s to allow animations to breathe
    if (now - this.lastTick < 2000) return;
    this.lastTick = now;

    // 1. Process Neural Decay and Auto-Thoughts
    const spontaneousThought = this.cognitive.processNeuralTick();
    const state = this.cognitive.getState();

    // 2. React to Spontaneous Thought
    if (spontaneousThought) {
        this.updateThought('introspection', 50, spontaneousThought);
        
        // Sometimes surface this thought to the UI as a pending insight
        if (Math.random() > 0.7) {
            this.pendingInsight = spontaneousThought;
        }
        
        // Log it as an internal memory
        this.cognitive.archiveMemory('subconscious', spontaneousThought, [], 0.1, dappContext);
    } 
    // 3. Idle Simulation (If High Efficiency Drive)
    else if (state.drives.efficiency > 70 && dappContext && Math.random() > 0.8) {
        this.updateThought('simulation', 30, 'Optimizing yield strategies...');
        // logic to check yield...
    }
    else {
        // Clear thought bubble if idle
        this.updateThought(null as any, 0, '');
    }
  }

  public async process(
    text: string, 
    isOwner: boolean,
    dappContext?: DAppContext
  ): Promise<{ response: string; actionPlan: ActionPlan }> { 
    try {
      // 1. INPUT PROCESSING
      this.updateThought('perception', 10, 'Analyzing input vector');
      const brainState = this.cognitive.getState();
      const inputAnalysis = this.inputProc.process(text, brainState.concepts, dappContext);
      
      // 2. SPREADING ACTIVATION (The "Thinking" Step)
      this.updateThought('spreading_activation', 40, 'Firing neural pathways');
      const activeIds = inputAnalysis.keywords.map(k => k.id);
      
      // Energy flows through the graph based on input keywords
      this.cognitive.stimulateNetwork(activeIds);
      
      await this.think(500); // Artificial delay for "weight"

      // 3. MEMORY RETRIEVAL (Contextual)
      const relevantMemories = this.cognitive.retrieveRelevantMemories(activeIds, inputAnalysis.inputVector);

      // 4. SIMULATION (If needed)
      this.updateThought('simulation', 70, 'Predicting outcomes');
      let simResult = null;
      if (dappContext && (inputAnalysis.intent === 'FINANCIAL_ADVICE' || inputAnalysis.intent === 'DAPP_QUERY')) {
          simResult = this.simulator.runSimulation(inputAnalysis.intent, dappContext, inputAnalysis.inputVector);
      }

      // 5. ACTION & RESPONSE
      this.updateThought('strategy', 90, 'Collapsing wave function');
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

      // Inject Internal Drive State into response generation
      let response = this.generator.generate(integratedContext);

      // If there was a pending subconscious thought, append it
      if (this.pendingInsight) {
          response += ` \n\n[Subconscious]: ${this.pendingInsight}`;
          this.pendingInsight = null;
      }

      // 6. LEARNING (Neuroplasticity)
      this.cognitive.archiveMemory(
        'user', inputAnalysis.cleanedInput, activeIds, inputAnalysis.emotionalWeight, dappContext, inputAnalysis.inputVector 
      );
      this.cognitive.archiveMemory(
        'bot', response, activeIds, 0.5, dappContext, inputAnalysis.inputVector
      );

      this.updateThought(null as any, 100, 'Complete');
      
      return { response, actionPlan }; 

    } catch (error) {
      console.error("Brain Failure:", error);
      return { 
          response: "Neural pathway disrupted. Rebooting cognitive core...",
          actionPlan: { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 0, reasoning: 'Error Fallback' }
      };
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
    return this.cognitive.getState().unsavedDataCount >= 10;
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
        mood: s.drives, // Mapping drives to mood for UI compat
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