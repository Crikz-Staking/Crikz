import { BrainState, DeepThoughtCycle, ActionPlan, InputAnalysis } from '../types'; 

export class ActionProcessor {
  
  public plan(
    analysis: InputAnalysis, 
    brainState: BrainState, 
    isOwner: boolean, 
    deepContext: DeepThoughtCycle[] 
  ): ActionPlan {
    
    const { intent, inputVector, safety, requestedCapability } = analysis;
    const { drives, activeGoals, unsavedDataCount } = brainState;

    // --- LEVEL 0: SAFETY ---
    if (safety.rating === 'UNSAFE' || safety.rating === 'SENSITIVE_DATA') {
        return {
            type: 'REFUSE_UNSAFE',
            requiresBlockchain: false,
            priority: 100, 
            reasoning: `Safety Violation: ${safety.reason}`,
            context: { violationType: safety.rating }
        };
    }

    // --- LEVEL 1: COMMANDS ---
    if (intent === 'COMMAND') {
      if (analysis.cleanedInput.includes('reset') || analysis.cleanedInput.includes('wipe')) {
        return { type: 'EXECUTE_COMMAND_RESET', requiresBlockchain: false, priority: 10, reasoning: 'User Command: Reset' };
      }
      if (analysis.cleanedInput.includes('save') || analysis.cleanedInput.includes('crystallize')) {
        return { type: 'EXECUTE_COMMAND_SAVE', requiresBlockchain: true, priority: 10, reasoning: 'User Command: Save' };
      }
    }

    // --- LEVEL 2: SYSTEM HEALTH ---
    const entropyRisk = drives.stability < 30; 
    const dataRisk = unsavedDataCount > 15; 

    if (isOwner && (entropyRisk || dataRisk)) {
         return {
            type: 'SUGGEST_ACTION',
            requiresBlockchain: true,
            priority: 9,
            reasoning: entropyRisk ? "System stability critical." : "Memory buffer full.",
            context: { suggestion: 'CRYSTALLIZE' }
        };
    }

    // --- LEVEL 3: CAPABILITY ROUTING ---
    // Math
    if (intent === 'MATH_CALCULATION') {
        return { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 8, reasoning: 'Math computation request.' };
    }

    // Transactions
    if (intent === 'TRANSACTION_REQUEST') {
        return {
            type: 'SUGGEST_ACTION',
            requiresBlockchain: true,
            priority: 8,
            reasoning: 'User requested blockchain write action.',
            context: { suggestion: 'TRANSACTION_UI_TRIGGER', details: analysis.grammar }
        };
    }

    // Finance
    const hasFinancialSim = deepContext.some(c => c.simResult !== null);
    if (intent === 'FINANCIAL_ADVICE' || hasFinancialSim || requestedCapability === 'ANALYZE_DATA') {
      return { type: 'RESPOND_DAPP', requiresBlockchain: false, priority: 8, reasoning: 'Financial intent.' };
    }

    // Logic Inference
    if (requestedCapability === 'INFER_RELATIONSHIP') {
        return { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 7, reasoning: 'Concept graph traversal.' };
    }

    // --- LEVEL 4: GOAL ALIGNMENT ---
    const repGoal = activeGoals.find(g => g.type === 'BUILD_REPUTATION');
    if (repGoal && inputVector[2] > 0.5) return { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 7, reasoning: 'Aligns with Reputation Goal.' };

    // --- LEVEL 5: DEFAULT ---
    return { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 1, reasoning: 'Standard conversational flow.' };
  }
}