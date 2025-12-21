// src/utils/calculations.ts
import { ORDER_TYPES, WAD } from '../config';

export function calculateOrderReputation(amount: bigint, orderTypeIndex: number): bigint {
  const orderType = ORDER_TYPES[orderTypeIndex];
  const multiplier = BigInt(Math.floor(orderType.multiplier * 1000));
  return (amount * multiplier) / 1000n;
}

export function calculateExpectedYield(
  reputation: bigint,
  fundBalance: bigint,
  totalReputation: bigint,
  durationDays: number
): bigint {
  if (totalReputation === 0n || fundBalance === 0n) return 0n;
  
  const durationSeconds = BigInt(durationDays * 24 * 60 * 60);
  const yieldGenerated = (fundBalance * durationSeconds * 6182n) / (100000n * BigInt(365 * 24 * 60 * 60));
  const yieldPerReputation = (yieldGenerated * WAD) / totalReputation;
  
  return (reputation * yieldPerReputation) / WAD;
}

export function getOrderStatus(startTime: bigint, duration: bigint) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const unlockTime = startTime + duration;
  const isUnlocked = now >= unlockTime;
  
  const timeRemaining = isUnlocked ? 0 : Number(unlockTime - now);
  const elapsed = now - startTime;
  const progress = duration > 0n ? Math.min(Number((elapsed * 100n) / duration), 100) : 0;
  
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