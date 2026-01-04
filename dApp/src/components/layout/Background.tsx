import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BackgroundProps {
  aiState: 'idle' | 'thinking' | 'responding';
}

export default function BackgroundEffects({ aiState }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // --- CONFIGURATION BASED ON AI STATE ---
    const getConfig = () => {
        switch(aiState) {
            case 'thinking': 
                return { color: '167, 139, 250', speed: 0.002, connectionDist: 150, opacity: 0.6 }; // Purple
            case 'responding': 
                return { color: '16, 185, 129', speed: 0.005, connectionDist: 200, opacity: 0.8 }; // Emerald/Green
            default: 
                return { color: '245, 158, 11', speed: 0.0005, connectionDist: 100, opacity: 0.3 }; // Gold (Idle)
        }
    };

    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2;
      }

      update(speedMult: number) {
        this.x += this.vx * (speedMult * 1000); // Speed up based on state
        this.y += this.vy * (speedMult * 1000);

        if (this.x < 0) this.x = canvas!.width;
        if (this.x > canvas!.width) this.x = 0;
        if (this.y < 0) this.y = canvas!.height;
        if (this.y > canvas!.height) this.y = 0;
      }

      draw(color: string, opacity: number) {
        if (!ctx) return;
        ctx.fillStyle = `rgba(${color}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const nodes: Node[] = Array.from({ length: 100 }, () => new Node());

    let animationFrame: number;

    function animate() {
      if (!ctx || !canvas) return;
      const config = getConfig();

      // Clear with trail effect
      ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((node, i) => {
        node.update(config.speed);
        node.draw(config.color, config.opacity);

        // Connections
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < config.connectionDist) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${config.color}, ${0.15 * (1 - dist / config.connectionDist)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });

      animationFrame = requestAnimationFrame(animate);
    }

    animate();
    return () => { 
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrame);
    };
  }, [aiState]); // Re-run when AI state changes

  // --- GRADIENT ORBS (React to State) ---
  const getOrbColors = () => {
      switch(aiState) {
          case 'thinking': return ['#7c3aed', '#4c1d95']; // Violet
          case 'responding': return ['#10b981', '#059669']; // Emerald
          default: return ['#f59e0b', '#d97706']; // Gold
      }
  };
  const orbColors = getOrbColors();

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      
      {/* Dynamic Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-20"
          animate={{ 
              background: `radial-gradient(circle, ${orbColors[0]} 0%, transparent 70%)`,
              scale: aiState === 'thinking' ? [1, 1.2, 1] : 1
          }}
          transition={{ duration: 2 }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[140px] opacity-15"
          animate={{ 
              background: `radial-gradient(circle, ${orbColors[1]} 0%, transparent 70%)`,
              scale: aiState === 'responding' ? [1, 1.5, 1] : 1
          }}
          transition={{ duration: 1 }}
        />
      </div>
    </>
  );
}