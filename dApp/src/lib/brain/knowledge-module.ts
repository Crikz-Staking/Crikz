import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '../crikzling-atomic-knowledge';
import { BrainState } from './types';

export class KnowledgeModule {
  private concepts: Record<string, AtomicConcept> = {};
  private relations: ConceptRelation[] = [];
  public unsavedCount: number = 0;

  constructor(state?: Partial<BrainState>) {
    this.concepts = { ...ATOMIC_PRIMITIVES };
    this.relations = [ ...ATOMIC_RELATIONS ];

    if (state) {
      this.concepts = { ...this.concepts, ...(state.concepts || {}) };
      this.relations = [ ...this.relations, ...(state.relations || []) };
      this.unsavedCount = state.unsavedDataCount || 0;
    }
  }

  /**
   * Spreading Activation Algorithm
   * Simulates how a biological brain activates related neurons
   */
  public activateNetwork(seedIds: string[], decayFactor: number = 0.5): Record<string, number> {
    const activationMap: Record<string, number> = {};
    const queue: { id: string, energy: number }[] = [];

    // 1. Ignite Seeds
    seedIds.forEach(id => {
      if (this.concepts[id]) {
        activationMap[id] = 1.0;
        queue.push({ id, energy: 1.0 });
      }
    });

    // 2. Propagate Energy
    const MAX_STEPS = 50;
    let steps = 0;

    while (queue.length > 0 && steps < MAX_STEPS) {
      const current = queue.shift()!;
      if (current.energy < 0.1) continue; // Energy fizzled out

      // Find outgoing relations
      const outgoing = this.relations.filter(r => r.from === current.id);
      
      for (const rel of outgoing) {
        const transferEnergy = current.energy * rel.strength * decayFactor;
        
        // If the target node gets significantly activated, add to queue
        if ((activationMap[rel.to] || 0) < transferEnergy) {
          activationMap[rel.to] = transferEnergy;
          queue.push({ id: rel.to, energy: transferEnergy });
        }
      }
      steps++;
    }

    return activationMap;
  }

  /**
   * Hebbian Learning: "Neurons that fire together, wire together"
   * Strengthens or creates connections between concepts appearing in the same context
   */
  public reinforceConnections(conceptIds: string[]) {
    if (conceptIds.length < 2) return;

    for (let i = 0; i < conceptIds.length; i++) {
      for (let j = i + 1; j < conceptIds.length; j++) {
        const a = conceptIds[i];
        const b = conceptIds[j];
        
        const existingRel = this.relations.find(r => 
          (r.from === a && r.to === b) || (r.from === b && r.to === a)
        );

        if (existingRel) {
          existingRel.strength = Math.min(1.0, existingRel.strength + 0.05);
          existingRel.last_activated = Date.now();
        } else {
          // Weak association created
          this.relations.push({
            from: a,
            to: b,
            type: 'associates',
            strength: 0.1,
            learned_at: Date.now(),
            last_activated: Date.now()
          });
          this.unsavedCount++;
        }
      }
    }
  }

  public getConcept(id: string) { return this.concepts[id]; }
  
  public addKnowledge(newConcepts: Record<string, AtomicConcept>, count: number) {
      Object.assign(this.concepts, newConcepts);
      this.unsavedCount += count;
  }

  public exportState() {
    return {
      concepts: this.concepts,
      relations: this.relations,
      unsavedDataCount: this.unsavedCount
    };
  }

  public getStats() {
      return { nodes: Object.keys(this.concepts).length, edges: this.relations.length };
  }
}