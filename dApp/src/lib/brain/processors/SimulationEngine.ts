import { DAppContext, SimulationResult, Vector } from '../types';
import { formatEther } from 'viem';
import { ORDER_TYPES, BASE_APR } from '@/config/index';

export class SimulationEngine {
  
  public runSimulation(
    intent: string, 
    context: DAppContext, 
    userVector: Vector 
  ): SimulationResult | null {
    
    if (!context) return null;

    const balance = context.user_balance ? parseFloat(formatEther(context.user_balance)) : 0;
    const reputation = context.total_reputation ? parseFloat(formatEther(context.total_reputation)) : 0;
    const globalFund = context.global_fund_balance ? parseFloat(formatEther(context.global_fund_balance)) : 0;
    
    // REAL LOGIC: Use actual protocol reputation if available, else fallback to 1 (avoid div by zero)
    const globalRep = context.global_total_reputation ? parseFloat(formatEther(context.global_total_reputation)) : 1;
    
    // Vector Decomposition
    const financialDrive = userVector[0]; // Financial
    const riskTolerance = userVector[5];  // Risk
    const timePreference = userVector[3]; // Temporal

    // Global Health Check (Yield per Reputation Unit)
    // Determines if the protocol is diluted or rich
    const yieldDensity = globalFund / Math.max(1, globalRep);

    if (yieldDensity < 0.0001 && balance > 0) {
        return {
            scenario: "Liquidity Constraint",
            outcomeValue: globalFund,
            riskLevel: 0.9,
            recommendation: `Global yield density is critical (${yieldDensity.toFixed(6)}). Staking now yields reputation, but token rewards are diluted due to high global participation.`
        };
    }

    if (financialDrive > 0.4 || intent === 'FINANCIAL_ADVICE') {
        return this.simulateYieldStrategy(balance, riskTolerance, timePreference);
    }

    if (intent === 'DAPP_QUERY') {
        return this.simulateReputationStrategy(balance, riskTolerance);
    }

    return null;
  }

  private simulateYieldStrategy(
    balance: number, 
    riskTolerance: number,
    timePreference: number
  ): SimulationResult {
    
    const standardTier = ORDER_TYPES[2]; // 34 days
    const industrialTier = ORDER_TYPES[4]; // 233 days

    // Formula: Principal * APR * (Days/365)
    const aprDecimal = BASE_APR / 100; // 0.06182
    
    const standardYield = balance * aprDecimal * (standardTier.days / 365);
    const industrialYield = balance * aprDecimal * (industrialTier.days / 365);

    if (balance < 10) {
        return {
            scenario: "Capital Accumulation",
            outcomeValue: standardYield,
            riskLevel: 0.1,
            recommendation: "Principal is below efficient threshold. Recommend short-term 'Prototype' cycles to compound capital before locking for yield."
        };
    }

    if (timePreference > 0.6) {
        const roi = balance > 0 ? ((industrialYield / balance) * 100).toFixed(2) : '0';
        return {
            scenario: "Industrial Fibonacci Compounding",
            outcomeValue: industrialYield,
            riskLevel: 0.4,
            recommendation: `Temporal analysis suggests high time-preference. The ${industrialTier.days}-day cycle maximizes the Golden Ratio multiplier (${industrialTier.multiplier}x), projecting ${roi}% yield.`
        };
    }

    return {
        scenario: "Standard Optimization",
        outcomeValue: standardYield,
        riskLevel: 0.1,
        recommendation: `The '${standardTier.name}' (${standardTier.days} days) offers the optimal balance of liquidity and yield (${standardYield.toFixed(2)} CRKZ) for your current profile.`
    };
  }

  private simulateReputationStrategy(balance: number, riskTolerance: number): SimulationResult {
    const maxTier = ORDER_TYPES[6]; // Monopoly
    const safeTier = ORDER_TYPES[2]; // Standard

    const maxRep = balance * maxTier.multiplier;
    const safeRep = balance * safeTier.multiplier;

    if (riskTolerance > 0.7) {
        return {
            scenario: "Influence Acceleration",
            outcomeValue: maxRep,
            riskLevel: 0.8,
            recommendation: `Maximizing governance weight requires the '${maxTier.name}' tier. You will lock liquidity for ${maxTier.days} days to gain ${maxTier.multiplier}x reputation instantly.`
        };
    }

    return {
        scenario: "Reputation Building",
        outcomeValue: safeRep,
        riskLevel: 0.2,
        recommendation: "Consistent 'Standard Run' orders create a ladder of reputation unlocking, ensuring continuous governance participation without excessive liquidity lockup."
    };
  }
}