import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '@/lib/crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from '@/lib/knowledge/knowledge-loader';
import { BrainState, Memory, Vector, InternalDrives } from '../types';

export class CognitiveProcessor {
  private state: BrainState;
  private publicClient?: PublicClient;
  private memoryContractAddress?: `0x${string}`;

  // Track specific IDs that are new/unsaved to create compact diffs
  private unsavedIds = {
      concepts: new Set<string>(),
      memories: new Set<string>(),
      relations: new Set<string>() // composite key "from-to-type"
  };

  constructor(baseStateJson?: string, diffStateJson?: string, publicClient?: PublicClient, memoryContractAddress?: `0x${string}`) {
    this.state = this.initializeState(baseStateJson, diffStateJson);
    this.publicClient = publicClient;
    this.memoryContractAddress = memoryContractAddress;
  }

  /**
   * HYDRATION LOGIC:
   * 1. Loads Static defaults.
   * 2. Overwrites with Base State (Blockchain/IPFS).
   * 3. Merges Diff State (Local Unsaved Changes).
   */
  private initializeState(baseJson?: string, diffJson?: string): BrainState {
    const knowledgeModules = loadAllKnowledgeModules();
    
    const defaultDrives: InternalDrives = { 
        curiosity: 60, stability: 100, efficiency: 50, social: 50, energy: 100 
    };

    let state: BrainState = {
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
      connectivity: { isConnected: false, bandwidthUsage: 0, stamina: 100, lastWebSync: 0 }
    };

    // 1. Apply Base (Blockchain)
    if (baseJson) {
        try {
            const base = JSON.parse(baseJson);
            state = { ...state, ...base };
            // Ensure relations and memories are arrays
            state.relations = base.relations || [];
            state.shortTermMemory = base.shortTermMemory || [];
            state.midTermMemory = base.midTermMemory || [];
            state.longTermMemory = base.longTermMemory || [];
            // Re-hydrate Sets if they exist in base (unlikely for IPFS, but good practice)
            this.unsavedIds.concepts.clear();
            this.unsavedIds.memories.clear();
            this.unsavedIds.relations.clear();
        } catch (e) { console.error("Base Load Error", e); }
    }

    // 2. Apply Diff (Local Storage)
    if (diffJson) {
        try {
            const diff = JSON.parse(diffJson);
            
            // Merge Concepts
            if (diff.concepts) {
                Object.entries(diff.concepts).forEach(([k, v]) => {
                    state.concepts[k] = v as AtomicConcept;
                    this.unsavedIds.concepts.add(k);
                });
            }

            // Merge Relations
            if (diff.relations) {
                diff.relations.forEach((r: ConceptRelation) => {
                    state.relations.push(r);
                    this.unsavedIds.relations.add(`${r.from}-${r.to}-${r.type}`);
                });
            }

            // Merge Memories
            ['shortTermMemory', 'midTermMemory', 'longTermMemory'].forEach(key => {
                if (diff[key]) {
                    diff[key].forEach((m: Memory) => {
                        // Avoid duplicates
                        if (!state[key as keyof BrainState].find((ex: any) => ex.id === m.id)) {
                            // @ts-ignore
                            state[key].push(m);
                            this.unsavedIds.memories.add(m.id);
                        }
                    });
                }
            });

            // Restore Counters
            if (diff.totalInteractions > state.totalInteractions) {
                state.totalInteractions = diff.totalInteractions;
            }
            state.unsavedDataCount = diff.unsavedDataCount || 0;

        } catch (e) { console.error("Diff Merge Error", e); }
    }

    return state;
  }

  public getState(): BrainState { return this.state; }
  
  /**
   * EXPORT DIFF:
   * Returns a lightweight JSON containing ONLY what hasn't been saved to blockchain.
   */
  public exportDiff(): string {
      const diff: any = {
          totalInteractions: this.state.totalInteractions,
          unsavedDataCount: this.state.unsavedDataCount,
          concepts: {},
          relations: [],
          shortTermMemory: [],
          midTermMemory: [],
          longTermMemory: []
      };

      // Extract Concepts
      this.unsavedIds.concepts.forEach(id => {
          if (this.state.concepts[id]) diff.concepts[id] = this.state.concepts[id];
      });

      // Extract Relations
      diff.relations = this.state.relations.filter(r => 
          this.unsavedIds.relations.has(`${r.from}-${r.to}-${r.type}`)
      );

      // Extract Memories
      diff.shortTermMemory = this.state.shortTermMemory.filter(m => this.unsavedIds.memories.has(m.id));
      diff.midTermMemory = this.state.midTermMemory.filter(m => this.unsavedIds.memories.has(m.id));
      diff.longTermMemory = this.state.longTermMemory.filter(m => this.unsavedIds.memories.has(m.id));

      return JSON.stringify(diff);
  }

  /**
   * EXPORT FULL:
   * Returns complete state for IPFS Crystallization
   */
  public exportFull(): string {
      return JSON.stringify(this.state);
  }

  public markSaved() { 
      this.state.unsavedDataCount = 0;
      this.state.lastBlockchainSync = Date.now();
      // Clear tracking sets
      this.unsavedIds.concepts.clear();
      this.unsavedIds.memories.clear();
      this.unsavedIds.relations.clear();
  }

  // --- PROCESSING LOGIC UPDATES ---

  public archiveMemory(role: 'user'|'bot'|'subconscious'|'system', content: string, concepts: string[], emotionalWeight: number, dappContext: any, vector: Vector = [0,0,0,0,0,0]) {
    const memory: Memory = {
      id: crypto.randomUUID(), role, content, timestamp: Date.now(),
      concepts, emotional_weight: emotionalWeight,
      dapp_context: dappContext, access_count: 0, vector 
    };
    
    this.state.shortTermMemory.push(memory);
    this.unsavedIds.memories.add(memory.id); // Track as unsaved
    
    if (role === 'user' || role === 'system') { // System events (neural link) count as interactions
        this.state.totalInteractions++; 
    }

    if (role === 'user') {
      this.learnAssociations(concepts);
      // Drive updates...
      const stabilityImpact = (emotionalWeight - 0.5) * 20; 
      this.state.drives.stability = Math.max(0, Math.min(100, this.state.drives.stability - Math.abs(stabilityImpact)));
      this.state.drives.energy = Math.max(0, this.state.drives.energy - (concepts.length * 2));
      this.state.drives.curiosity = Math.min(100, this.state.drives.curiosity + 5); 
    }
    
    // Memory Rotation Logic
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
          this.unsavedIds.relations.add(`${a}-${b}-associates`); // Track
        }
      }
    }
    this.updateEvolutionStage();
  }

  // --- Other Methods (No changes needed, but included for completeness of class) ---
  
  private updateEvolutionStage() {
      const nodeCount = Object.keys(this.state.concepts).length;
      const interactions = this.state.totalInteractions;
      if (interactions > 500 && nodeCount > 500) this.state.evolutionStage = 'TRANSCENDENT';
      else if (interactions > 100 && nodeCount > 200) this.state.evolutionStage = 'SAPIENT';
      else if (interactions > 20 && nodeCount > 50) this.state.evolutionStage = 'SENTIENT';
      else this.state.evolutionStage = 'GENESIS';
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
    Object.keys(concepts).forEach(id => this.unsavedIds.concepts.add(id)); // Track
    this.state.unsavedDataCount += count;
    this.updateEvolutionStage();
    return count;
  }

  public wipeLocalMemory() { this.state = this.initializeState(); }
  
  // Standard Brain Ops (Tick Logic Helpers)
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
    return this.state.activationMap;
  }

  public findAssociativePath(seedIds: string[], steps: number): string[] {
    let currentSet = [...seedIds];
    const path: string[] = [];
    for (let i = 0; i < steps; i++) {
        const nextSet: string[] = [];
        currentSet.forEach(id => {
            const neighbors = this.state.relations.filter(r => r.from === id).sort((a, b) => b.strength - a.strength);
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

  // Autonomous Refinements (Adding ID tracking)
  public clusterConcepts(): string | null {
      const candidates = this.getPriorityNodes();
      if (candidates.length < 3) return null;
      const targetId = candidates[Math.floor(this.getSecureRandom() * candidates.length)];
      const target = this.state.concepts[targetId];
      if (!target || !target.domain) return null;
      const neighbors = this.state.relations
          .filter(r => (r.from === targetId || r.to === targetId) && r.strength > 0.4)
          .map(r => r.from === targetId ? r.to : r.from)
          .filter(nid => this.state.concepts[nid]?.domain === target.domain);

      if (neighbors.length >= 2) {
          const clusterId = `cluster_${target.domain}_${Date.now().toString().slice(-4)}`.toLowerCase();
          if (!this.state.concepts[clusterId]) {
              this.state.concepts[clusterId] = {
                  id: clusterId, essence: `Hyper-structure organizing ${target.domain} logic`,
                  semanticField: ['paradigm', 'cluster'], examples: [], abstractionLevel: 0.95, technical_depth: 0.9, domain: target.domain
              };
              this.unsavedIds.concepts.add(clusterId); // Track
              
              [targetId, ...neighbors].forEach(n => {
                  this.state.relations.push({ from: n, to: clusterId, type: 'categorized_by', strength: 1.0, learned_at: Date.now() });
                  this.unsavedIds.relations.add(`${n}-${clusterId}-categorized_by`); // Track
              });
              this.state.unsavedDataCount += (neighbors.length + 2);
              return `Formed Paradigm: ${clusterId}`;
          }
      }
      return null;
  }

  public optimizeGraph(): string | null {
      const initialCount = this.state.relations.length;
      const oneHour = 60 * 60 * 1000;
      this.state.relations = this.state.relations.filter(r => {
          const isNew = (Date.now() - r.learned_at) < oneHour;
          return isNew || r.strength > 0.15;
      });
      // No need to track deletions in unsavedIds, exportDiff will simply not include them
      return initialCount > this.state.relations.length ? `Pruned ${initialCount - this.state.relations.length} connections` : null;
  }

  public prioritizedSynthesis(): string | null {
      const pool = this.getPriorityNodes();
      if(pool.length < 2) return null;
      const c1 = pool[Math.floor(this.getSecureRandom() * pool.length)];
      const c2 = pool[Math.floor(this.getSecureRandom() * pool.length)];
      if(c1 === c2) return null;
      
      const newId = `${c1}_${c2}`.substring(0, 40).toLowerCase();
      if(!this.state.concepts[newId]) {
          this.state.concepts[newId] = {
              id: newId, essence: `Synthesis of ${c1} and ${c2}`, semanticField: ['insight'],
              examples: [], abstractionLevel: 0.8, technical_depth: 0.8, domain: 'META'
          };
          this.unsavedIds.concepts.add(newId);
          this.state.relations.push({ from: newId, to: c1, type: 'requires', strength: 0.9, learned_at: Date.now() });
          this.unsavedIds.relations.add(`${newId}-${c1}-requires`);
          this.state.unsavedDataCount += 2;
          return `Synthesized: ${newId}`;
      }
      return null;
  }

  public deepKnowledge(): string | null { return null; } // Placeholder
  public deepenKnowledge(): string | null {
      const pool = this.getPriorityNodes();
      const targetId = pool[Math.floor(this.getSecureRandom() * pool.length)];
      const concept = this.state.concepts[targetId];
      if (concept && concept.technical_depth < 1.0) {
          concept.technical_depth = Math.min(1.0, concept.technical_depth + 0.15);
          this.unsavedIds.concepts.add(targetId); // Mark modified concept as unsaved
          this.state.unsavedDataCount++;
          return `Deepened: ${targetId}`;
      }
      return null;
  }

  public evolveCognitiveState(): string { return "Optimizing neural weights"; } // Simple stub for evolution
  
  public dream(): string {
      const seed = this.state.longTermMemory[Math.floor(this.getSecureRandom() * this.state.longTermMemory.length)];
      return seed ? `Dreaming of ${seed.concepts[0]}...` : "Void state...";
  }

  private getPriorityNodes(): string[] {
      const active = Object.keys(this.state.activationMap);
      return active.length > 0 ? active : Object.keys(this.state.concepts);
  }
}