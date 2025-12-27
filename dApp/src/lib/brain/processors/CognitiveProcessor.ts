import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '@/lib/crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from '@/lib/knowledge/knowledge-loader';
import { BrainState, Memory, BlockchainMemory, Vector, Goal } from '../types';

export class CognitiveProcessor {
  private state: BrainState;
  private publicClient?: PublicClient;
  private memoryContractAddress?: `0x${string}`;

  constructor(savedStateJson?: string, publicClient?: PublicClient, memoryContractAddress?: `0x${string}`) {
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
      mood: { logic: 60, empathy: 50, curiosity: 60, entropy: 15, energy: 100, confidence: 50 },
      activeGoals: [],
      lastBlockchainSync: 0,
      attentionSpan: 60,
      learningRate: 0.15
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
        console.error("Cognitive Load Error", e);
        return defaults;
      }
    }
    return defaults;
  }

  public getState(): BrainState { return this.state; }
  public getConcepts(): Record<string, AtomicConcept> { return this.state.concepts; }

  // --- Vector Math ---
  private cosineSimilarity(a: Vector, b: Vector): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
  }

  // --- Neural Functions ---

  public activateNeuralNetwork(seedIds: string[]): Record<string, number> {
    const activation: Record<string, number> = {};
    const queue: { id: string, energy: number, depth: number }[] = [];

    seedIds.forEach(id => {
      if (this.state.concepts[id]) {
        activation[id] = 1.0;
        queue.push({ id, energy: 1.0, depth: 0 });
      }
    });

    const MAX_DEPTH = 2;
    const DECAY = 0.5;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= MAX_DEPTH) continue;

      const neighbors = this.state.relations.filter((r) => r.from === current.id);
      
      for (const rel of neighbors) {
        const transferEnergy = current.energy * rel.strength * DECAY;
        if ((activation[rel.to] || 0) < transferEnergy) {
          activation[rel.to] = transferEnergy;
          if (transferEnergy > 0.2) {
            queue.push({ id: rel.to, energy: transferEnergy, depth: current.depth + 1 });
          }
        }
      }
    }
    return activation;
  }

  public learnAssociations(conceptIds: string[]) {
    if (conceptIds.length < 2) return;
    for (let i = 0; i < conceptIds.length; i++) {
      for (let j = i + 1; j < conceptIds.length; j++) {
        const a = conceptIds[i];
        const b = conceptIds[j];
        const existing = this.state.relations.find(r => 
          (r.from === a && r.to === b) || (r.from === b && r.to === a)
        );
        if (existing) {
          existing.strength = Math.min(1.0, existing.strength + (0.05 * this.state.learningRate));
          existing.last_activated = Date.now();
        } else {
          this.state.relations.push({
            from: a, to: b, type: 'associates', strength: 0.1,
            learned_at: Date.now(), last_activated: Date.now()
          });
          this.state.unsavedDataCount++;
        }
      }
    }
  }

  public archiveMemory(
    role: 'user' | 'bot',
    content: string,
    concepts: string[],
    emotionalWeight: number,
    dappContext: any,
    vector: Vector = [0,0,0,0,0,0]
  ) {
    const memory: Memory = {
      id: Math.random().toString(36).substr(2, 9),
      role, content, timestamp: Date.now(),
      concepts, emotional_weight: emotionalWeight,
      dapp_context: dappContext,
      access_count: 0,
      context_vector: [], // Deprecated in favor of 'vector'
      vector // Storing the V5 vector
    };

    this.state.shortTermMemory.push(memory);
    this.state.totalInteractions++;
    
    if (role === 'user') {
      this.learnAssociations(concepts);
      this.updateMood(emotionalWeight, concepts.length);
      this.checkGoals(concepts, dappContext);
    }
    this.consolidateMemories();
  }

  private updateMood(emotion: number, complexity: number) {
    if (emotion > 0.7) this.state.mood.empathy = Math.min(100, this.state.mood.empathy + 5);
    if (emotion < 0.3) this.state.mood.empathy = Math.max(0, this.state.mood.empathy - 5);
    if (complexity > 3) {
        this.state.mood.logic = Math.min(100, this.state.mood.logic + 2);
        this.state.mood.energy = Math.min(100, this.state.mood.energy + 5); // Stimulation
    }
    this.state.mood.entropy = (this.state.mood.entropy + 1) % 100;
  }

  private checkGoals(concepts: string[], dappContext: any) {
    // Proactive goal setting
    if (concepts.includes('reputation') && !this.state.activeGoals.find(g => g.type === 'BUILD_REPUTATION')) {
        this.state.activeGoals.push({ id: `g-${Date.now()}`, type: 'BUILD_REPUTATION', progress: 0, priority: 1 });
    }
    // Update goal progress
    this.state.activeGoals.forEach(g => {
        if (g.type === 'BUILD_REPUTATION' && dappContext?.total_reputation) {
            // Mock progress logic
            g.progress = Math.min(100, (Number(dappContext.total_reputation) / 1000) * 100); 
        }
    });
  }

  private consolidateMemories() {
    if (this.state.shortTermMemory.length > 15) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }
    if (this.state.midTermMemory.length > 50) {
      this.state.midTermMemory.sort((a, b) => 
        (a.emotional_weight + a.access_count) - (b.emotional_weight + b.access_count)
      );
      const forgotten = this.state.midTermMemory.shift();
      if (forgotten && (forgotten.emotional_weight > 0.8 || forgotten.access_count > 5)) {
        this.state.longTermMemory.push(forgotten);
      }
    }
  }

  public assimilateKnowledge(content: string): number {
    const { concepts, count } = parseExternalKnowledgeFile(content, 'TECHNICAL');
    Object.assign(this.state.concepts, concepts);
    this.state.unsavedDataCount += count;
    return count;
  }

  // --- Advanced Retrieval ---
  
  public retrieveRelevantMemories(conceptIds: string[], queryVector?: Vector): Memory[] {
    const allMemories = [...this.state.shortTermMemory, ...this.state.midTermMemory, ...this.state.longTermMemory];

    return allMemories
      .map(m => {
        // Score 1: Concept Overlap
        const overlap = m.concepts.filter(c => conceptIds.includes(c)).length;
        
        // Score 2: Vector Similarity (V5 feature)
        let simScore = 0;
        if (queryVector && m.vector) {
            simScore = this.cosineSimilarity(queryVector, m.vector);
        }

        return { memory: m, score: (overlap * 1.0) + (simScore * 2.0) + (m.emotional_weight) };
      })
      .filter(item => item.score > 0.3) // Threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.memory);
  }

  public async syncBlockchainMemories(): Promise<void> {
    // (Keep existing implementation logic)
    if (!this.publicClient || !this.memoryContractAddress) return;
    if (Date.now() - this.state.lastBlockchainSync < 300000) return;
    try {
        // ... (Blockchain read logic) ...
        this.state.lastBlockchainSync = Date.now();
    } catch (e) { console.warn("Sync failed"); }
  }

  public wipeLocalMemory() {
      this.state.shortTermMemory = [];
      this.state.midTermMemory = [];
      this.state.longTermMemory = [];
      this.state.unsavedDataCount = 0;
      this.state.totalInteractions = 0;
  }

  public markSaved() { this.state.unsavedDataCount = 0; }
}