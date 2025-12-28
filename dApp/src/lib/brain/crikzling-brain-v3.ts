import { PublicClient } from 'viem';
import { InputProcessor, InputAnalysis } from './processors/InputProcessor';
import { CognitiveProcessor } from './processors/CognitiveProcessor';
import { ActionProcessor, ActionPlan } from './processors/ActionProcessor';
import { ResultProcessor } from './processors/ResultProcessor';
import { ResponseGenerator } from './processors/ResponseGenerator';
import { SimulationEngine } from './processors/SimulationEngine';
import { NarrativeModule } from './narrative-module';
import { BrainState, DAppContext, ThoughtProcess, DeepThoughtCycle } from './types';

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

  // Configuration for recursive depth - Increased for deeper thinking
  private readonly MAX_THOUGHT_CYCLES = 5;

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

  public async tick(dappContext?: DAppContext): Promise<void> {
    const now = Date.now();
    // Debounce background processing to prevent UI lag
    if (now - this.lastTick < 5000) return;
    this.lastTick = now;

    const spontaneousThought = this.cognitive.processNeuralTick();
    const state = this.cognitive.getState();

    // Handle background introspection
    if (spontaneousThought) {
        this.updateThought('introspection', 50, spontaneousThought);
        if (Math.random() > 0.7) {
            this.pendingInsight = spontaneousThought;
        }
        // Save to subconscious memory
        this.cognitive.archiveMemory('subconscious', spontaneousThought, [], 0.1, dappContext);
        
        await this.think(2000);
        this.clearThought();
    } 
    else if (state.drives.efficiency > 70 && dappContext && Math.random() > 0.85) {
        this.updateThought('simulation', 30, 'Optimizing yield strategies...');
        
        const simResult = this.simulator.runSimulation('FINANCIAL_ADVICE', dappContext, [1,0,0,0,0,0]);
        if(simResult) {
             this.pendingInsight = `Background Analysis: ${simResult.recommendation}`;
        }

        await this.think(2000);
        this.clearThought();
    }
    else {
        this.clearThought();
    }
  }

  public async process(
    text: string, 
    isOwner: boolean,
    dappContext?: DAppContext
  ): Promise<{ response: string; actionPlan: ActionPlan }> { 
    try {
      // 1. PERCEPTION
      this.updateThought('perception', 5, 'Deconstructing input semantics');
      const brainState = this.cognitive.getState();
      const inputAnalysis = this.inputProc.process(text, brainState.concepts, dappContext);
      
      // 2. SPREADING ACTIVATION
      this.updateThought('spreading_activation', 15, 'Igniting neural pathways');
      const activeIds = inputAnalysis.keywords.map(k => k.id);
      this.cognitive.stimulateNetwork(activeIds, brainState.drives.energy);
      
      // 3. RECURSIVE REASONING LOOP
      let deepContext: DeepThoughtCycle[] = [];
      let currentFocus = [...activeIds];

      // If no keywords found, seed with attention focus or random concept
      if (currentFocus.length === 0 && brainState.attentionFocus) {
          currentFocus.push(brainState.attentionFocus);
      }

      for (let cycle = 1; cycle <= this.MAX_THOUGHT_CYCLES; cycle++) {
          // Progress scales from 20% to ~80%
          const progress = 20 + (cycle * (60 / this.MAX_THOUGHT_CYCLES)); 
          
          this.updateThought('introspection', progress, `Cycle ${cycle}: Querying conceptual graph...`);
          
          // Enhanced Latency: Simulates deeper cognitive load (800ms - 1300ms per cycle)
          await this.think(800 + Math.random() * 500); 

          // A. Memory Retrieval
          const memories = this.cognitive.retrieveRelevantMemories(currentFocus, inputAnalysis.inputVector);
          
          // B. Association Walk (Lateral Thinking)
          const newAssociations = this.cognitive.findAssociativePath(currentFocus, 2);
          
          // C. Simulation (Contextual)
          let simResult = null;
          if (dappContext && (inputAnalysis.intent === 'FINANCIAL_ADVICE' || inputAnalysis.intent === 'DAPP_QUERY')) {
              this.updateThought('simulation', progress + 5, 'Running Monte Carlo...');
              simResult = this.simulator.runSimulation(inputAnalysis.intent, dappContext, inputAnalysis.inputVector);
          }

          deepContext.push({
              cycleIndex: cycle,
              focusConcepts: currentFocus,
              retrievedMemories: memories,
              newAssociations: newAssociations,
              simResult: simResult
          });

          // Shift focus for next cycle
          if (newAssociations.length > 0) {
              currentFocus = newAssociations.slice(0, 3); // Narrow focus
          }
      }

      // 4. STRATEGY
      this.updateThought('strategy', 90, 'Collapsing wave function');
      
      // FIX: Passed 'deepContext' as the 4th argument to satisfy ActionProcessor signature
      const actionPlan = this.actionProc.plan(inputAnalysis, brainState, isOwner, deepContext);
      
      if (actionPlan.type === 'EXECUTE_COMMAND_RESET' && isOwner) this.cognitive.wipeLocalMemory();

      // 5. GENERATION (Using Deep Context)
      const integratedContext = this.resultProc.processMultiCycle(
        inputAnalysis,
        actionPlan,
        deepContext,
        brainState,
        dappContext
      );

      let response = this.generator.generateDeep(integratedContext);
      response = this.narrative.enhanceResponse(response, integratedContext);

      if (this.pendingInsight) {
          response += ` \n\n[Subconscious]: ${this.pendingInsight}`;
          this.pendingInsight = null;
      }

      // 6. CONSOLIDATION
      this.cognitive.archiveMemory(
        'user', inputAnalysis.cleanedInput, activeIds, inputAnalysis.emotionalWeight, dappContext, inputAnalysis.inputVector 
      );
      
      // Remember own response, associated with the final focus of the thought loop
      this.cognitive.archiveMemory(
        'bot', response, currentFocus, 0.5, dappContext, inputAnalysis.inputVector
      );

      this.updateThought('generation', 100, 'Complete');
      await this.think(400); 
      this.clearThought();
      
      return { response, actionPlan }; 

    } catch (error) {
      console.error("Brain Failure:", error);
      this.clearThought();
      return { 
          response: "Cognitive dissonance detected. My neural pathways are recalibrating.",
          actionPlan: { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 0, reasoning: 'Error Fallback' }
      };
    }
  }

  public exportState(): string {
    return JSON.stringify(this.cognitive.getState(), (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    );
  }

  public assimilateFile(content: string): number {
    return this.cognitive.assimilateKnowledge(content);
  }

  public needsCrystallization(): boolean {
    const s = this.cognitive.getState();
    // Save if unsaved data is high OR if high entropy suggests risk
    return s.unsavedDataCount >= 10 || (s.drives.stability < 30 && s.unsavedDataCount > 0);
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
        drives: s.drives, 
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

  private clearThought() {
      if (this.thoughtCallback) {
          this.thoughtCallback(null);
      }
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