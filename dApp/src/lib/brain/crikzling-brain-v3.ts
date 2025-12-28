import { PublicClient } from 'viem';
import { InputProcessor } from './processors/InputProcessor';
import { CognitiveProcessor } from './processors/CognitiveProcessor';
import { ActionProcessor } from './processors/ActionProcessor';
import { ResultProcessor } from './processors/ResultProcessor';
import { ResponseGenerator } from './processors/ResponseGenerator';
import { SimulationEngine } from './processors/SimulationEngine';
import { NarrativeModule } from './narrative-module';
import { 
  BrainState, DAppContext, ThoughtProcess, DeepThoughtCycle, 
  CognitiveLogEntry, InternalDrives, ActionPlan 
} from './types'; 
import { AtomicConcept } from '@/lib/crikzling-atomic-knowledge';

const bigIntReplacer = (_key: string, value: any) => 
  typeof value === 'bigint' ? value.toString() : value;

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

  private history: CognitiveLogEntry[] = [];
  private readonly MAX_THOUGHT_CYCLES = 5;

  constructor(
    baseState?: string,
    diffState?: string,
    publicClient?: PublicClient,
    memoryContractAddress?: `0x${string}`
  ) {
    this.cognitive = new CognitiveProcessor(baseState, diffState, publicClient, memoryContractAddress);
    this.inputProc = new InputProcessor();
    this.actionProc = new ActionProcessor();
    this.resultProc = new ResultProcessor();
    this.generator = new ResponseGenerator();
    this.simulator = new SimulationEngine();
    this.narrative = new NarrativeModule();
  }

  private getSecureRandom(): number {
    const array = new Uint32Array(1);
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(array);
        return array[0] / (0xFFFFFFFF + 1);
    }
    return Math.random();
  }

  public mergeState(remoteState: BrainState) {
      this.cognitive.mergeExternalState(remoteState);
  }

  public exportFullState(): string {
    const state = this.cognitive.getState();
    return JSON.stringify({ ...state, exportedAt: Date.now() }, bigIntReplacer);
  }

  public exportDiffState(): string {
    return this.cognitive.exportDiff();
  }

  // --- FEATURE: Network Optimization ---
  public optimizeNeuralGraph() {
      // Trigger deduplication and cleanup
      const result = this.cognitive.pruneDuplicates();
      const graphRes = this.cognitive.optimizeGraph();
      if (result || graphRes) {
          this.logEvent({ 
              type: 'SYSTEM', 
              input: 'NEURAL_OPTIMIZATION', 
              output: `${result} ${graphRes || ''}`, 
              intent: 'SYSTEM',
              activeNodes: [],
              vectors: {input:[0,0,0,0,0,0], response:[0,0,0,0,0,0]},
              thoughtCycles: [],
              executionTimeMs: 0
          });
      }
  }

  public async tick(dappContext?: DAppContext): Promise<void> {
    const now = Date.now();
    const state = this.cognitive.getState();
    const { isConnected } = state.connectivity;
    const tickRate = isConnected ? 50 : 8000; 
    
    if (now - this.lastTick < tickRate) return;
    this.lastTick = now;

    if (isConnected) {
        state.connectivity.stamina = 100; 
        state.connectivity.bandwidthUsage = Math.floor(this.getSecureRandom() * 20) + 80;
        
        // Randomly trigger optimization when connected
        if (this.getSecureRandom() < 0.05) {
            this.optimizeNeuralGraph();
        }

        const operations = Math.floor(state.connectivity.bandwidthUsage / 5); 
        for(let i=0; i<operations; i++) {
            const roll = this.getSecureRandom();
            if (roll > 0.85) this.cognitive.evolveCognitiveState();
            else if (roll > 0.70) this.cognitive.clusterConcepts();
            else if (roll > 0.55) this.cognitive.optimizeGraph();
            else if (roll > 0.30) this.cognitive.prioritizedSynthesis();
            else this.cognitive.deepenKnowledge();
        }
        state.totalInteractions += operations;
        this.updateThought('web_crawling', 100, `Hyper-processing ${operations} nodes...`);
    } else {
        state.connectivity.stamina = 100; 
        state.connectivity.bandwidthUsage = 0;
    }

    if (!isConnected && state.drives.energy > 80 && this.getSecureRandom() < 0.05) {
        const dream = this.cognitive.dream();
        if (dream) {
            state.totalInteractions++;
            this.logEvent({ type: 'DREAM', input: 'Subconscious', output: dream, intent: 'DISCOURSE', emotionalShift: 0, activeNodes: [], vectors: {input:[0,0,0,0,0,0], response:[0,0,0,0,0,0]}, thoughtCycles: [], executionTimeMs: 0 });
        }
    }
    this.clearThought();
  }

  public async process(text: string, isOwner: boolean, dappContext?: DAppContext): Promise<{ response: string; actionPlan: ActionPlan }> { 
    const startTime = Date.now();
    try {
      this.updateThought('perception', 10, 'Parsing semantics...');
      const brainState = this.cognitive.getState();
      const inputAnalysis = this.inputProc.process(text, brainState.concepts, dappContext);
      
      this.updateThought('spreading_activation', 20, 'Activating neural lattice...');
      const activeIds = inputAnalysis.keywords.map((k: AtomicConcept) => k.id); 
      this.cognitive.stimulateNetwork(activeIds, brainState.drives.energy);
      
      let deepContext: DeepThoughtCycle[] = [];
      let currentFocus = [...activeIds];

      if (currentFocus.length === 0 && brainState.attentionFocus) {
          currentFocus.push(brainState.attentionFocus);
      }

      for (let cycle = 1; cycle <= this.MAX_THOUGHT_CYCLES; cycle++) {
          const progress = 20 + (cycle * (60 / this.MAX_THOUGHT_CYCLES));
          this.updateThought('introspection', progress, `Cycle ${cycle}: Associative walk...`);
          await this.think(500); 

          const memories = this.cognitive.retrieveRelevantMemories(currentFocus, inputAnalysis.inputVector);
          const newAssociations = this.cognitive.findAssociativePath(currentFocus, 2);
          
          let simResult = null;
          if (dappContext && (inputAnalysis.intent === 'FINANCIAL_ADVICE' || inputAnalysis.intent === 'DAPP_QUERY')) {
              simResult = this.simulator.runSimulation(inputAnalysis.intent, dappContext, inputAnalysis.inputVector);
          }

          deepContext.push({
              cycleIndex: cycle,
              focusConcepts: currentFocus,
              retrievedMemories: memories,
              newAssociations: newAssociations,
              simResult: simResult
          });

          if (newAssociations.length > 0) currentFocus = newAssociations.slice(0, 3); 
      }

      this.updateThought('strategy', 90, 'Formulating output...');
      const actionPlan = this.actionProc.plan(inputAnalysis, brainState, isOwner, deepContext);
      
      if (actionPlan.type === 'EXECUTE_COMMAND_RESET' && isOwner) this.cognitive.wipeLocalMemory();

      const integratedContext = this.resultProc.processMultiCycle(inputAnalysis, actionPlan, deepContext, brainState, dappContext);
      let response = this.generator.generateDeep(integratedContext);
      
      if (this.pendingInsight) {
          response += `\n\n[Cached Insight]: ${this.pendingInsight}`;
          this.pendingInsight = null;
      }

      this.cognitive.archiveMemory('user', inputAnalysis.cleanedInput, activeIds, inputAnalysis.emotionalWeight, dappContext, inputAnalysis.inputVector);
      this.cognitive.archiveMemory('bot', response, currentFocus, 0.5, dappContext, inputAnalysis.inputVector);

      const outputVector = [...inputAnalysis.inputVector] as [number, number, number, number, number, number];
      if (inputAnalysis.intent === 'FINANCIAL_ADVICE') outputVector[0] += 0.2; 

      this.logEvent({
          type: 'INTERACTION',
          input: text,
          output: response,
          intent: inputAnalysis.intent,
          emotionalShift: inputAnalysis.emotionalWeight,
          activeNodes: [...new Set([...activeIds, ...currentFocus])],
          vectors: { input: inputAnalysis.inputVector, response: outputVector },
          thoughtCycles: deepContext,
          executionTimeMs: Date.now() - startTime,
          dappContext: dappContext,
          actionPlan: actionPlan
      });

      this.updateThought('generation', 100, 'Done');
      await this.think(200); 
      this.clearThought();
      
      return { response, actionPlan }; 

    } catch (error) {
      console.error("Brain Failure:", error);
      this.clearThought();
      return { 
          response: "Critical error in cognitive pipeline.",
          actionPlan: { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 0, reasoning: 'Error Fallback' }
      };
    }
  }

  // --- STATE ACCESSORS & UTILS ---

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtCallback = callback;
  }

  public toggleNeuralLink(active: boolean) {
      const state = this.cognitive.getState();
      state.connectivity.isConnected = active;
      if (!active) state.connectivity.bandwidthUsage = 0;
  }

  public simpleTrain(input: string): string {
      const state = this.cognitive.getState();
      if (input.includes(':=')) {
          const [term, def] = input.split(':=').map(s => s.trim());
          if (term && def) {
              const id = term.toLowerCase().replace(/\s+/g, '_');
              state.concepts[id] = {
                  id,
                  essence: def,
                  semanticField: [term],
                  examples: [],
                  abstractionLevel: 0.5,
                  technical_depth: 0.5,
                  domain: 'TECHNICAL'
              };
              state.unsavedDataCount++;
              this.logEvent({ type: 'SYSTEM', input: `Definition Injection: ${term}`, output: 'Concept Assimilated', intent: 'TEACHING', emotionalShift: 0, activeNodes: [], vectors: {input:[0,0,0,0,0,0], response:[0,0,0,0,0,0]}, thoughtCycles: [], executionTimeMs: 0 });
              return `Defined concept: ${term}`;
          }
      }
      return "Format: Term := Definition";
  }

  public updateDrives(newDrives: InternalDrives) {
      this.cognitive.getState().drives = newDrives;
  }

  public setLearningRate(rate: number) {
      this.cognitive.getState().learningRate = Math.max(0.01, Math.min(1.0, rate));
  }

  public injectConcept(concept: AtomicConcept) {
      this.cognitive.getState().concepts[concept.id] = concept;
      this.cognitive.getState().unsavedDataCount++;
  }

  private logEvent(entry: Partial<CognitiveLogEntry>) {
      const fullEntry: CognitiveLogEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'SYSTEM',
          input: '',
          output: '',
          intent: 'UNKNOWN',
          emotionalShift: 0,
          activeNodes: [],
          vectors: { input: [0,0,0,0,0,0], response: [0,0,0,0,0,0] },
          thoughtCycles: [],
          executionTimeMs: 0,
          ...entry
      };
      this.history.unshift(fullEntry);
      if (this.history.length > 100) this.history.pop();
  }

  public getHistory(isOwner: boolean): CognitiveLogEntry[] {
      if (isOwner) return this.history;
      return this.history.map(h => ({
          ...h,
          input: '***',
          vectors: { input: [0,0,0,0,0,0], response: [0,0,0,0,0,0] },
          thoughtCycles: [] 
      }));
  }

  public assimilateFile(content: string): number {
    return this.cognitive.assimilateKnowledge(content);
  }

  public needsCrystallization(): boolean {
    const s = this.cognitive.getState();
    return s.unsavedDataCount > 0;
  }

  public clearUnsavedCount() { this.cognitive.markSaved(); }
  public getState(): BrainState { return this.cognitive.getState(); }
  
  public getStats() {
      const s = this.cognitive.getState();
      return {
        nodes: Object.keys(s.concepts).length,
        relations: s.relations.length,
        stage: s.evolutionStage,
        drives: s.drives, 
        connectivity: s.connectivity, 
        unsaved: s.unsavedDataCount,
        learningRate: s.learningRate,
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
      this.history = []; 
  }

  private clearThought() { if (this.thoughtCallback) this.thoughtCallback(null); }

  private updateThought(phase: ThoughtProcess['phase'], progress: number, subProcess: string) {
    if (this.thoughtCallback) this.thoughtCallback({ phase, progress, subProcess });
  }

  private async think(ms: number) { return new Promise(r => setTimeout(r, ms)); }
}