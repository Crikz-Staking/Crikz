import { InputAnalysis } from './InputProcessor';
import { ActionPlan } from './ActionProcessor';
import { Memory, BrainState, DAppContext, BlockchainMemory, SimulationResult } from '../types';

export interface IntegratedContext {
  input: InputAnalysis;
  actionPlan: ActionPlan;
  memories: Memory[];
  blockchainHistory: BlockchainMemory[];
  dappState: DAppIntegratedState | null;
  simulation?: SimulationResult | null; // NEW: Simulation Data
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
    dappContext?: DAppContext,
    simulationResult?: SimulationResult | null // NEW
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

    return {
      input,
      actionPlan: plan,
      memories,
      blockchainHistory: brainState.blockchainMemories,
      dappState: integratedDApp,
      simulation: simulationResult, // Passed to Response Generator
      brainStats: {
        evolutionStage: brainState.evolutionStage,
        unsavedCount: brainState.unsavedDataCount
      }
    };
  }
}