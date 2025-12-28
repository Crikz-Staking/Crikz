import { InputAnalysis } from './InputProcessor';
import { ActionPlan } from './ActionProcessor';
import { Memory, BrainState, DAppContext, BlockchainMemory, SimulationResult, InternalDrives, DeepThoughtCycle } from '../types';

export interface IntegratedContext {
  input: InputAnalysis;
  actionPlan: ActionPlan;
  memories: Memory[];
  blockchainHistory: BlockchainMemory[];
  dappState: DAppIntegratedState | null;
  // NEW: Array of thought cycles
  deepContext: DeepThoughtCycle[];
  brainStats: {
    evolutionStage: string;
    unsavedCount: number;
    drives: InternalDrives;
    currentFocus: string | null;
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