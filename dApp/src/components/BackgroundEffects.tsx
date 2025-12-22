// src/components/BackgroundEffects.tsx
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BackgroundEffects() {
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

    // Fibonacci Spiral Particles
    class FibonacciParticle {
      x: number;
      y: number;
      angle: number;
      radius: number;
      speed: number;
      size: number;
      opacity: number;
      color: string;

      constructor() {
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * Math.min(canvas.width, canvas.height) / 2;
        this.speed = 0.0005 + Math.random() * 0.001;
        this.size = 1 + Math.random() * 2;
        this.opacity = Math.random() * 0.5 + 0.2;
        
        const hue = 38 + Math.random() * 40; // Orange to Cyan range
        this.color = `hsla(${hue}, 80%, 60%, ${this.opacity})`;
        
        this.updatePosition();
      }

      updatePosition() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Fibonacci spiral equation: r = a * e^(b*θ)
        const a = 1;
        const b = 0.3;
        const spiralRadius = a * Math.exp(b * this.angle) * this.radius / 10;
        
        this.x = centerX + spiralRadius * Math.cos(this.angle);
        this.y = centerY + spiralRadius * Math.sin(this.angle);
      }

      update() {
        this.angle += this.speed;
        this.updatePosition();

        // Fade in/out
        this.opacity += (Math.random() - 0.5) * 0.01;
        this.opacity = Math.max(0.1, Math.min(0.6, this.opacity));
      }

      draw() {
        if (!ctx) return;
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const particles: FibonacciParticle[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push(new FibonacciParticle());
    }

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        particle.update();
        particle.draw();

        // Connect nearby particles
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.strokeStyle = `rgba(255, 165, 0, ${0.1 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {/* Animated Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.4 }}
      />

      {/* Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{
            background: 'radial-gradient(circle, #FFA500 0%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{
            background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
        />

        <motion.div
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-10"
          style={{
            background: 'radial-gradient(circle, #A78BFA 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      {/* Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 165, 0, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 165, 0, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </>
  );
}