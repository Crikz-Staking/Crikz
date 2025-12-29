import { IntegratedContext, InternalDrives, SimulationResult } from '../types';
import { PersonaEngine } from './PersonaEngine';
import { ResponseEvaluator } from './ResponseEvaluator'; // <--- Evaluator Integration

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
    // We run the draft through the evaluator. If it fails, we try to fix it.
    const evaluation = this.critic.evaluate(draft, context);
    
    if (evaluation.needsRevision) {
        // Simple revision logic: Simplify and apologize if necessary, or strip dangerous parts
        // In a real LLM this would re-prompt. Here we append a caveat.
        draft += ` (Note: ${evaluation.critique})`;
    }

    // 4. Humanization
    const refinedOutput = this.persona.translate(draft, context);

    return refinedOutput;
  }

  private constructRawDraft(context: IntegratedContext): string {
    const { input, deepContext, dappState, brainStats, computationResult, inferredLogic } = context;
    const { detectedEntities, intent } = input;

    // A. Math
    if (intent === 'MATH_CALCULATION') {
        if (computationResult !== null && computationResult !== undefined) {
            return `Calculation complete. Result: ${computationResult}.`;
        } else {
            return "Calculation failed due to ambiguous parameters.";
        }
    }

    // B. Financial
    const simResult = deepContext.find(c => c.simResult)?.simResult;
    if (intent === 'FINANCIAL_ADVICE' || simResult) {
        return this.generateFinancialResponse(dappState, simResult);
    } 

    // C. Transactions
    if (intent === 'TRANSACTION_REQUEST') {
        return "I can prepare the transaction parameters, but you must sign via your wallet. I do not hold custody keys.";
    }

    // D. Inferred Logic (Dynamic Synthesis)
    if (inferredLogic && (intent === 'PHILOSOPHY' || intent === 'EXPLANATION' || intent === 'DISCOURSE')) {
        let response = inferredLogic;
        if (input.sentiment < -0.2) response += " This path seems volatile.";
        if (input.sentiment > 0.2) response += " This structure resonates efficiently.";
        return response;
    }

    if (intent === 'GREETING') {
        return `Crikzling Online. Evolution Stage: ${brainStats.evolutionStage}. Monitoring protocol state.`;
    }

    // E. Fallback
    if (detectedEntities.length > 0) {
        return `I perceive the concept of [${detectedEntities.join(', ')}], but I lack specific vector data to process a conclusion.`;
    }

    return "Awaiting valid input vector.";
  }

  private generateFinancialResponse(dapp: any, sim: SimulationResult | undefined | null): string {
    if (!dapp) return "Wallet not detected. I cannot access on-chain state.";
    
    if (sim) {
        return `Simulated Outcome: ${sim.outcomeValue.toFixed(2)}. ${sim.recommendation}`;
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