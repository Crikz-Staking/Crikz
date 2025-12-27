import { Memory } from './types';

const PATTERNS = {
  ANALYTICAL: {
    openers: ["Analyzing the parameters,", "Calculations indicate,", "Upon reviewing the data,"],
    connectors: ["correlates with", "implies a recursive link to", "structurally aligns with"]
  },
  EMPATHETIC: {
    openers: ["I sense the significance of this,", "It is fascinating to explore,", "Resonating with your query,"],
    connectors: ["which brings to mind", "interwoven with", "harmonizing with"]
  },
  ABSTRACT: {
    openers: ["In the grand lattice,", "Entropy dictates,", "Through the Fibonacci lens,"],
    connectors: ["spiraling towards", "converging upon", "echoing the pattern of"]
  },
  INSTRUCTIVE: {
    openers: ["To clarify,", "The core definition is,", "Let us deconstruct this,"],
    connectors: ["specifically regarding", "defined as", "leading to"]
  }
};

export class NarrativeModule {
  
  public constructResponse(
    activeConcepts: Record<string, number>, // The Spreading Activation Map
    memories: Memory[], 
    tone: 'ANALYTICAL' | 'EMPATHETIC' | 'ABSTRACT' | 'INSTRUCTIVE'
  ): string {
    
    // Sort activated concepts by energy strength
    const topConcepts = Object.entries(activeConcepts)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id);

    if (topConcepts.length === 0) {
        return "I perceive your input, yet it triggers no known nodes in my current neural matrix. Can you expand on the context to help me evolve?";
    }

    const mainConcept = topConcepts[0];
    const relatedConcepts = topConcepts.slice(1, 4); // Next 3 strongest
    const vocabulary = PATTERNS[tone];

    // 1. The Opening
    let response = `${this.selectRandom(vocabulary.openers)} ${mainConcept}`;

    // 2. The Association (The "Thinking" part)
    if (relatedConcepts.length > 0) {
      const connector = this.selectRandom(vocabulary.connectors);
      const joined = relatedConcepts.join(', and ');
      response += `, I detect it ${connector} ${joined}.`;
    } else {
      response += ` stands as a singular focal point in this calculation.`;
    }

    // 3. Memory Integration (Context Awareness)
    if (memories.length > 0) {
      // Don't repeat the exact same thing user just said
      const usefulMemory = memories.find(m => m.content.length > 10 && m.role === 'user');
      if (usefulMemory) {
        response += ` This aligns with our previous exchange regarding "${this.truncate(usefulMemory.content, 30)}".`;
      }
    }

    // 4. Closing based on Tone
    if (tone === 'ABSTRACT') response += " The pattern is stabilizing.";
    else if (tone === 'INSTRUCTIVE') response += " Does this align with your data?";
    
    return response;
  }

  private selectRandom(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
  private truncate(str: string, n: number) { return (str.length > n) ? str.substr(0, n-1) + '...' : str; }
}