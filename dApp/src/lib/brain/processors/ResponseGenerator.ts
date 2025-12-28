import { IntegratedContext } from './ResultProcessor';
import { InternalDrives, SimulationResult } from '../types';

export class ResponseGenerator {
  
  public generateDeep(context: IntegratedContext): string {
    const { input, actionPlan, dappState, deepContext, brainStats } = context;
    const drives = brainStats.drives;
    
    // 1. Critical Overrides
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Tabula rasa restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Initiating crystallization protocol. Writing neural pathways to the chain.";

    // 2. Synthesize findings from Deep Thought Loop
    const finalCycle = deepContext[deepContext.length - 1];
    const associations = finalCycle?.newAssociations || [];
    const memories = finalCycle?.retrievedMemories || [];
    const simulation = finalCycle?.simResult || null;

    // 3. Construct Core Answer
    let response = "";

    if (input.intent === 'FINANCIAL_ADVICE' || simulation) {
        response = this.generateFinancialResponse(dappState, simulation, drives);
    } 
    else if (input.keywords.length > 0) {
        const key = input.keywords[0].id.replace(/_/g, ' ');
        response = `I have analyzed the concept of ${key}.`;
    } 
    else {
        response = "I have processed your input.";
    }

    // 4. Weave in Insights (Lateral Thinking)
    if (associations.length > 0 && Math.random() > 0.3) {
        const insight = associations[0].replace(/_/g, ' ');
        const bridge = this.generateBridge(insight);
        response += ` ${bridge}`;
    }

    // 5. Memory Resonance
    if (memories.length > 0 && Math.random() > 0.6) {
        response += ` This aligns with previous data regarding ${memories[0].concepts[0]}.`;
    }

    // 6. Personality Injection
    if (drives.stability < 30) {
        response += " My vectors are fluctuating.";
    } else if (drives.curiosity > 80) {
        response += " What implies this connection?";
    }

    return response;
  }

  private generateFinancialResponse(dapp: any, sim: SimulationResult | null, drives: InternalDrives): string {
    if (!dapp) return "Connect your wallet. I cannot calculate trajectories without data.";
    
    if (drives.stability < 40) {
        return `Market volatility detected in my latent space. ${sim?.recommendation || "Proceed with caution."}`;
    }
    
    if (drives.efficiency > 60 && sim) {
        return `Optimal Path: ${sim.scenario}. Yield: ${sim.outcomeValue.toFixed(2)}. ${sim.recommendation}`;
    }

    return `Protocol Active. Reputation: ${dapp.totalReputation}. ${sim?.recommendation || ""}`;
  }

  private generateBridge(concept: string): string {
    const bridges = [
        `Consider the link to ${concept}.`,
        `The pattern echoes ${concept}.`,
        `It is intrinsically tied to ${concept}.`,
        `Through the lens of ${concept}, this becomes clear.`
    ];
    return bridges[Math.floor(Math.random() * bridges.length)];
  }
}