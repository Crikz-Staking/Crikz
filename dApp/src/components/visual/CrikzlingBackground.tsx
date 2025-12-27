import React, { useEffect, useRef } from 'react';

// Props to receive Crikzling's actual state from parent
interface CrikzlingBackgroundEffectsProps {
  isThinking: boolean;
  isTyping: boolean;
  currentThought: {
    phase: 'analyzing' | 'planning' | 'calculating' | 'synthesizing' | 'reviewing' | 'associating';
    progress: number;
    focus?: string[];
  } | null;
  brainStats: {
    nodes: number;
    stage: string;
  };
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number;
  pulsePhase: number;
}

interface CognitiveSpiral {
  angle: number;
  radius: number;
  speed: number;
  thickness: number;
  opacity: number;
  color: string;
  pulseIntensity: number;
}

interface NeuralPulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
  color: string;
}

const CrikzlingBackgroundEffects: React.FC<CrikzlingBackgroundEffectsProps> = ({
  isThinking,
  isTyping,
  currentThought,
  brainStats
}) => {
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

    // Base particles (original effect)
    const baseParticles: Particle[] = [];
    for (let i = 0; i < 150; i++) {
      baseParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        hue: 35 + Math.random() * 10,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // Cognitive spirals (Crikzling thinking visualization)
    const cognitiveSpirals: CognitiveSpiral[] = [];
    
    // Neural pulses (activity bursts)
    const neuralPulses: NeuralPulse[] = [];

    const getPhaseColor = (phase?: string): string => {
      switch (phase) {
        case 'analyzing': return '#3B82F6'; // Blue
        case 'associating': return '#EC4899'; // Pink - for memory/knowledge linking
        case 'planning': return '#A78BFA'; // Purple
        case 'calculating': return '#10B981'; // Emerald
        case 'synthesizing': return '#F59E0B'; // Amber
        case 'reviewing': return '#06B6D4'; // Cyan
        default: return '#F59E0B'; // Default gold
      }
    };

    const createCognitiveSpiral = () => {
      const phase = currentThought?.phase;
      cognitiveSpirals.push({
        angle: 0,
        radius: 0,
        speed: 0.002 + Math.random() * 0.003,
        thickness: 2 + Math.random() * 3,
        opacity: 0.6,
        color: getPhaseColor(phase),
        pulseIntensity: 0
      });
    };

    const createNeuralPulse = () => {
      neuralPulses.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 400,
        y: canvas.height / 2 + (Math.random() - 0.5) * 400,
        radius: 0,
        maxRadius: 80 + Math.random() * 120,
        opacity: 0.8,
        speed: 2 + Math.random() * 2,
        color: getPhaseColor(currentThought?.phase)
      });
    };

    let lastSpiralTime = 0;
    let lastPulseTime = 0;

    function animate(timestamp: number) {
      if (!ctx || !canvas) return;
      
      // Clear with trail effect
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Update and draw base particles
      baseParticles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;

        particle.pulsePhase += 0.02;
        particle.opacity = 0.3 + Math.sin(particle.pulsePhase) * 0.3;

        ctx.fillStyle = `hsla(${particle.hue}, 100%, 60%, ${particle.opacity})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${particle.hue}, 100%, 60%, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connections
        baseParticles.forEach((otherParticle, i) => {
          if (i <= baseParticles.indexOf(particle)) return;
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.strokeStyle = `rgba(245, 158, 11, ${0.15 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

      // CRIKZLING COGNITIVE VISUALIZATION
      if (isThinking && currentThought) {
        // Create new spirals periodically
        if (timestamp - lastSpiralTime > 2000 && cognitiveSpirals.length < 3) {
          createCognitiveSpiral();
          lastSpiralTime = timestamp;
        }

        // Create neural pulses
        if (timestamp - lastPulseTime > 1500) {
          createNeuralPulse();
          lastPulseTime = timestamp;
        }

        // Update and draw cognitive spirals
        cognitiveSpirals.forEach((spiral, index) => {
          spiral.angle += spiral.speed;
          spiral.radius = Math.min(spiral.radius + 0.5, Math.min(canvas.width, canvas.height) / 2.5);
          spiral.pulseIntensity = Math.sin(timestamp * 0.003) * 0.3 + 0.7;

          // Fibonacci spiral equation: r = a * e^(b*θ)
          const a = 0.5;
          const b = 0.2;
          const maxAngle = 20;
          
          ctx.strokeStyle = spiral.color;
          ctx.lineWidth = spiral.thickness;
          ctx.shadowBlur = 20 * spiral.pulseIntensity;
          ctx.shadowColor = spiral.color;
          ctx.globalAlpha = spiral.opacity * spiral.pulseIntensity;

          ctx.beginPath();
          for (let angle = 0; angle < maxAngle; angle += 0.1) {
            const spiralRadius = a * Math.exp(b * ((angle + spiral.angle) % maxAngle)) * spiral.radius / 5;
            const x = centerX + spiralRadius * Math.cos(angle + spiral.angle);
            const y = centerY + spiralRadius * Math.sin(angle + spiral.angle);
            
            if (angle === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;

          // Fade out completed spirals
          if (spiral.radius >= Math.min(canvas.width, canvas.height) / 2.5) {
            spiral.opacity -= 0.005;
            if (spiral.opacity <= 0) {
              cognitiveSpirals.splice(index, 1);
            }
          }
        });

        // Update and draw neural pulses
        neuralPulses.forEach((pulse, index) => {
          pulse.radius += pulse.speed;
          pulse.opacity -= 0.008;

          ctx.strokeStyle = pulse.color;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 25;
          ctx.shadowColor = pulse.color;
          ctx.globalAlpha = pulse.opacity;

          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Inner glow
          ctx.globalAlpha = pulse.opacity * 0.3;
          ctx.fillStyle = pulse.color;
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulse.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;

          if (pulse.opacity <= 0 || pulse.radius > pulse.maxRadius) {
            neuralPulses.splice(index, 1);
          }
        });

        // Progress indicator ring
        const progress = currentThought.progress / 100;
        const ringRadius = 120;
        
        ctx.strokeStyle = getPhaseColor(currentThought.phase);
        ctx.lineWidth = 6;
        ctx.shadowBlur = 30;
        ctx.shadowColor = getPhaseColor(currentThought.phase);
        ctx.globalAlpha = 0.4;

        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, -Math.PI / 2, -Math.PI / 2 + (progress * Math.PI * 2));
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Central core pulse
        const coreRadius = 8 + Math.sin(timestamp * 0.005) * 4;
        ctx.fillStyle = getPhaseColor(currentThought.phase);
        ctx.shadowBlur = 40;
        ctx.shadowColor = getPhaseColor(currentThought.phase);
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // Typing indicator effect
      if (isTyping) {
        const typingRadius = 100;
        const dotCount = 3;
        
        for (let i = 0; i < dotCount; i++) {
          const angle = (timestamp * 0.003 + i * (Math.PI * 2 / dotCount)) % (Math.PI * 2);
          const x = centerX + Math.cos(angle) * typingRadius;
          const y = centerY + Math.sin(angle) * typingRadius;
          const size = 4 + Math.sin(timestamp * 0.005 + i) * 2;
          
          ctx.fillStyle = '#F59E0B';
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#F59E0B';
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      requestAnimationFrame(animate);
    }

    animate(0);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [isThinking, isTyping, currentThought, brainStats]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
};

export default CrikzlingBackgroundEffects;