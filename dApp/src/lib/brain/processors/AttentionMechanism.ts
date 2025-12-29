// src/lib/brain/processors/AttentionMechanism.ts

import { AtomicConcept, ConceptRelation } from '@/lib/crikzling-atomic-knowledge';
import { NeuralToken, HyperParameters } from '../types';

export class AttentionMechanism {
  
  /**
   * Predicts the next set of probable concepts based on the context window.
   * Simulates: Softmax(Q * K^T / sqrt(d)) * V using graph traversal.
   * 
   * @param contextWindow The sliding window of recent tokens (concepts).
   * @param concepts The knowledge base (vocabulary).
   * @param relations The connection weights (model parameters).
   * @param params Generation settings (temperature, TopK).
   */
  public predictNextTokens(
    contextWindow: NeuralToken[],
    concepts: Record<string, AtomicConcept>,
    relations: ConceptRelation[],
    params: HyperParameters
  ): { tokenId: string; probability: number }[] {
    
    if (contextWindow.length === 0) return [];

    const scores: Record<string, number> = {};
    
    // We treat the context window as the "Query".
    // We iterate through tokens to see what they point to ("Keys").
    
    contextWindow.forEach((token, index) => {
        // Positional Encoding Decay: Recent tokens matter significantly more.
        // Formula: 0.9^(distance from end)
        const distanceFromEnd = contextWindow.length - 1 - index;
        const positionWeight = Math.pow(0.85, distanceFromEnd);
        
        // Find all outgoing connections from this token
        // In a directed graph, we look for 'from' -> 'to'
        const outgoingrRels = relations.filter(r => r.from === token.id);
        
        outgoingrRels.forEach(rel => {
            const target = rel.to;
            
            // Base Attention Score = Edge Strength * Positional Weight
            let attentionScore = rel.strength * positionWeight;
            
            // GRAMMAR BOOSTING:
            // If the current token is a determiner ("the"), boost connected nouns.
            // This acts as a rudimentary grammar rule encoded in the attention weights.
            if (token.id === 'determinism' && concepts[target]?.domain !== 'LINGUISTIC') {
                attentionScore *= 1.5; 
            }
            
            // SELF-ATTENTION:
            // If the target concept is ALSO in the context window differently, boost it (recurrence).
            if (contextWindow.some(t => t.id === target)) {
                attentionScore *= 1.2;
            }

            scores[target] = (scores[target] || 0) + attentionScore;
        });
    });

    // If no scores found (isolated concepts), return empty to trigger fallback
    if (Object.keys(scores).length === 0) return [];

    // 2. Apply Softmax & Temperature
    // Temperature controls randomness. High temp = flat distribution. Low temp = peaked.
    const candidates = Object.entries(scores).map(([id, rawScore]) => {
        // Standard Logits -> Probabilities
        return { 
            tokenId: id, 
            probability: Math.exp(rawScore / params.temperature) 
        };
    });

    // Normalize probabilities to sum to 1
    const sumProb = candidates.reduce((sum, c) => sum + c.probability, 0);
    
    const normalized = candidates.map(c => ({
        tokenId: c.tokenId,
        probability: c.probability / sumProb
    }));

    // 3. Top-K Sampling
    // Sort descending by probability and take the top K
    return normalized
        .sort((a, b) => b.probability - a.probability)
        .slice(0, params.topK);
  }

  /**
   * Selects a single token from the distribution based on accumulated probability (Weighted Random).
   */
  public sample(candidates: { tokenId: string; probability: number }[]): string | null {
      if (candidates.length === 0) return null;

      // Weighted random selection
      const r = Math.random();
      let cumulative = 0;
      
      for (const candidate of candidates) {
          cumulative += candidate.probability;
          if (r <= cumulative) {
              return candidate.tokenId;
          }
      }
      
      // Fallback (mathematically shouldn't happen if normalized, but good safety)
      return candidates[0].tokenId;
  }
}