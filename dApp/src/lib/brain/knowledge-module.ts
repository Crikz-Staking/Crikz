// src/lib/brain/knowledge-module.ts

import { AtomicConcept, ConceptRelation, ATOMIC_PRIMITIVES, ATOMIC_RELATIONS } from '../crikzling-atomic-knowledge';
// FIX: Using alias path to avoid relative path hell and duplicates
import { FIBONACCI_KNOWLEDGE, FIBONACCI_RELATIONS } from '@/lib/knowledge/fibonacci-math.knowledge';
import { BLOCKCHAIN_KNOWLEDGE, BLOCKCHAIN_RELATIONS } from '@/lib/knowledge/blockchain.knowledge';
import { CRIKZ_PROTOCOL_KNOWLEDGE, CRIKZ_PROTOCOL_RELATIONS } from '@/lib/knowledge/crikz-protocol.knowledge';
import { COMMUNICATION_KNOWLEDGE, COMMUNICATION_RELATIONS } from '@/lib/knowledge/communication.knowledge';
import { ENGLISH_LANGUAGE_KNOWLEDGE, ENGLISH_LANGUAGE_RELATIONS } from '@/lib/knowledge/english-language.knowledge';
import { MATHEMATICS_KNOWLEDGE, MATHEMATICS_RELATIONS } from '@/lib/knowledge/mathematics.knowledge';
import { TIME_KNOWLEDGE, TIME_RELATIONS } from '@/lib/knowledge/time.knowledge';
import { COMPUTER_SCIENCE_KNOWLEDGE, COMPUTER_SCIENCE_RELATIONS } from '@/lib/knowledge/computer-science.knowledge';
import { ADVANCED_BLOCKCHAIN_KNOWLEDGE, ADVANCED_BLOCKCHAIN_RELATIONS } from '@/lib/knowledge/advanced-blockchain.knowledge';
import { BrainState } from './types';

export interface KnowledgeModuleState {
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  metadata: {
    domain: string;
    version: string;
    lastUpdated: number;
  };
}

/**
 * Parses knowledge definitions from formatted strings
 * Format: "term := definition"
 */
function parseKnowledgeString(knowledgeStr: string, domain: string): Record<string, AtomicConcept> {
  const concepts: Record<string, AtomicConcept> = {};
  const lines = knowledgeStr.split('\n').filter(line => line.trim().length > 0);
  
  lines.forEach(line => {
    if (!line.includes(':=')) return;
    
    const [term, definition] = line.split(':=').map(s => s.trim());
    if (!term || !definition) return;
    
    const conceptId = term.toLowerCase().replace(/\s+/g, '_');
    
    concepts[conceptId] = {
      id: conceptId,
      essence: definition,
      semanticField: term.includes('_') ? [term.replace(/_/g, ' ')] : [],
      examples: [],
      abstractionLevel: 0.7,
      technical_depth: 0.8,
      domain: domain as any
    };
  });
  return concepts;
}

export class KnowledgeModule {
  public concepts: Record<string, AtomicConcept> = {};
  public relations: ConceptRelation[] = [];
  public unsavedCount: number = 0;

  constructor(state?: Partial<BrainState>) {
    // 1. Load Static Knowledge Base
    const staticConcepts = {
      ...ATOMIC_PRIMITIVES,
      ...parseKnowledgeString(FIBONACCI_KNOWLEDGE, 'NUMERICAL'),
      ...parseKnowledgeString(BLOCKCHAIN_KNOWLEDGE, 'TECHNICAL'),
      ...parseKnowledgeString(CRIKZ_PROTOCOL_KNOWLEDGE, 'FINANCIAL'),
      ...parseKnowledgeString(COMMUNICATION_KNOWLEDGE, 'LINGUISTIC'),
      ...parseKnowledgeString(ENGLISH_LANGUAGE_KNOWLEDGE, 'LINGUISTIC'),
      ...parseKnowledgeString(MATHEMATICS_KNOWLEDGE, 'NUMERICAL'),
      ...parseKnowledgeString(TIME_KNOWLEDGE, 'TEMPORAL'),
      ...parseKnowledgeString(COMPUTER_SCIENCE_KNOWLEDGE, 'TECHNICAL'),
      ...parseKnowledgeString(ADVANCED_BLOCKCHAIN_KNOWLEDGE, 'TECHNICAL')
    };
    const staticRelations: ConceptRelation[] = [
        ...ATOMIC_RELATIONS,
        ...FIBONACCI_RELATIONS.map(r => ({ ...r, learned_at: 0 })),
        ...BLOCKCHAIN_RELATIONS.map(r => ({ ...r, learned_at: 0 })),
        ...CRIKZ_PROTOCOL_RELATIONS.map(r => ({ ...r, learned_at: 0 })),
        ...COMMUNICATION_RELATIONS.map(r => ({ ...r, learned_at: 0 })),
        ...ENGLISH_LANGUAGE_RELATIONS.map(r => ({ ...r, learned_at: 0 })),
        ...MATHEMATICS_RELATIONS.map(r => ({ ...r, learned_at: 0 })),
        ...TIME_RELATIONS.map(r => ({ ...r, learned_at: 0 })),
        ...COMPUTER_SCIENCE_RELATIONS.map(r => ({ ...r, learned_at: 0 })),
        ...ADVANCED_BLOCKCHAIN_RELATIONS.map(r => ({ ...r, learned_at: 0 }))
    ] as ConceptRelation[];

    // 2. Hydrate from State or Defaults
    this.concepts = state?.concepts || staticConcepts;
    this.relations = state?.relations || staticRelations;
    this.unsavedCount = state?.unsavedDataCount || 0;
  }

  public activateNetwork(seedIds: string[], decayFactor: number = 0.6): Record<string, number> {
    const activationMap: Record<string, number> = {};
    const queue: { id: string, energy: number }[] = [];

    // Ignite Seeds
    seedIds.forEach(id => {
      if (this.concepts[id]) {
        activationMap[id] = 1.0;
        queue.push({ id, energy: 1.0 });
      }
    });

    // Propagate
    let steps = 0;
    while (queue.length > 0 && steps < 100) {
      const current = queue.shift()!;
      if (current.energy < 0.15) continue; 

      const outgoing = this.relations.filter(r => r.from === current.id);
      for (const rel of outgoing) {
        const transferEnergy = current.energy * rel.strength * decayFactor;
        if ((activationMap[rel.to] || 0) < transferEnergy) {
          activationMap[rel.to] = transferEnergy;
          queue.push({ id: rel.to, energy: transferEnergy });
        }
      }
      steps++;
    }

    return activationMap;
  }

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
          this.relations.push({
            from: a,
            to: b,
            type: 'associates', // @ts-ignore
            strength: 0.1,
            learned_at: Date.now(),
            last_activated: Date.now()
          });
          this.unsavedCount++;
        }
      }
    }
  }

  public getConcept(id: string): AtomicConcept | undefined {
    return this.concepts[id];
  }
  
  public addKnowledge(newConcepts: Record<string, AtomicConcept>, count: number) {
      this.concepts = { ...this.concepts, ...newConcepts };
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

export function parseExternalKnowledgeFile(content: string, domain: string = 'TECHNICAL'): {
  concepts: Record<string, AtomicConcept>;
  count: number;
} {
  const concepts: Record<string, AtomicConcept> = {};
  let count = 0;
  
  const lines = content.split('\n');
  lines.forEach(line => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return; 
    
    let separator = ':=';
    if (!clean.includes(':=') && clean.includes(':')) separator = ':';
    if (!clean.includes(separator)) return;
    
    const [term, definition] = clean.split(separator).map(s => s.trim());
    if (!term || !definition) return;
    
    const conceptId = term.toLowerCase().replace(/\s+/g, '_');
    
    if (!concepts[conceptId]) {
      concepts[conceptId] = {
        id: conceptId,
        essence: definition,
        semanticField: [term],
        examples: [],
        abstractionLevel: 0.6,
        technical_depth: 0.7,
        domain: domain as any
      };
      count++;
    }
  });
  return { concepts, count };
}