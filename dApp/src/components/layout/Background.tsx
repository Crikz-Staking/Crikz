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
      // Position state
      baseAngle: number; // The fixed position on the spiral structure
      distanceFromCenter: number; // The target distance (r)
      currentDistance: number; // For animation (starts at 0, grows to r)
      
      // Appearance
      size: number;
      color: string;
      isInteraction: boolean;
      
      // Physics
      driftSpeed: number;

      constructor(type: 'BASE' | 'INTERACTION', interactionColor?: string) {
        this.isInteraction = type === 'INTERACTION';
        
        // 1. Determine Position on the Spiral
        // We use random angles to fill the spiral naturally
        this.baseAngle = Math.random() * Math.PI * 20; // 10 full rotations worth of spiral space
        
        // Fibonacci Spiral Formula: r = a * e^(b * theta)
        // We map the angle to a distance
        const a = 2; 
        const b = 0.15;
        // Calculate target radius based on the angle (Golden Spiral)
        // We use modulo to create multiple "arms" if desired, or just raw angle for a single spiral
        // Let's create a multi-arm effect for a denser molecule look
        const armOffset = (Math.floor(Math.random() * 3) * (Math.PI * 2)) / 3; 
        const theta = this.baseAngle;
        
        // Target distance from center
        this.distanceFromCenter = (a * Math.exp(b * (theta % 10))) * (Math.min(canvas!.width, canvas!.height) / 20);
        
        // Clamp distance to screen bounds to keep molecule visible
        this.distanceFromCenter = Math.min(this.distanceFromCenter, Math.min(canvas!.width, canvas!.height) / 2.2);

        // 2. Animation State
        if (this.isInteraction) {
            this.currentDistance = 0; // Start at core
            this.size = Math.random() * 4 + 4; // Bigger atoms
            this.color = interactionColor || '#ffffff';
        } else {
            this.currentDistance = this.distanceFromCenter; // Already in place
            this.size = Math.random() * 2 + 1;
            this.color = ''; // Set in updateColor
            this.updateColor();
        }

        this.driftSpeed = 0.002 + Math.random() * 0.004;
      }

      updateColor() {
        if (this.isInteraction) return; 

        let hue = 35; // Gold (Idle)
        if (stateRef.current === 'thinking') hue = 260; // Purple
        if (stateRef.current === 'responding') hue = 150; // Green
        
        // Add slight variation
        hue += Math.random() * 15;
        const alpha = Math.random() * 0.5 + 0.2;
        this.color = `hsla(${hue}, 100%, 60%, ${alpha})`;
      }

      update(globalRotation: number) {
        // 1. Animate Arrival (Interaction Atoms fly from center to their slot)
        if (this.isInteraction && this.currentDistance < this.distanceFromCenter) {
            // Ease out animation
            this.currentDistance += (this.distanceFromCenter - this.currentDistance) * 0.05;
            if (Math.abs(this.currentDistance - this.distanceFromCenter) < 1) {
                this.currentDistance = this.distanceFromCenter;
            }
        }

        // 2. Base Atoms Twinkle
        if (!this.isInteraction && Math.random() > 0.98) {
            this.updateColor();
        }
      }

      draw(centerX: number, centerY: number, globalRotation: number) {
        if (!ctx) return;

        // Calculate actual screen position based on Global Rotation
        // x = r * cos(theta + rotation)
        const finalAngle = this.baseAngle + globalRotation;
        
        const x = centerX + this.currentDistance * Math.cos(finalAngle);
        const y = centerY + this.currentDistance * Math.sin(finalAngle);

        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        // Glow for interaction atoms
        if (this.isInteraction) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connection line to center if it's a new interaction atom traveling
        if (this.isInteraction && this.currentDistance < this.distanceFromCenter * 0.9) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = 0.2;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
      }
    }

    // --- INITIALIZATION ---
    const particles: FibonacciParticle[] = [];
    // Create the initial "Base Molecule"
    for (let i = 0; i < 120; i++) {
      particles.push(new FibonacciParticle('BASE'));
    }

    // --- EVENT LISTENER ---
    const handleInteraction = (e: Event) => {
        const customEvent = e as CustomEvent;
        const { type } = customEvent.detail;
        
        let color = '#ffffff';
        let count = 1;

        switch (type) {
            case 'NAVIGATION': color = '#3b82f6'; count = 1; break; // Blue
            case 'AI_THOUGHT': color = '#a78bfa'; count = 2; break; // Purple
            case 'AI_RESPONSE': color = '#10b981'; count = 2; break; // Green
            case 'TRANSACTION': color = '#f59e0b'; count = 5; break; // Gold (Burst)
            case 'ERROR': color = '#ef4444'; count = 1; break; // Red
        }

        // Add new atoms to the molecule
        for(let i=0; i<count; i++) {
            particles.push(new FibonacciParticle('INTERACTION', color));
        }

        // Performance Cap: Remove oldest BASE particles if too many, 
        // but try to keep INTERACTION particles longer to show history
        if (particles.length > 400) {
            // Find a base particle to remove
            const idx = particles.findIndex(p => !p.isInteraction);
            if (idx !== -1) particles.splice(idx, 1);
            else particles.shift(); // Fallback
        }
    };

    InteractionBus.addEventListener('crikz-interaction', handleInteraction);

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    let globalRotation = 0;

    function animate() {
      if (!ctx || !canvas) return;
      
      // Clear with slight trail for motion blur
      ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Rotate the entire molecule
      let speed = 0.001;
      if (stateRef.current === 'thinking') speed = 0.005;
      if (stateRef.current === 'responding') speed = 0.002;
      
      globalRotation += speed;

      // Update & Draw
      for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.update(globalRotation);
          p.draw(centerX, centerY, globalRotation);

          // Draw Connections (The Neural Web)
          // Connect atoms that are physically close in the current rotation
          // Optimization: Only check a subset or neighbors
          if (i % 2 === 0) { // Optimization: Only connect half the particles
              // Find one close neighbor to connect to
              // We can cheat and connect to the next particle in the array if it's close
              // or calculate real distance. Real distance is better for the "Molecule" look.
              
              // Let's connect to random other particles to form the web
              // But only if they are close
              for (let j = i + 1; j < Math.min(i + 10, particles.length); j++) {
                  const other = particles[j];
                  
                  // Calculate actual positions
                  const ang1 = p.baseAngle + globalRotation;
                  const x1 = centerX + p.currentDistance * Math.cos(ang1);
                  const y1 = centerY + p.currentDistance * Math.sin(ang1);

                  const ang2 = other.baseAngle + globalRotation;
                  const x2 = centerX + other.currentDistance * Math.cos(ang2);
                  const y2 = centerY + other.currentDistance * Math.sin(ang2);

                  const dist = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));

                  if (dist < 100) {
                      ctx.beginPath();
                      ctx.moveTo(x1, y1);
                      ctx.lineTo(x2, y2);
                      
                      // Dynamic Line Color
                      let strokeColor = 'rgba(255, 255, 255, 0.05)';
                      
                      // If connecting an interaction atom, color the line
                      if (p.isInteraction) strokeColor = p.color.replace(')', ', 0.2)').replace('rgb', 'rgba');
                      if (other.isInteraction) strokeColor = other.color.replace(')', ', 0.2)').replace('rgb', 'rgba');

                      ctx.strokeStyle = strokeColor;
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