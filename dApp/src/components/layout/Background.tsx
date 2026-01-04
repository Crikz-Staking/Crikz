import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BackgroundProps {
  aiState?: 'idle' | 'thinking' | 'responding';
}

export default function BackgroundEffects({ aiState = 'idle' }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let time = 0;

    // --- CONFIGURATION ---
    const PARTICLE_COUNT = 400; // Number of stars in the spiral
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.399 radians (137.5 degrees)

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Get dynamic settings based on AI state
    const getSettings = () => {
      switch (aiState) {
        case 'thinking':
          return {
            hue: 270, // Purple
            speed: 0.002,
            expansion: 1.2, // Expand slightly
            glow: 20
          };
        case 'responding':
          return {
            hue: 160, // Emerald/Cyan
            speed: 0.008, // Fast spin
            expansion: 1.1,
            glow: 15
          };
        default: // Idle
          return {
            hue: 45, // Gold
            speed: 0.0005, // Slow, majestic
            expansion: 1.0,
            glow: 10
          };
      }
    };

    function animate() {
      if (!ctx || !canvas) return;
      const settings = getSettings();
      
      // 1. Deep Space Fade (Trail Effect)
      ctx.fillStyle = 'rgba(5, 5, 8, 0.2)'; // Very dark blue-black, slight trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Center Origin
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      // 3. Update Time (Rotation)
      time += settings.speed;

      // 4. Draw Fibonacci Spiral
      // We draw from outside in, or inside out.
      
      ctx.save();
      ctx.translate(cx, cy);
      
      // Rotate the entire galaxy
      ctx.rotate(time); 

      for (let i = 1; i < PARTICLE_COUNT; i++) {
        // Fibonacci Math
        const angle = i * GOLDEN_ANGLE;
        const dist = Math.sqrt(i) * (12 * settings.expansion); // Distance from center
        
        // Convert polar to cartesian
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;

        // Size calculation (larger in middle, smaller at edges)
        const size = Math.max(0.5, (3 - (dist / 500))); 
        
        // Color Logic
        // Base color + slight variation based on distance for depth
        const alpha = Math.max(0.1, 1 - (dist / (Math.min(cx, cy) * 1.2)));
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        
        // Glow Effect
        ctx.shadowBlur = settings.glow;
        ctx.shadowColor = `hsla(${settings.hue}, 100%, 50%, ${alpha})`;
        ctx.fillStyle = `hsla(${settings.hue}, 80%, 60%, ${alpha})`;
        
        ctx.fill();

        // 5. Connect the "Arms" (Technological Lines)
        // Connecting i to i+something creates spiral arms visually
        // 34 is a Fibonacci number, creates nice arms
        const neighborIndex = i + 34; 
        if (neighborIndex < PARTICLE_COUNT) {
            const nAngle = neighborIndex * GOLDEN_ANGLE;
            const nDist = Math.sqrt(neighborIndex) * (12 * settings.expansion);
            const nx = Math.cos(nAngle) * nDist;
            const ny = Math.sin(nAngle) * nDist;

            const distToNeighbor = Math.sqrt((x-nx)**2 + (y-ny)**2);

            // Only draw line if close enough (creates the "web" look near center)
            if (distToNeighbor < 100) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(nx, ny);
                ctx.strokeStyle = `hsla(${settings.hue}, 100%, 50%, ${alpha * 0.15})`; // Very faint lines
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
      }

      // 6. The "Black Hole" Center (Event Horizon)
      // Clear a small circle in the middle to simulate the void
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();

      animationFrame = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [aiState]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{ background: '#050508' }} // Fallback background color
      />
      
      {/* Vignette Overlay for Cinematic Depth */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-60" />
    </>
  );
}