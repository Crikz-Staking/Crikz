import { DAppContext, SimulationResult, Vector, LogicPath, BrainState } from '../types';
import { formatEther } from 'viem';
import { ORDER_TYPES, BASE_APR } from '@/config/index';
import { ConceptRelation } from '@/lib/crikzling-atomic-knowledge';

export class SimulationEngine {
  
  public runSimulation(
    intent: string, 
    context: DAppContext, 
    userVector: Vector 
  ): SimulationResult | null {
    
    if (!context) return null;

    const balance = context.user_balance ? parseFloat(formatEther(context.user_balance)) : 0;
    const globalRep = context.global_total_reputation ? parseFloat(formatEther(context.global_total_reputation)) : 1;
    const globalFund = context.global_fund_balance ? parseFloat(formatEther(context.global_fund_balance)) : 0;

    const financial = userVector[0]; 
    const risk = userVector[5];  
    const time = userVector[3]; 

    const yieldDensity = globalFund / Math.max(1, globalRep);

    if (yieldDensity < 0.0001 && balance > 0) {
        return {
            scenario: "Liquidity Constraint",
            outcomeValue: globalFund,
            riskLevel: 0.9,
            recommendation: `Global yield density is critical (${yieldDensity.toFixed(6)}). Yield is diluted.`
        };
    }

    if (financial > 0.4 || intent === 'FINANCIAL_ADVICE') {
        return this.simulateYieldStrategy(balance, risk, time);
    }

    if (intent === 'DAPP_QUERY') {
        return this.simulateReputationStrategy(balance, risk);
    }

    return null;
  }

  // --- NEW: LOGIC GRAPH WALKER ---
  // This allows Crikzling to "Find a path" between two concepts to answer "Why" or "How" types of questions.
  public inferRelationship(startConcept: string, endConcept: string | null, relations: ConceptRelation[]): LogicPath | null {
      // Breadth-First Search to find path
      // If endConcept is null, find the strongest path outward
      
      const queue: { id: string, path: string[], rels: string[] }[] = [{ id: startConcept, path: [startConcept], rels: [] }];
      const visited = new Set<string>([startConcept]);
      
      let bestPath: LogicPath | null = null;
      let iterations = 0;

      while(queue.length > 0 && iterations < 50) {
          const current = queue.shift()!;
          
          if (endConcept && current.id === endConcept) {
              return { nodes: current.path, relations: current.rels, strength: 1.0 };
          }

          // If looking for generic explanation, just go 3 deep and stop at a high-value concept
          if (!endConcept && current.path.length >= 3) {
              return { nodes: current.path, relations: current.rels, strength: 0.8 };
          }

          const neighbors = relations.filter(r => r.from === current.id);
          // Sort by strength descending
          neighbors.sort((a,b) => b.strength - a.strength);

          for (const rel of neighbors) {
              if (!visited.has(rel.to)) {
                  visited.add(rel.to);
                  queue.push({
                      id: rel.to,
                      path: [...current.path, rel.to],
                      rels: [...current.rels, rel.type]
                  });
              }
          }
          iterations++;
      }
      
      return bestPath;
  }

  // --- Existing Strategies ---

  private simulateYieldStrategy(balance: number, riskTolerance: number, timePreference: number): SimulationResult {
    const standardTier = ORDER_TYPES[2]; 
    const industrialTier = ORDER_TYPES[4]; 
    const aprDecimal = BASE_APR / 100;
    
    const standardYield = balance * aprDecimal * (standardTier.days / 365);
    const industrialYield = balance * aprDecimal * (industrialTier.days / 365);

    if (balance < 10) {
        return {
            scenario: "Capital Accumulation",
            outcomeValue: standardYield,
            riskLevel: 0.1,
            recommendation: "Principal below efficient threshold. Recommend short-term cycles."
        };
    }

    if (timePreference > 0.6) {
        return {
            scenario: "Industrial Fibonacci Compounding",
            outcomeValue: industrialYield,
            riskLevel: 0.4,
            recommendation: `High time-preference detected. The ${industrialTier.days}-day cycle maximizes multiplier (${industrialTier.multiplier}x).`
        };
    }

    return {
        scenario: "Standard Optimization",
        outcomeValue: standardYield,
        riskLevel: 0.1,
        recommendation: `The '${standardTier.name}' offers optimal liquidity/yield balance.`
    };
  }

  private simulateReputationStrategy(balance: number, riskTolerance: number): SimulationResult {
    const maxTier = ORDER_TYPES[6]; 
    const safeTier = ORDER_TYPES[2]; 

    const maxRep = balance * maxTier.multiplier;
    const safeRep = balance * safeTier.multiplier;

    if (riskTolerance > 0.7) {
        return {
            scenario: "Influence Acceleration",
            outcomeValue: maxRep,
            riskLevel: 0.8,
            recommendation: `To maximize governance weight, lock liquidity for ${maxTier.days} days.`
        };
    }

    return {
        scenario: "Reputation Building",
        outcomeValue: safeRep,
        riskLevel: 0.2,
        recommendation: "Consistent 'Standard Run' orders create a ladder of reputation unlocking."
    };
  }
}