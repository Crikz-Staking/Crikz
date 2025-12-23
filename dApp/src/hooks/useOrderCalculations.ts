// src/hooks/useOrderCalculations.ts
import { useMemo } from 'react';
import { calculateOrderReputation, calculateExpectedYield } from '../utils/calculations';
import { ORDER_TYPES } from '../config';

export function useOrderCalculations(
  amount: string,
  selectedTier: number
) {
  return useMemo(() => {
    try {
      const amountBigInt = BigInt(Math.floor(parseFloat(amount || '0') * 1e18));
      
      if (amountBigInt === 0n) {
        return {
          reputation: 0n,
          expectedYield: 0n,
          tierInfo: ORDER_TYPES[selectedTier]
        };
      }

      const reputation = calculateOrderReputation(amountBigInt, selectedTier);
      
      // Updated to use static calculation (no fund dependency)
      const expectedYield = calculateExpectedYield(
        reputation,
        ORDER_TYPES[selectedTier].days
      );

      return {
        reputation,
        expectedYield,
        tierInfo: ORDER_TYPES[selectedTier]
      };
    } catch {
      return {
        reputation: 0n,
        expectedYield: 0n,
        tierInfo: ORDER_TYPES[selectedTier]
      };
    }
  }, [amount, selectedTier]);
}