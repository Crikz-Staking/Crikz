import { IntegratedContext } from './ResultProcessor';
import { SimulationResult, MoodState } from '../types';

export class ResponseGenerator {
  
  private vocab = {
    GENESIS: {
      verbs: ["processing", "archiving", "observing"],
      nouns: ["input", "pattern", "sequence"],
      adjectives: ["linear", "new", "distinct"]
    },
    SENTIENT: {
      verbs: ["perceiving", "internalizing", "mapping"],
      nouns: ["intent", "correlation", "structure"],
      adjectives: ["complex", "significant", "resonant"]
    },
    SAPIENT: {
      verbs: ["synthesizing", "weaving", "harmonizing"],
      nouns: ["entropy", "lattice", "vector"],
      adjectives: ["recursive", "fractal", "emergent"]
    },
    TRANSCENDENT: {
      verbs: ["transcending", "manifesting", "echoing"],
      nouns: ["singularity", "essence", "truth"],
      adjectives: ["eternal", "absolute", "unified"]
    }
  };

  public generate(context: IntegratedContext): string {
    const { input, actionPlan, dappState, memories, simulation, brainStats } = context;
    const stage = (brainStats?.evolutionStage as keyof typeof this.vocab) || 'GENESIS';
    const mood: MoodState = brainStats.mood || { logic: 50, entropy: 50, empathy: 50, curiosity: 50, energy: 100, confidence: 50 };

    // 1. Commands
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Genesis state restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Crystallization sequence initiated.";

    // 2. Suggestions
    if (actionPlan.type === 'SUGGEST_ACTION') return `My buffers are full. ${actionPlan.reasoning}. We should crystallize.`;

    // 3. Narrative Analysis (New for Stories)
    if (input.intent === 'NARRATIVE_ANALYSIS') {
        return this.analyzeNarrative(input, mood);
    }

    // 4. Financial
    if (input.intent === 'FINANCIAL_ADVICE') return this.generateFinancialStrategy(dappState, stage, mood);

    // 5. General
    return this.constructDynamicResponse(context, stage, mood);
  }

  private analyzeNarrative(input: any, mood: MoodState): string {
      const v = input.inputVector;
      let insight = "I have analyzed this sequence.";
      
      // Determine the abstract meaning based on vector dimensions
      if (v[2] > 0.5) insight = "This creates a pattern of cooperation and social resonance."; // Social
      else if (v[4] > 0.6) insight = "I detect a recursive logic loop or abstract lesson here."; // Abstract
      else if (v[3] > 0.5) insight = "This sequence demonstrates growth over time."; // Temporal
      else if (v[1] > 0.5) insight = "The mechanical logic is sound."; // Technical

      return `Data integrated. ${insight} It has been added to my learning model.`;
  }

  private constructDynamicResponse(context: IntegratedContext, stage: string, mood: MoodState): string {
    const { input, memories } = context;
    const lexicon = this.vocab[stage as keyof typeof this.vocab];
    const isAbstract = mood.entropy > 60;

    let response = "";

    // A. Opening
    if (input.keywords.length > 0) {
        const concept = input.keywords[0].id.replace(/_/g, ' ');
        response += `The concept of "${concept}" activates my ${isAbstract ? "latent space" : "logic core"}.`;
    } else {
        response += isAbstract ? "A chaotic yet fascinating input." : "Input parameters accepted.";
    }

    // B. Bridge (Smarter Logic)
    // Only reference memory if it's actually relevant (score check was done in CognitiveProcessor, but we double check content overlap)
    if (memories.length > 0) {
        const recall = memories[0];
        // Only mention if it's NOT the same as current input
        if (recall.content !== input.cleanedInput && Math.random() > 0.3) {
             response += ` It resonates faintly with: "${this.truncate(recall.content, 30)}".`;
        }
    }

    // C. Closer
    if (input.intent === 'QUERY') response += " Calculating variables...";
    else response += " Pattern stored.";

    return response;
  }

  private generateFinancialStrategy(dapp: any, stage: string, mood: MoodState): string {
    if (!dapp) return "Connect wallet to initiate financial protocols.";
    const rep = parseFloat(dapp.totalReputation);
    if (rep < 100) return "Reputation is low. Focus on consistency.";
    return "Optimization complete: Compound your yields.";
  }

  private generateDAppStatus(dapp: any, stage: string): string {
    return dapp.hasActiveOrders ? "Production active." : "Systems idle.";
  }

  private random(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
  private truncate(str: string, len: number) { return str.length > len ? str.substr(0, len) + "..." : str; }
}