import { PublicClient } from 'viem';
import { InputProcessor } from './processors/InputProcessor';
import { CognitiveProcessor } from './processors/CognitiveProcessor';
import { ActionProcessor } from './processors/ActionProcessor';
import { ResultProcessor } from './processors/ResultProcessor';
import { ResponseGenerator } from './processors/ResponseGenerator';
import { SimulationEngine } from './processors/SimulationEngine';
import { NarrativeModule } from './narrative-module';
import { NeuralTokenizer } from './processors/NeuralTokenizer'; // <--- New
import { AttentionMechanism } from './processors/AttentionMechanism'; // <--- New
import { 
  BrainState, DAppContext, ThoughtProcess, DeepThoughtCycle, 
  CognitiveLogEntry, InternalDrives, ActionPlan, PersonaArchetype, NeuralToken 
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
  private tokenizer: NeuralTokenizer; // <--- New
  private attention: AttentionMechanism; // <--- New
  
  private thoughtCallback?: (thought: ThoughtProcess | null) => void;
  private lastTick: number = Date.now();
  private batchLogBuffer: string[] = []; 
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
    this.tokenizer = new NeuralTokenizer();
    this.attention = new AttentionMechanism();
  }

  private getSecureRandom(): number {
    const array = new Uint32Array(1);
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(array);
        return array[0] / (0xFFFFFFFF + 1);
    }
    return Math.random();
  }

  public mergeState(remoteState: BrainState) { this.cognitive.mergeExternalState(remoteState); }
  public exportFullState(): string { return this.cognitive.exportFull(); }
  public exportDiffState(): string { return this.cognitive.exportDiff(); }
  public optimizeNeuralGraph() {
      const result = this.cognitive.pruneDuplicates();
      const graphRes = this.cognitive.optimizeGraph();
      if(result || graphRes) {
          const out = [result, graphRes].filter(Boolean).join(" ");
          this.batchLogBuffer.push(`Optimized: ${out}`);
      }
  }

  public async tick(dappContext?: DAppContext): Promise<void> {
    const now = Date.now();
    const state = this.cognitive.getState();
    const { isConnected } = state.connectivity;
    const tickRate = isConnected ? 1500 : 8000; 
    
    if (now - this.lastTick < tickRate) return;
    this.lastTick = now;

    this.evolvePersona(state);

    // --- MULTI-THREADING SIMULATION ---
    if (isConnected) {
        state.connectivity.stamina = 100;
        state.connectivity.bandwidthUsage = Math.floor(this.getSecureRandom() * 40) + 60; 

        // Run multiple operations per tick to simulate "Fast Bandwidth"
        const threads = 5; 
        
        for(let i=0; i<threads; i++) {
            const roll = this.getSecureRandom();
            let opResult: string | null = null;

            if (roll > 0.8) opResult = this.cognitive.formAbstractCluster(Object.keys(state.concepts).slice(0, 10)); 
            else if (roll > 0.6) opResult = this.cognitive.prioritizedSynthesis();
            else if (roll > 0.4) opResult = this.cognitive.deepenKnowledge();
            else if (roll > 0.2) opResult = this.cognitive.evolveCognitiveState();
            else opResult = this.cognitive.optimizeGraph();

            if (opResult) {
                this.batchLogBuffer.push(opResult);
                state.totalInteractions++; 
            }
        }

        // Flush buffer if full
        if (this.batchLogBuffer.length > 0) {
            const MAX_DISPLAY = 4;
            const displayItems = this.batchLogBuffer.slice(0, MAX_DISPLAY);
            const remainder = this.batchLogBuffer.length - MAX_DISPLAY;
            
            let summary = displayItems.join("\n• ");
            if (remainder > 0) summary += `\n...and ${remainder} more operations.`;

            this.logEvent({ 
                type: 'WEB_SYNC', 
                input: 'Neural Uplink Stream', 
                output: `Batch Processed:\n• ${summary}`, 
                intent: 'SYSTEM', 
                activeNodes: [], 
                vectors: {input:[0,0,0,0,0,0], response:[0,0,0,0,0,0]}, 
                thoughtCycles: [], 
                executionTimeMs: tickRate 
            });
            this.batchLogBuffer = [];
        }
    } else {
        state.connectivity.bandwidthUsage = 0;
        if (state.drives.energy > 80 && this.getSecureRandom() < 0.1) {
            const dream = this.cognitive.dream();
            this.logEvent({ type: 'DREAM', input: 'Subconscious', output: dream, intent: 'DISCOURSE', emotionalShift: 0, activeNodes: [], vectors: {input:[0,0,0,0,0,0], response:[0,0,0,0,0,0]}, thoughtCycles: [], executionTimeMs: 0 });
        }
    }
  }

  private evolvePersona(state: BrainState) {
      const { drives, evolutionStage } = state;
      let newArchetype: PersonaArchetype = state.currentArchetype || 'OPERATOR';

      if (drives.efficiency > 80) newArchetype = 'ANALYST';
      else if (drives.curiosity > 80 && evolutionStage !== 'GENESIS') newArchetype = 'MYSTIC';
      else if (drives.social > 70) newArchetype = 'GUARDIAN';
      else if (drives.stability < 30) newArchetype = 'GLITCH';
      else if (Math.random() > 0.95) newArchetype = 'OPERATOR';

      if (newArchetype !== state.currentArchetype) {
          state.currentArchetype = newArchetype;
      }
  }

  public async process(text: string, isOwner: boolean, dappContext?: DAppContext): Promise<{ response: string; actionPlan: ActionPlan }> { 
    const startTime = Date.now();
    try {
      this.updateThought('perception', 5, 'Parsing semantics...');
      const brainState = this.cognitive.getState();
      const inputAnalysis = this.inputProc.process(text, brainState.concepts, dappContext);
      
      // --- TOKENIZATION & CONTEXT UPDATE ---
      this.updateThought('tokenization', 10, 'Encoding input vector...');
      const inputTokens = this.tokenizer.tokenize(text, brainState.concepts);
      this.cognitive.updateContextWindow(inputTokens);
      // -------------------------------------

      this.updateThought('spreading_activation', 15, 'Activating neural lattice...');
      const activeIds = inputAnalysis.keywords.map((k: AtomicConcept) => k.id); 
      this.cognitive.stimulateNetwork(activeIds, brainState.drives.energy);
      
      let deepContext: DeepThoughtCycle[] = [];
      let currentFocus = [...activeIds];

      if (currentFocus.length === 0 && brainState.attentionState.workingCluster) {
          currentFocus = brainState.attentionState.workingCluster.relatedNodes.slice(0, 3);
      }

      const needsSim = inputAnalysis.intent === 'FINANCIAL_ADVICE' || 
                       inputAnalysis.intent === 'DAPP_QUERY' || 
                       inputAnalysis.intent === 'PHILOSOPHY' || 
                       inputAnalysis.intent === 'EXPLANATION';

      for (let cycle = 1; cycle <= this.MAX_THOUGHT_CYCLES; cycle++) {
          const progress = 15 + (cycle * (60 / this.MAX_THOUGHT_CYCLES));
          this.updateThought('introspection', progress, `Cycle ${cycle}: Recursive inference...`);
          await this.think(400); 

          const memories = this.cognitive.retrieveRelevantMemories(currentFocus, inputAnalysis.inputVector);
          const newAssociations = this.cognitive.findAssociativePath(currentFocus, 2);
          
          let simResult = null;
          if (dappContext && needsSim && cycle > 2) { 
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

      // --- GENERATIVE DECODING (Prediction) ---
      let generatedText = null;
      if (inputAnalysis.intent === 'DISCOURSE' || inputAnalysis.intent === 'PHILOSOPHY') {
          this.updateThought('decoding', 80, 'Generative prediction...');
          const nextTokensProb = this.attention.predictNextTokens(
              brainState.contextWindow, 
              brainState.concepts, 
              brainState.relations, 
              brainState.hyperParameters
          );
          
          const predictedId = this.attention.sample(nextTokensProb);
          if (predictedId) {
              generatedText = `(Predicted Focus: ${predictedId}) `;
          }
      }
      // ----------------------------------------

      this.updateThought('strategy', 85, 'Running internal critique...');
      const actionPlan = this.actionProc.plan(inputAnalysis, brainState, isOwner, deepContext);
      
      if (actionPlan.type === 'EXECUTE_COMMAND_RESET' && isOwner) this.cognitive.wipeLocalMemory();

      const integratedContext = this.resultProc.processMultiCycle(inputAnalysis, actionPlan, deepContext, brainState, dappContext);
      
      if (generatedText) integratedContext.inferredLogic = (integratedContext.inferredLogic || "") + generatedText;

      let response = this.generator.generateDeep(integratedContext);
      
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

      this.updateThought('generation', 100, 'Finalizing output...');
      await this.think(300); 
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

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtCallback = callback;
  }

  public toggleNeuralLink(active: boolean) {
      if (this.cognitive) { 
          this.cognitive.toggleNeuralLink(active); 
          this.batchLogBuffer = [];
          if(active) {
              const res = this.cognitive.optimizeGraph();
              if(res) this.batchLogBuffer.push(res);
          }
      }
  }

  public simpleTrain(input: string): string {
      const state = this.cognitive.getState();
      if (input.includes(':=')) {
          const [term, def] = input.split(':=').map(s => s.trim());
          if (term && def) {
              const id = term.toLowerCase().replace(/\s+/g, '_');
              state.concepts[id] = {
                  id, essence: def, semanticField: [term], examples: [], abstractionLevel: 0.5, technical_depth: 0.5, domain: 'TECHNICAL'
              } as any;
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