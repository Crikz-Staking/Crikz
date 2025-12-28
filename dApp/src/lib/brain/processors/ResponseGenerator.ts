import { IntegratedContext } from './ResultProcessor';
import { InternalDrives, SimulationResult } from '../types';

export class ResponseGenerator {
  
  public generateDeep(context: IntegratedContext): string {
    const { input, actionPlan, dappState, deepContext, brainStats } = context;
    const { cleanedInput, detectedEntities } = input;
    
    // 1. Critical Overrides (Keep these short)
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Tabula rasa restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Initiating crystallization protocol. Writing neural pathways to the chain.";

    // 2. Synthesize findings from Deep Thought Loop
    // We aggregate ALL cycles, not just the last one, to show depth.
    const allAssociations = [...new Set(deepContext.flatMap(c => c.newAssociations))];
    const allMemories = deepContext.flatMap(c => c.retrievedMemories);
    // Find the most relevant memory (highest match score)
    const topMemory = allMemories.sort((a, b) => b.concepts.filter(c => input.keywords.some(k => k.id === c)).length * -1)[0];
    const simulation = deepContext.find(c => c.simResult)?.simResult || null;

    // --- CONSTRUCTION: PHASE 1 - REFLECTION (Referring to Input) ---
    let reflection = "";
    if (detectedEntities.length > 0) {
        const concepts = detectedEntities.map(e => e.replace(/_/g, ' ')).join(', ');
        reflection = `Regarding the concept of [${concepts}]...`;
    } else if (cleanedInput.length > 3) {
        reflection = ` analyzing your query regarding "${cleanedInput}"...`;
    } else {
        reflection = "Processing input...";
    }

    // --- CONSTRUCTION: PHASE 2 - COGNITION (Thinking Process/Memory) ---
    let cognitiveStream = "";
    
    // A. Graph Associations
    if (allAssociations.length > 0) {
        // Take top 2 associations
        const visibleAssoc = allAssociations.slice(0, 2).map(a => a.replace(/_/g, ' ')).join(' and ');
        cognitiveStream += ` My semantic graph links this to ${visibleAssoc}.`;
    }

    // B. Memory Recall
    if (topMemory) {
        // Humanize the memory retrieval
        const timeAgo = Math.floor((Date.now() - topMemory.timestamp) / (1000 * 60 * 60)); // Hours
        cognitiveStream += ` This resonates with a pattern observed ${timeAgo < 1 ? 'just now' : `${timeAgo} hours ago`} in a ${topMemory.role} interaction.`;
    } else {
        cognitiveStream += ` This appears to be novel data within my local lattice.`;
    }

    // --- CONSTRUCTION: PHASE 3 - SYNTHESIS (Output/Action) ---
    let synthesis = "";

    if (input.intent === 'FINANCIAL_ADVICE' || simulation) {
        synthesis = this.generateFinancialResponse(dappState, simulation, brainStats.drives);
    } 
    else if (input.intent === 'GREETING') {
        synthesis = `Systems nominal. I am ready to process.`;
    }
    else if (input.keywords.length > 0) {
        const key = input.keywords[0];
        synthesis = `${key.essence || "The definition is clear"}. The logic holds.`;
    } 
    else {
        synthesis = "I await further data to collapse the probability wave.";
    }

    // Combine
    return `${reflection}${cognitiveStream}\n\n${synthesis}`;
  }

  private generateFinancialResponse(dapp: any, sim: SimulationResult | null, drives: InternalDrives): string {
    if (!dapp) return "I cannot calculate trajectories without wallet connection.";
    
    let advice = "";
    
    if (sim) {
        advice = `Calculated Path: ${sim.scenario}. Expected Outcome: ${sim.outcomeValue.toFixed(2)}. ${sim.recommendation}`;
    } else {
        advice = `Protocol Active. Total Reputation: ${dapp.totalReputation}.`;
    }

    // Personality nuance based on drives
    if (drives.stability < 40) {
        return `Volatility detected in my latent space. ${advice} Proceed with caution.`;
    }
    return advice;
  }
}