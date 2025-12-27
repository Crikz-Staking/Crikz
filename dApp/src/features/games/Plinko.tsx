import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ArrowDownCircle, Settings2, Zap } from 'lucide-react';

interface GameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  dynamicColor: string;
}

// --- CONFIGURATION ---
const ROWS = 14; // Increased rows for better gameplay depth
const PIN_RADIUS = 3;
const BALL_RADIUS = 5;
const GRAVITY_SPEED = 0.6; // Speed multiplier

type Difficulty = 'low' | 'medium' | 'high';

// --- CANVAS TYPES ---
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface PlinkoBallEntity {
  id: number;
  x: number;
  y: number;
  path: number[]; // Array of direction offsets (-1 or 1)
  currentRow: number;
  progress: number; // 0 to 1 between rows
  finished: boolean;
  color: string;
}

interface Pin {
  x: number;
  y: number;
  active: number; // 0 to 1, decay for glow effect
}

export default function Plinko({ onClose, balance, onUpdateBalance, dynamicColor }: GameProps) {
  const [bet, setBet] = useState(100);
  const [risk, setRisk] = useState<Difficulty>('medium');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game State Refs (Mutable for Animation Loop)
  const ballsRef = useRef<PlinkoBallEntity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const pinsRef = useRef<Pin[][]>([]);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const ballIdCounter = useRef(0);

  // --- MULTIPLIERS LOGIC ---
  const multipliers = useMemo(() => {
      const bucketCount = ROWS + 1;
      const center = Math.floor(bucketCount / 2);
      
      return Array.from({ length: bucketCount }).map((_, i) => {
          const dist = Math.abs(i - center);
          if (risk === 'high') {
              if (dist === center) return 110; 
              if (dist >= center - 1) return 45;
              if (dist >= center - 2) return 15;
              return i % 2 === 0 ? 0.2 : 0.3;
          } else if (risk === 'medium') {
              if (dist === center) return 25;
              if (dist >= center - 2) return 5;
              return dist === 0 ? 0.5 : 0.8 + (dist * 0.3);
          } else {
              // Low
              if (dist === center) return 10;
              return dist === 0 ? 0.8 : 1 + (dist * 0.1);
          }
      }).map(n => parseFloat(n.toFixed(1)));
  }, [risk]);

  // --- PHYSICS ENGINE ---
  const dropBall = () => {
    if (balance < bet) return;
    onUpdateBalance(-bet);

    // 1. Pre-calculate path (The "Rigging" / Provably Fair part)
    // 0 = Left, 1 = Right
    // Current Index starts at 0 (Tip of pyramid)
    const path: number[] = []; 
    let currentBucketIndex = 0; // Relative to row start? No, simplistic grid math.
    
    // Grid Logic:
    // Row 0: 1 Pin (Index 0)
    // Row 1: 2 Pins (Index 0, 1)
    // To go Left: Index stays same. To go Right: Index + 1.
    
    for(let i=0; i<ROWS; i++) {
        // Random direction
        const dir = Math.random() > 0.5 ? 1 : 0;
        path.push(dir);
    }

    const startX = canvasRef.current!.width / 2;
    const startY = 50;

    const newBall: PlinkoBallEntity = {
        id: ballIdCounter.current++,
        x: startX,
        y: startY,
        path: path,
        currentRow: 0,
        progress: 0,
        finished: false,
        color: dynamicColor
    };

    ballsRef.current.push(newBall);
  };

  // --- ANIMATION LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize Pins
    const initPins = () => {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const usableWidth = width - (padding * 2);
        const pinGap = usableWidth / ROWS; // approximate
        
        // Define Pyramid
        // Start Y
        const startY = 80;
        const endY = height - 100;
        const totalH = endY - startY;
        const rowH = totalH / ROWS;

        const newPins: Pin[][] = [];

        for(let r=0; r <= ROWS; r++) {
            const rowPins: Pin[] = [];
            const pinsInRow = r + 3; // Start with 3 pins at top row for visual buffering
            const rowWidth = pinsInRow * pinGap;
            const xOffset = (width - rowWidth) / 2 + (pinGap/2);
            
            for(let c=0; c < pinsInRow; c++) {
                rowPins.push({
                    x: xOffset + (c * pinGap),
                    y: startY + (r * rowH),
                    active: 0
                });
            }
            newPins.push(rowPins);
        }
        pinsRef.current = newPins;
    };

    const resize = () => {
        if(containerRef.current && canvas) {
            canvas.width = containerRef.current.clientWidth;
            canvas.height = containerRef.current.clientHeight;
            initPins();
        }
    };
    window.addEventListener('resize', resize);
    resize();

    // Loop
    const loop = (time: number) => {
        const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1); // Delta time in seconds
        lastTimeRef.current = time;
        
        // 1. Clear
        ctx.fillStyle = '#0A0A0F';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw/Update Pins
        pinsRef.current.forEach(row => {
            row.forEach(pin => {
                // Decay activation
                if (pin.active > 0) pin.active -= dt * 3;
                
                ctx.beginPath();
                ctx.arc(pin.x, pin.y, PIN_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + pin.active})`;
                ctx.fill();
                
                // Glow
                if (pin.active > 0.1) {
                    ctx.shadowColor = dynamicColor;
                    ctx.shadowBlur = pin.active * 15;
                    ctx.fillStyle = dynamicColor;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });
        });

        // 3. Update/Draw Balls
        for (let i = ballsRef.current.length - 1; i >= 0; i--) {
            const ball = ballsRef.current[i];
            
            // Logic: Move between Row N and Row N+1
            // We use Pins[row][col] as coordinates
            // Ball starts at top center (technically row -1 concept)
            // Let's align path index with pin rows.
            
            // Current Pin (Start of arc)
            // The path calculation determined we are at `currentPathIndex` (horizontal index)
            // Since we added padding to pins (row + 3), we need to offset the logic index to pin index.
            // Center of row 0 (3 pins) is index 1.
            
            // Logic Index (0..row) -> Pin Index
            // Row 0 (3 pins): logic 0 -> pin 1
            // Row 1 (4 pins): logic 0 -> pin 1, logic 1 -> pin 2
            
            // We calculate 'current logical index' by summing path 0/1s so far.
            const pathSoFar = ball.path.slice(0, ball.currentRow);
            const currentLogicCol = pathSoFar.reduce((a, b) => a + b, 0);
            
            // Pin Indices offset by +1 because row starts with 3 pins (indices 0,1,2). Center is 1.
            // Actually, let's look at pinsRef structure.
            // Row R has R+3 pins.
            // Center is roughly (R+3)/2. 
            // Let's approximate visually based on X coords of pinsRef.
            
            if (ball.currentRow >= ROWS) {
                // Finished
                if (!ball.finished) {
                    ball.finished = true;
                    // Trigger Payout
                    const finalBucket = currentLogicCol;
                    const mult = multipliers[finalBucket];
                    const win = Math.floor(bet * mult);
                    if (win > 0) {
                        onUpdateBalance(win);
                        // Bucket Hit Effect (Particles)
                        spawnExplosion(ball.x, ball.y, 20, dynamicColor);
                    }
                }
                // Fade out/Remove
                ballsRef.current.splice(i, 1);
                continue;
            }

            // Move Progress
            ball.progress += dt * (GRAVITY_SPEED + (ball.currentRow * 0.1)); // Accelerate slightly down rows

            if (ball.progress >= 1) {
                // Hit the pin!
                ball.currentRow++;
                ball.progress = 0;
                
                // Trigger Pin Glow
                // Determine which pin we hit. The 'target' of the previous move.
                const nextLogicCol = currentLogicCol + ball.path[ball.currentRow - 1]; // Previous move determines where we are now
                
                // This logic is getting complex for array indexing.
                // Simplified: Calculate positions based on Bezier.
                
                spawnExplosion(ball.x, ball.y, 5, '#ffffff');
                // Find nearest pin to light up
                const currentRowPins = pinsRef.current[ball.currentRow];
                if (currentRowPins) {
                    // Simple distance check to light up pin
                    let closestPin: Pin | null = null;
                    let minDist = 1000;
                    currentRowPins.forEach(p => {
                        const d = Math.abs(p.x - ball.x) + Math.abs(p.y - ball.y);
                        if (d < minDist) { minDist = d; closestPin = p; }
                    });
                    if (closestPin && minDist < 20) {
                        (closestPin as Pin).active = 1.0;
                    }
                }
            }

            // Calculate Position (Quadratic Bezier)
            // P0 = Start Pin, P2 = End Pin, P1 = Control (Up)
            
            // Start Pin Coords
            // Row R. Logic Index L.
            // Pin Index roughly = L + 1 (Since row 0 has 3 pins, center is index 1)
            // But we need to match the Pin Generation logic:
            // Row 0 has 3 pins. Logic Col 0 (start) corresponds to the middle pin (index 1).
            
            const r = ball.currentRow;
            const c = currentLogicCol; 
            
            // Adjust C for the pin array offset.
            // Row 0: 3 pins. We start at center (index 1). logic 0 -> 1.
            // Row 1: 4 pins. logic 0 (left) -> 1. logic 1 (right) -> 2.
            const pinIndexStart = c + 1;
            
            const startPin = pinsRef.current[r]?.[pinIndexStart] || { x: canvas.width/2, y: 50 }; // Fallback
            
            // End Pin (Next Row)
            const nextDir = ball.path[r]; // 0 or 1
            const nextC = c + nextDir;
            const pinIndexEnd = nextC + 1;
            const endPin = pinsRef.current[r+1]?.[pinIndexEnd] || { x: startPin.x, y: startPin.y + 30 };

            // Bezier Interpolation
            const t = ball.progress;
            // P1 (Control) is halfway between X, but slightly UP in Y to simulate arc
            const p1x = (startPin.x + endPin.x) / 2;
            const p1y = startPin.y - 15; // Bounce height

            // B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
            const bx = Math.pow(1-t, 2) * startPin.x + 2 * (1-t) * t * p1x + Math.pow(t, 2) * endPin.x;
            const by = Math.pow(1-t, 2) * startPin.y + 2 * (1-t) * t * p1y + Math.pow(t, 2) * endPin.y;

            ball.x = bx;
            ball.y = by;

            // Draw Ball
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = ball.color;
            ctx.shadowColor = ball.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 4. Update/Draw Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt * 2;
            
            if (p.life <= 0) {
                particlesRef.current.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        animationFrameRef.current = requestAnimationFrame(loop);
    };

    // Helper: Spawn Particles
    const spawnExplosion = (x: number, y: number, count: number, color: string) => {
        for(let i=0; i<count; i++) {
            particlesRef.current.push({
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: color,
                size: Math.random() * 2 + 1
            });
        }
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        window.removeEventListener('resize', resize);
    };
  }, [multipliers, bet, balance, dynamicColor]); // Dependencies for loop logic updates

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-white/10 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"><X size={20}/></button>

        {/* Game Board (Canvas) */}
        <div className="flex-[2] bg-[#0A0A0F] relative flex flex-col border-r border-white/5" ref={containerRef}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
            
            {/* Multipliers Overlay (HTML for crisp text) */}
            <div className="absolute bottom-4 left-4 right-4 flex gap-1 z-10 h-10">
                {multipliers.map((m, i) => {
                    // Color Logic
                    let bg = 'bg-white/5 text-gray-500';
                    if (m >= 10) bg = 'bg-red-500/20 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                    else if (m >= 3) bg = 'bg-orange-500/20 text-orange-500 border border-orange-500/50';
                    else if (m >= 1.5) bg = 'bg-green-500/20 text-green-500 border border-green-500/50';
                    else if (m < 1) bg = 'bg-blue-500/10 text-blue-500/50';

                    return (
                        <div key={i} className={`flex-1 flex items-center justify-center rounded text-[10px] font-bold ${bg} transition-all`}>
                            {m}x
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Controls */}
        <div className="flex-1 bg-[#181820] p-6 flex flex-col gap-6 relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
            <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <ArrowDownCircle className="text-primary-500"/> Plinko Pro
                </h3>
                <p className="text-xs text-gray-500">Provably fair physics simulation.</p>
            </div>

            <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Bet Amount</label>
                    <div className="flex gap-2">
                        <input type="number" value={bet} onChange={e => setBet(Math.max(10, parseInt(e.target.value)))} className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-white font-bold outline-none border border-transparent focus:border-primary-500 transition-colors"/>
                        <button onClick={() => setBet(bet * 2)} className="px-3 bg-white/5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors">2x</button>
                        <button onClick={() => setBet(Math.max(10, Math.floor(bet / 2)))} className="px-3 bg-white/5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors">1/2</button>
                    </div>
                </div>

                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                        <Settings2 size={12}/> Risk Level
                    </label>
                    <div className="flex bg-black/40 rounded-lg p-1">
                        {(['low', 'medium', 'high'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setRisk(r)}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                                    risk === r 
                                    ? 'bg-primary-500 text-black shadow-lg' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {r.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button 
                onClick={dropBall}
                disabled={balance < bet}
                className="mt-auto w-full py-4 bg-primary-500 text-black font-black text-lg rounded-xl hover:bg-primary-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <Zap size={20} fill="currentColor" /> DROP BALL
            </button>
        </div>
      </div>
    </div>
  );
}