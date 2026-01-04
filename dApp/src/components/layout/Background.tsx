import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { InteractionBus } from '@/lib/interaction-events';

interface BackgroundEffectsProps {
  aiState?: 'idle' | 'thinking' | 'responding';
}

// Configuration
const MOLECULE_RADIUS = 250;
const BASE_ATOM_COUNT = 40;
const ROTATION_SPEED = 0.002;
const TRAVEL_SPEED = 0.5;

export default function BackgroundEffects({ aiState = 'idle' }: BackgroundEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(aiState);

  // Sync Ref for animation loop
  useEffect(() => {
    stateRef.current = aiState;
  }, [aiState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize Handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // --- PHYSICS ENGINE ---

    class Atom {
      x: number;
      y: number;
      z: number;
      size: number;
      color: string;
      targetX: number;
      targetY: number;
      targetZ: number;
      isNew: boolean;
      orbitOffset: number;
      speed: number;

      constructor(type: 'BASE' | 'INTERACTION', interactionType?: string) {
        // Random starting position in 3D space
        this.x = (Math.random() - 0.5) * canvas!.width;
        this.y = (Math.random() - 0.5) * canvas!.height;
        this.z = (Math.random() - 0.5) * 500;
        
        this.orbitOffset = Math.random() * Math.PI * 2;
        this.speed = 0.01 + Math.random() * 0.02;
        this.isNew = type === 'INTERACTION';

        // Determine appearance based on type
        if (type === 'BASE') {
          this.size = Math.random() * 2 + 1;
          this.color = `hsla(35, 100%, 50%, ${Math.random() * 0.5 + 0.2})`; // Gold
        } else {
          this.size = Math.random() * 4 + 3; // Larger
          // Color coding based on interaction
          switch (interactionType) {
            case 'NAVIGATION': this.color = '#3b82f6'; break; // Blue
            case 'AI_THOUGHT': this.color = '#a78bfa'; break; // Purple
            case 'AI_RESPONSE': this.color = '#10b981'; break; // Green
            case 'TRANSACTION': this.color = '#f59e0b'; break; // Gold/Orange
            case 'ERROR': this.color = '#ef4444'; break; // Red
            default: this.color = '#ffffff';
          }
        }

        // Initial Target (Spherical Orbit)
        const phi = Math.acos(-1 + (2 * Math.random()));
        const theta = Math.sqrt(BASE_ATOM_COUNT * Math.PI) * phi;
        this.targetX = MOLECULE_RADIUS * Math.cos(theta) * Math.sin(phi);
        this.targetY = MOLECULE_RADIUS * Math.sin(theta) * Math.sin(phi);
        this.targetZ = MOLECULE_RADIUS * Math.cos(phi);
      }

      update(rotationX: number, rotationY: number, time: number) {
        // 1. Orbit Logic (The Molecule Spin)
        // Rotate the target coordinates
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);

        // Apply 3D Rotation Matrix to the "Ideal" orbit position
        let tx = this.targetX * cosY - this.targetZ * sinY;
        let tz = this.targetX * sinY + this.targetZ * cosY;
        let ty = this.targetY * cosX - tz * sinX;
        tz = this.targetY * sinX + tz * cosX;

        // 2. AI State Influence (Excitation)
        let jitter = 0;
        if (stateRef.current === 'thinking') jitter = 5;
        if (stateRef.current === 'responding') jitter = 2;

        // 3. Move actual position towards target (Smooth Lerp)
        // If it's a new atom, it flies in fast, then settles
        const lerpFactor = this.isNew ? 0.05 : 0.1;
        
        this.x += (tx - this.x + (Math.random() - 0.5) * jitter) * lerpFactor;
        this.y += (ty - this.y + (Math.random() - 0.5) * jitter) * lerpFactor;
        this.z += (tz - this.z) * lerpFactor;

        // 4. "Travel through space" effect (Starfield movement simulation)
        // We simulate this by moving the center point in the draw function, 
        // but here we can pulse the radius
        if (this.isNew && Math.abs(this.x - tx) < 10) {
            this.isNew = false; // Settled into orbit
        }
      }

      draw(centerX: number, centerY: number) {
        if (!ctx) return;
        
        // 3D Projection
        const fov = 300;
        const scale = fov / (fov + this.z);
        const x2d = this.x * scale + centerX;
        const y2d = this.y * scale + centerY;
        const size2d = this.size * scale;

        if (scale < 0) return; // Behind camera

        ctx.beginPath();
        ctx.arc(x2d, y2d, size2d, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        // Glow for interaction atoms
        if (this.size > 3) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // --- INITIALIZATION ---
    const atoms: Atom[] = [];
    for (let i = 0; i < BASE_ATOM_COUNT; i++) {
      atoms.push(new Atom('BASE'));
    }

    // --- EVENT LISTENER ---
    const handleInteraction = (e: Event) => {
        const customEvent = e as CustomEvent;
        const { type } = customEvent.detail;
        
        // Spawn new atoms based on interaction importance
        const count = type === 'TRANSACTION' ? 5 : type === 'AI_RESPONSE' ? 3 : 1;
        
        for(let i=0; i<count; i++) {
            atoms.push(new Atom('INTERACTION', type));
        }

        // Limit total atoms to prevent lag
        if (atoms.length > 150) {
            atoms.splice(0, atoms.length - 150);
        }
    };

    InteractionBus.addEventListener('crikz-interaction', handleInteraction);

    // --- ANIMATION LOOP ---
    let rotX = 0;
    let rotY = 0;
    let time = 0;

    function animate() {
      if (!ctx || !canvas) return;
      
      // Clear with trail for speed effect
      ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update Rotation
      let speed = ROTATION_SPEED;
      if (stateRef.current === 'thinking') speed *= 5; // Spin faster when thinking
      
      rotX += speed;
      rotY += speed * 0.5;
      time += 0.01;

      // Center of the molecule (Drifting slightly)
      const cx = canvas.width / 2 + Math.sin(time) * 20;
      const cy = canvas.height / 2 + Math.cos(time * 0.5) * 20;

      // Draw Connections (The Molecule Structure)
      // Only connect atoms that are close to each other
      ctx.lineWidth = 0.5;
      for (let i = 0; i < atoms.length; i++) {
        const a = atoms[i];
        a.update(rotX, rotY, time);
        a.draw(cx, cy);

        // Connections
        for (let j = i + 1; j < atoms.length; j++) {
            const b = atoms[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dz = a.z - b.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

            if (dist < 60) {
                const fov = 300;
                const scaleA = fov / (fov + a.z);
                const scaleB = fov / (fov + b.z);
                
                if (scaleA > 0 && scaleB > 0) {
                    ctx.beginPath();
                    ctx.moveTo(a.x * scaleA + cx, a.y * scaleA + cy);
                    ctx.lineTo(b.x * scaleB + cx, b.y * scaleB + cy);
                    
                    // Dynamic color mixing
                    const alpha = 1 - (dist / 60);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
                    ctx.stroke();
                }
            }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      InteractionBus.removeEventListener('crikz-interaction', handleInteraction);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 1 }} />
      {/* Ambient Glow based on AI State */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
            background: aiState === 'thinking' 
                ? 'radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.15), transparent 70%)' // Purple
                : aiState === 'responding'
                ? 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15), transparent 70%)' // Green
                : 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.05), transparent 70%)' // Gold
        }}
        transition={{ duration: 1 }}
      />
    </>
  );
}