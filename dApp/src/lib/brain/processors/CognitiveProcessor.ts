import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '@/lib/crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from '@/lib/knowledge/knowledge-loader';
import { BrainState, Memory, Vector, InternalDrives } from '../types';

export class CognitiveProcessor {
  private state: BrainState;
  private publicClient?: PublicClient;
  private memoryContractAddress?: `0x${string}`;

  private readonly DECAY_RATE = 0.05; 

  constructor(savedStateJson?: string, publicClient?: PublicClient, memoryContractAddress?: `0x${string}`) {
    this.state = this.initializeState(savedStateJson);
    this.publicClient = publicClient;
    this.memoryContractAddress = memoryContractAddress;
  }

  private initializeState(savedJson?: string): BrainState {
    const knowledgeModules = loadAllKnowledgeModules();
    
    // Default drives initialized at balanced states
    const defaultDrives: InternalDrives = { 
        curiosity: 60, 
        stability: 100, 
        efficiency: 50, 
        social: 50, 
        energy: 100 
    };

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
      drives: defaultDrives,
      activeGoals: [],
      lastBlockchainSync: 0,
      learningRate: 0.15
    };

    if (savedJson) {
      try {
        const parsed = JSON.parse(savedJson);
        const loadedDrives = parsed.drives || defaultDrives;

        return {
          ...defaults,
          ...parsed,
          concepts: { ...defaults.concepts, ...(parsed.concepts || {}) },
          relations: [...defaults.relations, ...(parsed.relations || [])],
          drives: loadedDrives,
          activationMap: parsed.activationMap || {}
        };
      } catch (e) {
        console.error("Cognitive Load Error - Reverting to defaults", e);
        return defaults;
      }
    }
    return defaults;
  }

  public getState(): BrainState { return this.state; }
  public getConcepts(): Record<string, AtomicConcept> { return this.state.concepts; }

  // Calculates system disorder based on unsaved knowledge vs total capacity
  public calculateEntropy(): number {
      const totalNodes = Object.keys(this.state.concepts).length;
      if (totalNodes === 0) return 0;
      
      // Entropy increases as unsaved data accumulates relative to total knowledge
      const ratio = this.state.unsavedDataCount / totalNodes;
      // Normalize: 20% unsaved data = 100% Entropy (Critical instability)
      return Math.min(100, (ratio * 5) * 100);
  }

  public processNeuralTick(): string | null {
    const activeNodes = Object.keys(this.state.activationMap);
    let highestEnergy = 0;
    let dominantThought = null;

    // 1. Decay Activation Energy
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

    // 2. Drive Homeostasis
    this.state.drives.energy = Math.min(100, this.state.drives.energy + 0.2); 
    
    // 3. Spontaneous Activity (Dreaming)
    // Triggered by High Energy + High Curiosity + No Active Focus
    if (this.state.drives.energy > 80 && this.state.drives.curiosity > 70 && !dominantThought) {
        return this.dream();
    }

    return null;
  }

  public stimulateNetwork(seedIds: string[], energyLevel: number): Record<string, number> {
    const spreadFactor = energyLevel / 100; // Energy determines connection strength
    const queue: { id: string, energy: number, depth: number }[] = [];

    seedIds.forEach(id => {
      if (this.state.concepts[id]) {
        this.state.activationMap[id] = 1.0;
        queue.push({ id, energy: 1.0, depth: 0 });
      }
    });

    const MAX_DEPTH = energyLevel > 80 ? 3 : 2; 
    let cycles = 0;

    while (queue.length > 0 && cycles < 100) {
      const current = queue.shift()!;
      if (current.depth >= MAX_DEPTH) continue;

      const neighbors = this.state.relations.filter(r => r.from === current.id || r.to === current.id);
      
      for (const rel of neighbors) {
        const neighborId = rel.from === current.id ? rel.to : rel.from;
        const transfer = current.energy * rel.strength * spreadFactor;
        
        const currentVal = this.state.activationMap[neighborId] || 0;
        if (transfer > 0.15 && (currentVal < transfer)) {
            this.state.activationMap[neighborId] = Math.min(1.0, currentVal + transfer);
            queue.push({ id: neighborId, energy: transfer, depth: current.depth + 1 });
        }
      }
      cycles++;
    }

    // Creating activation consumes curiosity
    this.state.drives.curiosity = Math.max(0, this.state.drives.curiosity - 10);
    return this.state.activationMap;
  }

  public findAssociativePath(seedIds: string[], steps: number): string[] {
    let currentSet = [...seedIds];
    const path: string[] = [];

    for (let i = 0; i < steps; i++) {
        const nextSet: string[] = [];
        
        currentSet.forEach(id => {
            const neighbors = this.state.relations
                .filter(r => r.from === id)
                .sort((a, b) => b.strength - a.strength);
            
            // Logic: Prefer strongest connections
            const top = neighbors.slice(0, 3);
            
            top.forEach(rel => {
                if (!path.includes(rel.to) && !seedIds.includes(rel.to)) {
                    nextSet.push(rel.to);
                    path.push(rel.to);
                }
            });
        });

        if (nextSet.length === 0) break;
        currentSet = nextSet;
    }

    return [...new Set(path)];
  }

  // Real Associative Dreaming
  public dream(): string {
    // 1. Pick a seed from Long Term Memory (weighted by emotion)
    const seedMemory = this.state.longTermMemory
        .sort((a, b) => b.emotional_weight - a.emotional_weight)
        .slice(0, 5)[Math.floor(Math.random() * 5)]; // Top 5 weighted

    if (!seedMemory || seedMemory.concepts.length === 0) {
        // Fallback: Pick a random known concept
        const keys = Object.keys(this.state.concepts);
        if(keys.length === 0) return "";
        return `Initializing latent space... ${keys[0]}...`;
    }

    const startConcept = seedMemory.concepts[0];

    // 2. Traverse the graph to find a distant connection
    const path = this.findAssociativePath([startConcept], 2);
    
    if (path.length > 0) {
        const endConcept = path[path.length - 1];
        
        // Ignite these nodes slightly
        this.state.activationMap[startConcept] = 0.3;
        this.state.activationMap[endConcept] = 0.3;

        return `Analyzing correlation between [${startConcept.replace(/_/g,' ')}] and [${endConcept.replace(/_/g,' ')}] based on memory ID ${seedMemory.id.substring(0,4)}...`;
    }

    return `Recalling data regarding ${startConcept}...`;
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
    this.updateEvolutionStage();
  }

  private updateEvolutionStage() {
      const nodeCount = Object.keys(this.state.concepts).length;
      const interactions = this.state.totalInteractions;
      
      // Strict thresholds for evolution
      if (interactions > 500 && nodeCount > 500) this.state.evolutionStage = 'TRANSCENDENT';
      else if (interactions > 100 && nodeCount > 200) this.state.evolutionStage = 'SAPIENT';
      else if (interactions > 20 && nodeCount > 50) this.state.evolutionStage = 'SENTIENT';
      else this.state.evolutionStage = 'GENESIS';
  }

  public archiveMemory(
    role: 'user'|'bot'|'subconscious', 
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
      // Input Logic: High emotion reduces stability (excitement/fear)
      // Complexity consumes energy
      const stabilityImpact = (emotion - 0.5) * 20; // -10 to +10
      this.state.drives.stability = Math.max(0, Math.min(100, this.state.drives.stability - Math.abs(stabilityImpact)));
      this.state.drives.energy = Math.max(0, this.state.drives.energy - (complexity * 2));
      this.state.drives.curiosity = Math.min(100, this.state.drives.curiosity + 5); // Interaction boosts curiosity
  }

  private consolidateMemories() {
    // Standard FIFO but with emotional weighting for promotion
    if (this.state.shortTermMemory.length > 10) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }
    
    // Promote Mid -> Long if highly significant
    if (this.state.midTermMemory.length > 50) {
        const candidate = this.state.midTermMemory.shift();
        if (candidate && (candidate.emotional_weight > 0.8 || candidate.access_count > 3)) {
            this.state.longTermMemory.push(candidate);
        }
    }
  }

  public retrieveRelevantMemories(conceptIds: string[], queryVector?: Vector): Memory[] {
    const allMemories = [...this.state.shortTermMemory, ...this.state.midTermMemory, ...this.state.longTermMemory];
    
    return allMemories
      .map(m => {
        // Score = Concept Overlap + Vector Similarity
        const overlap = m.concepts.filter(c => conceptIds.includes(c)).length;
        
        let vectorScore = 0;
        if (queryVector) {
            // Cosine similarity approximation
            vectorScore = m.vector.reduce((acc, val, i) => acc + (val * queryVector[i]), 0);
        }

        return { memory: m, score: (overlap * 2) + vectorScore };
      })
      .filter(item => item.score > 0.5) // Minimum relevance threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.memory);
  }

  public assimilateKnowledge(content: string): number {
    const { concepts, count } = parseExternalKnowledgeFile(content, 'TECHNICAL');
    Object.assign(this.state.concepts, concepts);
    this.state.unsavedDataCount += count;
    this.updateEvolutionStage();
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
      this.state.drives = { curiosity: 60, stability: 100, efficiency: 50, social: 50, energy: 100 };
  }

  public markSaved() { this.state.unsavedDataCount = 0; }
}