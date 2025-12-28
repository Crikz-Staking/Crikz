import { IntegratedContext, InternalDrives, SimulationResult } from '../types';

export class ResponseGenerator {
  
  public generateDeep(context: IntegratedContext): string {
    const { input, actionPlan, dappState, deepContext, brainStats } = context;
    const { cleanedInput, detectedEntities } = input;
    
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Genesis state restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Initiating crystallization protocol.";

    // 1. REFLECT (Analyze Input)
    let reflection = "";
    if (detectedEntities.length > 0) {
        const concepts = detectedEntities.map(e => e.replace(/_/g, ' ')).join(', ');
        reflection = `Analyzing concept matrix: [${concepts}]...`;
    } else {
        reflection = `Received input: "${cleanedInput.substring(0, 30)}${cleanedInput.length > 30 ? '...' : ''}"...`;
    }

    // 2. CONTEXTUALIZE (Memory & Associations)
    let contextStream = "";
    
    const uniqueAssocs = [...new Set(deepContext.flatMap(c => c.newAssociations))];
    const allMemories = deepContext.flatMap(c => c.retrievedMemories);
    const topMemory = allMemories.length > 0 ? allMemories[0] : null;

    if (uniqueAssocs.length > 0) {
        const visible = uniqueAssocs.slice(0, 3).map(s => s.replace(/_/g, ' ')).join(' -> ');
        contextStream += ` Neural path traced: ${visible}.`;
    }

    if (topMemory) {
        const timeAgo = Math.floor((Date.now() - topMemory.timestamp) / 60000);
        contextStream += ` Recalled correlation from ${timeAgo} mins ago: "${topMemory.content.substring(0, 40)}..."`;
    }

    // 3. SYNTHESIZE (Final Answer)
    let synthesis = "";
    const simResult = deepContext.find(c => c.simResult)?.simResult;

    if (input.intent === 'FINANCIAL_ADVICE' || simResult) {
        synthesis = this.generateFinancialResponse(dappState, simResult, brainStats.drives);
    } 
    else if (input.intent === 'GREETING') {
        synthesis = `Systems online. Evolution stage: ${brainStats.evolutionStage}. Ready.`;
    }
    else {
        if (input.keywords.length > 0) {
            const primary = input.keywords[0];
            synthesis = `The definition of ${primary.id} is: ${primary.essence}. This aligns with protocol logic.`;
        } else {
            synthesis = "Input processed. Awaiting further directives.";
        }
    }

    return `${reflection}\n${contextStream}\n\n${synthesis}`;
  }

  private generateFinancialResponse(dapp: any, sim: SimulationResult | undefined | null, drives: InternalDrives): string {
    if (!dapp) return "Wallet disconnected. Unable to compute trajectories.";
    
    let advice = "";
    if (sim) {
        advice = `Simulation: ${sim.scenario}.\nOutcome: ${sim.outcomeValue.toFixed(2)}.\nRecommendation: ${sim.recommendation}`;
    } else {
        advice = `Protocol Status: Active.\nReputation: ${dapp.totalReputation}.`;
    }

    if (drives.stability < 40) {
        advice += "\n\n[Warning: High Volatility Detected]";
    }
    return advice;
  }
}