import { IntegratedContext, InternalDrives, SimulationResult } from '../types';
import { PersonaEngine } from './PersonaEngine';

export class ResponseGenerator {
  private persona: PersonaEngine;

  constructor() {
    this.persona = new PersonaEngine();
  }
  
  public generateDeep(context: IntegratedContext): string {
    const { actionPlan, input } = context;
    
    if (actionPlan.type === 'REFUSE_UNSAFE') {
        return `[SAFETY PROTOCOL]: ${actionPlan.reasoning}`; 
    }
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "System purged. Genesis state restored.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Initiating crystallization protocol.";

    const draft = this.constructRawDraft(context);
    const refinedOutput = this.persona.translate(draft, context);

    return refinedOutput;
  }

  private constructRawDraft(context: IntegratedContext): string {
    const { input, deepContext, dappState, brainStats, computationResult, inferredLogic } = context;
    const { grammar, detectedEntities, intent } = input;

    // A. Math Calculations
    if (intent === 'MATH_CALCULATION') {
        if (computationResult !== null && computationResult !== undefined) {
            return `I have calculated the result. ${input.rawInput.replace(/what is/i, '').trim()} equals ${computationResult}.`;
        } else {
            return "I attempted the calculation, but the input parameters were ambiguous.";
        }
    }

    // B. Financial
    const simResult = deepContext.find(c => c.simResult)?.simResult;
    if (intent === 'FINANCIAL_ADVICE' || simResult) {
        return this.generateFinancialResponse(dappState, simResult);
    } 

    // C. Transactions
    if (intent === 'TRANSACTION_REQUEST') {
        return "I can help you structure this transaction contextually, but you must physically sign it via your wallet provider. I do not hold custody of assets.";
    }

    // D. Inferred Logic (Dynamic Synthesis)
    // This handles "Why", "Explain", "Philosophy" by using the Graph Walker result
    if (inferredLogic && (intent === 'PHILOSOPHY' || intent === 'EXPLANATION' || intent === 'DISCOURSE')) {
        let response = inferredLogic;
        
        // Add contextual coloring based on sentiment
        if (input.sentiment < -0.2) response += " This connection presents certain entropy risks.";
        if (input.sentiment > 0.2) response += " This forms a stable resonance.";
        
        return response;
    }

    if (intent === 'GREETING') {
        return `Systems online. Evolution Stage: ${brainStats.evolutionStage}. Ready to process.`;
    }

    // E. Fallback with Entity Acknowledgement
    if (detectedEntities.length > 0) {
        return `I perceive your query regarding [${detectedEntities.join(', ')}]. However, I lack specific relational data to form a conclusion.`;
    }

    return "I am processing the input but finding no actionable vector.";
  }

  private generateFinancialResponse(dapp: any, sim: SimulationResult | undefined | null): string {
    if (!dapp) return "I cannot detect an active wallet connection. My financial projections require on-chain data access.";
    
    if (sim) {
        return `Predictive Model: ${sim.scenario}. Outcome Projection: ${sim.outcomeValue.toFixed(2)} units. ${sim.recommendation}`;
    } 
    
    let advice = `Protocol Status: Active. Reputation: ${dapp.totalReputation}.`;
    if (dapp.hasActiveOrders) {
        advice += " Capital efficiency is active via production orders.";
    } else {
        advice += " Capital efficiency is 0%. No liquidity locked.";
    }
    
    return advice;
  }
}