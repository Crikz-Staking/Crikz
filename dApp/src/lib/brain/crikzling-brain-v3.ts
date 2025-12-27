import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation } from '@/lib/crikzling-atomic-knowledge';

// Import New Processors
import { InputProcessor } from './processors/InputProcessor';
import { CognitiveProcessor } from './processors/CognitiveProcessor';
import { ActionProcessor } from './processors/ActionProcessor';
import { ResultProcessor } from './processors/ResultProcessor';
import { ResponseGenerator } from './processors/ResponseGenerator';

// --- Shared Types Definitions ---
export interface Memory {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  concepts: string[];
  emotional_weight: number;
  dapp_context?: any;
}

export interface BlockchainMemory {
  timestamp: number;
  ipfsCid: string;
  conceptsCount: bigint;
  evolutionStage: string;
  triggerEvent: string;
}

export interface BrainState {
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  shortTermMemory: Memory[];
  midTermMemory: Memory[];
  longTermMemory: Memory[];
  blockchainMemories: BlockchainMemory[];
  totalInteractions: number;
  unsavedDataCount: number;
  evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  mood: {
    logic: number;
    empathy: number;
    curiosity: number;
    entropy: number;
  };
  lastBlockchainSync: number;
}

export interface DAppContext {
  user_balance?: bigint;
  active_orders_count?: number;
  total_reputation?: bigint;
  pending_yield?: bigint;
  global_fund_balance?: bigint;
  current_block?: bigint;
}

export interface ThoughtProcess {
  phase: 'analyzing' | 'retrieving' | 'planning' | 'synthesizing' | 'responding' | 'blockchain_sync';
  progress: number;
  subProcess?: string;
  focus?: string[];
}

// --- The Brain Class (Orchestrator) ---

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
    // Initialize Processors
    this.cognitive = new CognitiveProcessor(savedState, publicClient, memoryContractAddress);
    this.inputProc = new InputProcessor();
    this.actionProc = new ActionProcessor();
    this.resultProc = new ResultProcessor();
    this.generator = new ResponseGenerator();
  }

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtCallback = callback;
  }

  /**
   * Main Processing Pipeline
   */
  public async process(
    text: string, 
    isOwner: boolean,
    dappContext?: DAppContext
  ): Promise<{ response: string }> {
    try {
      // 1. INPUT PHASE
      this.updateThought('analyzing', 10, 'Deconstructing semantic input');
      await this.think(200);
      const inputAnalysis = this.inputProc.process(text, this.cognitive.getConcepts(), dappContext);

      // 2. COGNITIVE PHASE (Memory & Blockchain)
      this.updateThought('retrieving', 30, 'Accessing neural lattice');
      await this.cognitive.syncBlockchainMemories(); // Attempt sync if needed
      const relevantMemories = this.cognitive.retrieveRelevantMemories(
        inputAnalysis.keywords.map(k => k.id)
      );
      await this.think(300);

      // 3. ACTION PHASE
      this.updateThought('planning', 50, `Evaluating intent: ${inputAnalysis.intent}`);
      const brainState = this.cognitive.getState();
      const actionPlan = this.actionProc.plan(inputAnalysis, brainState, isOwner);
      
      // Execute internal brain commands immediately if needed
      if (actionPlan.type === 'EXECUTE_COMMAND_RESET' && isOwner) {
        this.cognitive.wipeLocalMemory();
      }

      // 4. RESULT/SYNTHESIS PHASE
      this.updateThought('synthesizing', 75, 'Integrating context and logic');
      const integratedContext = this.resultProc.process(
        inputAnalysis,
        actionPlan,
        relevantMemories,
        brainState,
        dappContext
      );
      await this.think(400);

      // 5. GENERATION PHASE
      this.updateThought('responding', 90, 'Formulating natural language');
      const response = this.generator.generate(integratedContext);

      // 6. MEMORY ARCHIVAL (Post-Response)
      this.cognitive.archiveMemory(
        'user', 
        inputAnalysis.cleanedInput, 
        inputAnalysis.keywords.map(k => k.id), 
        inputAnalysis.emotionalWeight, 
        dappContext
      );
      this.cognitive.archiveMemory(
        'bot', 
        response, 
        inputAnalysis.keywords.map(k => k.id), 
        0.5, 
        dappContext
      );

      this.updateThought('responding', 100, 'Transmission complete');
      setTimeout(() => this.updateThought(null as any, 0, ''), 1500);

      return { response };

    } catch (error) {
      console.error("Brain Failure:", error);
      return { response: "Cognitive dissonance detected. My processors encountered a critical fault. Please retry." };
    }
  }

  // --- Utility / Exposure Methods ---

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