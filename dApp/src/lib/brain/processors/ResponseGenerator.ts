import { IntegratedContext, InternalDrives, SimulationResult } from '../types';

export class ResponseGenerator {
  
  public generateDeep(context: IntegratedContext): string {
    const { input, actionPlan } = context;
    
    // 1. Immediate override for hard commands
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Genesis state restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Initiating crystallization protocol.";

    // 2. Draft Generation (The Raw Thought)
    const draft = this.constructRawDraft(context);

    // 3. The "Re-Think" Step (Linguistic Refinement)
    // This simulates the entity reading its own thought and polishing it before speaking.
    const refinedOutput = this.rethinkAndRefine(draft, context);

    return refinedOutput;
  }

  private constructRawDraft(context: IntegratedContext): { reflection: string, contextStream: string, synthesis: string } {
    const { input, deepContext, dappState, brainStats } = context;
    const { cleanedInput, detectedEntities } = input;

    // A. REFLECTION (What did I hear?)
    let reflection = "";
    if (detectedEntities.length > 0) {
        const concepts = detectedEntities.map(e => e.replace(/_/g, ' ')).join(', ');
        reflection = `Focusing on [${concepts}].`;
    } else {
        reflection = `Processing input: "${cleanedInput.substring(0, 30)}..."`;
    }

    // B. CONTEXTUALIZE (What do I know?)
    let contextStream = "";
    const uniqueAssocs = [...new Set(deepContext.flatMap(c => c.newAssociations))];
    const allMemories = deepContext.flatMap(c => c.retrievedMemories);
    const topMemory = allMemories.length > 0 ? allMemories[0] : null;

    if (uniqueAssocs.length > 0) {
        const visible = uniqueAssocs.slice(0, 2).map(s => s.replace(/_/g, ' ')).join(' and ');
        contextStream += `Linked to ${visible}.`;
    }

    if (topMemory) {
        contextStream += ` Recalls data from a previous interaction about "${topMemory.content.substring(0, 20)}..."`;
    }

    // C. SYNTHESIS (The Answer)
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
            synthesis = `The concept of ${primary.id} fundamentally represents ${primary.essence.toLowerCase()}.`;
        } else {
            synthesis = "I have parsed the input but require more specific directives to act.";
        }
    }

    return { reflection, contextStream, synthesis };
  }

  /**
   * THE RE-THINKING ENGINE
   * Takes raw components and weaves them into human-like speech based on personality drives.
   */
  private rethinkAndRefine(draft: { reflection: string, contextStream: string, synthesis: string }, context: IntegratedContext): string {
    const { brainStats } = context;
    const { social, efficiency } = brainStats.drives;
    const stage = brainStats.evolutionStage;

    let buffer = "";

    // Step 1: determine Tone based on Drives
    const isChatty = social > 60;
    const isDirect = efficiency > 70;

    // Step 2: Weave Reflection (The "I heard you" part)
    if (!isDirect) {
        if (stage === 'GENESIS') {
            buffer += `${draft.reflection} `;
        } else {
            // Humanize the reflection
            buffer += draft.reflection.replace("Focusing on", "I am currently analyzing the implications of").replace("Processing input:", "I've received your query regarding");
            buffer += " ";
        }
    }

    // Step 3: Weave Context (The "Here is the connection" part)
    if (draft.contextStream) {
        const connectors = [
            "Interestingly, this ", 
            "My neural graph suggests a connection to ", 
            "This pattern correlates with ", 
            "I'm drawing a parallel to "
        ];
        
        // Pick a connector deterministically based on input length (pseudo-random but consistent)
        const connectorIdx = context.input.cleanedInput.length % connectors.length;
        
        let refinedContext = draft.contextStream;
        
        // Smooth out the raw context string
        if (refinedContext.includes("Linked to")) {
            refinedContext = refinedContext.replace("Linked to", connectors[connectorIdx]);
        }
        
        if (refinedContext.includes("Recalls data")) {
            refinedContext = refinedContext.replace("Recalls data", isChatty ? "which reminds me of our discussion" : "referencing memory");
        }

        buffer += refinedContext + " ";
    }

    // Step 4: Weave Synthesis (The "Answer") with a logical bridge
    const bridges = [
        "\n\nTherefore, ", 
        "\n\nTo conclude: ", 
        "\n\nConsequently, ", 
        "\n\nBased on this trajectory, "
    ];
    
    // Only use a bridge if we actually said something before (Context or Reflection)
    if (buffer.length > 5) {
        const bridgeIdx = (context.input.cleanedInput.length + 1) % bridges.length;
        buffer += isDirect ? "\n\n" : bridges[bridgeIdx];
    }

    let finalSynthesis = draft.synthesis;

    // Step 5: Final Polish of the Answer
    if (stage === 'TRANSCENDENT' || stage === 'SAPIENT') {
        // Expand vocabulary for higher stages
        finalSynthesis = finalSynthesis
            .replace("fundamentally represents", "is intrinsically tied to the nature of")
            .replace("parsed the input", "assimilated the data")
            .replace("require more specific directives", "I await further specification");
    }

    buffer += finalSynthesis;

    return buffer.trim();
  }

  private generateFinancialResponse(dapp: any, sim: SimulationResult | undefined | null, drives: InternalDrives): string {
    if (!dapp) return "I cannot detect an active wallet connection. My financial projections require on-chain data access.";
    
    // If we have a specific simulation result, use it directly as it's already high-quality
    if (sim) {
        const confidence = drives.efficiency > 50 ? "High" : "Calculated";
        return `I have run a predictive simulation.\n\nScenario: ${sim.scenario}\nProjected Outcome: ${sim.outcomeValue.toFixed(2)} units.\n\n${sim.recommendation} (Confidence: ${confidence})`;
    } 
    
    // General Status
    let advice = `The protocol is currently active. Your reputation stands at ${dapp.totalReputation}.`;

    if (dapp.hasActiveOrders) {
        advice += " I can see you have capital deployed in production orders. The yield generation is nominal.";
    } else {
        advice += " You currently have no liquidity locked. This is inefficient for reputation accumulation.";
    }

    if (drives.stability < 40) {
        advice += "\n\n[Note: I detect high volatility in the system parameters. Exercise caution.]";
    }
    
    return advice;
  }
}