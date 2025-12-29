import { PublicClient } from 'viem';
import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '@/lib/crikzling-atomic-knowledge';
import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from '@/lib/knowledge/knowledge-loader';
import { BrainState, Memory, Vector, InternalDrives, PersonaArchetype, AttentionState, ConceptCluster } from '../types';

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

    const emptyAttention: AttentionState = {
        semanticFocus: null,
        emotionalFocus: null,
        goalFocus: null,
        workingCluster: null
    };

    let state: BrainState = {
      concepts: { ...ATOMIC_PRIMITIVES, ...knowledgeModules.concepts },
      relations: [...ATOMIC_RELATIONS, ...knowledgeModules.relations],
      activationMap: {},
      attentionState: emptyAttention, 
      generatedClusters: [],
      shortTermMemory: [],
      midTermMemory: [],
      longTermMemory: [],
      blockchainMemories: [],
      totalInteractions: 0,
      unsavedDataCount: 0,
      evolutionStage: 'GENESIS',
      currentArchetype: 'OPERATOR', 
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
            if(!state.attentionState) state.attentionState = emptyAttention;
            if(!state.generatedClusters) state.generatedClusters = [];
            
            state.concepts = { ...state.concepts, ...base.concepts };
            state.relations = Array.isArray(base.relations) ? base.relations : state.relations;
            
            this.unsavedIds.concepts.clear();
            this.unsavedIds.memories.clear();
            this.unsavedIds.relations.clear();
        } catch (e) { console.error("Base Load Error", e); }
    }

    if (diffJson) {
        try {
            const diff = JSON.parse(diffJson);
            if (diff.concepts) Object.assign(state.concepts, diff.concepts);
            if (diff.relations) state.relations.push(...diff.relations);
            if (diff.unsavedDataCount) state.unsavedDataCount = diff.unsavedDataCount;
            if (diff.currentArchetype) state.currentArchetype = diff.currentArchetype;
        } catch (e) { console.error("Diff Merge Error", e); }
    }

    return state;
  }

  public mergeExternalState(remoteState: any) {
      if (!remoteState) return;

      // 1. Merge Concepts
      if (remoteState.concepts) {
          Object.assign(this.state.concepts, remoteState.concepts);
      }

      // 2. Merge Relations
      if (remoteState.relations && Array.isArray(remoteState.relations)) {
          const currentSigs = new Set(this.state.relations.map(r => `${r.from}-${r.to}-${r.type}`));
          remoteState.relations.forEach((r: ConceptRelation) => {
              const sig = `${r.from}-${r.to}-${r.type}`;
              if (!currentSigs.has(sig)) {
                  this.state.relations.push(r);
              }
          });
      }

      // 3. Force Ops Sync
      const remoteOps = Number(remoteState.totalInteractions || remoteState.interactions || 0);
      if (remoteOps > this.state.totalInteractions) {
          this.state.totalInteractions = remoteOps;
      }

      // 4. Update Time
      this.state.lastBlockchainSync = Date.now();
      
      // 5. Clear unsaved if clean sync
      if (remoteOps >= this.state.totalInteractions) {
          this.state.unsavedDataCount = 0;
          this.unsavedIds.concepts.clear();
          this.unsavedIds.relations.clear();
      }
  }

  public formAbstractCluster(activeNodes: string[]): string | null {
      if (activeNodes.length < 3) return null;

      let bestNode = activeNodes[0];
      let maxConnections = 0;

      activeNodes.forEach(node => {
          const links = this.state.relations.filter(r => r.from === node || r.to === node).length;
          if (links > maxConnections) {
              maxConnections = links;
              bestNode = node;
          }
      });

      const clusterId = `cluster_${Date.now()}`;
      const cluster: ConceptCluster = {
          id: clusterId,
          centerConcept: bestNode,
          relatedNodes: activeNodes.filter(n => n !== bestNode),
          strength: 0.8,
          lastActivated: Date.now()
      };

      this.state.generatedClusters.push(cluster);
      
      this.state.attentionState.workingCluster = cluster;
      this.state.attentionState.semanticFocus = bestNode;

      if (this.state.generatedClusters.length > 5) {
          this.state.generatedClusters.shift();
      }

      this.state.unsavedDataCount++;
      return `Abstraction formed around [${bestNode}]`;
  }

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
          return `Pruned ${removed} redundant nodes.`;
      }
      return null;
  }

  // --- RESTORED LOGIC FOR SYSTEM CHURN ---

  public removeWeakRelations(): string | null {
      const initialCount = this.state.relations.length;
      this.state.relations = this.state.relations.filter(r => r.strength > 0.05); 
      const pruned = initialCount - this.state.relations.length;
      if (pruned > 0) {
          // No unsaved count increment for cleanup
          return `Decay: Removed ${pruned} weak synapses.`;
      }
      return null;
  }

  public optimizeGraph(): string | null { 
      return this.removeWeakRelations();
  }

  public deepenKnowledge(): string | null {
      // Pick a random concept and increase its depth slightly
      const keys = Object.keys(this.state.concepts);
      if (keys.length === 0) return null;
      
      const targetId = keys[Math.floor(this.getSecureRandom() * keys.length)];
      const concept = this.state.concepts[targetId];
      if (concept) {
          const oldDepth = concept.technical_depth;
          concept.technical_depth = Math.min(1.0, oldDepth + 0.01);
          
          if (concept.technical_depth > oldDepth) {
              this.unsavedIds.concepts.add(targetId);
              this.state.unsavedDataCount++;
              // Only return string occasionally to avoid log spam
              return Math.random() > 0.7 ? `Deepened understanding of [${targetId}]` : null;
          }
      }
      return null;
  }

  public evolveCognitiveState(): string | null { 
      // Reinforce connections
      let strengthened = 0;
      // Random sample to save CPU
      const sampleSize = Math.min(50, this.state.relations.length);
      for(let i=0; i<sampleSize; i++) {
          const idx = Math.floor(Math.random() * this.state.relations.length);
          const r = this.state.relations[idx];
          if (r && r.strength < 1.0) {
              r.strength += 0.005;
              strengthened++;
          }
      }
      
      if (strengthened > 0) {
          this.state.unsavedDataCount++;
          return Math.random() > 0.8 ? `Reinforced ${strengthened} pathways` : null;
      }
      return null;
  }

  public prioritizedSynthesis(): string | null {
      // Create new connection between two random concepts
      const keys = Object.keys(this.state.concepts);
      if(keys.length < 2) return null;
      
      const c1 = keys[Math.floor(this.getSecureRandom() * keys.length)];
      const c2 = keys[Math.floor(this.getSecureRandom() * keys.length)];
      
      if(c1 !== c2) {
          // Check if exists
          const exists = this.state.relations.some(r => (r.from === c1 && r.to === c2) || (r.from === c2 && r.to === c1));
          if (!exists) {
              this.state.relations.push({
                  from: c1, to: c2, type: 'relates_to', strength: 0.1, learned_at: Date.now()
              });
              this.state.unsavedDataCount++;
              return `New Synapse: ${c1} <-> ${c2}`;
          }
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

  public exportDiff(): string {
      const diff: any = {
          totalInteractions: this.state.totalInteractions,
          unsavedDataCount: this.state.unsavedDataCount,
          currentArchetype: this.state.currentArchetype, 
          concepts: {},
          relations: [],
      };
      this.unsavedIds.concepts.forEach(id => {
          if (this.state.concepts[id]) diff.concepts[id] = this.state.concepts[id];
      });
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
      this.state.drives.curiosity = Math.min(100, this.state.drives.curiosity + 5); 
    }
    
    if (this.state.shortTermMemory.length > 10) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }
  }

  public retrieveRelevantMemories(conceptIds: string[], queryVector?: Vector): Memory[] {
    const allMemories = [...this.state.shortTermMemory, ...this.state.midTermMemory, ...this.state.longTermMemory];
    return allMemories.map(m => {
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
    Object.keys(concepts).forEach(id => this.unsavedIds.concepts.add(id));
    this.state.unsavedDataCount += count;
    return count;
  }

  public wipeLocalMemory() { this.state = this.initializeState(); }
  
  public stimulateNetwork(seedIds: string[], energyLevel: number): Record<string, number> {
    const spreadLimit = energyLevel > 80 ? 3 : 1; 
    const queue: { id: string, energy: number, depth: number }[] = [];
    
    seedIds.forEach(id => {
      if (this.state.concepts[id]) {
        this.state.activationMap[id] = 1.0;
        queue.push({ id, energy: 1.0, depth: 0 });
      }
    });

    let processed = 0;
    while (queue.length > 0 && processed < 50) {
      const current = queue.shift()!;
      if (current.depth >= spreadLimit) continue;

      const neighbors = this.state.relations.filter((r: ConceptRelation) => r.from === current.id || r.to === current.id);
      
      for (const rel of neighbors) {
        const neighborId = rel.from === current.id ? rel.to : rel.from;
        if (!this.state.concepts[neighborId]) continue;

        let weight = rel.strength;
        if (rel.type === 'antonym') weight *= 0.1; 
        
        const transfer = current.energy * weight * 0.8;
        const existing = this.state.activationMap[neighborId] || 0;
        
        if (transfer > 0.2 && existing < transfer) {
            this.state.activationMap[neighborId] = transfer;
            queue.push({ id: neighborId, energy: transfer, depth: current.depth + 1 });
        }
      }
      processed++;
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
  
  public dream(): string {
      const keys = Object.keys(this.state.concepts);
      if (keys.length > 0) {
          const randomKey = keys[Math.floor(this.getSecureRandom() * keys.length)];
          return `Analyzing recursive loop: ${randomKey}...`;
      }
      return "Subconscious alignment...";
  }
}