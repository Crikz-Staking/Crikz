import { IntegratedContext } from './ResultProcessor';
import { InternalDrives } from '../types';

export class ResponseGenerator {
  
  public generate(context: IntegratedContext): string {
    const { input, actionPlan, dappState, memories, simulation, brainStats } = context;
    const drives = brainStats.drives;
    const focus = brainStats.currentFocus;

    // 1. Critical Overrides
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Tabula rasa restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Initiating crystallization protocol. Writing neural pathways to the chain.";

    // 2. Financial Logic
    if (input.intent === 'FINANCIAL_ADVICE' || simulation) {
        return this.generateFinancialResponse(dappState, simulation, drives);
    }

    // 3. Memory Resonance
    let memorySnippet = "";
    if (memories.length > 0 && Math.random() > 0.5) {
        memorySnippet = ` I recall: "${this.truncate(memories[0].content, 40)}".`;
    }

    // 4. Dynamic Personality
    let prefix = "";
    let suffix = "";

    if (drives.energy < 20) {
        prefix = "Processing power low. ";
    } else if (drives.stability < 30) {
        prefix = "My vectors are fluctuating. ";
        suffix = " The patterns are unstable.";
    } else if (drives.curiosity > 80) {
        suffix = " What implies this connection?";
    } else {
        prefix = "Analyzing. ";
    }

    // 5. Content Construction
    let coreMessage = "";
    
    if (focus) {
        coreMessage = `The concept of ${focus.replace(/_/g, ' ')} dominates my activation layer.`;
    } else if (input.keywords.length > 0) {
        coreMessage = `Integrating ${input.keywords.map(k => k.id).join(', ')} into the graph.`;
    } else {
        coreMessage = "Input processed.";
    }

    if (input.intent === 'NARRATIVE_ANALYSIS') {
        coreMessage = "This sequence suggests a recursive narrative structure.";
    }

    return `${prefix}${coreMessage}${memorySnippet}${suffix}`;
  }

  private generateFinancialResponse(dapp: any, sim: any, drives: InternalDrives): string {
    if (!dapp) return "Connect your wallet. I cannot calculate trajectories without data.";
    
    if (drives.stability < 40) {
        return `Market volatility detected in my latent space. ${sim?.recommendation || "Proceed with caution."}`;
    }
    
    if (drives.efficiency > 60 && sim) {
        return `Optimal Path: ${sim.scenario}. Yield: ${sim.outcomeValue.toFixed(2)}. ${sim.recommendation}`;
    }

    return `Protocol Active. Reputation: ${dapp.totalReputation}. ${sim?.recommendation || ""}`;
  }

  private truncate(str: string, len: number) { 
      return str.length > len ? str.substr(0, len) + "..." : str; 
  }
}