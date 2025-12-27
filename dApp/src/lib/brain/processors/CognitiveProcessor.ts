import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '@/lib/crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from '@/lib/knowledge/knowledge-loader';
import { BrainState, Memory, BlockchainMemory } from '../crikzling-brain-v3';

export class CognitiveProcessor {
  private state: BrainState;
  private publicClient?: PublicClient;
  private memoryContractAddress?: `0x${string}`;

  constructor(
    savedStateJson?: string, 
    publicClient?: PublicClient, 
    memoryContractAddress?: `0x${string}`
  ) {
    this.state = this.initializeState(savedStateJson);
    this.publicClient = publicClient;
    this.memoryContractAddress = memoryContractAddress;
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
        console.error("Cognitive Load Error:", e);
        return defaults;
      }
    }
    return defaults;
  }

  public getState(): BrainState {
    return this.state;
  }

  public getConcepts(): Record<string, AtomicConcept> {
    return this.state.concepts;
  }

  public async syncBlockchainMemories(): Promise<void> {
    if (!this.publicClient || !this.memoryContractAddress) return;
    
    // Throttle sync: only every 5 minutes
    if (Date.now() - this.state.lastBlockchainSync < 300000) return;

    try {
      const memories: BlockchainMemory[] = [];
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

      // Attempt to read recent history (last 5 slots)
      for (let i = 0; i < 5; i++) {
        try {
          const data = await this.publicClient.readContract({
            address: this.memoryContractAddress,
            abi: memoryABI,
            functionName: 'memoryTimeline',
            args: [BigInt(i)],
          });
          if (data && Array.isArray(data)) {
            memories.push({
              timestamp: Number(data[0]),
              ipfsCid: data[1] as string,
              conceptsCount: data[2] as bigint,
              evolutionStage: data[3] as string,
              triggerEvent: data[4] as string
            });
          }
        } catch (e) { break; }
      }
      
      this.state.blockchainMemories = memories;
      this.state.lastBlockchainSync = Date.now();
    } catch (e) {
      console.warn("Blockchain Memory Sync Failed (Non-critical)");
    }
  }

  public retrieveRelevantMemories(conceptIds: string[]): Memory[] {
    const relevant: Memory[] = [];
    
    // 1. Immediate Context
    relevant.push(...this.state.shortTermMemory.slice(-5));

    // 2. Associated Knowledge (Mid Term)
    const midTermMatches = this.state.midTermMemory.filter((m) =>
      m.concepts.some((c) => conceptIds.includes(c))
    ).slice(-3);
    relevant.push(...midTermMatches);

    // 3. Deep Storage (Long Term - High Emotion)
    const longTermMatches = this.state.longTermMemory
      .filter((m) => 
        m.emotional_weight > 0.6 || 
        m.concepts.filter((c) => conceptIds.includes(c)).length >= 2
      )
      .sort((a, b) => b.emotional_weight - a.emotional_weight)
      .slice(0, 3);
    relevant.push(...longTermMatches);

    return relevant;
  }

  public archiveMemory(
    role: 'user' | 'bot',
    content: string,
    concepts: string[],
    emotionalWeight: number,
    dappContext: any
  ) {
    const memory: Memory = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: Date.now(),
      concepts,
      emotional_weight: emotionalWeight,
      dapp_context: dappContext
    };

    this.state.shortTermMemory.push(memory);
    this.state.totalInteractions++;

    // Consolidation Logic
    if (this.state.shortTermMemory.length > 10) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }

    if (this.state.midTermMemory.length > 50) {
      const moved = this.state.midTermMemory.shift();
      // Only move significant memories to LTM
      if (moved && (moved.emotional_weight > 0.6 || moved.concepts.length > 2)) {
        this.state.longTermMemory.push(moved);
      }
    }

    // LTM Cap
    if (this.state.longTermMemory.length > 200) {
      this.state.longTermMemory.sort((a, b) => a.timestamp - b.timestamp).shift();
    }
  }

  public assimilateKnowledge(content: string): number {
    const { concepts, count } = parseExternalKnowledgeFile(content, 'TECHNICAL');
    Object.assign(this.state.concepts, concepts);
    this.state.unsavedDataCount += count;
    return count;
  }

  public wipeLocalMemory() {
    this.state.shortTermMemory = [];
    this.state.midTermMemory = [];
    this.state.longTermMemory = [];
    this.state.unsavedDataCount = 0;
    this.state.totalInteractions = 0;
  }

  public markSaved() {
    this.state.unsavedDataCount = 0;
  }
}