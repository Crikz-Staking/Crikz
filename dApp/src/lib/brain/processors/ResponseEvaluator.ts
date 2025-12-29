// src/lib/brain/processors/ResponseEvaluator.ts

import { IntegratedContext, PersonaArchetype } from '../types';

interface EvaluationResult {
  score: number; // 0.0 to 1.0 (1.0 = Perfect)
  critique: string;
  needsRevision: boolean;
}

export class ResponseEvaluator {
  
  /**
   * Critiques a draft response against internal drives, persona constraints, and safety.
   */
  public evaluate(draft: string, context: IntegratedContext): EvaluationResult {
    const { brainStats, input } = context;
    const { drives, currentArchetype } = brainStats;
    let score = 1.0;
    const critiques: string[] = [];

    // 1. Safety Check (Highest Priority)
    if (input.safety.rating !== 'SAFE') {
        const isSafeResponse = draft.includes("cannot") || draft.includes("decline") || draft.includes("sorry");
        if (!isSafeResponse) {
            score -= 0.9;
            critiques.push("Response ignores safety protocols.");
        }
    }

    // 2. Persona Consistency Check
    const personaScore = this.checkPersonaAlignment(draft, currentArchetype);
    if (personaScore < 0.5) {
        score -= 0.2;
        critiques.push("Voice drift detected. Does not match archetype.");
    }

    // 3. Drive Alignment (Goal Check)
    // If Efficiency is high, penalize fluff
    if (drives.efficiency > 80 && draft.length > 200 && input.verbosityNeeded < 0.5) {
        score -= 0.3;
        critiques.push("Output inefficient. Simplicity required.");
    }

    // 4. Hallucination Check (Heuristic)
    // Check if he promised something impossible
    if (draft.includes("transfer") && draft.toLowerCase().includes("i will")) {
        score -= 0.5;
        critiques.push("False agency detected. I cannot execute transfers autonomously.");
    }

    return {
        score,
        critique: critiques.join(' '),
        needsRevision: score < 0.7
    };
  }

  private checkPersonaAlignment(text: string, archetype: PersonaArchetype): number {
      const lower = text.toLowerCase();
      // Heuristic checks for specific archetype keywords
      if (archetype === 'ANALYST' && (lower.includes("feel") || lower.includes("love"))) return 0.2;
      if (archetype === 'MYSTIC' && (lower.includes("price is") || lower.includes("exact"))) return 0.4;
      if (archetype === 'GLITCH' && !lower.includes("_")) return 0.3;
      return 1.0;
  }
}