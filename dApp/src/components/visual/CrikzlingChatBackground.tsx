import React, { useEffect, useRef } from 'react';

interface CrikzlingChatBackgroundProps {
  isThinking: boolean;
  isTyping: boolean;
  currentThought: {
    phase: 'analyzing' | 'planning' | 'calculating' | 'synthesizing' | 'reviewing' | 'associating';
    progress: number;
    focus?: string[];
  } | null;
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

const CrikzlingChatBackground: React.FC<CrikzlingChatBackgroundProps> = ({
  isThinking,
  isTyping,
  currentThought
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const cognitiveSpirals: CognitiveSpiral[] = [];
    const neuralPulses: NeuralPulse[] = [];

    const getPhaseColor = (phase?: string): string => {
      switch (phase) {
        case 'analyzing': return '#3B82F6';
        case 'associating': return '#EC4899';
        case 'planning': return '#A78BFA';
        case 'calculating': return '#10B981';
        case 'synthesizing': return '#F59E0B';
        case 'reviewing': return '#06B6D4';
        default: return '#F59E0B';
      }
    };

    const createCognitiveSpiral = () => {
      const phase = currentThought?.phase;
      cognitiveSpirals.push({
        angle: 0,
        radius: 0,
        speed: 0.003 + Math.random() * 0.004,
        thickness: 1.5 + Math.random() * 2,
        opacity: 0.5,
        color: getPhaseColor(phase),
        pulseIntensity: 0
      });
    };

    const createNeuralPulse = () => {
      neuralPulses.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2 + (Math.random() - 0.5) * 200,
        radius: 0,
        maxRadius: 60 + Math.random() * 80,
        opacity: 0.6,
        speed: 1.5 + Math.random() * 1.5,
        color: getPhaseColor(currentThought?.phase)
      });
    };

    let lastSpiralTime = 0;
    let lastPulseTime = 0;

    function animate(timestamp: number) {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (isThinking && currentThought) {
        if (timestamp - lastSpiralTime > 3000 && cognitiveSpirals.length < 2) {
          createCognitiveSpiral();
          lastSpiralTime = timestamp;
        }

        if (timestamp - lastPulseTime > 2000) {
          createNeuralPulse();
          lastPulseTime = timestamp;
        }

        cognitiveSpirals.forEach((spiral, index) => {
          spiral.angle += spiral.speed;
          spiral.radius = Math.min(spiral.radius + 0.4, Math.min(canvas.width, canvas.height) / 3);
          spiral.pulseIntensity = Math.sin(timestamp * 0.003) * 0.3 + 0.7;

          const a = 0.5;
          const b = 0.2;
          const maxAngle = 15;
          
          ctx.strokeStyle = spiral.color;
          ctx.lineWidth = spiral.thickness;
          ctx.shadowBlur = 15 * spiral.pulseIntensity;
          ctx.shadowColor = spiral.color;
          ctx.globalAlpha = spiral.opacity * spiral.pulseIntensity;

          ctx.beginPath();
          for (let angle = 0; angle < maxAngle; angle += 0.15) {
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

          if (spiral.radius >= Math.min(canvas.width, canvas.height) / 3) {
            spiral.opacity -= 0.008;
            if (spiral.opacity <= 0) {
              cognitiveSpirals.splice(index, 1);
            }
          }
        });

        neuralPulses.forEach((pulse, index) => {
          pulse.radius += pulse.speed;
          pulse.opacity -= 0.01;

          ctx.strokeStyle = pulse.color;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 15;
          ctx.shadowColor = pulse.color;
          ctx.globalAlpha = pulse.opacity;

          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.globalAlpha = pulse.opacity * 0.2;
          ctx.fillStyle = pulse.color;
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulse.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;

          if (pulse.opacity <= 0 || pulse.radius > pulse.maxRadius) {
            neuralPulses.splice(index, 1);
          }
        });

        const progress = currentThought.progress / 100;
        const ringRadius = Math.min(canvas.width, canvas.height) / 6;
        
        ctx.strokeStyle = getPhaseColor(currentThought.phase);
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = getPhaseColor(currentThought.phase);
        ctx.globalAlpha = 0.4;

        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, -Math.PI / 2, -Math.PI / 2 + (progress * Math.PI * 2));
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        const coreRadius = 5 + Math.sin(timestamp * 0.005) * 3;
        ctx.fillStyle = getPhaseColor(currentThought.phase);
        ctx.shadowBlur = 25;
        ctx.shadowColor = getPhaseColor(currentThought.phase);
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      if (isTyping) {
        const typingRadius = Math.min(canvas.width, canvas.height) / 8;
        const dotCount = 3;
        
        for (let i = 0; i < dotCount; i++) {
          const angle = (timestamp * 0.003 + i * (Math.PI * 2 / dotCount)) % (Math.PI * 2);
          const x = centerX + Math.cos(angle) * typingRadius;
          const y = centerY + Math.sin(angle) * typingRadius;
          const size = 3 + Math.sin(timestamp * 0.005 + i) * 1.5;
          
          ctx.fillStyle = '#F59E0B';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#F59E0B';
          ctx.globalAlpha = 0.5;
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
  }, [isThinking, isTyping, currentThought]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
};

export default CrikzlingChatBackground;