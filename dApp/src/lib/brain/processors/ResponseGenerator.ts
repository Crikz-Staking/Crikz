import { IntegratedContext, InternalDrives, SimulationResult } from '../types';
import { PersonaEngine } from './PersonaEngine';
import { ResponseEvaluator } from './ResponseEvaluator';

export class ResponseGenerator {
  private persona: PersonaEngine;
  private critic: ResponseEvaluator;

  constructor() {
    this.persona = new PersonaEngine();
    this.critic = new ResponseEvaluator();
  }
  
  public generateDeep(context: IntegratedContext): string {
    const { actionPlan, input } = context;
    
    // 1. Mandatory Overrides
    if (actionPlan.type === 'REFUSE_UNSAFE') return `[SAFETY PROTOCOL]: ${actionPlan.reasoning}`; 
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Genesis state restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Initiating crystallization protocol.";

    // 2. Draft Generation
    let draft = this.constructRawDraft(context);

    // 3. The "Critic" Loop (Self-Correction)
    const evaluation = this.critic.evaluate(draft, context);
    
    if (evaluation.needsRevision) {
        // Revision Logic: If irrelevant protocol data led to bad score, strip it.
        if (evaluation.critique.includes("irrelevant protocol data")) {
            draft = "I acknowledge your input. " + 
                    (context.inferredLogic || "However, I drifted into irrelevant data. Let's focus on your topic.");
        } else {
            draft += ` (${evaluation.critique})`;
        }
    }

    // 4. Humanization
    const refinedOutput = this.persona.translate(draft, context);

    return refinedOutput;
  }

  private constructRawDraft(context: IntegratedContext): string {
    const { input, deepContext, dappState, brainStats, computationResult, inferredLogic } = context;
    const { detectedEntities, intent, isProtocolSpecific } = input;

    // A. Math
    if (intent === 'MATH_CALCULATION') {
        if (computationResult !== null && computationResult !== undefined) {
            return `Result: ${computationResult}.`;
        } else {
            return "Calculation failed due to ambiguous parameters.";
        }
    }

    // B. Financial - Only if Protocol Specific OR explicitly asked
    const simResult = deepContext.find(c => c.simResult)?.simResult;
    if (intent === 'DAPP_QUERY' || (intent === 'FINANCIAL_ADVICE' && isProtocolSpecific)) {
        return this.generateFinancialResponse(dappState, simResult);
    } 

    if (intent === 'TRANSACTION_REQUEST') {
        return "I can help you structure this transaction contextually, but you must physically sign it via your wallet provider.";
    }

    // C. Logic Inference (General Conversation / Philosophy)
    if (inferredLogic || intent === 'PHILOSOPHY' || intent === 'EXPLANATION' || intent === 'DISCOURSE') {
        if (inferredLogic) {
            let response = inferredLogic;
            if (input.sentiment < -0.2) response += " This path seems volatile.";
            if (input.sentiment > 0.2) response += " This structure resonates efficiently.";
            return response;
        }
        // Fallback for Discourse if no logic path found
        return `Your query regarding [${detectedEntities.join(' ')}] touches on interesting concepts. I am analyzing the semantic relevance.`;
    }

    if (intent === 'GREETING') {
        return `Crikzling Online. Evolution Stage: ${brainStats.evolutionStage}. Ready.`;
    }

    // D. Fallback
    if (detectedEntities.length > 0) {
        return `I perceive the concept of [${detectedEntities.join(', ')}]. How should I relate this to the network?`;
    }

    return "Processing input vector... Please elaborate.";
  }

  private generateFinancialResponse(dapp: any, sim: SimulationResult | undefined | null): string {
    if (!dapp) return "Wallet not detected. I cannot access on-chain state.";
    
    if (sim) {
        return `Predictive Model: ${sim.scenario}. Outcome Projection: ${sim.outcomeValue.toFixed(2)} units. ${sim.recommendation}`;
    } 
    
    let advice = `Protocol Active. Reputation: ${dapp.totalReputation}.`;
    if (dapp.hasActiveOrders) {
        advice += " Capital is currently deployed.";
    } else {
        advice += " Capital efficiency is low. No active orders.";
    }
    
    return advice;
  }
}