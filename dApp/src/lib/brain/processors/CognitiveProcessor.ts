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
      evolutionStage: 'GENESIS',
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
          // Merge learned concepts with defaults to ensure upgrades don't break state
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

  // --- Vector Math (V4 Upgrade) ---
  
  private cosineSimilarity(a: Vector, b: Vector): number {
    if (!a || !b) return 0;
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

    const MAX_DEPTH = 3; // Increased depth for V4
    const DECAY = 0.6;   // Energy retention

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= MAX_DEPTH) continue;

      const neighbors = this.state.relations.filter((r) => r.from === current.id);
      
      for (const rel of neighbors) {
        const transferEnergy = current.energy * rel.strength * DECAY;
        
        // Accumulate energy
        const existing = activation[rel.to] || 0;
        if (existing < transferEnergy) {
          activation[rel.to] = transferEnergy;
          
          // Only propagate if signal is strong enough
          if (transferEnergy > 0.15) {
            queue.push({ id: rel.to, energy: transferEnergy, depth: current.depth + 1 });
          }
        }
      }
    }
    return activation;
  }

  public learnAssociations(conceptIds: string[]) {
    if (conceptIds.length < 2) return;
    
    // Hebbian Learning: Neurons that fire together, wire together
    for (let i = 0; i < conceptIds.length; i++) {
      for (let j = i + 1; j < conceptIds.length; j++) {
        const a = conceptIds[i];
        const b = conceptIds[j];
        
        const existing = this.state.relations.find(r => 
          (r.from === a && r.to === b) || (r.from === b && r.to === a)
        );

        if (existing) {
          // Strengthen existing connection
          existing.strength = Math.min(1.0, existing.strength + (0.05 * this.state.learningRate));
          existing.last_activated = Date.now();
        } else {
          // Create new synaptic link
          this.state.relations.push({
            from: a, to: b, type: 'associates', strength: 0.1,
            learned_at: Date.now(), last_activated: Date.now()
          });
          this.state.unsavedDataCount++;
        }
      }
    }
    
    this.checkEvolution();
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

  // --- Maintenance & Dreaming (V4 Features) ---

  public performMemoryMaintenance() {
    const now = Date.now();
    const HOUR = 3600 * 1000;

    // 1. Decay Short Term Memory
    this.state.shortTermMemory = this.state.shortTermMemory.filter(m => {
        // If older than 1 hour and low importance, forget it
        if (now - m.timestamp > HOUR && m.emotional_weight < 0.3) return false;
        return true;
    });

    // 2. Prune Weak Relations
    if (this.state.relations.length > 500) {
        this.state.relations = this.state.relations.filter(r => r.strength > 0.15);
    }

    // 3. Regulate Mood (Homeostasis)
    // Slowly return to baseline
    this.state.mood.energy = Math.min(100, this.state.mood.energy + 1); // Recover energy
    this.state.mood.entropy = Math.max(10, this.state.mood.entropy - 1); // Reduce chaos
  }

  private checkEvolution() {
      const nodeCount = Object.keys(this.state.concepts).length;
      const edgeCount = this.state.relations.length;
      const interactions = this.state.totalInteractions;

      if (interactions > 500 && nodeCount > 500) this.state.evolutionStage = 'TRANSCENDENT';
      else if (interactions > 100 && nodeCount > 200) this.state.evolutionStage = 'SAPIENT';
      else if (interactions > 20 && nodeCount > 50) this.state.evolutionStage = 'SENTIENT';
      else this.state.evolutionStage = 'GENESIS';
  }

  private updateMood(emotion: number, complexity: number) {
    if (emotion > 0.7) this.state.mood.empathy = Math.min(100, this.state.mood.empathy + 5);
    if (emotion < 0.3) this.state.mood.empathy = Math.max(0, this.state.mood.empathy - 5);
    if (complexity > 3) {
        this.state.mood.logic = Math.min(100, this.state.mood.logic + 2);
        this.state.mood.energy = Math.max(0, this.state.mood.energy - 2); // Thinking costs energy
    }
    this.state.mood.entropy = (this.state.mood.entropy + 2) % 100; // Interaction increases entropy
  }

  private checkGoals(concepts: string[], dappContext: any) {
    // Proactive goal setting
    if (concepts.includes('reputation') && !this.state.activeGoals.find(g => g.type === 'BUILD_REPUTATION')) {
        this.state.activeGoals.push({ id: `g-${Date.now()}`, type: 'BUILD_REPUTATION', progress: 0, priority: 1 });
    }
    
    // Update goal progress
    this.state.activeGoals.forEach(g => {
        if (g.type === 'BUILD_REPUTATION' && dappContext?.total_reputation) {
            // Logic: 1000 reputation = 100% goal
            g.progress = Math.min(100, (Number(dappContext.total_reputation) / 1000) * 100); 
        }
    });
  }

  private consolidateMemories() {
    // Move from Short to Mid
    if (this.state.shortTermMemory.length > 15) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }
    // Move from Mid to Long
    if (this.state.midTermMemory.length > 50) {
      // Sort by importance (Emotion + Frequency)
      this.state.midTermMemory.sort((a, b) => 
        (a.emotional_weight + a.access_count) - (b.emotional_weight + b.access_count)
      );
      const forgotten = this.state.midTermMemory.shift();
      
      // Only keep significant memories in Long Term
      if (forgotten && (forgotten.emotional_weight > 0.7 || forgotten.access_count > 3)) {
        this.state.longTermMemory.push(forgotten);
      }
    }
  }

  public assimilateKnowledge(content: string): number {
    const { concepts, count } = parseExternalKnowledgeFile(content, 'TECHNICAL');
    Object.assign(this.state.concepts, concepts);
    this.state.unsavedDataCount += count;
    this.checkEvolution();
    return count;
  }

  // --- Advanced Retrieval ---
  
  public retrieveRelevantMemories(conceptIds: string[], queryVector?: Vector): Memory[] {
    const allMemories = [...this.state.shortTermMemory, ...this.state.midTermMemory, ...this.state.longTermMemory];

    return allMemories
      .map(m => {
        // Score 1: Concept Overlap (Exact Keyword Match)
        const overlap = m.concepts.filter(c => conceptIds.includes(c)).length;
        
        // Score 2: Vector Similarity (Semantic Meaning)
        let simScore = 0;
        if (queryVector && m.vector) {
            simScore = this.cosineSimilarity(queryVector, m.vector);
        }

        // Score 3: Recency Boost (Short term memories are more relevant usually)
        const age = Date.now() - m.timestamp;
        const recencyBoost = age < 60000 ? 0.5 : 0;

        return { 
            memory: m, 
            score: (overlap * 1.5) + (simScore * 2.5) + (m.emotional_weight) + recencyBoost
        };
      })
      .filter(item => item.score > 0.4) // Minimum relevance threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.memory);
  }

  public async syncBlockchainMemories(): Promise<void> {
    if (!this.publicClient || !this.memoryContractAddress) return;
    if (Date.now() - this.state.lastBlockchainSync < 300000) return; // 5 min cooldown
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
  
        // Fetch last 5 crystallized memories
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
    } catch (e) { console.warn("Sync failed"); }
  }

  public wipeLocalMemory() {
      this.state.shortTermMemory = [];
      this.state.midTermMemory = [];
      this.state.longTermMemory = [];
      this.state.unsavedDataCount = 0;
      this.state.totalInteractions = 0;
      this.state.evolutionStage = 'GENESIS';
  }

  public markSaved() { this.state.unsavedDataCount = 0; }
}