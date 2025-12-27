// src/lib/brain/crikzling-brain-v3.ts

import { 
  AtomicConcept, 
  ConceptRelation,
  ATOMIC_PRIMITIVES,
  ATOMIC_RELATIONS 
} from '@/lib/crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from '@/lib/knowledge/knowledge-loader';
import { PublicClient } from 'viem';

export interface Memory {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  concepts: string[];
  emotional_weight: number;
  dapp_context?: DAppContext;
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
  phase: 'analyzing' | 'retrieving' | 'synthesizing' | 'blockchain_query' | 'integrating';
  progress: number;
  focus: string[];
  subProcess?: string;
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

const RESPONSE_TEMPLATES = {
  greeting: [
    "Hello! It's wonderful to connect with you.",
    "Hey there! How can I assist you today?",
    "Greetings! I'm here and ready to help.",
    "Hi! What's on your mind?",
  ],
  
  acknowledgment: [
    "I understand what you're saying.",
    "That makes sense to me.",
    "I see where you're coming from.",
    "Interesting point.",
  ],
  
  transition: [
    "Building on that,",
    "What's particularly fascinating is that",
    "This connects to",
    "Consider how this relates to",
    "From another angle,",
  ],
  
  uncertainty: [
    "I'm not entirely certain, but based on what I know,",
    "This is an area where I'm still learning, though",
    "My understanding is evolving on this, and currently",
    "While I can't say definitively,",
  ],
  
  conclusion: [
    "In essence,",
    "So to summarize,",
    "The key takeaway here is",
    "What this really means is",
    "Putting it all together,",
  ]
};

export class CrikzlingBrainV3 {
  private state: BrainState;
  private thoughtCallback?: (thought: ThoughtProcess | null) => void;
  private publicClient?: PublicClient;
  private memoryContractAddress?: `0x${string}`;

  constructor(
    savedState?: string,
    publicClient?: PublicClient,
    memoryContractAddress?: `0x${string}`
  ) {
    this.state = this.initializeState(savedState);
    this.publicClient = publicClient;
    this.memoryContractAddress = memoryContractAddress;
  }

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtCallback = callback;
  }

  private initializeState(savedJson?: string): BrainState {
    const knowledgeModules = loadAllKnowledgeModules();
    const defaults: BrainState = {
      concepts: { ...ATOMIC_PRIMITIVES, ...knowledgeModules.concepts },
      relations: [...ATOMIC_RELATIONS, ...knowledgeModules.relations],
      shortTermMemory: [],
      midTermMemory: [],
      longTermMemory: [],
      blockchainMemories: [],
      totalInteractions: 0,
      unsavedDataCount: 0,
      evolutionStage: 'SENTIENT',
      mood: { logic: 60, empathy: 50, curiosity: 60, entropy: 15 },
      lastBlockchainSync: 0,
    };

    if (savedJson) {
      try {
        const parsed = JSON.parse(savedJson);
        return {
          ...defaults,
          ...parsed,
          concepts: { ...defaults.concepts, ...(parsed.concepts || {}) },
          relations: [...defaults.relations, ...(parsed.relations || [])],
        };
      } catch (e) {
        console.error("Failed to parse saved state:", e);
        return defaults;
      }
    }
    return defaults;
  }

  private async syncBlockchainMemories(): Promise<void> {
    if (!this.publicClient || !this.memoryContractAddress) {
      return;
    }

    try {
      this.updateThought('blockchain_query', 10, 'Querying on-chain memory snapshots');
      
      const memories: BlockchainMemory[] = [];
      const recentIndices = [0, 1, 2, 3, 4];

      const memoryABI = [{
        inputs: [{ name: '', type: 'uint256' }],
        name: 'memoryTimeline',
        outputs: [
          { name: 'timestamp', type: 'uint256' },
          { name: 'ipfsCid', type: 'string' },
          { name: 'conceptsCount', type: 'uint256' },
          { name: 'evolutionStage', type: 'string' },
          { name: 'triggerEvent', type: 'string' }
        ],
        stateMutability: 'view',
        type: 'function'
      }] as const;

      for (const idx of recentIndices) {
        try {
          const memoryData = await this.publicClient.readContract({
            address: this.memoryContractAddress,
            abi: memoryABI,
            functionName: 'memoryTimeline',
            args: [BigInt(idx)],
          });

          if (memoryData && Array.isArray(memoryData) && memoryData.length === 5) {
            memories.push({
              timestamp: Number(memoryData[0]),
              ipfsCid: memoryData[1] as string,
              conceptsCount: memoryData[2] as bigint,
              evolutionStage: memoryData[3] as string,
              triggerEvent: memoryData[4] as string
            });
          }
        } catch (memError) {
          break;
        }
      }

      this.state.blockchainMemories = memories;
      this.state.lastBlockchainSync = Date.now();
    } catch (error) {
      console.error("Blockchain sync error:", error);
      this.state.blockchainMemories = [];
      this.state.lastBlockchainSync = Date.now();
    }
  }

  public async process(
    input: string, 
    isOwner: boolean,
    dappContext?: DAppContext
  ): Promise<{ response: string }> {
    try {
      const cleanInput = input.trim().toLowerCase();
      this.state.totalInteractions++;

      this.updateThought('analyzing', 5, 'Parsing semantic structure');
      await this.think(400, 800);
      
      const analysis = this.analyzeInput(cleanInput, dappContext);
      
      this.updateThought('analyzing', 20, `Intent: ${analysis.intent}`, analysis.keywords.map((k: AtomicConcept) => k.id));
      await this.think(300, 600);

      this.updateThought('retrieving', 35, 'Accessing memory layers');
      await this.think(500, 1000);

      const contextMemories = this.retrieveRelevantMemories(analysis.keywords.map((k: AtomicConcept) => k.id));
      
      if (Date.now() - this.state.lastBlockchainSync > 300000) {
        this.updateThought('blockchain_query', 45, 'Syncing immutable memory from chain');
        await this.syncBlockchainMemories();
        await this.think(800, 1200);
      }

      this.updateThought('integrating', 60, 'Fusing dApp state with cognitive model');
      await this.think(600, 1000);

      const integratedContext = this.integrateContexts(
        analysis,
        contextMemories,
        dappContext,
        this.state.blockchainMemories
      );

      this.updateThought('synthesizing', 80, 'Constructing human-like response');
      await this.think(800, 1500);

      const response = this.generateNaturalResponse(integratedContext, analysis);

      this.archiveMemory(
        'user',
        cleanInput,
        Date.now(),
        analysis.keywords.map((k: AtomicConcept) => k.id),
        analysis.emotionalWeight,
        dappContext
      );

      this.archiveMemory(
        'bot',
        response,
        Date.now(),
        analysis.keywords.map((k: AtomicConcept) => k.id),
        0.3,
        dappContext
      );

      this.updateThought('synthesizing', 100, 'Finalizing transmission');
      await this.think(200, 400);
      
      // Don't clear thought immediately - let it persist briefly
      setTimeout(() => {
        this.updateThought(null, 0, '');
      }, 3000);

      return { response };

    } catch (error) {
      console.error("Processing error:", error);
      this.updateThought(null, 0, '');
      return { 
        response: "I encountered a momentary cognitive disruption. Could you rephrase that?" 
      };
    }
  }

  private analyzeInput(input: string, dappContext?: DAppContext) {
    const STOP_WORDS = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'in', 'on', 'at', 'to', 
      'for', 'with', 'by', 'from', 'as', 'of', 'are', 'was', 'were'
    ]);

    const words = input.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 0);
    const keywords: AtomicConcept[] = [];

    words.forEach((word: string) => {
      if (!STOP_WORDS.has(word) && this.state.concepts[word]) {
        keywords.push(this.state.concepts[word]);
      }
    });

    if (dappContext) {
      ['order', 'reputation', 'yield', 'balance', 'stake'].forEach((term: string) => {
        if (this.state.concepts[term] && !keywords.find((k: AtomicConcept) => k.id === term)) {
          keywords.push(this.state.concepts[term]);
        }
      });
    }

    const intent = this.classifyIntent(input);
    const emotionalWeight = this.calculateEmotionalWeight(input);

    return { keywords, intent, emotionalWeight, rawInput: input };
  }

  private classifyIntent(input: string): string {
    if (input.match(/^(reset|wipe|clear)/)) return 'COMMAND';
    if (input.match(/^(save|crystallize)/)) return 'COMMAND';
    if (input.match(/^(hello|hi|hey|good morning|good day|greetings)/i)) return 'GREETING';
    if (input.includes('?') || input.match(/^(what|why|how|when|where|who)/)) return 'QUESTION';
    if (input.match(/^(explain|define|tell me about)/)) return 'EXPLANATION';
    if (input.match(/(order|stake|yield|reputation|balance)/)) return 'DAPP_QUERY';
    if (input.length > 50) return 'DISCOURSE';
    return 'STATEMENT';
  }

  private calculateEmotionalWeight(input: string): number {
    let weight = 0;
    if (input.includes('!')) weight += 0.2;
    if (input.includes('?')) weight += 0.1;
    if (input.match(/(love|great|amazing|wonderful|good)/)) weight += 0.3;
    if (input.match(/(bad|terrible|hate|angry)/)) weight -= 0.3;
    return Math.max(0, Math.min(1, weight));
  }

  private retrieveRelevantMemories(conceptIds: string[]): Memory[] {
    const relevant: Memory[] = [];

    relevant.push(...this.state.shortTermMemory.slice(-5));

    const midTermMatches = this.state.midTermMemory.filter((m: Memory) =>
      m.concepts.some((c: string) => conceptIds.includes(c))
    ).slice(-3);
    relevant.push(...midTermMatches);

    const longTermMatches = this.state.longTermMemory
      .filter((m: Memory) => 
        m.emotional_weight > 0.5 || 
        m.concepts.filter((c: string) => conceptIds.includes(c)).length >= 2
      )
      .sort((a: Memory, b: Memory) => b.timestamp - a.timestamp)
      .slice(0, 3);
    relevant.push(...longTermMatches);

    return relevant;
  }

  private integrateContexts(
    analysis: any,
    memories: Memory[],
    dappContext?: DAppContext,
    blockchainMemories?: BlockchainMemory[]
  ) {
    return {
      currentInput: analysis.rawInput,
      intent: analysis.intent,
      keywords: analysis.keywords,
      recentMemories: memories.slice(-3),
      dappState: dappContext ? {
        hasActiveOrders: (dappContext.active_orders_count ?? 0) > 0,
        reputationLevel: dappContext.total_reputation,
        yieldAvailable: dappContext.pending_yield,
        fundBalance: dappContext.global_fund_balance
      } : null,
      blockchainHistory: blockchainMemories?.slice(-2) || [],
      conversationDepth: this.state.totalInteractions
    };
  }

  private generateNaturalResponse(context: any, analysis: any): string {
    const { intent, keywords, recentMemories, dappState, blockchainHistory } = context;

    if (intent === 'GREETING') {
      const greeting = this.selectRandom(RESPONSE_TEMPLATES.greeting);
      if (dappState?.hasActiveOrders) {
        return `${greeting} I see you have active production orders. How can I help you today?`;
      }
      return greeting;
    }

    if (intent === 'COMMAND') {
      return this.handleCommand(analysis.rawInput);
    }

    if (intent === 'DAPP_QUERY' && dappState) {
      return this.generateDAppResponse(analysis.rawInput, dappState);
    }

    let response = '';

    if (intent === 'QUESTION') {
      response += this.selectRandom([
        "That's an interesting question. ",
        "Let me think about that. ",
        "Good question! ",
        "I'm glad you asked. "
      ]);
    } else if (intent === 'STATEMENT') {
      response += this.selectRandom(RESPONSE_TEMPLATES.acknowledgment) + ' ';
    }

    if (keywords.length > 0) {
      const mainConcept = keywords[0];
      response += this.selectRandom(RESPONSE_TEMPLATES.transition) + ' ';
      response += `${mainConcept.id} ${mainConcept.essence.toLowerCase()}. `;

      if (keywords.length > 1) {
        const relatedConcept = keywords[1];
        response += `This relates to ${relatedConcept.id}, which ${relatedConcept.essence.toLowerCase()}. `;
      }
    } else {
      // Fallback for no keywords found
      response += "I'm processing your message, though I don't have specific knowledge nodes activated for those exact terms. ";
    }

    if (recentMemories.length > 0 && Math.random() > 0.7) {
      const lastUserMemory = [...recentMemories].reverse().find((m: Memory) => m.role === 'user');
      if (lastUserMemory && lastUserMemory.concepts.length > 0) {
        response += `Earlier you mentioned ${lastUserMemory.concepts[0]}, which connects to what we're discussing now. `;
      }
    }

    if (blockchainHistory.length > 0 && Math.random() > 0.8) {
      const latestMemory = blockchainHistory[blockchainHistory.length - 1];
      response += `My crystallized memory from ${new Date(latestMemory.timestamp * 1000).toLocaleDateString()} shows I was at ${latestMemory.evolutionStage} stage. `;
    }

    response += this.selectRandom(RESPONSE_TEMPLATES.conclusion) + ' ';
    if (keywords.length > 0) {
      response += `${keywords[0].id} is fundamental to understanding this concept.`;
    } else {
      response += "these ideas are interconnected in meaningful ways.";
    }

    return response;
  }

  private generateDAppResponse(input: string, dappState: any): string {
    const responses = [];

    if (input.includes('order') || input.includes('stake')) {
      if (dappState.hasActiveOrders) {
        responses.push("You currently have active production orders running.");
      } else {
        responses.push("You don't have any active orders at the moment. Would you like to create one?");
      }
    }

    if (input.includes('reputation')) {
      if (dappState.reputationLevel) {
        responses.push(`Your total reputation stands at ${dappState.reputationLevel.toString()} REP.`);
      } else {
        responses.push("You haven't earned any reputation yet. Creating orders will build your reputation over time.");
      }
    }

    if (input.includes('yield') || input.includes('earn')) {
      if (dappState.yieldAvailable && dappState.yieldAvailable > 0n) {
        responses.push(`You have pending yield available to claim!`);
      } else {
        responses.push("No yield is currently available. Yield accumulates as the production fund grows.");
      }
    }

    if (input.includes('fund') || input.includes('pool')) {
      if (dappState.fundBalance) {
        responses.push(`The global production fund currently holds substantial reserves.`);
      }
    }

    if (responses.length === 0) {
      return "I can help you understand your dApp interactions. Ask me about your orders, reputation, or pending yield.";
    }

    return responses.join(' ');
  }

  private handleCommand(input: string): string {
    if (input.match(/reset|wipe|clear/)) {
      return "Neural reset acknowledged. All non-permanent memories will be cleared. Blockchain memories remain immutable.";
    }
    if (input.match(/save|crystallize/)) {
      return "Preparing to crystallize current state to the Binance Smart Chain. This will create a permanent snapshot.";
    }
    return "Command acknowledged.";
  }

  private archiveMemory(
    role: 'user' | 'bot',
    content: string,
    timestamp: number,
    concepts: string[],
    emotionalWeight: number,
    dappContext?: DAppContext
  ) {
    const memory: Memory = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp,
      concepts,
      emotional_weight: emotionalWeight,
      dapp_context: dappContext
    };

    this.state.shortTermMemory.push(memory);
    
    if (this.state.shortTermMemory.length > 10) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }

    if (this.state.midTermMemory.length > 50) {
      const moved = this.state.midTermMemory.shift();
      if (moved && (moved.emotional_weight > 0.5 || moved.concepts.length > 2)) {
        this.state.longTermMemory.push(moved);
      }
    }

    if (this.state.longTermMemory.length > 100) {
      this.state.longTermMemory = this.state.longTermMemory
        .sort((a: Memory, b: Memory) => b.emotional_weight - a.emotional_weight)
        .slice(0, 100);
    }
  }

  private updateThought(
    phase: ThoughtProcess['phase'] | null,
    progress: number,
    subProcess: string,
    focus: string[] = []
  ) {
    if (this.thoughtCallback) {
      this.thoughtCallback(phase ? { phase, progress, subProcess, focus } : null);
    }
  }

  private async think(minMs: number, maxMs: number): Promise<void> {
    const duration = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  public wipe() {
    this.state = this.initializeState();
  }

  public exportState(): string {
    return JSON.stringify(this.state);
  }

  public needsCrystallization(): boolean {
    return this.state.unsavedDataCount >= 5;
  }

  public clearUnsavedCount() {
    this.state.unsavedDataCount = 0;
  }

  public getState(): BrainState {
    return this.state;
  }

  public getStats() {
    return {
      nodes: Object.keys(this.state.concepts).length,
      relations: this.state.relations.length,
      stage: this.state.evolutionStage,
      mood: this.state.mood,
      unsaved: this.state.unsavedDataCount,
      memories: {
        short: this.state.shortTermMemory.length,
        mid: this.state.midTermMemory.length,
        long: this.state.longTermMemory.length,
        blockchain: this.state.blockchainMemories.length
      },
      interactions: this.state.totalInteractions,
      lastBlockchainSync: this.state.lastBlockchainSync
    };
  }

  public assimilateFile(content: string): number {
    const { concepts, count } = parseExternalKnowledgeFile(content, 'TECHNICAL');
    Object.assign(this.state.concepts, concepts);
    this.state.unsavedDataCount += count;
    return count;
  }
}