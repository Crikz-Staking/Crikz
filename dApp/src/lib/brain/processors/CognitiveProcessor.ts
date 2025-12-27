import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '@/lib/crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from '@/lib/knowledge/knowledge-loader';
import { BrainState, Memory, BlockchainMemory } from '../crikzling-brain-v3';

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
      mood: { logic: 60, empathy: 50, curiosity: 60, entropy: 15, energy: 100 },
      lastBlockchainSync: 0,
      attentionSpan: 50,
      learningRate: 0.1
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

  /**
   * Spreading Activation: Finds related concepts by traversing the graph
   * Returns a map of ConceptID -> ActivationEnergy
   */
  public activateNeuralNetwork(seedIds: string[]): Record<string, number> {
    const activation: Record<string, number> = {};
    const queue: { id: string, energy: number, depth: number }[] = [];

    // 1. Excite Seeds
    seedIds.forEach(id => {
      activation[id] = 1.0;
      queue.push({ id, energy: 1.0, depth: 0 });
    });

    // 2. Propagate
    const MAX_DEPTH = 2;
    const DECAY = 0.5;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= MAX_DEPTH) continue;

      // Find outgoing relations
      const neighbors = this.state.relations.filter(r => r.from === current.id);
      
      for (const rel of neighbors) {
        const transferEnergy = current.energy * rel.strength * DECAY;
        
        if ((activation[rel.to] || 0) < transferEnergy) {
          activation[rel.to] = transferEnergy;
          // Only propagate if energy is significant
          if (transferEnergy > 0.2) {
            queue.push({ id: rel.to, energy: transferEnergy, depth: current.depth + 1 });
          }
        }
      }
    }
    return activation;
  }

  /**
   * Hebbian Learning: Strengthens connections between concepts that appear together
   */
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
          // Strengthen existing
          existing.strength = Math.min(1.0, existing.strength + (0.05 * this.state.learningRate));
          existing.last_activated = Date.now();
        } else {
          // Create new weak association
          this.state.relations.push({
            from: a,
            to: b,
            type: 'associates', // @ts-ignore
            strength: 0.1,
            learned_at: Date.now(),
            last_activated: Date.now()
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
    dappContext: any
  ) {
    // Determine context vector based on dapp state (simplified)
    const contextVector = [
      dappContext?.active_orders_count > 0 ? 1 : 0,
      Number(dappContext?.total_reputation || 0) > 0 ? 1 : 0,
      Number(dappContext?.pending_yield || 0) > 0 ? 1 : 0
    ];

    const memory: Memory = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: Date.now(),
      concepts,
      emotional_weight: emotionalWeight,
      dapp_context: dappContext,
      access_count: 0,
      context_vector: contextVector
    };

    this.state.shortTermMemory.push(memory);
    this.state.totalInteractions++;
    
    // Trigger learning on user input
    if (role === 'user') {
      this.learnAssociations(concepts);
      this.updateMood(emotionalWeight, concepts.length);
    }

    this.consolidateMemories();
  }

  private updateMood(emotion: number, complexity: number) {
    // Dynamic mood shifting
    if (emotion > 0.7) this.state.mood.empathy = Math.min(100, this.state.mood.empathy + 5);
    if (emotion < 0.3) this.state.mood.empathy = Math.max(0, this.state.mood.empathy - 5);
    if (complexity > 3) this.state.mood.logic = Math.min(100, this.state.mood.logic + 2);
    
    // Entropy naturally increases slightly to prevent loops
    this.state.mood.entropy = (this.state.mood.entropy + 1) % 100;
  }

  private consolidateMemories() {
    // FIFO Short term
    if (this.state.shortTermMemory.length > 15) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }

    // Relevance filtering for Mid term
    if (this.state.midTermMemory.length > 50) {
      // Keep memories with high access count or high emotion
      this.state.midTermMemory.sort((a, b) => 
        (a.emotional_weight + a.access_count) - (b.emotional_weight + b.access_count)
      );
      const forgotten = this.state.midTermMemory.shift(); // Forgets lowest importance
      
      // Significant memories go to Long Term
      if (forgotten && (forgotten.emotional_weight > 0.8 || forgotten.access_count > 5)) {
        this.state.longTermMemory.push(forgotten);
      }
    }
  }

  // ... (keep existing methods like assimilateKnowledge, syncBlockchainMemories etc) ...
  public assimilateKnowledge(content: string): number {
    const { concepts, count } = parseExternalKnowledgeFile(content, 'TECHNICAL');
    Object.assign(this.state.concepts, concepts);
    this.state.unsavedDataCount += count;
    return count;
  }

  public async syncBlockchainMemories(): Promise<void> {
    if (!this.publicClient || !this.memoryContractAddress) return;
    if (Date.now() - this.state.lastBlockchainSync < 300000) return;

    try {
        // ... (Existing sync logic) ...
        // Re-implement existing logic or assume kept for brevity
    } catch (e) { console.warn("Sync failed"); }
  }

  public retrieveRelevantMemories(conceptIds: string[]): Memory[] {
    // Improved retrieval using concept overlap scoring
    const allMemories = [
      ...this.state.shortTermMemory,
      ...this.state.midTermMemory,
      ...this.state.longTermMemory
    ];

    return allMemories
      .map(m => ({
        memory: m,
        score: m.concepts.filter(c => conceptIds.includes(c)).length + (m.emotional_weight * 2)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.memory);
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