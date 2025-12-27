import { formatTokenAmount } from '@/lib/utils';

export type GameResult = {
  won: boolean;
  multiplier: number;
  reward: bigint;
  message: string;
};

function isPrime(num: number): boolean {
  for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
    if (num % i === 0) return false;
  }
  return num > 1;
}

/**
 * Logic for the Fibonacci Dice game
 * Current implementation uses client-side randomness for demonstration.
 * In a mainnet deployment, this should call a contract using Chainlink VRF.
 */
export const calculateDiceResult = (betAmount: bigint, choice: 'fib' | 'prime'): GameResult => {
  const roll = Math.floor(Math.random() * 100) + 1;
  const fibNumbers = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  const isFib = fibNumbers.includes(roll);

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