// src/utils/gameLogic.ts

// --- TIC TAC TOE AI (Minimax) ---
// The "Intelligent Being" that plays against the user
export function getBestMove(squares: any[], player: string): number {
  const opponent = player === 'X' ? 'O' : 'X';
  
  // Available moves
  const availableMoves = squares.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];

  // 1. If logic allows, take center (Fibonacci optimization: center is key)
  if (squares[4] === null) return 4;

  // 2. Simple Minimax-lite for immediate threat/win (for speed)
  // Check if can win now
  for (let i of availableMoves) {
    const copy = [...squares];
    copy[i] = player;
    if (calculateWinner(copy)) return i;
  }

  // Check if must block opponent
  for (let i of availableMoves) {
    const copy = [...squares];
    copy[i] = opponent;
    if (calculateWinner(copy)) return i;
  }

  // 3. Random fallback (weighted by Golden Ratio for "natural" feel)
  // Pick random available move
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
}

export function calculateWinner(squares: any[]) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// --- FIBONACCI PUZZLE LOGIC ---
export function generateFibSequence(difficulty: number): number[] {
  // Start with random seeds based on difficulty
  const n1 = Math.floor(Math.random() * (difficulty * 5)) + 1;
  const n2 = Math.floor(Math.random() * (difficulty * 5)) + n1;
  const seq = [n1, n2];
  
  for (let i = 2; i < 6; i++) {
    seq.push(seq[i-1] + seq[i-2]);
  }
  return seq;
}

// --- "CHRONO CLASH" BATTLE LOGIC ---
// Simulates an enemy reacting based on Fibonacci time intervals (3s, 5s, 8s)
export const ENEMY_TYPES = [
    { name: "Void Walker", hp: 100, attack: 5, interval: 3000 }, // Fast
    { name: "Time Weaver", hp: 150, attack: 8, interval: 5000 }, // Medium
    { name: "Golden Guardian", hp: 300, attack: 13, interval: 8000 } // Boss
];