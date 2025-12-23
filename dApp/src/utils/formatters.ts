// src/utils/formatters.ts

export const formatTokenAmount = (amount: string | number | bigint, digits: number = 2): string => {
  const num = typeof amount === 'bigint' ?
    parseFloat(amount.toString()) / 1e18 : 
    typeof amount === 'string' ?
    parseFloat(amount) : amount;
  
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