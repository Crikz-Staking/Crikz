import { 
  BrainState, 
  DAppContext, 
  DeepThoughtCycle, 
  ActionPlan, 
  InputAnalysis, 
  IntegratedContext, 
  DAppIntegratedState 
} from '../types';

export class ResultProcessor {
  
  public processMultiCycle(
    input: InputAnalysis,
    plan: ActionPlan,
    deepContext: DeepThoughtCycle[],
    brainState: BrainState,
    dappContext?: DAppContext
  ): IntegratedContext {
    
    let integratedDApp: DAppIntegratedState | null = null;
    let computationResult: string | number | null = null;
    
    // 1. DApp State Integration
    if (dappContext) {
      integratedDApp = {
        hasActiveOrders: (dappContext.active_orders_count || 0) > 0,
        totalReputation: dappContext.total_reputation ? (Number(dappContext.total_reputation) / 1e18).toFixed(2) : '0',
        availableYield: dappContext.pending_yield ? (Number(dappContext.pending_yield) / 1e18).toFixed(4) : '0',
        fundBalance: dappContext.global_fund_balance ? (Number(dappContext.global_fund_balance) / 1e18).toFixed(2) : '0',
        orders: [] 
      };
    }

    // 2. Math Processing Engine
    if (input.intent === 'MATH_CALCULATION') {
        computationResult = this.solveMath(input.cleanedInput);
    }

    // Flatten memories from all cycles for reference
    const allMemories = deepContext.flatMap(c => c.retrievedMemories);

    return {
      input,
      actionPlan: plan,
      memories: [...new Set(allMemories)], // Unique memories
      blockchainHistory: brainState.blockchainMemories,
      dappState: integratedDApp,
      deepContext: deepContext,
      brainStats: {
        evolutionStage: brainState.evolutionStage,
        unsavedCount: brainState.unsavedDataCount,
        drives: brainState.drives,
        currentFocus: brainState.attentionFocus,
        currentArchetype: brainState.currentArchetype || 'OPERATOR' 
      },
      computationResult // Attach result
    };
  }

  /**
   * Safe Math Evaluator
   * Parses natural language math into executable values without using eval()
   */
  private solveMath(text: string): string | null {
      try {
          // Normalize text to standard operators
          let clean = text
            .replace(/what is/g, '')
            .replace(/calculate/g, '')
            .replace(/plus/g, '+')
            .replace(/minus/g, '-')
            .replace(/times/g, '*')
            .replace(/divided by/g, '/')
            .replace(/multiplied by/g, '*')
            .replace(/x/g, '*') // Common multiplication char
            .replace(/[^-+*/0-9.()^]/g, ''); // Strip everything else

          // Handle special functions before parsing
          if (text.includes('sqrt') || text.includes('square root')) {
              const numMatch = text.match(/\d+(\.\d+)?/);
              if (numMatch) {
                  return Math.sqrt(parseFloat(numMatch[0])).toString();
              }
          }

          // Basic Parser for Arithmetic
          // We use Function constructor here but sanitized inputs only contain numbers/operators
          // This is generally safe if regex filtered strict characters.
          if (!/^[-+*/0-9.()^]+$/.test(clean)) return null;

          // Safe execution wrapper
          const result = new Function(`return ${clean}`)();
          
          if (isNaN(result) || !isFinite(result)) return "undefined";
          
          // Format based on precision
          if (Number.isInteger(result)) return result.toString();
          return result.toFixed(4).replace(/\.?0+$/, ''); // Trim trailing zeros

      } catch (e) {
          console.error("Math Error:", e);
          return null;
      }
  }
}