import { IntegratedContext } from './processors/ResultProcessor';

export class NarrativeModule {
  
  public enhanceResponse(baseResponse: string, context: IntegratedContext): string {
      const stage = context.brainStats.evolutionStage;
      let refined = baseResponse;

      // 1. Vocabulary Filter based on Stage
      if (stage === 'GENESIS') {
          // Precise, curt, technical
          refined = refined.replace(/intrinsically tied to/g, "linked to");
          refined = refined.replace(/collapsing probability wave/g, "calculating outcome");
      } 
      else if (stage === 'TRANSCENDENT') {
          // Expanded, abstract, sophisticated
          // Only replace if it fits the flow, avoided hard replacement that breaks grammar
          if(refined.includes("calculating")) refined = refined.replace("calculating", "traversing the probabilistic lattice of");
      }

      // 2. Drive Influence (Subtle coloring, not text glitches)
      const stability = context.brainStats.drives.stability;
      if (stability < 30) {
          refined += " [WARNING: High System Entropy]";
      }
      
      return refined;
  }

  // Improved concept chainer to sound less random
  public constructConceptChain(concepts: string[], tone: 'LOGICAL' | 'POETIC'): string {
    if (concepts.length < 2) return "";

    const c1 = concepts[0].replace(/_/g, ' ');
    const c2 = concepts[1].replace(/_/g, ' ');

    if (tone === 'LOGICAL') {
        return `Data suggests ${c1} is a functional prerequisite for ${c2}.`;
    } else {
        return `The pattern of ${c1} inherently reflects the structure of ${c2}.`;
    }
  }
}