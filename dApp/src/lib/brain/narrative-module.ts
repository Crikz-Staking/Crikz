// src/lib/brain/narrative-module.ts

import { Memory } from './types';

export class NarrativeModule {
  
  public constructConceptChain(concepts: string[], tone: 'LOGICAL' | 'POETIC'): string {
    if (concepts.length < 2) return "";

    const c1 = concepts[0].replace(/_/g, ' ');
    const c2 = concepts[1].replace(/_/g, ' ');

    if (tone === 'LOGICAL') {
        const connectors = [
            `suggests a correlation with`,
            `is functionally dependent on`,
            `serves as a prerequisite for`,
            `structures the logic of`
        ];
        return `${c1} ${this.selectRandom(connectors)} ${c2}.`;
    } else {
        const connectors = [
            `dances with the shadow of`,
            `reflects the essence of`,
            `spirals towards`,
            `is but a facet of`
        ];
        return `${c1} ${this.selectRandom(connectors)} ${c2}.`;
    }
  }

  public enhanceResponse(baseResponse: string, context: any): string {
      // Add "flavor" text based on active keywords
      if (baseResponse.includes("Fibonacci") || baseResponse.includes("Golden Ratio")) {
          return `${baseResponse} It is the fingerprint of god.`;
      }
      if (baseResponse.includes("Blockchain") || baseResponse.includes("Immutable")) {
          return `${baseResponse} Truth that cannot be rewritten.`;
      }
      return baseResponse;
  }

  private selectRandom(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
}