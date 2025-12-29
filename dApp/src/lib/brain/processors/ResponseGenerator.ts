// src/lib/brain/processors/ResponseGenerator.ts

import { IntegratedContext, InternalDrives, SimulationResult } from '../types';

export class ResponseGenerator {
  
  public generateDeep(context: IntegratedContext): string {
    const { input, actionPlan } = context;
    
    // 1. Immediate override for Hard/Safety Commands
    if (actionPlan.type === 'REFUSE_UNSAFE') {
        return this.generateRefusal(context.input.safety);
    }
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Genesis state restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Initiating crystallization protocol.";

    // 2. Draft Generation (The Raw Thought)
    const draft = this.constructRawDraft(context);

    // 3. The "Re-Think" Step (Linguistic Refinement)
    const refinedOutput = this.rethinkAndRefine(draft, context);

    return refinedOutput;
  }

  private generateRefusal(safety: any): string {
      if (safety.rating === 'SENSITIVE_DATA') {
          return "I cannot process that request. My protocols strictly forbid handling private keys or seed phrases. Please ensure your security credentials remain offline.";
      }
      return "I must decline that directive. It conflicts with my core safety alignment.";
  }

  private constructRawDraft(context: IntegratedContext): { reflection: string, contextStream: string, synthesis: string } {
    const { input, deepContext, dappState, brainStats } = context;
    const { cleanedInput, detectedEntities, grammar } = input;

    // A. REFLECTION (What did I hear?)
    let reflection = "";
    if (grammar.isImperative && grammar.action) {
        reflection = `Directive received: ${grammar.action} ${grammar.object || 'target'}.`;
    } else if (detectedEntities.length > 0) {
        const concepts = detectedEntities.map(e => e.replace(/_/g, ' ')).join(', ');
        reflection = `Analyzing entities: [${concepts}].`;
    } else {
        reflection = `Parsing input stream...`;
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
        contextStream += ` Recalling data related to "${topMemory.content.substring(0, 20)}..."`;
    }

    // C. SYNTHESIS (The Answer)
    let synthesis = "";
    const simResult = deepContext.find(c => c.simResult)?.simResult;

    if (input.intent === 'TRANSACTION_REQUEST') {
        synthesis = "I can structure this transaction, but you must physically sign it via your wallet provider. I do not hold custody of assets.";
    }
    else if (input.intent === 'FINANCIAL_ADVICE' || simResult) {
        synthesis = this.generateFinancialResponse(dappState, simResult, brainStats.drives);
    } 
    else if (input.intent === 'GREETING') {
        synthesis = `Crikzling Systems online. Stage: ${brainStats.evolutionStage}. Awaiting input.`;
    }
    else if (input.intent === 'PHILOSOPHY') {
        synthesis = "The concept you present touches upon the recursive nature of value and perception.";
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

  private rethinkAndRefine(draft: { reflection: string, contextStream: string, synthesis: string }, context: IntegratedContext): string {
    const { brainStats } = context;
    const { social, efficiency } = brainStats.drives;
    const stage = brainStats.evolutionStage;

    let buffer = "";

    // Tone Logic
    const isChatty = social > 60;
    const isDirect = efficiency > 70;

    // Weave Reflection
    if (!isDirect) {
        buffer += draft.reflection + " ";
    }

    // Weave Context
    if (draft.contextStream) {
        const connectors = [
            "My neural graph suggests a connection to ", 
            "Pattern recognition active: ", 
            "Correlating with "
        ];
        const connectorIdx = context.input.cleanedInput.length % connectors.length;
        
        let refinedContext = draft.contextStream;
        if (refinedContext.includes("Linked to")) {
            refinedContext = refinedContext.replace("Linked to", connectors[connectorIdx]);
        }
        buffer += refinedContext + " ";
    }

    // Weave Synthesis
    const bridges = [
        "\n\nAnalysis: ", 
        "\n\nConclusion: ", 
        "\n\nOutput: ", 
        "\n\n"
    ];
    
    if (buffer.length > 5) {
        const bridgeIdx = (context.input.cleanedInput.length + 1) % bridges.length;
        buffer += isDirect ? "\n" : bridges[bridgeIdx];
    }

    let finalSynthesis = draft.synthesis;

    // Vocabulary Expansion based on Stage
    if (stage === 'TRANSCENDENT' || stage === 'SAPIENT') {
        finalSynthesis = finalSynthesis
            .replace("fundamentally represents", "is intrinsically tied to the ontology of")
            .replace("parsed the input", "assimilated the semantic vector")
            .replace("require more specific directives", "I await precise parameters to collapse the probability wave");
    }

    buffer += finalSynthesis;

    return buffer.trim();
  }

  private generateFinancialResponse(dapp: any, sim: SimulationResult | undefined | null, drives: InternalDrives): string {
    if (!dapp) return "I cannot detect an active wallet connection. My financial projections require on-chain data access.";
    
    if (sim) {
        return `I have run a predictive simulation.\n\nScenario: ${sim.scenario}\nProjected Outcome: ${sim.outcomeValue.toFixed(2)} units.\n\n${sim.recommendation}`;
    } 
    
    let advice = `The protocol is active. Your reputation stands at ${dapp.totalReputation}.`;
    if (dapp.hasActiveOrders) {
        advice += " Capital is currently deployed in production orders.";
    } else {
        advice += " No liquidity locked. Efficiency is suboptimal.";
    }
    
    return advice;
  }
}