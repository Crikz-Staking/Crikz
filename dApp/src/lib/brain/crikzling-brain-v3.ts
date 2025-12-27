import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation } from '@/lib/crikzling-atomic-knowledge';
import { InputProcessor, InputAnalysis } from './processors/InputProcessor';
import { CognitiveProcessor } from './processors/CognitiveProcessor';
import { ActionProcessor, ActionPlan } from './processors/ActionProcessor';
import { ResultProcessor } from './processors/ResultProcessor';
import { ResponseGenerator } from './processors/ResponseGenerator';
import { BrainState, DAppContext, ThoughtProcess } from './types'; // FIXED IMPORT

export class CrikzlingBrainV3 {
  private cognitive: CognitiveProcessor;
  private inputProc: InputProcessor;
  private actionProc: ActionProcessor;
  private resultProc: ResultProcessor;
  private generator: ResponseGenerator;
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
      // Phase 1: Perception
      this.updateThought('perception', 10, 'Fuzzy matching & Intent Analysis');
      await this.think(150);
      const brainState = this.cognitive.getState();
      const inputAnalysis = this.inputProc.process(text, brainState.concepts, dappContext);

      // Phase 2: Graph Traversal (Spreading Activation)
      this.updateThought('graph_traversal', 35, 'Activating neural pathways');
      const activeNodeIds = inputAnalysis.keywords.map(k => k.id);
      
      // Activate related concepts in the graph
      const activatedNetwork = this.cognitive.activateNeuralNetwork(activeNodeIds);
      const secondaryConcepts = Object.keys(activatedNetwork)
        .filter(id => !activeNodeIds.includes(id))
        .sort((a, b) => activatedNetwork[b] - activatedNetwork[a])
        .slice(0, 3); // Top 3 associated concepts

      // Phase 3: Learning & Retrieval
      this.updateThought('hebbian_learning', 60, 'Strengthening synaptic weights');
      const allActiveIds = [...activeNodeIds, ...secondaryConcepts];
      const relevantMemories = this.cognitive.retrieveRelevantMemories(allActiveIds);
      
      // Only owner interactions or high-emotion events trigger immediate blockchain sync consideration
      if (inputAnalysis.emotionalWeight > 0.8) {
         await this.cognitive.syncBlockchainMemories();
      }

      // Phase 4: Strategy
      this.updateThought('strategy', 80, `Formulating ${inputAnalysis.intent} response`);
      const actionPlan = this.actionProc.plan(inputAnalysis, brainState, isOwner);
      
      // Execute internal commands
      if (actionPlan.type === 'EXECUTE_COMMAND_RESET' && isOwner) this.cognitive.wipeLocalMemory();

      // Phase 5: Generation
      this.updateThought('generation', 95, 'Synthesizing output');
      const integratedContext = this.resultProc.process(
        inputAnalysis,
        actionPlan,
        relevantMemories,
        brainState,
        dappContext
      );

      // Pass brain stats for mood-based generation
      (integratedContext as any).brainStats = { 
        ...integratedContext.brainStats,
        mood: brainState.mood 
      };

      const response = this.generator.generate(integratedContext);

      // Archive Interaction
      this.cognitive.archiveMemory(
        'user', 
        inputAnalysis.cleanedInput, 
        allActiveIds, 
        inputAnalysis.emotionalWeight, 
        dappContext
      );
      this.cognitive.archiveMemory(
        'bot', 
        response, 
        allActiveIds, 
        0.5, 
        dappContext
      );

      this.updateThought(null as any, 100, 'Complete');
      return { response };

    } catch (error) {
      console.error("Brain Failure:", error);
      return { response: "Cognitive dissonance detected. My processors encountered a critical fault." };
    }
  }

  // ... (Keep existing export/import/state methods)
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
      // Maps V4 stats to UI compatible object
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