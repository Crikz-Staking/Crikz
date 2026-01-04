import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BackgroundEffectsProps {
  aiState?: 'idle' | 'thinking' | 'responding';
}

export default function BackgroundEffects({ aiState = 'idle' }: BackgroundEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(aiState);

  // Keep stateRef in sync with prop for the animation loop
  useEffect(() => {
    stateRef.current = aiState;
  }, [aiState]);

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

    class FibonacciParticle {
      x: number = 0;
      y: number = 0;
      angle: number;
      radius: number;
      speed: number;
      size: number;
      opacity: number;
      color: string;

      constructor() {
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * Math.min(canvas!.width, canvas!.height) / 1.2;
        this.speed = 0.0005 + Math.random() * 0.002;
        this.size = 1.5 + Math.random() * 2.5;
        this.opacity = Math.random() * 0.6 + 0.3;
        
        // Initial color setup
        this.updateColor();
        this.updatePosition();
      }

      updateColor() {
        let hue = 35; // Gold (Idle)
        if (stateRef.current === 'thinking') hue = 260; // Purple
        if (stateRef.current === 'responding') hue = 150; // Green
        
        // Add slight variation
        hue += Math.random() * 10;
        this.color = `hsla(${hue}, 100%, 60%, ${this.opacity})`;
      }

      updatePosition() {
        if (!canvas) return;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Fibonacci spiral: r = a * e^(b*θ)
        const a = 0.5;
        const b = 0.2;
        
        const spiralRadius = a * Math.exp(b * (this.angle % 20)) * this.radius / 5;
        this.x = centerX + spiralRadius * Math.cos(this.angle);
        this.y = centerY + spiralRadius * Math.sin(this.angle);
      }

      update() {
        // Adjust speed based on state
        let speedMult = 1;
        if (stateRef.current === 'thinking') speedMult = 3;
        if (stateRef.current === 'responding') speedMult = 0.5;

        this.angle += this.speed * speedMult;
        this.updatePosition();
        
        // Twinkle
        this.opacity += (Math.random() - 0.5) * 0.02;
        this.opacity = Math.max(0.2, Math.min(0.8, this.opacity));
        
        // Update color dynamically
        this.updateColor();
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const particles: FibonacciParticle[] = [];
    for (let i = 0; i < 150; i++) {
      particles.push(new FibonacciParticle());
    }

    let animationFrameId: number;

    function animate() {
      if (!ctx || !canvas) return;
      
      // Clear with slight trail
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        particle.update();
        particle.draw();

        // Connect nearby
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            // Dynamic connection color
            let r=245, g=158, b=11; // Gold
            if (stateRef.current === 'thinking') { r=167; g=139; b=250; } // Purple
            if (stateRef.current === 'responding') { r=16; g=185; b=129; } // Emerald

            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.15 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });
      animationFrameId = requestAnimationFrame(animate);
    }

    animate();
    return () => { 
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Dynamic Orb Colors for Framer Motion
  const getOrbColor = (pos: 'top' | 'bottom') => {
      if (aiState === 'thinking') return pos === 'top' ? '#A78BFA' : '#8B5CF6';
      if (aiState === 'responding') return pos === 'top' ? '#34D399' : '#10B981';
      return pos === 'top' ? '#F59E0B' : '#D97706'; // Idle
  };

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.8 }} />
      {/* Static Gold Gradient Orbs - Now Dynamic */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-20"
          animate={{ 
              scale: [1, 1.2, 1], 
              opacity: [0.15, 0.25, 0.15],
              background: `radial-gradient(circle, ${getOrbColor('top')} 0%, transparent 70%)`
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[140px] opacity-15"
          animate={{ 
              scale: [1, 1.3, 1], 
              opacity: [0.15, 0.3, 0.15],
              background: `radial-gradient(circle, ${getOrbColor('bottom')} 0%, transparent 70%)`
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>
    </>
  );
}