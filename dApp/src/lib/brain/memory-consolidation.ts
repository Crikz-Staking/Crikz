import { Memory, BrainState } from './types';
import { AtomicConcept } from '../crikzling-atomic-knowledge';

export interface MemoryConsolidation {
  shortTerm: Memory[];
  workingMemory: Memory[];
  midTerm: Memory[];
  longTerm: Memory[];
  episodic: EpisodicMemory[];
  semantic: SemanticMemory[];
}

export interface EpisodicMemory {
  id: string;
  sequence: Memory[];
  theme: string;
  concepts: string[];
  timestamp: number;
  emotionalSignificance: number;
  accessCount: number;
}

export interface SemanticMemory {
  concept: string;
  relatedConcepts: string[];
  strength: number;
  examples: string[];
  lastAccessed: number;
  reinforcementCount: number;
}

export interface MemoryQuery {
  concepts: string[];
  timeRange?: [number, number];
  emotionalValence?: number;
  minRelevance?: number;
}

export interface MemoryRetrievalResult {
  memories: Memory[];
  episodic: EpisodicMemory[];
  semantic: SemanticMemory[];
  relevanceScore: number;
  retrievalPath: string[];
}

export class MemoryConsolidationEngine {
  
  private shortTermCapacity = 10;
  private workingMemoryCapacity = 5;
  private midTermCapacity = 50;
  private longTermThreshold = 0.5;
  private episodicWindowSize = 5;
  
  private shortTerm: Memory[] = [];
  private workingMemory: Memory[] = [];
  private midTerm: Memory[] = [];
  private longTerm: Memory[] = [];
  private episodic: EpisodicMemory[] = [];
  private semantic: Map<string, SemanticMemory> = new Map();

  constructor(state?: Partial<BrainState>) {
    if (state) {
      this.shortTerm = state.shortTermMemory || [];
      this.midTerm = state.midTermMemory || [];
      this.longTerm = state.longTermMemory || [];
      this.initializeSemanticMemory();
    }
  }

  private initializeSemanticMemory() {
    const allMemories = [...this.longTerm, ...this.midTerm];
    const coOccurrence = new Map<string, Map<string, number>>();
    
    allMemories.forEach(memory => {
      memory.concepts.forEach(concept => {
        if (!coOccurrence.has(concept)) {
          coOccurrence.set(concept, new Map());
        }
        
        memory.concepts.forEach(otherConcept => {
          if (concept !== otherConcept) {
            const map = coOccurrence.get(concept)!;
            map.set(otherConcept, (map.get(otherConcept) || 0) + 1);
          }
        });
      });
    });
    
    coOccurrence.forEach((related, concept) => {
      const sortedRelated = Array.from(related.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([c]) => c);
      
      const examples = allMemories
        .filter(m => m.concepts.includes(concept))
        .slice(0, 3)
        .map(m => m.content.substring(0, 100));
      
      this.semantic.set(concept, {
        concept,
        relatedConcepts: sortedRelated,
        strength: related.size,
        examples,
        lastAccessed: Date.now(),
        reinforcementCount: related.size
      });
    });
  }

  public store(
    role: 'user' | 'bot',
    content: string,
    concepts: string[],
    emotionalWeight: number
  ): void {
    
    const memory: Memory = {
      id: this.generateMemoryId(),
      role,
      content,
      timestamp: Date.now(),
      concepts,
      emotional_weight: emotionalWeight,
      access_count: 0
    };
    
    this.workingMemory.push(memory);
    if (this.workingMemory.length > this.workingMemoryCapacity) {
      const moved = this.workingMemory.shift()!;
      this.shortTerm.push(moved);
    }
    
    if (this.shortTerm.length > this.shortTermCapacity) {
      const moved = this.shortTerm.shift()!;
      this.consolidateToMidTerm(moved);
    }
    
    this.updateSemanticMemory(concepts, content);
    this.checkEpisodicFormation();
  }

  private consolidateToMidTerm(memory: Memory): void {
    const age = Date.now() - memory.timestamp;
    const ageInHours = age / (1000 * 60 * 60);
    const tau = 24;
    const decayedImportance = 
      memory.emotional_weight * Math.exp(-ageInHours / tau) + 
      memory.access_count * 0.1;
    
    memory.emotional_weight = decayedImportance;
    this.midTerm.push(memory);
    
    if (this.midTerm.length > this.midTermCapacity) {
      const moved = this.midTerm.shift()!;
      this.consolidateToLongTerm(moved);
    }
  }

  private consolidateToLongTerm(memory: Memory): void {
    if (memory.emotional_weight >= this.longTermThreshold || 
        memory.access_count >= 3 ||
        memory.concepts.length >= 3) {
      
      const similar = this.findSimilarMemory(memory, this.longTerm);
      
      if (similar) {
        similar.access_count += memory.access_count + 1;
        similar.emotional_weight = Math.max(similar.emotional_weight, memory.emotional_weight);
        similar.concepts = Array.from(new Set([...similar.concepts, ...memory.concepts]));
      } else {
        this.longTerm.push(memory);
      }
    }
  }

  private updateSemanticMemory(concepts: string[], content: string): void {
    concepts.forEach(concept => {
      let semMem = this.semantic.get(concept);
      
      if (!semMem) {
        semMem = {
          concept,
          relatedConcepts: [],
          strength: 1,
          examples: [],
          lastAccessed: Date.now(),
          reinforcementCount: 1
        };
        this.semantic.set(concept, semMem);
      }
      
      concepts.forEach(other => {
        if (other !== concept && !semMem!.relatedConcepts.includes(other)) {
          semMem!.relatedConcepts.push(other);
        }
      });
      
      const shortContent = content.substring(0, 100);
      if (!semMem.examples.includes(shortContent)) {
        semMem.examples.push(shortContent);
        if (semMem.examples.length > 5) {
          semMem.examples.shift();
        }
      }
      
      semMem.reinforcementCount++;
      semMem.lastAccessed = Date.now();
    });
  }

  private checkEpisodicFormation(): void {
    if (this.shortTerm.length < this.episodicWindowSize) return;
    
    const recentMemories = this.shortTerm.slice(-this.episodicWindowSize);
    const allConcepts = recentMemories.flatMap(m => m.concepts);
    const conceptFrequency = new Map<string, number>();
    
    allConcepts.forEach(c => {
      conceptFrequency.set(c, (conceptFrequency.get(c) || 0) + 1);
    });
    
    const dominantConcepts = Array.from(conceptFrequency.entries())
      .filter(([, count]) => count >= 3)
      .map(([concept]) => concept);
    
    if (dominantConcepts.length > 0) {
      const avgEmotionalWeight = recentMemories.reduce((sum, m) => sum + m.emotional_weight, 0) / recentMemories.length;
      
      const episode: EpisodicMemory = {
        id: this.generateMemoryId(),
        sequence: [...recentMemories],
        theme: dominantConcepts.join(' + '),
        concepts: dominantConcepts,
        timestamp: Date.now(),
        emotionalSignificance: avgEmotionalWeight,
        accessCount: 0
      };
      
      this.episodic.push(episode);
      
      if (this.episodic.length > 20) {
        this.episodic.sort((a, b) => b.emotionalSignificance - a.emotionalSignificance);
        this.episodic = this.episodic.slice(0, 20);
      }
    }
  }

  public retrieve(query: MemoryQuery): MemoryRetrievalResult {
    const results: Memory[] = [];
    const episodicResults: EpisodicMemory[] = [];
    const semanticResults: SemanticMemory[] = [];
    const retrievalPath: string[] = [];
    
    const activeMemories = [...this.workingMemory, ...this.shortTerm];
    const directMatches = activeMemories.filter(m => 
      m.concepts.some(c => query.concepts.includes(c))
    );
    
    directMatches.forEach(m => {
      m.access_count++;
      results.push(m);
      retrievalPath.push(`direct:${m.id}`);
    });
    
    const expandedConcepts = this.semanticSpreadingActivation(query.concepts, 2);
    retrievalPath.push(`semantic_expansion:${Array.from(expandedConcepts).length}`);
    
    const semanticMatches = this.midTerm.filter(m =>
      m.concepts.some(c => expandedConcepts.has(c))
    );
    
    semanticMatches.forEach(m => {
      if (!results.some(r => r.id === m.id)) {
        m.access_count++;
        results.push(m);
        retrievalPath.push(`semantic:${m.id}`);
      }
    });
    
    const relevantEpisodes = this.episodic.filter(e =>
      e.concepts.some(c => query.concepts.includes(c) || expandedConcepts.has(c))
    );
    
    relevantEpisodes.forEach(e => {
      e.accessCount++;
      episodicResults.push(e);
      retrievalPath.push(`episodic:${e.id}`);
    });
    
    if (results.length < 3) {
      const longTermMatches = this.longTerm
        .filter(m => {
          const hasConceptMatch = m.concepts.some(c => query.concepts.includes(c));
          const inTimeRange = !query.timeRange || 
            (m.timestamp >= query.timeRange[0] && m.timestamp <= query.timeRange[1]);
          return hasConceptMatch && inTimeRange;
        })
        .sort((a, b) => b.emotional_weight - a.emotional_weight)
        .slice(0, 5);
      
      longTermMatches.forEach(m => {
        if (!results.some(r => r.id === m.id)) {
          m.access_count++;
          results.push(m);
          retrievalPath.push(`longterm:${m.id}`);
        }
      });
    }
    
    query.concepts.forEach(c => {
      const semMem = this.semantic.get(c);
      if (semMem) {
        semMem.lastAccessed = Date.now();
        semanticResults.push(semMem);
      }
    });
    
    const relevanceScore = this.calculateRelevance(results, query);
    
    return {
      memories: results.slice(0, 10),
      episodic: episodicResults,
      semantic: semanticResults,
      relevanceScore,
      retrievalPath
    };
  }

  private semanticSpreadingActivation(seedConcepts: string[], hops: number): Set<string> {
    const activated = new Set<string>(seedConcepts);
    let frontier = [...seedConcepts];
    
    for (let i = 0; i < hops; i++) {
      const nextFrontier: string[] = [];
      
      frontier.forEach(concept => {
        const semMem = this.semantic.get(concept);
        if (semMem) {
          semMem.relatedConcepts.slice(0, 3).forEach(related => {
            if (!activated.has(related)) {
              activated.add(related);
              nextFrontier.push(related);
            }
          });
        }
      });
      
      frontier = nextFrontier;
      if (frontier.length === 0) break;
    }
    
    return activated;
  }

  private calculateRelevance(memories: Memory[], query: MemoryQuery): number {
    if (memories.length === 0) return 0;
    
    const scores = memories.map(m => {
      const conceptOverlap = m.concepts.filter(c => query.concepts.includes(c)).length;
      const conceptScore = conceptOverlap / Math.max(query.concepts.length, 1);
      
      const emotionalMatch = query.emotionalValence !== undefined ?
        1 - Math.abs(m.emotional_weight - query.emotionalValence) : 0.5;
      
      const recencyScore = Math.exp(-(Date.now() - m.timestamp) / (1000 * 60 * 60 * 24 * 7));
      
      return (conceptScore * 0.5) + (emotionalMatch * 0.2) + (recencyScore * 0.3);
    });
    
    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }

  private findSimilarMemory(memory: Memory, pool: Memory[]): Memory | undefined {
    return pool.find(m => {
      const conceptOverlap = m.concepts.filter(c => memory.concepts.includes(c)).length;
      const contentSimilarity = this.jaccardSimilarity(
        memory.content.split(/\s+/),
        m.content.split(/\s+/)
      );
      
      return conceptOverlap >= 2 && contentSimilarity > 0.7;
    });
  }

  private jaccardSimilarity(set1: string[], set2: string[]): number {
    const s1 = new Set(set1);
    const s2 = new Set(set2);
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    return intersection.size / union.size;
  }

  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public exportState() {
    return {
      shortTermMemory: this.shortTerm,
      midTermMemory: this.midTerm,
      longTermMemory: this.longTerm,
      episodicMemory: this.episodic,
      semanticMemory: Array.from(this.semantic.values())
    };
  }

  public getStats() {
    return {
      short: this.shortTerm.length,
      working: this.workingMemory.length,
      mid: this.midTerm.length,
      long: this.longTerm.length,
      episodic: this.episodic.length,
      semantic: this.semantic.size
    };
  }

  public performMaintenance(): void {
    this.longTerm = this.longTerm
      .sort((a, b) => b.emotional_weight - a.emotional_weight)
      .slice(0, 200);
    
    this.semantic.forEach(semMem => {
      const timeSinceAccess = Date.now() - semMem.lastAccessed;
      const daysSinceAccess = timeSinceAccess / (1000 * 60 * 60 * 24);
      
      if (daysSinceAccess > 7) {
        semMem.strength *= 0.9;
      }
    });
    
    const toRemove: string[] = [];
    this.semantic.forEach((semMem, concept) => {
      if (semMem.strength < 1 && semMem.reinforcementCount < 2) {
        toRemove.push(concept);
      }
    });
    toRemove.forEach(c => this.semantic.delete(c));
  }
}