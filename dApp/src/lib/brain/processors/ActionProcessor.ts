import { InputAnalysis } from './InputProcessor';
import { BrainState } from '../types'; // FIXED IMPORT

export type ActionType = 
  | 'RESPOND_NATURAL' 
  | 'RESPOND_DAPP' 
  | 'EXECUTE_COMMAND_RESET' 
  | 'EXECUTE_COMMAND_SAVE'
  | 'LEARN_PASSIVE';

export interface ActionPlan {
  type: ActionType;
  requiresBlockchain: boolean;
  priority: number; // 1-10
  responseContext?: any;
}

export class ActionProcessor {
  
  public plan(analysis: InputAnalysis, brainState: BrainState, isOwner: boolean): ActionPlan {
    // 1. Check for Commands (Owner Only for criticals)
    if (analysis.intent === 'COMMAND') {
      if (analysis.cleanedInput.includes('reset') || analysis.cleanedInput.includes('wipe')) {
        return { type: 'EXECUTE_COMMAND_RESET', requiresBlockchain: false, priority: 10 };
      }
      if (analysis.cleanedInput.includes('save') || analysis.cleanedInput.includes('crystallize')) {
        return { type: 'EXECUTE_COMMAND_SAVE', requiresBlockchain: true, priority: 10 };
      }
    }

    // 2. DApp Specific Queries
    if (analysis.intent === 'DAPP_QUERY') {
      return { 
        type: 'RESPOND_DAPP', 
        requiresBlockchain: false, 
        priority: 8 
      };
    }

    // 3. Automatic Crystallization Check (Autonomic Nervous System)
    // If unsaved data is high, we might suggest saving in the response, 
    // but here we plan the conversation flow.
    
    // 4. Default Conversation
    return { 
      type: 'RESPOND_NATURAL', 
      requiresBlockchain: false, 
      priority: 5 
    };
  }
}