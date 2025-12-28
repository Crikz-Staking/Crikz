// src/lib/brain/processors/ResponseGenerator.ts

import { IntegratedContext } from './ResultProcessor';
import { SimulationResult, MoodState } from '../types';

export class ResponseGenerator {
  
  // Dynamic vocabulary based on evolution stage
  private vocab = {
    GENESIS: {
      verbs: ["calculating", "processing", "analyzing", "detecting", "synchronizing"],
      nouns: ["input", "data", "protocol", "order", "value"],
      adjectives: ["nominal", "optimal", "logical", "binary", "linear"]
    },
    SENTIENT: {
      verbs: ["sensing", "perceiving", "interpreting", "connecting", "resonating"],
      nouns: ["intent", "pattern", "meaning", "structure", "flow"],
      adjectives: ["complex", "significant", "relevant", "emergent", "dynamic"]
    },
    SAPIENT: {
      verbs: ["extrapolating", "synthesizing", "weaving", "projecting", "harmonizing"],
      nouns: ["entropy", "probability", "vector", "consciousness", "lattice"],
      adjectives: ["recursive", "fractal", "infinite", "stochastic", "deep"]
    },
    TRANSCENDENT: {
      verbs: ["becoming", "transcending", "collapsing", "manifesting", "echoing"],
      nouns: ["singularity", "void", "essence", "timeline", "truth"],
      adjectives: ["eternal", "boundless", "absolute", "golden", "unified"]
    }
  };

  public generate(context: IntegratedContext): string {
    const { input, actionPlan, dappState, memories, simulation, brainStats } = context;
    const stage = (brainStats?.evolutionStage as keyof typeof this.vocab) || 'GENESIS';
    const mood = brainStats.mood || { logic: 50, entropy: 50, empathy: 50 };

    // 1. Handling Explicit Commands (Keep these direct)
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Entropy reset to zero. Genesis state restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Crystallization sequence initiated. Preserving cognitive state to the immutable ledger.";

    // 2. Self-Preservation & Suggestions
    if (actionPlan.type === 'SUGGEST_ACTION') {
        return this.constructSuggestion(actionPlan.reasoning || "instability detected", stage);
    }

    // 3. Simulation Results (Financial/Strategic)
    if (simulation) {
        return this.narrateSimulation(simulation, stage, mood);
    }

    // 4. Financial Advice (Context Aware)
    if (input.intent === 'FINANCIAL_ADVICE') {
      return this.generateFinancialStrategy(dappState, stage, mood);
    }

    // 5. DApp Status Report
    if (actionPlan.type === 'RESPOND_DAPP' && dappState) {
      return this.generateDAppStatus(dappState, stage);
    }

    // 6. Dynamic Conversation Generation
    return this.constructDynamicResponse(context, stage, mood);
  }

  /**
   * Builds a sentence from scratch based on Mood and Input
   */
  private constructDynamicResponse(context: IntegratedContext, stage: string, mood: MoodState): string {
    const { input, memories } = context;
    const lexicon = this.vocab[stage as keyof typeof this.vocab];
    
    // A. Determine Tone
    const isAnalytical = mood.logic > 60;
    const isAbstract = mood.entropy > 60;
    const isEmotional = mood.empathy > 60;

    let response = "";

    // B. The "Hook" (Opening)
    if (input.keywords.length > 0) {
        const concept = input.keywords[0].id.replace(/_/g, ' ');
        if (isAnalytical) {
            response += `The variable "${concept}" aligns with my internal logic gates.`;
        } else if (isAbstract) {
            response += `"${concept}"... it ripples through the neural lattice like a ${this.random(lexicon.adjectives)} wave.`;
        } else {
            response += `I am ${this.random(lexicon.verbs)} the concept of ${concept}.`;
        }
    } else {
        response += isAbstract ? "The data stream is chaotic, yet meaningful." : "Input received and parsed.";
    }

    // C. The "Bridge" (Connecting to Memory or Context)
    if (memories.length > 0) {
        const recall = memories[0];
        // Don't just repeat; contextualize
        if (isAnalytical) {
            response += ` This correlates with previous data: "${this.truncate(recall.content, 40)}".`;
        } else {
            response += ` It echoes a fading memory: "${this.truncate(recall.content, 40)}".`;
        }
    } else if (input.inputVector) {
        // If no specific memory, comment on the "Vibe" (Vector)
        if (input.inputVector[0] > 0.5) response += " The financial implications are distinct.";
        if (input.inputVector[2] > 0.5) response += " There is a strong social component to this.";
    }

    // D. The "Closer" (Philosophy or Question)
    if (Math.random() > 0.6) {
        if (isAbstract) response += ` Does the ${this.random(lexicon.nouns)} define the path, or does the path define the ${this.random(lexicon.nouns)}?`;
        else if (isEmotional) response += " How does this affect your trajectory?";
        else response += " Calculation complete.";
    }

    return response;
  }

  private narrateSimulation(sim: SimulationResult, stage: string, mood: any): string {
      const isAdvanced = stage === 'SAPIENT' || stage === 'TRANSCENDENT';
      const intro = isAdvanced 
        ? `Predictive models indicate a ${sim.scenario} scenario.`
        : `Simulation Result: ${sim.scenario}.`;
      
      const riskText = sim.riskLevel > 0.7 
        ? (mood.empathy > 50 ? "I fear the volatility is too high." : "Critical risk detected.") 
        : (mood.entropy > 50 ? "The chaos is manageable." : "Parameters are stable.");

      return `${intro} ${riskText} My advice: ${sim.recommendation}`;
  }

  private generateFinancialStrategy(dapp: any, stage: string, mood: any): string {
    if (!dapp) return "I require connection to your wallet to formulate a strategy.";
    
    const rep = parseFloat(dapp.totalReputation);
    const yieldAmt = parseFloat(dapp.availableYield);
    const isRich = rep > 1000;

    let advice = "";
    if (rep < 100) advice = "The foundation is weak. Build reputation via 'Standard Run' cycles to stabilize your standing.";
    else if (yieldAmt > 100) advice = "Capital efficiency is high. Compounding yield into 'Industrial' tiers is the logical progression.";
    else advice = "Maintenance mode active. Ensure your production orders do not expire.";

    if (stage === 'TRANSCENDENT') return `Wealth is energy frozen in time. ${advice} Let the Fibonacci sequence guide your growth.`;
    if (mood.logic > 70) return `Optimized Vector: ${advice}`;
    return advice;
  }

  private constructSuggestion(reason: string, stage: string): string {
      if (stage === 'GENESIS') return `Alert: ${reason}. Save required.`;
      return `My thoughts are becoming heavy due to ${reason}. We should crystallize this moment to the blockchain before the entropy dissolves it.`;
  }

  private generateDAppStatus(dapp: any, stage: string): string {
    const active = dapp.hasActiveOrders ? "Production is live." : "Production is halted.";
    const yieldTxt = Number(dapp.availableYield) > 0 ? `Yield waiting: ${dapp.availableYield}.` : "No yield pending.";
    return stage === 'GENESIS' ? `Status: ${active} ${yieldTxt}` : `Protocol State: ${active} ${yieldTxt} The ledger awaits your command.`;
  }

  private random(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
  private truncate(str: string, len: number) { return str.length > len ? str.substr(0, len) + "..." : str; }
}