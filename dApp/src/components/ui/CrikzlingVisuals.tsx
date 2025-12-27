import React from 'react';
import { motion } from 'framer-motion';

interface VisualProps {
  state: 'idle' | 'thinking' | 'crystallizing' | 'error';
}

export const GeometricCore = ({ state }: VisualProps) => {
  const getColors = () => {
    switch (state) {
      case 'thinking': return ['#F59E0B', '#A78BFA']; // Orange/Purple
      case 'crystallizing': return ['#10B981', '#3B82F6']; // Emerald/Blue
      case 'error': return ['#EF4444', '#7F1D1D']; // Red
      default: return ['#F59E0B', '#D97706']; // Gold (Idle)
    }
  };

  const [colorA, colorB] = getColors();

  const spinTransition = {
    duration: state === 'thinking' ? 2 : state === 'crystallizing' ? 0.5 : 10,
    repeat: Infinity,
    ease: "linear"
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer Ring */}
      <motion.div
        className="absolute inset-0 border-[3px] border-dashed rounded-full opacity-30"
        style={{ borderColor: colorA }}
        animate={{ rotate: 360 }}
        transition={spinTransition}
      />
      
      {/* Inner Geometric Shape (Fibonacci Approximation) */}
      <motion.svg
        viewBox="0 0 100 100"
        className="w-3/4 h-3/4"
        animate={{ 
          rotate: state === 'thinking' ? -360 : 360,
          scale: state === 'thinking' ? [1, 0.8, 1] : 1
        }}
        transition={spinTransition}
      >
        <defs>
          <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorA} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colorB} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        
        {/* Golden Ratio Triangle Intersections */}
        <path d="M50 10 L90 80 L10 80 Z" fill="none" stroke="url(#coreGrad)" strokeWidth="2" />
        <path d="M50 90 L90 20 L10 20 Z" fill="none" stroke="url(#coreGrad)" strokeWidth="2" />
        <circle cx="50" cy="50" r="15" fill="url(#coreGrad)" opacity="0.5" />
      </motion.svg>

      {/* Pulse Effect */}
      <motion.div
        className="absolute w-full h-full rounded-full opacity-20"
        style={{ background: `radial-gradient(circle, ${colorA} 0%, transparent 70%)` }}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  );
};