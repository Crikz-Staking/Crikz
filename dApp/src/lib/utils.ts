import { ORDER_TYPES, BASE_APR, WAD } from '@/config/index';

// ==========================================
// FORMATTERS
// ==========================================

export const formatTokenAmount = (amount: string | number | bigint, digits: number = 2): string => {
  const num = typeof amount === 'bigint' ? 
    parseFloat(amount.toString()) / 1e18 : 
    typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0.00';
  if (num === 0) return '0.00';
  if (num < 0.001) return '<0.001';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: 4,
  }).format(num);
};

export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return "Ready";
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m left`;
};

export const formatDate = (timestamp: bigint | number): string => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// ==========================================
// CALCULATIONS
// ==========================================

export function calculateOrderReputation(amount: bigint, orderTypeIndex: number): bigint {
  if (orderTypeIndex < 0 || orderTypeIndex >= ORDER_TYPES.length) return 0n;
  const orderType = ORDER_TYPES[orderTypeIndex];
  // Multiplier scaled by 1000 (e.g., 1.001 -> 1001)
  const multiplierScaled = BigInt(Math.floor(orderType.multiplier * 1000));
  return (amount * multiplierScaled) / 1000n;
}

export function calculateExpectedYield(reputation: bigint, durationDays: number): bigint {
  if (reputation === 0n) return 0n;
  const durationSeconds = BigInt(durationDays * 24 * 60 * 60);
  const secondsPerYear = BigInt(365 * 24 * 60 * 60);
  
  // BASE_APR is 6.182 -> scaled to 6182
  const aprScaled = BigInt(Math.floor(BASE_APR * 1000));
  
  // (Rep * Duration * APR) / (SecondsYear * 1000 * 100)
  return (reputation * durationSeconds * aprScaled) / (secondsPerYear * 100000n);
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