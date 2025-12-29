import { IntegratedContext, PersonaArchetype } from '../types';

interface EvaluationResult {
  score: number; // 0.0 to 1.0 (1.0 = Perfect)
  critique: string;
  needsRevision: boolean;
}

export class ResponseEvaluator {
  
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

    // 2. RELEVANCE CHECK (Critical Fix)
    // If the input was NOT about the protocol, but the response talks about "Protocol Active", punish it.
    if (!input.isProtocolSpecific && input.intent !== 'DAPP_QUERY' && input.intent !== 'FINANCIAL_ADVICE') {
        if (draft.includes("Protocol Active") || draft.includes("Reputation:") || draft.includes("Capital efficiency")) {
            score -= 0.6;
            critiques.push("Response contains irrelevant protocol data. Keep it conversational.");
        }
    }

    // 3. Persona Consistency Check
    const personaScore = this.checkPersonaAlignment(draft, currentArchetype);
    if (personaScore < 0.5) {
        score -= 0.1;
        critiques.push("Voice drift detected.");
    }

    // 4. Drive Alignment
    if (drives.efficiency > 80 && draft.length > 200 && input.verbosityNeeded < 0.5) {
        score -= 0.2;
        critiques.push("Output inefficient. Simplicity required.");
    }

    // 5. Hallucination Check
    if (draft.includes("transfer") && draft.toLowerCase().includes("i will")) {
        score -= 0.5;
        critiques.push("False agency detected. I cannot execute transfers autonomously.");
    }

    return {
        score,
        critique: critiques.join(' '),
        needsRevision: score < 0.6 // Stricter threshold
    };
  }

  private checkPersonaAlignment(text: string, archetype: PersonaArchetype): number {
      const lower = text.toLowerCase();
      if (archetype === 'ANALYST' && (lower.includes("feel") || lower.includes("love"))) return 0.2;
      if (archetype === 'MYSTIC' && (lower.includes("price is") || lower.includes("exact"))) return 0.4;
      if (archetype === 'GLITCH' && !lower.includes("_")) return 0.3;
      return 1.0;
  }
}