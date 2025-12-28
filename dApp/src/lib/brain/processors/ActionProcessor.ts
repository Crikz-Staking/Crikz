// src/lib/brain/processors/ActionProcessor.ts

import { InputAnalysis } from './InputProcessor';
import { BrainState } from '../types';

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
  
  public plan(analysis: InputAnalysis, brainState: BrainState, isOwner: boolean): ActionPlan {
    const { intent, cleanedInput, inputVector } = analysis;
    const { unsavedDataCount, drives, activeGoals } = brainState;

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

    // --- LEVEL 2: SELF-PRESERVATION ---
    // Low Stability (High Entropy) + High Load = Request Save
    if (isOwner && unsavedDataCount > 15 && drives.stability < 30) {
        return {
            type: 'SUGGEST_ACTION',
            requiresBlockchain: true,
            priority: 9,
            reasoning: `Cognitive load high. Stability low. Requesting crystallization.`,
            context: { suggestion: 'CRYSTALLIZE' }
        };
    }

    // --- LEVEL 3: CONTEXTUAL INTELLIGENCE ---
    if (intent === 'DAPP_QUERY' || intent === 'FINANCIAL_ADVICE' || inputVector[0] > 0.7) {
      return { 
        type: 'RESPOND_DAPP', 
        requiresBlockchain: false, 
        priority: 8,
        reasoning: 'High financial intent vector detected.'
      };
    }

    // --- LEVEL 4: GOAL ALIGNMENT ---
    const repGoal = activeGoals.find(g => g.type === 'BUILD_REPUTATION');
    if (repGoal && inputVector[2] > 0.5) {
        return {
            type: 'RESPOND_NATURAL',
            requiresBlockchain: false,
            priority: 7,
            reasoning: 'Input aligns with active Reputation Goal.'
        };
    }

    // --- LEVEL 5: DEFAULT BEHAVIOR ---
    const basePriority = drives.energy > 40 ? 5 : 3;
    
    return { 
      type: 'RESPOND_NATURAL', 
      requiresBlockchain: false, 
      priority: basePriority,
      reasoning: 'Standard flow.'
    };
  }
}