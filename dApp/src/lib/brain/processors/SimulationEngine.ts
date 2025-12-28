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
    
    // Vector Decomposition
    const financialDrive = userVector[0]; // Financial
    const riskTolerance = userVector[5];  // Risk
    const timePreference = userVector[3]; // Temporal

    // Global Health Check
    // If Global Fund is low relative to reputation, yield density is low.
    const globalHealth = globalFund > 1000 ? 1 : 0.5; 

    if (globalHealth < 0.5 && balance > 0) {
        return {
            scenario: "Liquidity Constraint",
            outcomeValue: globalFund,
            riskLevel: 0.9,
            recommendation: "Global production fund is currently low. Staking now yields primarily reputation, not token rewards."
        };
    }

    if (financialDrive > 0.4 || intent === 'FINANCIAL_ADVICE') {
        return this.simulateYieldStrategy(balance, reputation, riskTolerance, timePreference);
    }

    if (intent === 'DAPP_QUERY') {
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
    
    // EXACT CONTRACT MATH:
    // Yield = (Fund * Time * 6182) / (100000 * 365)
    // Here we approximate the Fund portion using the User's Share logic from ProductionDistributor.sol
    // UserShare = (UserRep / TotalRep) * AccumulatedYield
    
    // We simulate "Standard" vs "Industrial" tiers
    const standardTier = ORDER_TYPES[2]; // 34 days
    const industrialTier = ORDER_TYPES[4]; // 233 days

    // Calculate Raw Reputation Gain
    const standardRep = balance * standardTier.multiplier;
    const industrialRep = balance * industrialTier.multiplier;

    // Calculate Projected Yield (Approximate based on BASE_APR)
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

    // Long-term Preference Logic
    if (timePreference > 0.6) {
        const roi = ((industrialYield / balance) * 100).toFixed(2);
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