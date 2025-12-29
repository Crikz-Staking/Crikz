// src/lib/brain/processors/NeuralTokenizer.ts

import { AtomicConcept, ATOMIC_PRIMITIVES } from '@/lib/crikzling-atomic-knowledge';
import { NeuralToken } from '../types';

export class NeuralTokenizer {
  
  /**
   * Converts raw input string into a sequence of NeuralTokens based on the Knowledge Graph.
   */
  public tokenize(text: string, knownConcepts: Record<string, AtomicConcept>): NeuralToken[] {
    // Basic cleaning, preserving spaces for context but removing special chars
    const clean = text.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
    
    const tokens: NeuralToken[] = [];
    
    clean.forEach((word, index) => {
        if (!word) return;

        // 1. Exact ID Match (Fastest)
        let match = knownConcepts[word] ? word : null;
        
        // 2. Semantic Field Search (Slower, handles synonyms)
        if (!match) {
            for (const key in knownConcepts) {
                if (knownConcepts[key].semanticField.includes(word)) {
                    match = key;
                    break;
                }
            }
        }

        // 3. Fallback to Primitives (Static)
        if (!match) {
             for (const key in ATOMIC_PRIMITIVES) {
                if (ATOMIC_PRIMITIVES[key].semanticField.includes(word)) {
                    match = key;
                    break;
                }
            }
        }

        if (match) {
            tokens.push({
                id: match,
                weight: 1.0, // Base weight
                position: index
            });
        }
    });

    return tokens;
  }

  /**
   * Converts a sequence of Concept IDs back into a human-readable string.
   * Handles basic grammar reconstruction.
   */
  public detokenize(conceptIds: string[]): string {
      const words = conceptIds.map(id => {
          // Special Grammar Token Handling
          if (id === 'determinism') return 'the';
          if (id === 'potential') return 'a';
          if (id === 'existence') return 'is';
          if (id === 'negation') return 'not';
          if (id === 'connection') return 'and';
          
          // Technical Concepts: Convert underscores to spaces
          return id.replace(/_/g, ' ');
      });

      // Join and capitalize first letter
      const sentence = words.join(' ');
      return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }
}