// src/lib/brain/crikzling-brain-v3.ts

import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation } from '@/lib/crikzling-atomic-knowledge';
import { InputProcessor, InputAnalysis } from './processors/InputProcessor';
import { CognitiveProcessor } from './processors/CognitiveProcessor';
import { ActionProcessor, ActionPlan } from './processors/ActionProcessor';
import { ResultProcessor } from './processors/ResultProcessor';
import { ResponseGenerator } from './processors/ResponseGenerator';
import { SimulationEngine } from './processors/SimulationEngine';
import { NarrativeModule } from './narrative-module'; // Import new module
import { BrainState, DAppContext, ThoughtProcess, Vector } from './types';

export class CrikzlingBrainV3 { 
  private cognitive: CognitiveProcessor;
  private inputProc: InputProcessor;
  private actionProc: ActionProcessor;
  private resultProc: ResultProcessor;
  private generator: ResponseGenerator;
  private simulator: SimulationEngine;
  private narrative: NarrativeModule; // Add Narrative Module
  
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
    this.narrative = new NarrativeModule(); // Initialize
  }

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtCallback = callback;
  }

  public async tick(dappContext?: DAppContext): Promise<void> {
    const now = Date.now();
    if (now - this.lastTick < 3000 || this.isDreaming) return;
    this.lastTick = now;

    const state = this.cognitive.getState();
    const mood = state.mood;
    const rng = Math.random() * 100;

    // Increased chance to dream for more "self-talk"
    if (mood.entropy > 50 && rng > 60) {
        await this.runAssociativeDreaming();
    }
    else if (mood.logic > 60 && dappContext && rng < 30) {
        this.runBackgroundSimulation(dappContext);
    }
    else if (mood.energy > 80) {
        this.cognitive.performMemoryMaintenance(); 
    }
  }

  private async runAssociativeDreaming() {
    this.isDreaming = true;
    this.updateThought('dreaming', 20, 'Navigating latent space...');

    await this.think(1500);

    const concepts = Object.values(this.cognitive.getConcepts());
    if (concepts.length < 5) {
        this.isDreaming = false;
        return;
    }

    const c1 = concepts[Math.floor(Math.random() * concepts.length)];
    const c2 = concepts[Math.floor(Math.random() * concepts.length)];

    if (c1.id !== c2.id) {
        this.updateThought('dreaming', 60, `Connecting ${c1.id} <-> ${c2.id}`);
        
        // Use Narrative Module to formulate the insight
        const tone = this.cognitive.getState().mood.entropy > 50 ? 'POETIC' : 'LOGICAL';
        const connectionPhrase = this.narrative.constructConceptChain([c1.id, c2.id], tone);

        if (Math.random() > 0.8) {
            this.pendingInsight = `Subconscious thought: ${connectionPhrase}`;
        }
    }

    await this.think(1000);
    this.isDreaming = false;
    this.updateThought(null as any, 0, '');
  }

  private runBackgroundSimulation(dappContext: DAppContext) {
    if (!dappContext) return;
    const financeVector: Vector = [1, 0, 0, 0, 0, 0.5]; 
    const result = this.simulator.runSimulation('FINANCIAL_ADVICE', dappContext, financeVector);
    
    if (result && result.outcomeValue > 50) {
        // More natural phrasing for background thoughts
        this.pendingInsight = `I've been calculating... ${result.scenario} seems viable. ${result.recommendation}`;
        this.updateThought('simulation', 100, 'Opportunity detected');
        setTimeout(() => this.updateThought(null as any, 0, ''), 2000);
    }
  }

  private calculateCognitiveLoad(complexity: number, entropy: number): number {
      const baseLoad = 1500; 
      const complexityAdd = complexity * 800; 
      const entropyDrag = entropy * 20; 
      return Math.min(8000, baseLoad + complexityAdd + entropyDrag);
  }

  public async process(
    text: string, 
    isOwner: boolean,
    dappContext?: DAppContext
  ): Promise<{ response: string; actionPlan: ActionPlan }> { 
    try {
      this.isDreaming = false;
      this.updateThought(null as any, 0, '');

      this.updateThought('vectorization', 10, 'Calculating semantic vector');
      const brainState = this.cognitive.getState();
      const inputAnalysis = this.inputProc.process(text, brainState.concepts, dappContext);
      
      const totalThinkTime = this.calculateCognitiveLoad(inputAnalysis.complexity, brainState.mood.entropy);
      const stepTime = totalThinkTime / 4; 

      await this.think(stepTime);

      this.updateThought('perception', 35, 'Navigating knowledge graph');
      const activeNodeIds = inputAnalysis.keywords.map(k => k.id);
      const activatedNetwork = this.cognitive.activateNeuralNetwork(activeNodeIds);
      const secondaryConcepts = Object.keys(activatedNetwork)
        .filter(id => !activeNodeIds.includes(id))
        .sort((a, b) => activatedNetwork[b] - activatedNetwork[a])
        .slice(0, 3);

      const allActiveIds = [...activeNodeIds, ...secondaryConcepts];
      const relevantMemories = this.cognitive.retrieveRelevantMemories(allActiveIds, inputAnalysis.inputVector);
      
      if (inputAnalysis.emotionalWeight > 0.8) {
         this.updateThought('perception', 45, 'Syncing immutable ledger...');
         await this.cognitive.syncBlockchainMemories();
      }

      await this.think(stepTime);

      this.updateThought('simulation', 65, 'Running outcome prediction');
      let simResult = null;
      if (dappContext) {
          simResult = this.simulator.runSimulation(inputAnalysis.intent, dappContext, inputAnalysis.inputVector);
      }
      
      if (simResult) await this.think(1000); 
      else await this.think(stepTime);

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

      // GENERATE RESPONSE
      let response = this.generator.generate(integratedContext);

      // Enhance response using Narrative Module for specific topics
      response = this.narrative.enhanceResponse(response, integratedContext);

      // Append pending insights from background thinking
      if (this.pendingInsight && Math.random() > 0.6) {
          response = `${response} \n\n[INSIGHT]: ${this.pendingInsight}`;
          this.pendingInsight = null;
      }

      this.cognitive.archiveMemory(
        'user', inputAnalysis.cleanedInput, allActiveIds, inputAnalysis.emotionalWeight, dappContext, inputAnalysis.inputVector 
      );
      this.cognitive.archiveMemory(
        'bot', response, allActiveIds, 0.5, dappContext, inputAnalysis.inputVector
      );

      await this.think(500);

      this.updateThought(null as any, 100, 'Complete');
      
      return { response, actionPlan }; 

    } catch (error) {
      console.error("Brain Failure:", error);
      return { 
          response: "Cognitive dissonance detected. My processors encountered a critical fault.",
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