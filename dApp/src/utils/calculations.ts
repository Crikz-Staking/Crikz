// src/utils/calculations.ts
import { ORDER_TYPES, WAD } from '../config';

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
  fundBalance: bigint,
  totalReputation: bigint,
  durationDays: number
): bigint {
  if (totalReputation === 0n || fundBalance === 0n) return 0n;

  const durationSeconds = BigInt(durationDays * 24 * 60 * 60);
  const secondsPerYear = BigInt(365 * 24 * 60 * 60);
  
  // Yield = (Balance * Duration * APR_BASIS) / (100000 * SecondsPerYear)
  // 6182 represents 6.182%
  const yieldGenerated = (fundBalance * durationSeconds * 6182n) / (100000n * secondsPerYear);
  
  // Share = (YieldGenerated * WAD) / TotalReputation
  const yieldPerReputation = (yieldGenerated * WAD) / totalReputation;
  
  // User Share = (Reputation * YieldPerReputation) / WAD
  return (reputation * yieldPerReputation) / WAD;
}

export function getOrderStatus(startTime: bigint, duration: bigint) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const unlockTime = startTime + duration;
  const isUnlocked = now >= unlockTime;
  
  const timeRemaining = isUnlocked ? 0 : Number(unlockTime - now);
  const elapsed = now - startTime;
  
  // Avoid division by zero
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
  const totalProduct = (reputation * accumulatedYieldPerReputation) / WAD;
  if (totalProduct <= yieldDebt) return 0n;
  return totalProduct - yieldDebt;
}