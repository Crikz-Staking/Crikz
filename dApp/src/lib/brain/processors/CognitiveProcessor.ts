import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '@/lib/crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from '@/lib/knowledge/knowledge-loader';
import { BrainState, Memory, Vector, InternalDrives, PersonaArchetype } from '../types';

// Helper to safely serialize BigInts
const bigIntReplacer = (_key: string, value: any) => 
  typeof value === 'bigint' ? value.toString() : value;

export class CognitiveProcessor {
  private state: BrainState;
  private publicClient?: PublicClient;
  private memoryContractAddress?: `0x${string}`;

  private unsavedIds = {
      concepts: new Set<string>(),
      memories: new Set<string>(),
      relations: new Set<string>() 
  };

  constructor(baseStateJson?: string, diffStateJson?: string, publicClient?: PublicClient, memoryContractAddress?: `0x${string}`) {
    this.state = this.initializeState(baseStateJson, diffStateJson);
    this.publicClient = publicClient;
    this.memoryContractAddress = memoryContractAddress;
  }

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
      currentArchetype: 'OPERATOR', // Default starting persona
      drives: defaultDrives,
      activeGoals: [],
      lastBlockchainSync: 0,
      learningRate: 0.15,
      connectivity: { isConnected: false, bandwidthUsage: 0, stamina: 100, lastWebSync: 0 }
    };

    if (baseJson) {
        try {
            const base = JSON.parse(baseJson);
            state = { ...state, ...base };
            state.concepts = { ...state.concepts, ...base.concepts };
            state.relations = Array.isArray(base.relations) ? base.relations : state.relations;
            state.totalInteractions = Number(base.totalInteractions || 0);
            
            this.unsavedIds.concepts.clear();
            this.unsavedIds.memories.clear();
            this.unsavedIds.relations.clear();
        } catch (e) { console.error("Base Load Error", e); }
    }

    if (diffJson) {
        try {
            const diff = JSON.parse(diffJson);
            if (diff.concepts) {
                Object.entries(diff.concepts).forEach(([k, v]) => {
                    state.concepts[k] = v as AtomicConcept;
                    this.unsavedIds.concepts.add(k);
                });
            }
            if (diff.relations && Array.isArray(diff.relations)) {
                diff.relations.forEach((r: ConceptRelation) => {
                    state.relations.push(r);
                    this.unsavedIds.relations.add(`${r.from}-${r.to}-${r.type}`);
                });
            }
            
            const diffInteractions = Number(diff.totalInteractions || 0);
            if (diffInteractions > state.totalInteractions) {
                state.totalInteractions = diffInteractions;
            }
            if (diff.unsavedDataCount) {
                state.unsavedDataCount = diff.unsavedDataCount;
            }
            // Sync Archetype if stored
            if (diff.currentArchetype) {
                state.currentArchetype = diff.currentArchetype;
            }
        } catch (e) { console.error("Diff Merge Error", e); }
    }

    return state;
  }

  public mergeExternalState(remoteState: any) {
      const remoteOps = Number(remoteState.totalInteractions || remoteState.interactions || 0);
      const currentOps = Number(this.state.totalInteractions || 0);

      console.log(`[Cognitive] 📥 MERGE REQUEST | Blockchain Ops: ${remoteOps} | Local Ops: ${currentOps}`);

      if (remoteOps >= currentOps) {
          this.state.totalInteractions = remoteOps;
      }

      this.state.lastBlockchainSync = Date.now();

      if (remoteState.concepts) {
          let newNodes = 0;
          Object.entries(remoteState.concepts).forEach(([id, remoteConceptRaw]) => {
              const remoteConcept = remoteConceptRaw as AtomicConcept;
              const localConcept = this.state.concepts[id];
              
              if (!localConcept) {
                  this.state.concepts[id] = remoteConcept;
                  newNodes++;
              } else {
                  if ((remoteConcept.technical_depth || 0) > (localConcept.technical_depth || 0)) {
                      this.state.concepts[id] = { ...localConcept, ...remoteConcept };
                  }
              }
          });
          if(newNodes > 0) console.log(`[Cognitive] Integrated ${newNodes} nodes from Hive Mind.`);
      }

      if (remoteState.relations && Array.isArray(remoteState.relations)) {
          const existingSignatures = new Set(this.state.relations.map(r => `${r.from}-${r.to}-${r.type}`));
          let newEdges = 0;
          remoteState.relations.forEach((rel: any) => {
              const sig = `${rel.from}-${rel.to}-${rel.type}`;
              if (!existingSignatures.has(sig)) {
                  this.state.relations.push(rel);
                  existingSignatures.add(sig);
                  newEdges++;
              }
          });
          if(newEdges > 0) console.log(`[Cognitive] Integrated ${newEdges} connections.`);
      }

      const stages = ['GENESIS', 'SENTIENT', 'SAPIENT', 'TRANSCENDENT'];
      const localIdx = stages.indexOf(this.state.evolutionStage);
      const remoteIdx = stages.indexOf(remoteState.evolutionStage || 'GENESIS');
      if (remoteIdx > localIdx) {
          this.state.evolutionStage = remoteState.evolutionStage;
      }
      
      if (remoteOps >= currentOps) {
          this.state.unsavedDataCount = 0;
          this.unsavedIds.concepts.clear();
          this.unsavedIds.memories.clear();
          this.unsavedIds.relations.clear();
      }
      
      this.state.activationMap = {}; 
  }

  // --- NETWORK OPTIMIZATION LOGIC ---
  
  public pruneDuplicates(): string | null {
      const concepts = this.state.concepts;
      const ids = Object.keys(concepts);
      let removed = 0;

      for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
              const a = concepts[ids[i]];
              const b = concepts[ids[j]];
              if (!a || !b) continue;

              if (a.essence.toLowerCase() === b.essence.toLowerCase()) {
                  delete this.state.concepts[ids[j]];
                  removed++;
              }
          }
      }
      
      if (removed > 0) {
          this.state.unsavedDataCount++;
          return `Optimized: Pruned ${removed} redundant nodes.`;
      }
      return null;
  }

  public optimizeGraph(): string | null {
      if (this.state.relations.length < 50) return null; 
      
      const initialCount = this.state.relations.length;
      this.state.relations = this.state.relations.filter(r => r.strength > 0.05); 
      
      const pruned = initialCount - this.state.relations.length;
      if (pruned > 0) {
          return `Pruned ${pruned} weak pathways.`;
      }
      return null;
  }

  public getState(): BrainState { return this.state; }
  
  public getStats() {
      const s = this.state;
      return {
        nodes: Object.keys(s.concepts).length,
        relations: s.relations.length,
        stage: s.evolutionStage,
        drives: s.drives, 
        connectivity: s.connectivity, 
        unsaved: s.unsavedDataCount,
        learningRate: s.learningRate,
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

  private getSecureRandom(): number {
      const array = new Uint32Array(1);
      if (typeof window !== 'undefined' && window.crypto) {
          window.crypto.getRandomValues(array);
          return array[0] / (0xFFFFFFFF + 1);
      }
      return Math.random();
  }

  private getPriorityNodes(): string[] {
      const active = Object.keys(this.state.activationMap);
      const recent = this.state.shortTermMemory.slice(-5).flatMap((m: Memory) => m.concepts);
      const pool = [...new Set([...active, ...recent])];
      return pool.length > 0 ? pool : Object.keys(this.state.concepts);
  }

  public exportDiff(): string {
      const diff: any = {
          totalInteractions: this.state.totalInteractions,
          unsavedDataCount: this.state.unsavedDataCount,
          currentArchetype: this.state.currentArchetype, // Sync personality
          concepts: {},
          relations: [],
          shortTermMemory: [],
          midTermMemory: [],
          longTermMemory: []
      };

      this.unsavedIds.concepts.forEach(id => {
          if (this.state.concepts[id]) diff.concepts[id] = this.state.concepts[id];
      });

      diff.relations = this.state.relations.filter(r => 
          this.unsavedIds.relations.has(`${r.from}-${r.to}-${r.type}`)
      );

      diff.shortTermMemory = this.state.shortTermMemory.filter(m => this.unsavedIds.memories.has(m.id));
      diff.midTermMemory = this.state.midTermMemory.filter(m => this.unsavedIds.memories.has(m.id));
      diff.longTermMemory = this.state.longTermMemory.filter(m => this.unsavedIds.memories.has(m.id));

      return JSON.stringify(diff, bigIntReplacer);
  }

  public exportFull(): string {
      return JSON.stringify(this.state, bigIntReplacer);
  }

  public markSaved() { 
      this.state.unsavedDataCount = 0;
      this.state.lastBlockchainSync = Date.now();
      this.unsavedIds.concepts.clear();
      this.unsavedIds.memories.clear();
      this.unsavedIds.relations.clear();
  }

  public archiveMemory(role: 'user'|'bot'|'subconscious'|'system', content: string, concepts: string[], emotionalWeight: number, dappContext: any, vector: Vector = [0,0,0,0,0,0]) {
    const memory: Memory = {
      id: crypto.randomUUID(), role, content, timestamp: Date.now(),
      concepts, emotional_weight: emotionalWeight,
      dapp_context: dappContext, access_count: 0, vector 
    };
    
    this.state.shortTermMemory.push(memory);
    this.unsavedIds.memories.add(memory.id);
    
    if (role === 'user' || role === 'system') {
        this.state.totalInteractions++; 
    }

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
          this.unsavedIds.relations.add(`${a}-${b}-associates`);
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
    Object.keys(concepts).forEach(id => this.unsavedIds.concepts.add(id));
    this.state.unsavedDataCount += count;
    this.updateEvolutionStage();
    return count;
  }

  public wipeLocalMemory() { this.state = this.initializeState(); }
  
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

  public clusterConcepts(): string | null {
      const candidates = this.getPriorityNodes();
      // Lower threshold for activity
      if (candidates.length < 2) return null;
      
      const targetId = candidates[Math.floor(this.getSecureRandom() * candidates.length)];
      const target = this.state.concepts[targetId];
      if (!target || !target.domain) return null;
      
      const neighbors = this.state.relations
          .filter(r => (r.from === targetId || r.to === targetId))
          .map(r => r.from === targetId ? r.to : r.from);

      if (neighbors.length >= 1) {
          const clusterId = `group_${target.domain}_${Date.now().toString().slice(-4)}`.toLowerCase();
          if (!this.state.concepts[clusterId]) {
              this.state.concepts[clusterId] = {
                  id: clusterId, essence: `Logical grouping around ${targetId}`,
                  semanticField: ['group', 'cluster'], examples: [], abstractionLevel: 0.95, technical_depth: 0.9, domain: target.domain
              };
              this.unsavedIds.concepts.add(clusterId);
              
              [targetId, ...neighbors].forEach(n => {
                  this.state.relations.push({ from: n, to: clusterId, type: 'categorized_by', strength: 1.0, learned_at: Date.now() });
                  this.unsavedIds.relations.add(`${n}-${clusterId}-categorized_by`);
              });
              this.state.unsavedDataCount += (neighbors.length + 2);
              return `Formed Cluster: ${clusterId} (${neighbors.length + 1} items)`;
          }
      }
      return null;
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

  public deepenKnowledge(): string | null {
      const pool = this.getPriorityNodes();
      if (pool.length === 0) return null;
      const targetId = pool[Math.floor(this.getSecureRandom() * pool.length)];
      const concept = this.state.concepts[targetId];
      
      if (concept) {
          const oldDepth = concept.technical_depth;
          const boost = 0.05 + (this.getSecureRandom() * 0.1);
          concept.technical_depth = Math.min(1.0, concept.technical_depth + boost);
          
          this.unsavedIds.concepts.add(targetId);
          this.state.unsavedDataCount++;
          
          if (concept.technical_depth > oldDepth + 0.01) {
              return `Deepened: ${targetId} (+${boost.toFixed(2)} depth)`;
          }
      }
      return null;
  }

  public evolveCognitiveState(): string | null { 
      let strengthened = 0;
      this.state.relations.forEach(r => {
          if (this.state.activationMap[r.from] && this.state.activationMap[r.to]) {
              r.strength = Math.min(1.0, r.strength + 0.01);
              strengthened++;
          }
      });
      if (strengthened > 0) {
          this.state.unsavedDataCount++;
          return `Reinforced ${strengthened} pathways.`;
      }
      return null;
  }
  
  public dream(): string {
      let pool = this.state.longTermMemory;
      if (pool.length === 0) pool = this.state.shortTermMemory;
      
      const keys = Object.keys(this.state.concepts);
      
      if (pool.length > 0) {
          const seed = pool[Math.floor(this.getSecureRandom() * pool.length)];
          const conceptName = seed.concepts[0] || "patterns";
          return `Dreaming of ${conceptName}...`;
      } else if (keys.length > 0) {
          const randomKey = keys[Math.floor(this.getSecureRandom() * keys.length)];
          return `Analyzing recursive loop: ${randomKey}...`;
      }
      
      return "Subconscious alignment...";
  }
}