import { useMemo } from 'react';
import { calculateOrderReputation, calculateExpectedYield } from '@/lib/utils';
import { ORDER_TYPES } from '@/config/index';
import { parseEther } from 'viem';

export function useOrderCalculations(amount: string, selectedTier: number) {
  return useMemo(() => {
    try {
      // FIX: Use parseEther for accurate 18 decimal parsing
      // If empty string or invalid, default to 0n
      const amountBigInt = amount && !isNaN(Number(amount)) ? parseEther(amount) : 0n;
      
      if (amountBigInt === 0n) {
        return { reputation: 0n, expectedYield: 0n, tierInfo: ORDER_TYPES[selectedTier] };
      }

      const reputation = calculateOrderReputation(amountBigInt, selectedTier);
      const expectedYield = calculateExpectedYield(reputation, ORDER_TYPES[selectedTier].days);

      return { reputation, expectedYield, tierInfo: ORDER_TYPES[selectedTier] };
    } catch {
      return { reputation: 0n, expectedYield: 0n, tierInfo: ORDER_TYPES[selectedTier] };
    }
  }, [amount, selectedTier]);
}