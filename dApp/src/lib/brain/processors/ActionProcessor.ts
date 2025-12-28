import { InputAnalysis } from './InputProcessor';
import { BrainState, DeepThoughtCycle } from '../types';

export type ActionType = 
  | 'RESPOND_NATURAL' 
  | 'RESPOND_DAPP' 
  | 'EXECUTE_COMMAND_RESET' 
  | 'EXECUTE_COMMAND_SAVE'
  | 'SUGGEST_ACTION';

export interface ActionPlan {
  type: ActionType;
  requiresBlockchain: boolean;
  priority: number;
  reasoning: string;
  context?: any;
}

export class ActionProcessor {
  
  public plan(
    analysis: InputAnalysis, 
    brainState: BrainState, 
    isOwner: boolean, 
    deepContext: DeepThoughtCycle[] // Context now available for planning
  ): ActionPlan {
    
    const { intent, inputVector } = analysis;
    const { drives, activeGoals, unsavedDataCount } = brainState;

    // --- LEVEL 1: EXPLICIT COMMANDS ---
    if (intent === 'COMMAND') {
      if (analysis.cleanedInput.includes('reset') || analysis.cleanedInput.includes('wipe')) {
        return { 
            type: 'EXECUTE_COMMAND_RESET', 
            requiresBlockchain: false, 
            priority: 10,
            reasoning: 'User Command: Reset'
        };
      }
      if (analysis.cleanedInput.includes('save') || analysis.cleanedInput.includes('crystallize')) {
        return { 
            type: 'EXECUTE_COMMAND_SAVE', 
            requiresBlockchain: true, 
            priority: 10,
            reasoning: 'User Command: Save'
        };
      }
    }

    // --- LEVEL 2: SYSTEM HEALTH (Entropy Check) ---
    // Instead of hard numbers, use ratios or drive states
    const entropyRisk = drives.stability < 30; // Low stability
    const dataRisk = unsavedDataCount > 15; // Unsaved accumulation

    if (isOwner && (entropyRisk || dataRisk)) {
         return {
            type: 'SUGGEST_ACTION',
            requiresBlockchain: true,
            priority: 9,
            reasoning: entropyRisk ? "System stability critical." : "Memory buffer full.",
            context: { suggestion: 'CRYSTALLIZE' }
        };
    }

    // --- LEVEL 3: CONTEXTUAL INTELLIGENCE ---
    // Check deep context for financial simulations
    const hasFinancialSim = deepContext.some(c => c.simResult !== null);
    
    if (intent === 'FINANCIAL_ADVICE' || hasFinancialSim) {
      return { 
        type: 'RESPOND_DAPP', 
        requiresBlockchain: false, 
        priority: 8,
        reasoning: 'Financial intent verified via Simulation Engine.'
      };
    }

    // --- LEVEL 4: GOAL ALIGNMENT ---
    // If input vector matches active goal vector
    const repGoal = activeGoals.find(g => g.type === 'BUILD_REPUTATION');
    const financialGoal = activeGoals.find(g => g.type === 'MAXIMIZE_YIELD');

    if (repGoal && inputVector[2] > 0.5) { // Social/Rep vector
        return {
            type: 'RESPOND_NATURAL',
            requiresBlockchain: false,
            priority: 7,
            reasoning: 'Aligns with Reputation Goal.'
        };
    }
    if (financialGoal && inputVector[0] > 0.5) { // Financial vector
        return {
            type: 'RESPOND_DAPP',
            requiresBlockchain: false,
            priority: 7,
            reasoning: 'Aligns with Yield Goal.'
        };
    }

    // --- LEVEL 5: DEFAULT BEHAVIOR ---
    return { 
      type: 'RESPOND_NATURAL', 
      requiresBlockchain: false, 
      priority: 1,
      reasoning: 'Standard conversational flow.'
    };
  }
}