import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { InteractionBus } from '@/lib/interaction-events';

interface BackgroundEffectsProps {
  aiState?: 'idle' | 'thinking' | 'responding';
}

export default function BackgroundEffects({ aiState = 'idle' }: BackgroundEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(aiState);

  // Sync Ref
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

    // --- PARTICLE SYSTEM ---

    class Particle {
      x: number = 0;
      y: number = 0;
      angle: number;
      radius: number;
      speed: number;
      size: number;
      opacity: number;
      color: string;
      type: 'SPIRAL' | 'INTERACTION';
      life: number; // For interaction particles

      constructor(type: 'SPIRAL' | 'INTERACTION', interactionType?: string) {
        this.type = type;
        
        if (type === 'SPIRAL') {
            // The Base AI Spiral
            this.angle = Math.random() * Math.PI * 2;
            this.radius = Math.random() * Math.min(canvas!.width, canvas!.height) / 1.2;
            this.speed = 0.0005 + Math.random() * 0.002;
            this.size = 1.5 + Math.random() * 2.0;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.life = 100; // Infinite
            
            // Golden / Amber Base
            const hue = 35 + Math.random() * 10; 
            this.color = `hsla(${hue}, 100%, 60%, ${this.opacity})`;
        } else {
            // Interaction Atoms (New Protons)
            this.angle = Math.random() * Math.PI * 2;
            this.radius = 0; // Start at center (The Core)
            this.speed = 0.02 + Math.random() * 0.03; // Fast expansion
            this.size = Math.random() * 3 + 2;
            this.opacity = 1;
            this.life = 1.0; // Decays

            // Color based on Event
            switch (interactionType) {
                case 'NAVIGATION': this.color = '#3b82f6'; break; // Blue
                case 'AI_THOUGHT': this.color = '#a78bfa'; break; // Purple
                case 'AI_RESPONSE': this.color = '#10b981'; break; // Green
                case 'TRANSACTION': this.color = '#f59e0b'; break; // Gold
                case 'ERROR': this.color = '#ef4444'; break; // Red
                default: this.color = '#ffffff';
            }
        }
        
        this.updatePosition();
      }

      updatePosition() {
        if (!canvas) return;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        if (this.type === 'SPIRAL') {
            // Fibonacci spiral equation: r = a * e^(b*θ)
            // We map this to the particle's radius and angle
            const a = 0.5;
            const b = 0.2;
            
            // Add "Breathing" effect based on AI State
            let breath = 0;
            if (stateRef.current === 'thinking') breath = Math.sin(Date.now() / 200) * 20;
            if (stateRef.current === 'responding') breath = Math.sin(Date.now() / 100) * 40;

            const spiralRadius = (a * Math.exp(b * (this.angle % 20)) * this.radius / 5) + breath;
            this.x = centerX + spiralRadius * Math.cos(this.angle);
            this.y = centerY + spiralRadius * Math.sin(this.angle);
        } else {
            // Interaction Atoms: Spiral OUTWARDS from center
            this.radius += 5; // Expand
            this.x = centerX + this.radius * Math.cos(this.angle);
            this.y = centerY + this.radius * Math.sin(this.angle);
        }
      }

      update() {
        if (this.type === 'SPIRAL') {
            // Rotate the spiral
            let speedMult = 1;
            if (stateRef.current === 'thinking') speedMult = 5;
            if (stateRef.current === 'responding') speedMult = 2;

            this.angle += this.speed * speedMult;
            
            // Twinkle
            this.opacity += (Math.random() - 0.5) * 0.02;
            this.opacity = Math.max(0.1, Math.min(0.6, this.opacity));
        } else {
            // Interaction atoms rotate slightly while expanding
            this.angle += 0.05;
            this.life -= 0.01;
        }

        this.updatePosition();
      }

      draw() {
        if (!ctx) return;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        if (this.type === 'SPIRAL') {
            ctx.fillStyle = this.color;
        } else {
            // Interaction atoms glow
            ctx.fillStyle = this.color;
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        }
        
        ctx.fill();
        
        // Reset context
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    // --- STATE ---
    const particles: Particle[] = [];
    
    // Initialize Spiral
    for (let i = 0; i < 200; i++) {
      particles.push(new Particle('SPIRAL'));
    }

    // --- EVENT LISTENER ---
    const handleInteraction = (e: Event) => {
        const customEvent = e as CustomEvent;
        const { type } = customEvent.detail;
        
        // Spawn Interaction Atoms
        const count = type === 'TRANSACTION' ? 20 : 5;
        for(let i=0; i<count; i++) {
            particles.push(new Particle('INTERACTION', type));
        }
    };

    InteractionBus.addEventListener('crikz-interaction', handleInteraction);

    // --- ANIMATION LOOP ---
    let animationFrameId: number;

    function animate() {
      if (!ctx || !canvas) return;
      
      // Clear with trail for motion blur effect
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update & Draw
      for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.update();
          p.draw();

          // Remove dead interaction particles
          if (p.type === 'INTERACTION' && p.life <= 0) {
              particles.splice(i, 1);
              continue;
          }

          // Connect Spiral Particles (The Neural Web)
          if (p.type === 'SPIRAL') {
              // Only connect to nearby neighbors in the array to save perf
              // and create the "strand" look
              for (let j = i + 1; j < Math.min(i + 5, particles.length); j++) {
                  const other = particles[j];
                  if (other.type !== 'SPIRAL') continue;

                  const dx = p.x - other.x;
                  const dy = p.y - other.y;
                  const dist = Math.sqrt(dx*dx + dy*dy);

                  if (dist < 100) {
                      ctx.beginPath();
                      ctx.moveTo(p.x, p.y);
                      ctx.lineTo(other.x, other.y);
                      
                      // Dynamic Line Color
                      let r=245, g=158, b=11; // Gold
                      if (stateRef.current === 'thinking') { r=167; g=139; b=250; } // Purple
                      if (stateRef.current === 'responding') { r=16; g=185; b=129; } // Green

                      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 * (1 - dist/100)})`;
                      ctx.lineWidth = 0.5;
                      ctx.stroke();
                  }
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

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.8 }} />
      
      {/* Background Gradient Orbs (Atmosphere) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-10"
          animate={{ 
              background: aiState === 'thinking' 
                ? 'radial-gradient(circle, #A78BFA 0%, transparent 70%)' 
                : 'radial-gradient(circle, #F59E0B 0%, transparent 70%)',
              scale: [1, 1.1, 1]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </>
  );
}