import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { InteractionBus } from '@/lib/interaction-events';

interface BackgroundEffectsProps {
  aiState?: 'idle' | 'thinking' | 'responding';
}

export default function BackgroundEffects({ aiState = 'idle' }: BackgroundEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(aiState);

  // Keep stateRef in sync for the animation loop
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

    // --- PARTICLE CLASS ---
    class FibonacciParticle {
      x: number = 0;
      y: number = 0;
      angle: number;
      radius: number;
      speed: number;
      size: number;
      opacity: number;
      color: string = ''; // Initialized
      isInteraction: boolean;
      life: number; // For interaction particles to eventually fade or merge

      constructor(type: 'BASE' | 'INTERACTION', interactionColor?: string) {
        this.isInteraction = type === 'INTERACTION';
        
        if (this.isInteraction) {
            // Interaction Atoms: Start at the center (The Core) and spiral out
            this.angle = 0; 
            this.radius = 10; // Start close to center
            this.speed = 0.05; // Move faster along the neural path
            this.size = Math.random() * 3 + 3; // Larger than base
            this.opacity = 1;
            this.color = interactionColor || '#ffffff';
            this.life = 1.0;
        } else {
            // Base Atoms: Random placement on the spiral
            this.angle = Math.random() * Math.PI * 2;
            this.radius = Math.random() * Math.min(canvas!.width, canvas!.height) / 1.2;
            this.speed = 0.0005 + Math.random() * 0.002;
            this.size = 1.5 + Math.random() * 2.5;
            this.opacity = Math.random() * 0.6 + 0.3;
            this.life = 1.0;
            this.updateColor();
        }
        
        this.updatePosition();
      }

      updateColor() {
        if (this.isInteraction) return; // Keep interaction color fixed

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
        
        let effectiveRadius = this.radius;
        
        if (this.isInteraction) {
            // Calculate radius based on angle to force it to stick to the spiral path
            // As angle increases, radius increases
            // Fixed: Added '!' to canvas properties to satisfy TS strict null checks
            effectiveRadius = a * Math.exp(b * (this.angle % 20)) * (Math.min(canvas!.width, canvas!.height) / 6);
        } else {
            // Base particles float around their assigned radius with the spiral offset
            effectiveRadius = a * Math.exp(b * (this.angle % 20)) * this.radius / 5;
        }

        this.x = centerX + effectiveRadius * Math.cos(this.angle);
        this.y = centerY + effectiveRadius * Math.sin(this.angle);
      }

      update() {
        // Adjust speed based on state
        let speedMult = 1;
        if (stateRef.current === 'thinking') speedMult = 3;
        if (stateRef.current === 'responding') speedMult = 0.5;

        // Interaction particles move faster to "deliver" the data
        if (this.isInteraction) speedMult = 5;

        this.angle += this.speed * speedMult;
        this.updatePosition();
        
        if (!this.isInteraction) {
            // Twinkle for base particles
            this.opacity += (Math.random() - 0.5) * 0.02;
            this.opacity = Math.max(0.2, Math.min(0.8, this.opacity));
            this.updateColor();
        } else {
            // Interaction particles fade slightly as they reach the edge
            // Fixed: Added '!' to canvas properties
            if (this.x < 0 || this.x > canvas!.width || this.y < 0 || this.y > canvas!.height) {
                this.life -= 0.02;
            }
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        
        // Glow effect
        ctx.shadowBlur = this.isInteraction ? 20 : 15;
        ctx.shadowColor = this.color;
        
        ctx.globalAlpha = this.isInteraction ? this.life : 1;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    // --- INITIALIZATION ---
    const particles: FibonacciParticle[] = [];
    for (let i = 0; i < 150; i++) {
      particles.push(new FibonacciParticle('BASE'));
    }

    // --- EVENT LISTENER FOR INTERACTIONS ---
    const handleInteraction = (e: Event) => {
        const customEvent = e as CustomEvent;
        const { type } = customEvent.detail;
        
        let color = '#ffffff';
        let count = 1;

        switch (type) {
            case 'NAVIGATION': color = '#3b82f6'; count = 2; break; // Blue
            case 'AI_THOUGHT': color = '#a78bfa'; count = 3; break; // Purple
            case 'AI_RESPONSE': color = '#10b981'; count = 3; break; // Green
            case 'TRANSACTION': color = '#f59e0b'; count = 8; break; // Gold/Orange (Burst)
            case 'ERROR': color = '#ef4444'; count = 2; break; // Red
        }

        // Inject new atoms into the spiral
        for(let i=0; i<count; i++) {
            // Stagger them slightly
            setTimeout(() => {
                particles.push(new FibonacciParticle('INTERACTION', color));
            }, i * 100);
        }

        // Cleanup old particles if too many
        if (particles.length > 300) {
            // Remove oldest interaction particles first
            const removeIdx = particles.findIndex(p => p.isInteraction && p.life < 0.5);
            if (removeIdx > -1) particles.splice(removeIdx, 1);
        }
    };

    InteractionBus.addEventListener('crikz-interaction', handleInteraction);

    // --- ANIMATION LOOP ---
    let animationFrameId: number;

    function animate() {
      if (!ctx || !canvas) return;
      
      // Clear with slight trail for motion blur
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and Draw
      for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.update();
          
          // Remove dead particles
          if (p.isInteraction && p.life <= 0) {
              particles.splice(i, 1);
              continue;
          }
          
          p.draw();

          // Connect nearby particles (The Neural Web)
          // We limit connections to optimize performance
          for (let j = i + 1; j < particles.length; j++) {
            const other = particles[j];
            const dx = p.x - other.x;
            const dy = p.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
                // Dynamic connection color
                // If one is an interaction particle, color the line that color
                let strokeColor = p.color;
                if (other.isInteraction) strokeColor = other.color;
                else if (p.isInteraction) strokeColor = p.color;
                else {
                    // Base color logic
                    let r=245, g=158, b=11; // Gold
                    if (stateRef.current === 'thinking') { r=167; g=139; b=250; } // Purple
                    if (stateRef.current === 'responding') { r=16; g=185; b=129; } // Emerald
                    strokeColor = `rgba(${r}, ${g}, ${b}, ${0.15 * (1 - distance / 120)})`;
                }

                // If interaction, make line brighter
                // const alpha = p.isInteraction || other.isInteraction ? 0.4 : 0.15;
                
                // Simplified: just use the particle's computed color string but lower opacity
                ctx.strokeStyle = strokeColor; 
                ctx.lineWidth = p.isInteraction || other.isInteraction ? 1 : 0.5;
                
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(other.x, other.y);
                ctx.stroke();
            }
          }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    }

    animate();
    return () => { 
        window.removeEventListener('resize', resize);
        InteractionBus.removeEventListener('crikz-interaction', handleInteraction);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Dynamic Orb Colors for Framer Motion (Background Atmosphere)
  const getOrbColor = (pos: 'top' | 'bottom') => {
      if (aiState === 'thinking') return pos === 'top' ? '#A78BFA' : '#8B5CF6';
      if (aiState === 'responding') return pos === 'top' ? '#34D399' : '#10B981';
      return pos === 'top' ? '#F59E0B' : '#D97706'; // Idle
  };

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.75 }} />
      
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