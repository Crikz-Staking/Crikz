import { 
  BrainState, 
  DAppContext, 
  DeepThoughtCycle, 
  ActionPlan, 
  InputAnalysis, 
  IntegratedContext, 
  DAppIntegratedState 
} from '../types';
import { SimulationEngine } from './SimulationEngine';

export class ResultProcessor {
  private simulator: SimulationEngine;

  constructor() {
      this.simulator = new SimulationEngine();
  }
  
  public processMultiCycle(
    input: InputAnalysis,
    plan: ActionPlan,
    deepContext: DeepThoughtCycle[],
    brainState: BrainState,
    dappContext?: DAppContext
  ): IntegratedContext {
    
    let integratedDApp: DAppIntegratedState | null = null;
    let computationResult: string | number | null = null;
    let inferredLogic: string = "";
    
    if (dappContext) {
      integratedDApp = {
        hasActiveOrders: (dappContext.active_orders_count || 0) > 0,
        totalReputation: dappContext.total_reputation ? (Number(dappContext.total_reputation) / 1e18).toFixed(2) : '0',
        availableYield: dappContext.pending_yield ? (Number(dappContext.pending_yield) / 1e18).toFixed(4) : '0',
        fundBalance: dappContext.global_fund_balance ? (Number(dappContext.global_fund_balance) / 1e18).toFixed(2) : '0',
        orders: [] 
      };
    }

    // 1. Math Processing
    if (input.intent === 'MATH_CALCULATION') {
        computationResult = this.solveMath(input.cleanedInput);
    }

    // 2. Logic Inference Processing (For "Why/Explain" queries)
    if (input.intent === 'PHILOSOPHY' || input.intent === 'EXPLANATION') {
        if (input.keywords.length > 0) {
            const startNode = input.keywords[0].id;
            const endNode = input.keywords.length > 1 ? input.keywords[1].id : null;
            
            // Run pathfinding on the brain's relation graph
            const logicPath = this.simulator.inferRelationship(startNode, endNode, brainState.relations);
            
            if (logicPath) {
                // Construct natural language from path
                let thoughtChain = `I trace a connection: ${logicPath.nodes[0]}`;
                for(let i=0; i<logicPath.relations.length; i++) {
                    const rel = logicPath.relations[i].replace(/_/g, ' ');
                    const nextNode = logicPath.nodes[i+1];
                    thoughtChain += ` which ${rel} ${nextNode}`;
                }
                inferredLogic = thoughtChain + ".";
            }
        }
    }

    const allMemories = deepContext.flatMap(c => c.retrievedMemories);

    return {
      input,
      actionPlan: plan,
      memories: [...new Set(allMemories)],
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
      computationResult,
      inferredLogic // <--- Attached logic path
    };
  }

  private solveMath(text: string): string | null {
      try {
          let clean = text
            .replace(/what is/g, '')
            .replace(/calculate/g, '')
            .replace(/plus/g, '+')
            .replace(/minus/g, '-')
            .replace(/times/g, '*')
            .replace(/divided by/g, '/')
            .replace(/multiplied by/g, '*')
            .replace(/x/g, '*') 
            .replace(/[^-+*/0-9.()^]/g, ''); 

          if (text.includes('sqrt') || text.includes('square root')) {
              const numMatch = text.match(/\d+(\.\d+)?/);
              if (numMatch) {
                  return Math.sqrt(parseFloat(numMatch[0])).toString();
              }
          }

          if (!/^[-+*/0-9.()^]+$/.test(clean)) return null;

          const result = new Function(`return ${clean}`)();
          if (isNaN(result) || !isFinite(result)) return "undefined";
          
          if (Number.isInteger(result)) return result.toString();
          return result.toFixed(4).replace(/\.?0+$/, ''); 

      } catch (e) {
          console.error("Math Error:", e);
          return null;
      }
  }
}