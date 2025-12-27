import { DAppContext, SimulationResult, Vector } from '../types';
import { formatTokenAmount } from '@/lib/utils'; // You might need to adjust import path
import { parseEther, formatEther } from 'viem';

export class SimulationEngine {
  
  public runSimulation(
    intent: string, 
    context: DAppContext, 
    userVector: Vector
  ): SimulationResult | null {
    
    // Only simulate for financial or dApp queries
    if (!['FINANCIAL_ADVICE', 'DAPP_QUERY'].includes(intent) || !context) return null;

    const balance = context.user_balance ? parseFloat(formatEther(context.user_balance)) : 0;
    const reputation = context.total_reputation ? parseFloat(formatEther(context.total_reputation)) : 0;

    // SCENARIO 1: Accumulation (Finance Dimension dominant)
    if (userVector[0] > 0.6) {
      return this.simulateYieldStrategy(balance, reputation);
    }

    // SCENARIO 2: Reputation Building (Social/Abstract Dimension dominant)
    if (userVector[2] > 0.5 || userVector[4] > 0.5) {
      return this.simulateReputationStrategy(balance);
    }

    return null;
  }

  private simulateYieldStrategy(balance: number, reputation: number): SimulationResult {
    // Logic: Compare short term vs long term
    // Mock calculation based on Protocol Math
    const potentialYieldShort = (balance * 0.0618 * (5/365)); // 5 days
    const potentialYieldLong = (balance * 0.0618 * (233/365)) * 1.618; // 233 days + multiplier

    if (balance < 100) {
      return {
        scenario: "Low Capital Efficiency",
        outcomeValue: potentialYieldShort,
        riskLevel: 0.1,
        recommendation: "Capital insufficient for significant yield. Prioritize 'Standard Run' to build reputation base first."
      };
    }

    return {
      scenario: "Yield Maximization",
      outcomeValue: potentialYieldLong,
      riskLevel: 0.4, // Time risk
      recommendation: `Projected outcome: Long-term locking (233d) yields ~${potentialYieldLong.toFixed(2)}x more than cycling short-term orders due to the 1.618x Fibonacci multiplier.`
    };
  }

  private simulateReputationStrategy(balance: number): SimulationResult {
    return {
      scenario: "Reputation Acceleration",
      outcomeValue: balance * 2.618, // Max multiplier
      riskLevel: 0.8,
      recommendation: "To maximize social standing in the protocol, the 'Monopoly' tier offers a 2.618x reputation boost. This is the fastest path to governance influence."
    };
  }
}