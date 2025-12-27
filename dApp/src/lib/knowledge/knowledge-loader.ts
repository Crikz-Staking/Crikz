// src/lib/knowledge/knowledge-loader.ts

import { AtomicConcept, ConceptRelation } from '../crikzling-atomic-knowledge';
import { FIBONACCI_KNOWLEDGE, FIBONACCI_RELATIONS } from './fibonacci-math.knowledge';
import { BLOCKCHAIN_KNOWLEDGE, BLOCKCHAIN_RELATIONS } from './blockchain.knowledge';
import { CRIKZ_PROTOCOL_KNOWLEDGE, CRIKZ_PROTOCOL_RELATIONS } from './crikz-protocol.knowledge';

export interface KnowledgeModule {
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
    
    // Extract semantic variations
    const semanticField: string[] = [];
    if (term.includes('_')) {
      semanticField.push(term.replace(/_/g, ' '));
    }
    
    concepts[conceptId] = {
      id: conceptId,
      essence: definition,
      semanticField,
      examples: [],
      abstractionLevel: 0.7,
      frequency: 1,
      technical_depth: 0.8,
      domain: domain as any
    };
  });
  
  return concepts;
}

/**
 * Loads all knowledge modules into a unified structure
 */
export function loadAllKnowledgeModules(): KnowledgeModule {
  const fibonacciConcepts = parseKnowledgeString(FIBONACCI_KNOWLEDGE, 'NUMERICAL');
  const blockchainConcepts = parseKnowledgeString(BLOCKCHAIN_KNOWLEDGE, 'TECHNICAL');
  const protocolConcepts = parseKnowledgeString(CRIKZ_PROTOCOL_KNOWLEDGE, 'FINANCIAL');
  
  const allConcepts = {
    ...fibonacciConcepts,
    ...blockchainConcepts,
    ...protocolConcepts
  };
  
  const allRelations: ConceptRelation[] = [
    ...FIBONACCI_RELATIONS.map(r => ({ ...r, learned_at: Date.now() })),
    ...BLOCKCHAIN_RELATIONS.map(r => ({ ...r, learned_at: Date.now() })),
    ...CRIKZ_PROTOCOL_RELATIONS.map(r => ({ ...r, learned_at: Date.now() }))
  ];
  
  return {
    concepts: allConcepts,
    relations: allRelations,
    metadata: {
      domain: 'UNIFIED_KNOWLEDGE',
      version: '1.0.0',
      lastUpdated: Date.now()
    }
  };
}

/**
 * Loads knowledge from external text files
 * Format: "term: definition" per line
 */
export function parseExternalKnowledgeFile(content: string, domain: string = 'TECHNICAL'): {
  concepts: Record<string, AtomicConcept>;
  count: number;
} {
  const concepts: Record<string, AtomicConcept> = {};
  let count = 0;
  
  const lines = content.split('\n');
  
  lines.forEach(line => {
    const clean = line.trim();
    
    // Support both ":=" and ":" formats
    let separator = ':=';
    if (!clean.includes(':=') && clean.includes(':')) {
      separator = ':';
    }
    
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
        frequency: 1,
        technical_depth: 0.7,
        domain: domain as any
      };
      count++;
    }
  });
  
  return { concepts, count };
}