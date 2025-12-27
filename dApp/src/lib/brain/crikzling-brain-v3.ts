import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation } from '@/lib/crikzling-atomic-knowledge';
import { InputProcessor, InputAnalysis } from './processors/InputProcessor';
import { CognitiveProcessor } from './processors/CognitiveProcessor';
import { ActionProcessor, ActionPlan } from './processors/ActionProcessor';
import { ResultProcessor } from './processors/ResultProcessor';
import { ResponseGenerator } from './processors/ResponseGenerator';
import { SimulationEngine } from './processors/SimulationEngine'; // NEW
import { BrainState, DAppContext, ThoughtProcess } from './types';

export class CrikzlingBrainV3 {
  private cognitive: CognitiveProcessor;
  private inputProc: InputProcessor;
  private actionProc: ActionProcessor;
  private resultProc: ResultProcessor;
  private generator: ResponseGenerator;
  private simulator: SimulationEngine; // NEW
  private thoughtCallback?: (thought: ThoughtProcess | null) => void;

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
    this.simulator = new SimulationEngine(); // NEW
  }

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtCallback = callback;
  }

  public async process(
    text: string, 
    isOwner: boolean,
    dappContext?: DAppContext
  ): Promise<{ response: string }> {
    try {
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

      // Phase 3: Retrieval (Using V5 Vector Search)
      const allActiveIds = [...activeNodeIds, ...secondaryConcepts];
      const relevantMemories = this.cognitive.retrieveRelevantMemories(allActiveIds, inputAnalysis.inputVector);
      
      if (inputAnalysis.emotionalWeight > 0.8) {
         await this.cognitive.syncBlockchainMemories();
      }

      // Phase 4: Simulation (NEW)
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
        simResult // Pass simulation
      );

      (integratedContext as any).brainStats = { 
        ...integratedContext.brainStats,
        mood: brainState.mood 
      };

      const response = this.generator.generate(integratedContext);

      // Archive Interaction (Storing Vector)
      this.cognitive.archiveMemory(
        'user', 
        inputAnalysis.cleanedInput, 
        allActiveIds, 
        inputAnalysis.emotionalWeight, 
        dappContext,
        inputAnalysis.inputVector // Store vector for future search
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

  // ... (Export/Import/Utils same as before)
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