import { WAD } from '@/config/index';
import { formatTokenAmount } from '@/lib/utils';

export type GameResult = {
  won: boolean;
  multiplier: number;
  reward: bigint;
  message: string;
};

/**
 * Logic for the Fibonacci Dice game
 * Uses a pseudo-random seed (In production, replace with Chainlink VRF)
 */
export const calculateDiceResult = (betAmount: bigint, choice: 'fib' | 'prime'): GameResult => {
  const roll = Math.floor(Math.random() * 100) + 1;
  const fibNumbers = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  const isFib = fibNumbers.includes(roll);
  
  // Logic: Choosing 'fib' is harder (10% chance) but pays more (5x)
  // Choosing 'prime' is easier (25% chance) and pays less (2x)
  let won = false;
  let multiplier = 0;

  if (choice === 'fib' && isFib) {
    won = true;
    multiplier = 5;
  } else if (choice === 'prime' && isPrime(roll)) {
    won = true;
    multiplier = 2;
  }

  const reward = won ? betAmount * BigInt(multiplier) : 0n;
  
  return {
    won,
    multiplier,
    reward,
    message: won 
      ? `Success! You rolled ${roll} and earned ${formatTokenAmount(reward)} CRIKZ.`
      : `Rolled ${roll}. Better luck next production cycle.`
  };
};

function isPrime(num: number): boolean {
  for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
    if (num % i === 0) return false;
  }
  return num > 1;
}