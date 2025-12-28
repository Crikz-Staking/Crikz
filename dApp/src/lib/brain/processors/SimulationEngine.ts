import { DAppContext, SimulationResult, Vector } from '../types';
import { formatEther } from 'viem';

export class SimulationEngine {
  
  /**
   * Run a simulation based on intent, context, and user personality vector.
   * Supports both active queries and background subconscious checks.
   */
  public runSimulation(
    intent: string, 
    context: DAppContext, 
    userVector: Vector // [Financial, Technical, Social, Temporal, Abstract, Risk]
  ): SimulationResult | null {
    
    if (!context) return null;

    // Parse BigInts to numbers for simulation math
    const balance = context.user_balance ? parseFloat(formatEther(context.user_balance)) : 0;
    const reputation = context.total_reputation ? parseFloat(formatEther(context.total_reputation)) : 0;
    const globalFund = context.global_fund_balance ? parseFloat(formatEther(context.global_fund_balance)) : 0;

    // 1. Analyze User Profile from Vector
    const financialDrive = userVector[0];
    const riskTolerance = userVector[5]; // -1 (Safety) to 1 (Risk)
    const timePreference = userVector[3]; // 0 (Now) to 1 (Long term)

    // 2. Determine Simulation Strategy
    
    // STRATEGY A: Global Health Check (Priority if critical)
    // If the fund is running low compared to user's stake, warn them.
    if (globalFund < balance * 0.1 && balance > 0) {
        return {
            scenario: "Liquidity Constraint",
            outcomeValue: globalFund,
            riskLevel: 0.9,
            recommendation: "The global production fund is currently low relative to your potential claim. It is mathematically optimal to delay large yield claims until the fund is replenished via new orders."
        };
    }

    // STRATEGY B: Yield Optimization (High Financial Drive)
    if (financialDrive > 0.5 || intent === 'FINANCIAL_ADVICE') {
        return this.simulateYieldStrategy(balance, reputation, riskTolerance, timePreference);
    }

    // STRATEGY C: Reputation/Governance (High Social Drive)
    if (userVector[2] > 0.5 || intent === 'DAPP_QUERY') {
        return this.simulateReputationStrategy(balance, riskTolerance);
    }

    return null;
  }

  private simulateYieldStrategy(
    balance: number, 
    reputation: number, 
    riskTolerance: number,
    timePreference: number
  ): SimulationResult {
    
    const APR_BASE = 0.0618; // 6.18%
    
    // Scenario 1: Safe / Short Term
    const shortTermTier = { days: 34, mult: 1.001, name: "Standard Run" };
    const shortYield = balance * APR_BASE * (shortTermTier.days / 365) * shortTermTier.mult;
    
    // Scenario 2: Aggressive / Long Term
    const longTermTier = { days: 233, mult: 1.619, name: "Industrial" };
    const longYield = balance * APR_BASE * (longTermTier.days / 365) * longTermTier.mult;

    if (balance < 50) {
        return {
            scenario: "Capital Accumulation Phase",
            outcomeValue: shortYield,
            riskLevel: 0.1,
            recommendation: "Your capital base is in the seeding phase. I recommend short cycles (13-34 days) to compound principal before attempting industrial scales."
        };
    }

    // High Risk Tolerance OR Long Time Preference -> Recommend Long Term
    if (riskTolerance > 0.3 || timePreference > 0.6) {
        const roi = ((longYield / balance) * 100).toFixed(2);
        return {
            scenario: "Fibonacci Compounding",
            outcomeValue: longYield,
            riskLevel: 0.4, // Time lock risk
            recommendation: `Based on your temporal preference, the '${longTermTier.name}' tier aligns with your vector. It offers a ${longTermTier.mult}x multiplier, projected to generate ${longYield.toFixed(2)} tokens (${roi}% ROI).`
        };
    }

    // Default Safe Recommendation
    return {
        scenario: "Steady Growth",
        outcomeValue: shortYield,
        riskLevel: 0.1,
        recommendation: `To minimize liquidity risk while maintaining growth, the '${shortTermTier.name}' cycle is optimal. It keeps your assets liquid while building a reputation baseline.`
    };
  }

  private simulateReputationStrategy(balance: number, riskTolerance: number): SimulationResult {
    // Reputation = Amount * Tier Multiplier
    const maxMultiplier = 2.618; // Monopoly Tier
    const safeMultiplier = 1.001; // Standard Tier

    if (riskTolerance > 0.5) {
        const potentialRep = balance * maxMultiplier;
        return {
            scenario: "Influence Acceleration",
            outcomeValue: potentialRep,
            riskLevel: 0.8,
            recommendation: `You demonstrate high entropy tolerance. Locking funds in the 'Monopoly' tier (1597 days) applies the Golden Ratio multiplier (2.618x), maximizing your governance weight instantly.`
        };
    }

    return {
        scenario: "Reputation Building",
        outcomeValue: balance * safeMultiplier,
        riskLevel: 0.2,
        recommendation: "Consistency beats intensity. Rolling multiple 'Standard Run' orders creates a ladder of unlocking reputation, ensuring you are never without voting power."
    };
  }
}