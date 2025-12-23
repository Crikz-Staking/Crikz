// src/utils/calculations.ts
import { ORDER_TYPES, WAD, BASE_APR } from '../config';

export function calculateOrderReputation(amount: bigint, orderTypeIndex: number): bigint {
  if (orderTypeIndex < 0 || orderTypeIndex >= ORDER_TYPES.length) return 0n;
  const orderType = ORDER_TYPES[orderTypeIndex];
  // Convert decimal multiplier to BigInt (e.g., 1.001 -> 1001 scaled by 1000)
  const multiplierScaled = BigInt(Math.floor(orderType.multiplier * 1000));
  // amount * multiplier / 1000
  return (amount * multiplierScaled) / 1000n;
}

export function calculateExpectedYield(
  reputation: bigint,
  durationDays: number
): bigint {
  if (reputation === 0n) return 0n;
  
  const durationSeconds = BigInt(durationDays * 24 * 60 * 60);
  const secondsPerYear = BigInt(365 * 24 * 60 * 60);
  
  // Static APR Calculation: (Reputation * Duration * APR) / SecondsPerYear
  // BASE_APR is 6.182, scaled by 1000 for precision => 6182
  const aprScaled = BigInt(Math.floor(BASE_APR * 1000)); 
  
  // Result = (Rep * Duration * 6182) / (365 days * 1000 * 100 for percent)
  const yieldAmount = (reputation * durationSeconds * aprScaled) / (secondsPerYear * 100000n);
  
  return yieldAmount;
}

export function getOrderStatus(startTime: bigint, duration: bigint) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const unlockTime = startTime + duration;
  const isUnlocked = now >= unlockTime;
  
  const timeRemaining = isUnlocked ? 0 : Number(unlockTime - now);
  const elapsed = now - startTime;
  
  const progress = duration > 0n 
    ? Math.min(Number((elapsed * 100n) / duration), 100) 
    : 100;
  
  return { isUnlocked, timeRemaining, progress, unlockTime };
}

export function calculatePendingYield(
  reputation: bigint,
  accumulatedYieldPerReputation: bigint,
  yieldDebt: bigint
): bigint {
  // Kept for utility, but currently unused in main flow due to removal request
  const totalProduct = (reputation * accumulatedYieldPerReputation) / WAD;
  if (totalProduct <= yieldDebt) return 0n;
  return totalProduct - yieldDebt;
}