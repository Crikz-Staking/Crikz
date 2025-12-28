import { PublicClient } from 'viem';
import { InputProcessor, InputAnalysis } from './processors/InputProcessor';
import { CognitiveProcessor } from './processors/CognitiveProcessor';
import { ActionProcessor, ActionPlan } from './processors/ActionProcessor';
import { ResultProcessor } from './processors/ResultProcessor';
import { ResponseGenerator } from './processors/ResponseGenerator';
import { SimulationEngine } from './processors/SimulationEngine';
import { NarrativeModule } from './narrative-module';
import { BrainState, DAppContext, ThoughtProcess, DeepThoughtCycle, CognitiveLogEntry, InternalDrives } from './types';
import { AtomicConcept } from '@/lib/crikzling-atomic-knowledge';

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

    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            if (parsed.history && Array.isArray(parsed.history)) {
                this.history = parsed.history;
            }
        } catch (e) {
            console.warn("Failed to restore logs");
        }
    }
  }

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtCallback = callback;
  }

  // --- NEW TRAINING METHODS ---

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

  public forceConnection(from: string, to: string, strength: number) {
      const state = this.cognitive.getState();
      const existing = state.relations.find(r => 
          (r.from === from && r.to === to) || (r.from === to && r.from === from)
      );
      
      if (existing) {
          existing.strength = strength;
          existing.last_activated = Date.now();
      } else {
          state.relations.push({
              from, to, type: 'associates', strength, 
              learned_at: Date.now(), last_activated: Date.now()
          });
      }
      state.unsavedDataCount++;
  }

  // --- END NEW METHODS ---

  public async tick(dappContext?: DAppContext): Promise<void> {
    const now = Date.now();
    if (now - this.lastTick < 5000) return;
    this.lastTick = now;

    const spontaneousThought = this.cognitive.processNeuralTick();
    const state = this.cognitive.getState();

    if (spontaneousThought) {
        this.updateThought('dreaming', 50, spontaneousThought);
        this.logEvent({
            type: 'DREAM',
            input: 'Spontaneous Activation',
            output: spontaneousThought,
            intent: 'DISCOURSE',
            emotionalShift: 0,
            activeNodes: state.attentionFocus ? [state.attentionFocus] : [],
            vectors: { input: [0,0,0,0,0,0], response: [0,0,0,0,0,0] },
            thoughtCycles: []
        });

        if (state.drives.stability > 40) {
            this.pendingInsight = spontaneousThought;
        }
        
        this.cognitive.archiveMemory('subconscious', spontaneousThought, [], 0.1, dappContext);
        await this.think(2500); 
        this.clearThought();
    } 
    else if (state.drives.efficiency > 80 && dappContext) {
        this.updateThought('simulation', 30, 'Background yield optimization...');
        const simResult = this.simulator.runSimulation('FINANCIAL_ADVICE', dappContext, [1,0,0,0,0,0]);
        if(simResult && simResult.riskLevel < 0.2) {
             this.pendingInsight = `Note: ${simResult.recommendation}`;
        }
        await this.think(1500);
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
    const startTime = Date.now();
    try {
      this.updateThought('perception', 10, 'Parsing semantics...');
      const brainState = this.cognitive.getState();
      const inputAnalysis = this.inputProc.process(text, brainState.concepts, dappContext);
      
      this.updateThought('spreading_activation', 20, 'Activating neural lattice...');
      const activeIds = inputAnalysis.keywords.map(k => k.id);
      this.cognitive.stimulateNetwork(activeIds, brainState.drives.energy);
      
      let deepContext: DeepThoughtCycle[] = [];
      let currentFocus = [...activeIds];

      if (currentFocus.length === 0 && brainState.attentionFocus) {
          currentFocus.push(brainState.attentionFocus);
      }

      for (let cycle = 1; cycle <= this.MAX_THOUGHT_CYCLES; cycle++) {
          const progress = 20 + (cycle * (60 / this.MAX_THOUGHT_CYCLES));
          this.updateThought('introspection', progress, `Cycle ${cycle}: Associative walk...`);
          
          await this.think(800 + (brainState.drives.efficiency * 5)); 

          const memories = this.cognitive.retrieveRelevantMemories(currentFocus, inputAnalysis.inputVector);
          const newAssociations = this.cognitive.findAssociativePath(currentFocus, 2);
          
          let simResult = null;
          if (dappContext && (inputAnalysis.intent === 'FINANCIAL_ADVICE' || inputAnalysis.intent === 'DAPP_QUERY')) {
              this.updateThought('simulation', progress + 5, 'Calculating probabilities...');
              simResult = this.simulator.runSimulation(inputAnalysis.intent, dappContext, inputAnalysis.inputVector);
          }

          deepContext.push({
              cycleIndex: cycle,
              focusConcepts: currentFocus,
              retrievedMemories: memories,
              newAssociations: newAssociations,
              simResult: simResult
          });

          if (newAssociations.length > 0) {
              currentFocus = newAssociations.slice(0, 3); 
          }
      }

      this.updateThought('strategy', 90, 'Formulating output...');
      const actionPlan = this.actionProc.plan(inputAnalysis, brainState, isOwner, deepContext);
      
      if (actionPlan.type === 'EXECUTE_COMMAND_RESET' && isOwner) this.cognitive.wipeLocalMemory();

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
          response += `\n\n[Cached Insight]: ${this.pendingInsight}`;
          this.pendingInsight = null;
      }

      this.cognitive.archiveMemory(
        'user', inputAnalysis.cleanedInput, activeIds, inputAnalysis.emotionalWeight, dappContext, inputAnalysis.inputVector 
      );
      this.cognitive.archiveMemory(
        'bot', response, currentFocus, 0.5, dappContext, inputAnalysis.inputVector
      );

      // Determine Result Vector based on last cycle focus or simple shift
      const outputVector = [...inputAnalysis.inputVector] as [number, number, number, number, number, number];
      // Simple shift logic for demo purposes (real logic would re-vectorize the response)
      if (inputAnalysis.intent === 'FINANCIAL_ADVICE') outputVector[0] += 0.2; 

      this.logEvent({
          type: 'INTERACTION',
          input: text,
          output: response,
          intent: inputAnalysis.intent,
          emotionalShift: inputAnalysis.emotionalWeight,
          activeNodes: [...new Set([...activeIds, ...currentFocus])],
          vectors: {
              input: inputAnalysis.inputVector,
              response: outputVector
          },
          thoughtCycles: deepContext,
          executionTimeMs: Date.now() - startTime
      });

      this.updateThought('generation', 100, 'Done');
      await this.think(400); 
      this.clearThought();
      
      return { response, actionPlan }; 

    } catch (error) {
      console.error("Brain Failure:", error);
      this.clearThought();
      return { 
          response: "Critical error in cognitive pipeline. Recalibrating...",
          actionPlan: { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 0, reasoning: 'Error Fallback' }
      };
    }
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

  public exportState(): string {
    const state = this.cognitive.getState();
    const exportData = { ...state, history: this.history };
    return JSON.stringify(exportData, (_, v) => typeof v === 'bigint' ? v.toString() : v);
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