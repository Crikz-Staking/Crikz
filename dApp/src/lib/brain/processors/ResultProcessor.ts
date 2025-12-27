import { InputAnalysis } from './InputProcessor';
import { ActionPlan } from './ActionProcessor';
import { Memory, BrainState, DAppContext, BlockchainMemory } from '../crikzling-brain-v3';

export interface IntegratedContext {
  input: InputAnalysis;
  actionPlan: ActionPlan;
  memories: Memory[];
  blockchainHistory: BlockchainMemory[];
  dappState: DAppIntegratedState | null;
  brainStats: {
    evolutionStage: string;
    unsavedCount: number;
  };
}

export interface DAppIntegratedState {
  hasActiveOrders: boolean;
  totalReputation: string;
  availableYield: string;
  fundBalance: string;
  orders: any[];
}

export class ResultProcessor {
  
  public process(
    input: InputAnalysis,
    plan: ActionPlan,
    memories: Memory[],
    brainState: BrainState,
    dappContext?: DAppContext
  ): IntegratedContext {
    
    // Format DApp State for consumption
    let integratedDApp: DAppIntegratedState | null = null;
    
    if (dappContext) {
      integratedDApp = {
        hasActiveOrders: (dappContext.active_orders_count || 0) > 0,
        totalReputation: dappContext.total_reputation ? (Number(dappContext.total_reputation) / 1e18).toFixed(2) : '0',
        availableYield: dappContext.pending_yield ? (Number(dappContext.pending_yield) / 1e18).toFixed(4) : '0',
        fundBalance: dappContext.global_fund_balance ? (Number(dappContext.global_fund_balance) / 1e18).toFixed(2) : '0',
        orders: [] // Could populate detail if needed
      };
    }

    return {
      input,
      actionPlan: plan,
      memories,
      blockchainHistory: brainState.blockchainMemories,
      dappState: integratedDApp,
      brainStats: {
        evolutionStage: brainState.evolutionStage,
        unsavedCount: brainState.unsavedDataCount
      }
    };
  }
}