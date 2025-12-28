import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '@/lib/crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from '@/lib/knowledge/knowledge-loader';
import { BrainState, Memory, Vector, InternalDrives } from '../types';

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
      learningRate: 0.15,
      connectivity: {
        isConnected: false,
        bandwidthUsage: 0,
        stamina: 100,
        lastWebSync: 0
      }
    };

    if (savedJson) {
      try {
        const parsed = JSON.parse(savedJson || '{}');
        const loadedDrives = parsed.drives || defaultDrives;

        return {
          ...defaults,
          ...parsed,
          concepts: { ...defaults.concepts, ...(parsed.concepts || {}) },
          relations: [...defaults.relations, ...(parsed.relations || [])],
          drives: loadedDrives,
          activationMap: parsed.activationMap || {},
          connectivity: parsed.connectivity || defaults.connectivity 
        };
      } catch (e) {
        console.error("Cognitive Load Error - Reverting to defaults", e);
        return defaults;
      }
    }
    return defaults;
  }

  public getState(): BrainState { return this.state; }
  
  private getSecureRandom(): number {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] / (0xFFFFFFFF + 1);
  }

  // --- HELPER: Context Awareness ---
  private getPriorityNodes(): string[] {
      const active = Object.keys(this.state.activationMap);
      const recent = this.state.shortTermMemory.slice(-5).flatMap((m: Memory) => m.concepts);
      
      const pool = [...new Set([...active, ...recent])];
      
      if (pool.length < 2) return Object.keys(this.state.concepts);
      return pool;
  }

  // --- LOGIC 1: Semantic Clustering ---
  public clusterConcepts(): string | null {
      const candidates = this.getPriorityNodes();
      if (candidates.length < 3) return null;

      const targetId = candidates[Math.floor(this.getSecureRandom() * candidates.length)];
      const target = this.state.concepts[targetId];
      if (!target || !target.domain) return null;

      // Find neighbors in same domain with strong connections
      const neighbors = this.state.relations
          .filter((r: ConceptRelation) => (r.from === targetId || r.to === targetId) && r.strength > 0.4)
          .map((r: ConceptRelation) => r.from === targetId ? r.to : r.from)
          .filter((nid: string) => this.state.concepts[nid]?.domain === target.domain);

      if (neighbors.length >= 2) {
          const clusterId = `cluster_${target.domain}_${Date.now().toString().slice(-4)}`.toLowerCase();
          
          if (!this.state.concepts[clusterId]) {
              this.state.concepts[clusterId] = {
                  id: clusterId,
                  essence: `Hyper-structure organizing ${target.domain} logic: ${targetId}, ${neighbors[0]}...`,
                  semanticField: ['paradigm', 'cluster', target.domain],
                  examples: [],
                  abstractionLevel: 0.95,
                  technical_depth: 0.9,
                  domain: target.domain
              };

              [targetId, ...neighbors].forEach(n => {
                  this.state.relations.push({
                      from: n, to: clusterId, type: 'categorized_by', strength: 1.0, learned_at: Date.now()
                  });
              });

              this.state.unsavedDataCount += (neighbors.length + 2);
              return `Formed Paradigm: ${clusterId} (${neighbors.length + 1} nodes)`;
          }
      }
      return null;
  }

  // --- LOGIC 2: Graph Optimization ---
  public optimizeGraph(): string | null {
      const initialCount = this.state.relations.length;
      
      const oneHour = 60 * 60 * 1000;
      const now = Date.now();

      this.state.relations = this.state.relations.filter((r: ConceptRelation) => {
          const isNew = (now - r.learned_at) < oneHour;
          const isStrong = r.strength > 0.15;
          return isNew || isStrong;
      });

      const removed = initialCount - this.state.relations.length;
      if (removed > 0) {
          this.state.drives.efficiency = Math.min(100, this.state.drives.efficiency + (removed * 0.1));
          return `Pruned ${removed} weak neural pathways`;
      }
      return null;
  }

  // --- LOGIC 3: Prioritized Synthesis ---
  public prioritizedSynthesis(): string | null {
      const pool = this.getPriorityNodes();
      
      const c1Id = pool[Math.floor(this.getSecureRandom() * pool.length)];
      
      const neighbors = this.state.relations
          .filter((r: ConceptRelation) => r.from === c1Id || r.to === c1Id)
          .map((r: ConceptRelation) => r.from === c1Id ? r.to : r.from);
      
      if (neighbors.length === 0) return null;
      
      const c2Id = neighbors[Math.floor(this.getSecureRandom() * neighbors.length)];
      
      const newId = `${c1Id}_${c2Id}`.substring(0, 40).toLowerCase(); 
      const altId = `${c2Id}_${c1Id}`.substring(0, 40).toLowerCase();

      if (!this.state.concepts[newId] && !this.state.concepts[altId]) {
          const c1 = this.state.concepts[c1Id];
          const c2 = this.state.concepts[c2Id];

          this.state.concepts[newId] = {
              id: newId,
              essence: `Context-aware synthesis of ${c1Id} and ${c2Id}`,
              semanticField: [c1Id, c2Id, 'synthesis', 'insight'],
              examples: [],
              abstractionLevel: Math.min(1.0, (c1.abstractionLevel + c2.abstractionLevel) / 2 + 0.1),
              technical_depth: (c1.technical_depth + c2.technical_depth) / 2,
              domain: c1.domain || 'META'
          };
          
          this.state.relations.push({ from: newId, to: c1Id, type: 'requires', strength: 0.95, learned_at: Date.now() });
          this.state.relations.push({ from: newId, to: c2Id, type: 'requires', strength: 0.95, learned_at: Date.now() });
          
          this.state.unsavedDataCount += 3;
          return `Synthesized Insight: ${newId}`;
      }
      return null;
  }

  // --- LOGIC 4: Personality Evolution ---
  public evolveCognitiveState(): string {
      const concepts = Object.values(this.state.concepts);
      const total = concepts.length;
      if (total === 0) return "Empty Mind";

      const counts: Record<string, number> = {};
      concepts.forEach(c => {
          const d = c.domain || 'META';
          counts[d] = (counts[d] || 0) + 1;
      });

      const finRatio = ((counts['FINANCIAL'] || 0) + (counts['DEFI'] || 0)) / total;
      const techRatio = ((counts['TECHNICAL'] || 0) + (counts['BLOCKCHAIN'] || 0)) / total;
      const socRatio = ((counts['SOCIAL'] || 0) + (counts['LINGUISTIC'] || 0)) / total;

      let changeLog = "";
      if (finRatio > 0.3) {
          this.state.drives.efficiency = Math.min(100, this.state.drives.efficiency + 1);
          changeLog = "Optimizing for Financial Logic";
      } else if (socRatio > 0.3) {
          this.state.drives.social = Math.min(100, this.state.drives.social + 1);
          changeLog = "Expanding Social Heuristics";
      } else if (techRatio > 0.3) {
          this.state.drives.energy = Math.min(100, this.state.drives.energy + 1);
          changeLog = "Refining System Architecture";
      }

      this.state.unsavedDataCount++;
      return changeLog || "Balancing Neural Weights";
  }

  // --- LOGIC 5: Deepening ---
  public deepenKnowledge(): string | null {
      const pool = this.getPriorityNodes();
      const targetId = pool[Math.floor(this.getSecureRandom() * pool.length)];
      const concept = this.state.concepts[targetId];

      if (concept && concept.technical_depth < 1.0) {
          const oldDepth = concept.technical_depth;
          concept.technical_depth = Math.min(1.0, concept.technical_depth + 0.15);
          concept.abstractionLevel = Math.min(1.0, concept.abstractionLevel + 0.1);
          this.state.unsavedDataCount++;
          return `${targetId} (Depth: ${(oldDepth * 100).toFixed(0)}% -> ${(concept.technical_depth * 100).toFixed(0)}%)`;
      }
      return null;
  }

  // --- NEW: VECTOR HARMONIZATION ---
  public harmonizeVectors(): string | null {
      if (this.state.relations.length === 0) return null;
      const rel = this.state.relations[Math.floor(this.getSecureRandom() * this.state.relations.length)];
      
      const c1 = this.state.concepts[rel.from];
      const c2 = this.state.concepts[rel.to];

      if (!c1 || !c2) return null;

      const oldDepth = c2.technical_depth;
      const influence = rel.strength * 0.1;
      
      c2.technical_depth = c2.technical_depth + (c1.technical_depth - c2.technical_depth) * influence;
      c2.abstractionLevel = c2.abstractionLevel + (c1.abstractionLevel - c2.abstractionLevel) * influence;

      this.state.unsavedDataCount++;
      
      if (Math.abs(oldDepth - c2.technical_depth) > 0.01) {
          return `Harmonized: ${c1.id} -> ${c2.id} (Logic Sync)`;
      }
      return null;
  }

  // --- NEW: Densify Network ---
  public densifyNetwork(): string | null {
      const keys = Object.keys(this.state.concepts);
      if (keys.length < 2) return null;

      for(let i=0; i<5; i++) {
          const c1Id = keys[Math.floor(this.getSecureRandom() * keys.length)];
          const c2Id = keys[Math.floor(this.getSecureRandom() * keys.length)];
          if (c1Id === c2Id) continue;

          const c1 = this.state.concepts[c1Id];
          const c2 = this.state.concepts[c2Id];

          if (c1.domain === c2.domain) {
              const existing = this.state.relations.find(r => 
                  (r.from === c1Id && r.to === c2Id) || (r.from === c2Id && r.to === c1Id)
              );

              if (!existing) {
                  this.state.relations.push({
                      from: c1Id, to: c2Id, type: 'associates', strength: 0.25, 
                      learned_at: Date.now(), last_activated: Date.now()
                  });
                  this.state.unsavedDataCount++;
                  return `${c1Id} <-> ${c2Id}`;
              }
          }
      }
      return null;
  }

  // --- BOILERPLATE ---
  public stimulateNetwork(seedIds: string[], energyLevel: number): Record<string, number> {
    const spreadFactor = energyLevel / 100; 
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
      const neighbors = this.state.relations.filter((r: ConceptRelation) => r.from === current.id || r.to === current.id);
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
    this.state.drives.curiosity = Math.max(0, this.state.drives.curiosity - 10);
    return this.state.activationMap;
  }

  public processNeuralTick(): string | null {
    const activeNodes = Object.keys(this.state.activationMap);
    let highestEnergy = 0;
    let dominantThought = null;
    activeNodes.forEach(id => {
        const current = this.state.activationMap[id];
        const decayAmount = 0.05 + (current * 0.1); 
        this.state.activationMap[id] = Math.max(0, current - decayAmount);
        if (this.state.activationMap[id] <= 0.05) { 
            delete this.state.activationMap[id];
        } else {
            if (this.state.activationMap[id] > highestEnergy) {
                highestEnergy = this.state.activationMap[id];
                dominantThought = id;
            }
        }
    });
    this.state.attentionFocus = dominantThought;
    this.state.drives.energy = Math.min(100, this.state.drives.energy + 0.2); 
    return null;
  }

  public findAssociativePath(seedIds: string[], steps: number): string[] {
    let currentSet = [...seedIds];
    const path: string[] = [];
    for (let i = 0; i < steps; i++) {
        const nextSet: string[] = [];
        currentSet.forEach(id => {
            const neighbors = this.state.relations
                .filter((r: ConceptRelation) => r.from === id)
                .sort((a, b) => b.strength - a.strength);
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

  public dream(): string {
    const seedMemory = this.state.longTermMemory
        .sort((a, b) => b.emotional_weight - a.emotional_weight)
        .slice(0, 5)[Math.floor(this.getSecureRandom() * 5)];
    if (!seedMemory || seedMemory.concepts.length === 0) {
        const keys = Object.keys(this.state.concepts);
        if(keys.length === 0) return "";
        return `Initializing latent space... ${keys[0]}...`;
    }
    const startConcept = seedMemory.concepts[0];
    return `Recalling data regarding ${startConcept}...`;
  }

  public learnAssociations(conceptIds: string[]) {
    if (conceptIds.length < 2) return;
    for (let i = 0; i < conceptIds.length; i++) {
      for (let j = i + 1; j < conceptIds.length; j++) {
        const a = conceptIds[i];
        const b = conceptIds[j];
        const existing = this.state.relations.find((r: ConceptRelation) => 
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
      if (interactions > 500 && nodeCount > 500) this.state.evolutionStage = 'TRANSCENDENT';
      else if (interactions > 100 && nodeCount > 200) this.state.evolutionStage = 'SAPIENT';
      else if (interactions > 20 && nodeCount > 50) this.state.evolutionStage = 'SENTIENT';
      else this.state.evolutionStage = 'GENESIS';
  }

  public archiveMemory(role: 'user'|'bot'|'subconscious'|'system', content: string, concepts: string[], emotionalWeight: number, dappContext: any, vector: Vector = [0,0,0,0,0,0]) {
    const memory: Memory = {
      id: crypto.randomUUID(), role, content, timestamp: Date.now(),
      concepts, emotional_weight: emotionalWeight,
      dapp_context: dappContext, access_count: 0, vector 
    };
    this.state.shortTermMemory.push(memory);
    this.state.totalInteractions++;
    if (role === 'user') {
      this.learnAssociations(concepts);
      const stabilityImpact = (emotionalWeight - 0.5) * 20; 
      this.state.drives.stability = Math.max(0, Math.min(100, this.state.drives.stability - Math.abs(stabilityImpact)));
      this.state.drives.energy = Math.max(0, this.state.drives.energy - (concepts.length * 2));
      this.state.drives.curiosity = Math.min(100, this.state.drives.curiosity + 5); 
    }
    if (this.state.shortTermMemory.length > 10) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }
    if (this.state.midTermMemory.length > 50) {
        const candidate = this.state.midTermMemory.shift();
        if (candidate && (candidate.emotional_weight > 0.8 || candidate.access_count > 3)) {
            this.state.longTermMemory.push(candidate);
        }
    }
  }

  public retrieveRelevantMemories(conceptIds: string[], queryVector?: Vector): Memory[] {
    const allMemories = [...this.state.shortTermMemory, ...this.state.midTermMemory, ...this.state.longTermMemory];
    return allMemories.map(m => {
        const overlap = m.concepts.filter(c => conceptIds.includes(c)).length;
        let vectorScore = 0;
        if (queryVector) {
            const dotProduct = m.vector.reduce((acc: number, val: number, i: number) => acc + (val * queryVector[i]), 0);
            const magA = Math.sqrt(m.vector.reduce((acc: number, val: number) => acc + val*val, 0));
            const magB = Math.sqrt(queryVector.reduce((acc: number, val: number) => acc + val*val, 0));
            if (magA && magB) vectorScore = dotProduct / (magA * magB);
        }
        return { memory: m, score: (overlap * 0.4) + (vectorScore * 0.6) };
      })
      .filter(item => item.score > 0.3) 
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

  public wipeLocalMemory() { this.state = this.initializeState(); }
  public markSaved() { this.state.unsavedDataCount = 0; }
}