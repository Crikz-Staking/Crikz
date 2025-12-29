import { IntegratedContext, InternalDrives, SimulationResult } from '../types';
import { PersonaEngine } from './PersonaEngine';

export class ResponseGenerator {
  private persona: PersonaEngine;

  constructor() {
    this.persona = new PersonaEngine();
  }
  
  public generateDeep(context: IntegratedContext): string {
    const { actionPlan, input } = context;
    
    // 1. Immediate Safety/System Overrides (Skip Persona for critical alerts)
    if (actionPlan.type === 'REFUSE_UNSAFE') {
        return `[SAFETY PROTOCOL]: ${actionPlan.reasoning}`; // Keep robotic for safety
    }
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Genesis state restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Initiating crystallization protocol.";

    // 2. Draft Generation (The "Thought")
    const draft = this.constructRawDraft(context);

    // 3. Humanization & Translation (The "Voice")
    // Pass the raw draft through the Persona Engine
    const refinedOutput = this.persona.translate(draft, context);

    return refinedOutput;
  }

  private constructRawDraft(context: IntegratedContext): string {
    const { input, deepContext, dappState, brainStats, computationResult } = context;
    const { grammar, detectedEntities, intent } = input;

    // A. Math Calculations
    if (intent === 'MATH_CALCULATION') {
        if (computationResult !== null && computationResult !== undefined) {
            return `I have calculated the result. ${input.rawInput.replace(/what is/i, '').trim()} equals ${computationResult}.`;
        } else {
            return "I attempted the calculation, but the input parameters were ambiguous.";
        }
    }

    // B. Financial Responses (Prioritize Data)
    const simResult = deepContext.find(c => c.simResult)?.simResult;
    if (intent === 'FINANCIAL_ADVICE' || simResult) {
        return this.generateFinancialResponse(dappState, simResult);
    } 

    // C. Transaction Requests
    if (intent === 'TRANSACTION_REQUEST') {
        return "I can help you structure this transaction, but you must physically sign it via your wallet provider. I do not hold custody of assets.";
    }

    // D. Greetings
    if (intent === 'GREETING') {
        return "Systems online. I am ready to process your input.";
    }

    // E. Philosophy / Discourse (The Abstract Mind)
    if (intent === 'PHILOSOPHY' || intent === 'EXPLANATION') {
        // Construct concepts
        let thought = "";
        if (input.keywords.length > 0) {
            const primary = input.keywords[0];
            thought = `The concept of ${primary.id} is interesting. It represents ${primary.essence.toLowerCase()}.`;
            
            // Add associations found in deep thought
            const assocs = deepContext.flatMap(c => c.newAssociations).slice(0, 2);
            if (assocs.length > 0) {
                thought += ` I see a correlation with ${assocs.join(' and ')}.`;
            }
        } else {
            thought = "I am pondering the recursive nature of your query.";
        }
        return thought;
    }

    // F. Fallback
    return `I processed your input regarding ${detectedEntities.join(', ') || 'this topic'}, but I require more specific parameters to act effectively.`;
  }

  private generateFinancialResponse(dapp: any, sim: SimulationResult | undefined | null): string {
    if (!dapp) return "I cannot detect an active wallet connection. My financial projections require on-chain data access.";
    
    if (sim) {
        return `I have run a predictive simulation. Scenario: ${sim.scenario}. Outcome: ${sim.outcomeValue.toFixed(2)} units. ${sim.recommendation}`;
    } 
    
    let advice = `The protocol is active. Your reputation stands at ${dapp.totalReputation}.`;
    if (dapp.hasActiveOrders) {
        advice += " You have capital deployed in production orders.";
    } else {
        advice += " You have no liquidity locked. This is inefficient.";
    }
    
    return advice;
  }
}