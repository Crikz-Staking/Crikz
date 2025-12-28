import { 
  Memory, 
  BrainState, 
  DAppContext, 
  BlockchainMemory, 
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
    
    if (dappContext) {
      integratedDApp = {
        hasActiveOrders: (dappContext.active_orders_count || 0) > 0,
        totalReputation: dappContext.total_reputation ? (Number(dappContext.total_reputation) / 1e18).toFixed(2) : '0',
        availableYield: dappContext.pending_yield ? (Number(dappContext.pending_yield) / 1e18).toFixed(4) : '0',
        fundBalance: dappContext.global_fund_balance ? (Number(dappContext.global_fund_balance) / 1e18).toFixed(2) : '0',
        orders: [] 
      };
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
        currentFocus: brainState.attentionFocus
      }
    };
  }
}