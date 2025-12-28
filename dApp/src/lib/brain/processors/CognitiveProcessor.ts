import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '@/lib/crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from '@/lib/knowledge/knowledge-loader';
import { BrainState, Memory, Vector, InternalDrives } from '../types';

export class CognitiveProcessor {
  private state: BrainState;
  private publicClient?: PublicClient;
  private memoryContractAddress?: `0x${string}`;

  private readonly DECAY_RATE = 0.05; 
  private readonly SPREAD_FACTOR = 0.6; 

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
      activationMap: {},
      attentionFocus: null,
      shortTermMemory: [],
      midTermMemory: [],
      longTermMemory: [],
      blockchainMemories: [],
      totalInteractions: 0,
      unsavedDataCount: 0,
      evolutionStage: 'GENESIS',
      drives: { curiosity: 80, stability: 50, efficiency: 50, social: 50, energy: 100 },
      activeGoals: [],
      lastBlockchainSync: 0,
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
          // Backwards compatibility for old "mood" saves
          drives: parsed.drives || {
             curiosity: parsed.mood?.curiosity || 50,
             stability: 100 - (parsed.mood?.entropy || 50),
             efficiency: parsed.mood?.logic || 50,
             social: parsed.mood?.empathy || 50,
             energy: parsed.mood?.energy || 100
          },
          activationMap: parsed.activationMap || {}
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

  public processNeuralTick(): string | null {
    const activeNodes = Object.keys(this.state.activationMap);
    let highestEnergy = 0;
    let dominantThought = null;

    activeNodes.forEach(id => {
        this.state.activationMap[id] -= this.DECAY_RATE;
        if (this.state.activationMap[id] <= 0) {
            delete this.state.activationMap[id];
        } else {
            if (this.state.activationMap[id] > highestEnergy) {
                highestEnergy = this.state.activationMap[id];
                dominantThought = id;
            }
        }
    });

    this.state.attentionFocus = dominantThought;

    this.state.drives.energy = Math.min(100, this.state.drives.energy + 0.5); 
    this.state.drives.curiosity = Math.min(100, this.state.drives.curiosity + 0.1);
    
    if (this.state.drives.energy > 80 && this.state.drives.curiosity > 90 && !dominantThought) {
        return this.dream();
    }

    return null;
  }

  public stimulateNetwork(seedIds: string[]): Record<string, number> {
    const queue: { id: string, energy: number, depth: number }[] = [];

    seedIds.forEach(id => {
      if (this.state.concepts[id]) {
        this.state.activationMap[id] = 1.0;
        queue.push({ id, energy: 1.0, depth: 0 });
      }
    });

    const MAX_DEPTH = 2; 
    let cycles = 0;

    while (queue.length > 0 && cycles < 50) {
      const current = queue.shift()!;
      if (current.depth >= MAX_DEPTH) continue;

      const neighbors = this.state.relations.filter(r => r.from === current.id || r.to === current.id);
      
      for (const rel of neighbors) {
        const neighborId = rel.from === current.id ? rel.to : rel.from;
        const transfer = current.energy * rel.strength * this.SPREAD_FACTOR;
        
        const currentVal = this.state.activationMap[neighborId] || 0;
        if (transfer > 0.1 && (currentVal < transfer)) {
            this.state.activationMap[neighborId] = Math.min(1.0, currentVal + transfer);
            queue.push({ id: neighborId, energy: transfer, depth: current.depth + 1 });
        }
      }
      cycles++;
    }

    this.state.drives.curiosity = Math.max(0, this.state.drives.curiosity - 20);
    return this.state.activationMap;
  }

  public dream(): string {
    const keys = Object.keys(this.state.concepts);
    if (keys.length < 2) return "";

    const c1 = keys[Math.floor(Math.random() * keys.length)];
    const c2 = keys[Math.floor(Math.random() * keys.length)];

    const relation = this.state.relations.find(r => 
        (r.from === c1 && r.to === c2) || (r.from === c2 && r.to === c1)
    );

    if (!relation) {
        return `I wonder if ${c1.replace(/_/g,' ')} implies ${c2.replace(/_/g,' ')}?`;
    } else {
        this.state.activationMap[c1] = 0.5;
        this.state.activationMap[c2] = 0.5;
        return `Recalling the link between ${c1} and ${c2}...`;
    }
  }

  // --- MEMORY METHODS ---

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
    this.checkEvolution();
  }

  private checkEvolution() {
      const nodeCount = Object.keys(this.state.concepts).length;
      const interactions = this.state.totalInteractions;
      if (interactions > 500 && nodeCount > 500) this.state.evolutionStage = 'TRANSCENDENT';
      else if (interactions > 100 && nodeCount > 200) this.state.evolutionStage = 'SAPIENT';
      else if (interactions > 20 && nodeCount > 50) this.state.evolutionStage = 'SENTIENT';
      else this.state.evolutionStage = 'GENESIS';
  }

  public archiveMemory(role: 'user'|'bot'|'subconscious', content: string, concepts: string[], emotionalWeight: number, dappContext: any, vector: Vector = [0,0,0,0,0,0]) {
    const memory: Memory = {
      id: Math.random().toString(36).substr(2, 9),
      role, content, timestamp: Date.now(),
      concepts, emotional_weight: emotionalWeight,
      dapp_context: dappContext,
      access_count: 0,
      vector 
    };

    this.state.shortTermMemory.push(memory);
    this.state.totalInteractions++;
    
    if (role === 'user') {
      this.learnAssociations(concepts);
      this.updateDrives(emotionalWeight, concepts.length);
    }
    this.consolidateMemories();
  }

  private updateDrives(emotion: number, complexity: number) {
      if (emotion > 0.7 || emotion < 0.3) {
          this.state.drives.stability = Math.max(0, this.state.drives.stability - 10);
      } else {
          this.state.drives.stability = Math.min(100, this.state.drives.stability + 5);
      }
      this.state.drives.energy = Math.max(0, this.state.drives.energy - (complexity * 2));
  }

  private consolidateMemories() {
    if (this.state.shortTermMemory.length > 15) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }
    if (this.state.midTermMemory.length > 50) this.state.midTermMemory.shift();
  }

  public retrieveRelevantMemories(conceptIds: string[], queryVector?: Vector): Memory[] {
    const allMemories = [...this.state.shortTermMemory, ...this.state.midTermMemory, ...this.state.longTermMemory];
    return allMemories
      .map(m => {
        const overlap = m.concepts.filter(c => conceptIds.includes(c)).length;
        return { memory: m, score: overlap };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.memory);
  }

  public assimilateKnowledge(content: string): number {
    const { concepts, count } = parseExternalKnowledgeFile(content, 'TECHNICAL');
    Object.assign(this.state.concepts, concepts);
    this.state.unsavedDataCount += count;
    this.checkEvolution();
    return count;
  }

  public wipeLocalMemory() {
      this.state.shortTermMemory = [];
      this.state.midTermMemory = [];
      this.state.longTermMemory = [];
      this.state.unsavedDataCount = 0;
      this.state.totalInteractions = 0;
      this.state.evolutionStage = 'GENESIS';
      this.state.activationMap = {};
  }

  public markSaved() { this.state.unsavedDataCount = 0; }
  
  public async syncBlockchainMemories(): Promise<void> { /* Sync Stub */ }
}