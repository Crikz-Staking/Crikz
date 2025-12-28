import { InputAnalysis } from './InputProcessor';
import { BrainState, Goal } from '../types';

export type ActionType = 
  | 'RESPOND_NATURAL' 
  | 'RESPOND_DAPP' 
  | 'EXECUTE_COMMAND_RESET' 
  | 'EXECUTE_COMMAND_SAVE'
  | 'SUGGEST_ACTION'; // New: Proactive suggestion bucket

export interface ActionPlan {
  type: ActionType;
  requiresBlockchain: boolean;
  priority: number; // 1-10 (10 = Critical/Immediate)
  reasoning: string; // For debugging and AI introspection
  context?: any;
}

export class ActionProcessor {
  
  public plan(analysis: InputAnalysis, brainState: BrainState, isOwner: boolean): ActionPlan {
    const { intent, cleanedInput, inputVector } = analysis;
    const { unsavedDataCount, mood, activeGoals } = brainState;

    // --- LEVEL 1: OVERRIDES (Commands) ---
    if (intent === 'COMMAND') {
      if (cleanedInput.includes('reset') || cleanedInput.includes('wipe')) {
        return { 
            type: 'EXECUTE_COMMAND_RESET', 
            requiresBlockchain: false, 
            priority: 10,
            reasoning: 'Explicit user command: System Reset'
        };
      }
      if (cleanedInput.includes('save') || cleanedInput.includes('crystallize')) {
        return { 
            type: 'EXECUTE_COMMAND_SAVE', 
            requiresBlockchain: true, 
            priority: 10,
            reasoning: 'Explicit user command: Memory Crystallization'
        };
      }
    }

    // --- LEVEL 2: SELF-PRESERVATION (Autonomic) ---
    // If the brain has accumulated too much volatility (unsaved data + high entropy),
    // it prioritizes stabilizing its state over chatting.
    if (isOwner && unsavedDataCount > 15 && mood.entropy > 60) {
        return {
            type: 'SUGGEST_ACTION',
            requiresBlockchain: true,
            priority: 9,
            reasoning: `Cognitive load critical (${unsavedDataCount} items). Entropy high. Requesting stabilization.`,
            context: { suggestion: 'CRYSTALLIZE' }
        };
    }

    // --- LEVEL 3: CONTEXTUAL INTELLIGENCE (DApp & Finance) ---
    // Use Vector Analysis: If Financial dimension (index 0) is dominant (> 0.7)
    if (intent === 'DAPP_QUERY' || intent === 'FINANCIAL_ADVICE' || inputVector[0] > 0.7) {
      return { 
        type: 'RESPOND_DAPP', 
        requiresBlockchain: false, 
        priority: 8,
        reasoning: 'High financial intent vector detected. Engaging protocol analysis.'
      };
    }

    // --- LEVEL 4: GOAL ALIGNMENT ---
    // If the user has an active goal (e.g., "Build Reputation") and the input touches on Social dimensions
    const repGoal = activeGoals.find(g => g.type === 'BUILD_REPUTATION');
    if (repGoal && inputVector[2] > 0.5) { // Social dimension > 0.5
        return {
            type: 'RESPOND_NATURAL',
            requiresBlockchain: false,
            priority: 7,
            reasoning: 'Input aligns with active Reputation Goal. Focusing response on governance.'
        };
    }

    // --- LEVEL 5: DEFAULT BEHAVIOR ---
    // Adjust base priority based on Energy levels
    const basePriority = mood.energy > 40 ? 5 : 3;
    
    return { 
      type: 'RESPOND_NATURAL', 
      requiresBlockchain: false, 
      priority: basePriority,
      reasoning: 'Standard conversational flow. No critical overrides active.'
    };
  }
}