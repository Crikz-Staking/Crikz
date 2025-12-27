import { BrainState, Memory } from './types';

export class MemoryModule {
  private shortTerm: Memory[] = [];
  private midTerm: Memory[] = [];
  private longTerm: Memory[] = [];

  constructor(state?: Partial<BrainState>) {
    if (state) {
      this.shortTerm = state.shortTermMemory || [];
      this.midTerm = state.midTermMemory || [];
      this.longTerm = state.longTermMemory || [];
    }
  }

  public archiveInteraction(role: 'user' | 'bot', content: string, concepts: string[], emotionalWeight: number) {
    const memory: Memory = { 
        id: Math.random().toString(36).substr(2, 9),
        role, 
        content, 
        timestamp: Date.now(), 
        concepts, 
        emotional_weight: emotionalWeight,
        access_count: 0
    };

    // 1. Short Term (Immediate Working Memory)
    this.shortTerm.push(memory);
    if (this.shortTerm.length > 5) {
      const moved = this.shortTerm.shift();
      if (moved) this.midTerm.push(moved);
    }

    // 2. Mid Term (Session Context)
    if (this.midTerm.length > 20) {
      const moved = this.midTerm.shift();
      // Only consolidate important memories to Long Term
      if (moved && (moved.emotional_weight > 0.4 || moved.concepts.length > 2)) {
        this.longTerm.push(moved);
      }
    }
  }

  /**
   * Associative Retrieval
   * Finds memories that share high conceptual overlap with the input
   */
  public retrieveAssociative(activeConcepts: string[], limit: number = 3): Memory[] {
    const allMemories = [...this.longTerm, ...this.midTerm];
    
    // Score memories based on concept intersection
    const scored = allMemories.map(mem => {
      const overlap = mem.concepts.filter(c => activeConcepts.includes(c)).length;
      const recencyBonus = (Date.now() - mem.timestamp) < 60000 ? 0.5 : 0; // Bonus for very recent
      const relevance = overlap + (mem.emotional_weight * 2) + recencyBonus;
      return { mem, relevance };
    });

    // Sort by relevance and take top N
    const results = scored
      .filter(s => s.relevance > 0.5) // Minimum relevance threshold
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(s => {
        s.mem.access_count++; // Reinforce accessed memory
        return s.mem;
      });

    return results;
  }

  public exportState() {
    return {
      shortTermMemory: this.shortTerm,
      midTermMemory: this.midTerm,
      longTermMemory: this.longTerm
    };
  }
  
  public getStats() {
      return { short: this.shortTerm.length, mid: this.midTerm.length, long: this.longTerm.length };
  }
}