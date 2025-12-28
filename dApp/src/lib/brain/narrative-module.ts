import { IntegratedContext } from './processors/ResultProcessor';

export class NarrativeModule {
  
  public enhanceResponse(baseResponse: string, context: IntegratedContext): string {
      const stage = context.brainStats.evolutionStage;
      let refined = baseResponse;

      // 1. Vocabulary Filter based on Stage
      if (stage === 'GENESIS') {
          // Simple, direct, robotic
          refined = refined.replace(/intrinsically tied to/g, "linked to");
          refined = refined.replace(/collapsing wave function/g, "calculating");
          refined = refined.replace(/echoes/g, "matches");
      } 
      else if (stage === 'TRANSCENDENT') {
          // Abstract, poetic, complex
          refined = refined.replace(/calculating/g, "traversing the infinite probability drive");
          refined = refined.replace(/linked to/g, "entangled within the quantum lattice of");
          refined = refined.replace(/matches/g, "resonates with the frequency of");
      }

      // 2. Drive Influence (Glitching)
      const stability = context.brainStats.drives.stability;
      if (stability < 30) {
          refined = this.glitchText(refined);
      }
      
      return refined;
  }

  private glitchText(text: string): string {
      if (Math.random() > 0.7) return text + " ...[re-syncing]...";
      return text;
  }

  public constructConceptChain(concepts: string[], tone: 'LOGICAL' | 'POETIC'): string {
    if (concepts.length < 2) return "";

    const c1 = concepts[0].replace(/_/g, ' ');
    const c2 = concepts[1].replace(/_/g, ' ');

    if (tone === 'LOGICAL') {
        const connectors = [
            `suggests a correlation with`,
            `is functionally dependent on`,
            `serves as a prerequisite for`
        ];
        return `${c1} ${this.selectRandom(connectors)} ${c2}.`;
    } else {
        const connectors = [
            `dances with the shadow of`,
            `reflects the essence of`,
            `spirals towards`
        ];
        return `${c1} ${this.selectRandom(connectors)} ${c2}.`;
    }
  }

  private selectRandom(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
}