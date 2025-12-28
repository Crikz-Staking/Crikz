import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface VisualProps {
  state: 'idle' | 'thinking' | 'crystallizing' | 'error' | 'connected'; // <--- Added 'connected'
}

/**
 * Crikzling V4 Visual Core
 * Represents the AI's cognitive state using Sacred Geometry and Neural Pulsations.
 */
export const GeometricCore = ({ state }: VisualProps) => {
  
  // 1. Dynamic Color Palette based on State
  const colors = useMemo(() => {
    switch (state) {
      case 'thinking':
        return {
          primary: '#A78BFA', // Purple (Compute)
          secondary: '#F59E0B', // Gold (Data)
          glow: 'rgba(167, 139, 250, 0.5)',
          core: '#FFF'
        };
      case 'connected': // <--- New Palette for Internet/High Stamina
        return {
          primary: '#22D3EE', // Cyan (Electric/Data)
          secondary: '#3B82F6', // Blue
          glow: 'rgba(34, 211, 238, 0.6)',
          core: '#E0F2FE'
        };
      case 'crystallizing':
        return {
          primary: '#10B981', // Emerald (Success/Save)
          secondary: '#3B82F6', // Blue (Blockchain)
          glow: 'rgba(16, 185, 129, 0.5)',
          core: '#ECFDF5'
        };
      case 'error':
        return {
          primary: '#EF4444', // Red
          secondary: '#7F1D1D',
          glow: 'rgba(239, 68, 68, 0.5)',
          core: '#FEF2F2'
        };
      default: // Idle
        return {
          primary: '#F59E0B', // Crikz Gold
          secondary: '#D97706',
          glow: 'rgba(245, 158, 11, 0.3)',
          core: '#FFEDD5'
        };
    }
  }, [state]);

  // 2. Animation Variants
  const outerRingVariants = {
    idle: { 
      rotate: 360, 
      scale: [1, 1.05, 1],
      transition: { rotate: { duration: 20, ease: "linear", repeat: Infinity }, scale: { duration: 4, repeat: Infinity } } 
    },
    thinking: { 
      rotate: -360, 
      scale: [1, 0.9, 1],
      transition: { rotate: { duration: 2, ease: "linear", repeat: Infinity }, scale: { duration: 0.5, repeat: Infinity } } 
    },
    connected: { // <--- Fast spin for high bandwidth
      rotate: 360,
      scale: [1, 1.1, 1],
      opacity: [0.5, 1, 0.5],
      transition: { rotate: { duration: 1, ease: "linear", repeat: Infinity }, scale: { duration: 0.5, repeat: Infinity } }
    },
    crystallizing: { 
      rotate: [0, 720], 
      scale: [1, 1.5, 0], // Implosion effect
      opacity: [1, 1, 0],
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity } 
    },
    error: {
      x: [0, -5, 5, -2, 2, 0],
      transition: { duration: 0.2, repeat: Infinity }
    }
  };

  const coreVariants = {
    idle: { scale: [1, 1.2, 1], opacity: 0.8, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
    thinking: { scale: [0.8, 1.5, 0.8], opacity: 1, transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" } },
    connected: { scale: [1, 1.3, 1], opacity: 1, transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" } }, // <--- Rapid Pulse
    crystallizing: { scale: 0, opacity: 0, transition: { duration: 0.5 } },
    error: { scale: [1, 0.8, 1], transition: { duration: 0.1, repeat: Infinity } }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      
      {/* A. Background Neural Field (The Aura) */}
      <motion.div
        className="absolute inset-[-20%] rounded-full blur-xl"
        animate={{
          opacity: state === 'thinking' || state === 'connected' ? [0.2, 0.6, 0.2] : [0.1, 0.2, 0.1],
          scale: state === 'thinking' ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: state === 'connected' ? 0.5 : 2, repeat: Infinity }}
        style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)` }}
      />

      {/* B. The Data Stream Ring (Outer dashed) */}
      <motion.div
        className="absolute inset-0 border-2 border-dashed rounded-full"
        variants={outerRingVariants}
        animate={state}
        style={{ borderColor: colors.primary, opacity: 0.4 }}
      />

      {/* C. The Logic Ring (Inner solid) */}
      <motion.div
        className="absolute inset-[15%] border-[1px] rounded-full"
        animate={{ 
          rotate: state === 'thinking' || state === 'connected' ? 360 : -360,
          borderColor: [colors.secondary, colors.primary, colors.secondary]
        }}
        transition={{ duration: state === 'thinking' ? 3 : state === 'connected' ? 1 : 10, repeat: Infinity, ease: "linear" }}
        style={{ opacity: 0.6 }}
      />

      {/* D. The Fibonacci Core (SVG Geometry) */}
      <motion.svg
        viewBox="0 0 100 100"
        className="w-[60%] h-[60%] z-10"
        variants={coreVariants}
        animate={state}
      >
        <defs>
          <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 1. The Golden Triangle (Phi) */}
        <motion.path
          d="M50 10 L90 80 L10 80 Z"
          fill="none"
          stroke="url(#coreGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1, rotate: state === 'thinking' ? 360 : 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          style={{ originX: "50px", originY: "55px" }}
        />

        {/* 2. The Inner Eye (Focus) */}
        <motion.circle
          cx="50"
          cy="55" // Visual center of the triangle roughly
          r="8"
          fill={colors.core}
          filter="url(#glow)"
          animate={{ 
            scale: state === 'thinking' ? [1, 1.5, 1] : [1, 1.1, 1],
            opacity: state === 'thinking' ? 1 : 0.8
          }}
          transition={{ duration: state === 'thinking' ? 0.5 : 4, repeat: Infinity }}
        />

        {/* 3. Thinking Scanner Lines (Only visible when active or connected) */}
        {(state === 'thinking' || state === 'connected') && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: state === 'connected' ? 0.5 : 1, repeat: Infinity, ease: "linear" }}
            style={{ originX: "50px", originY: "50px" }}
          >
            <circle cx="50" cy="50" r="40" stroke={colors.primary} strokeWidth="1" strokeDasharray="10 20" opacity="0.5" />
            <path d="M50 50 L90 50" stroke={colors.primary} strokeWidth="2" opacity="0.8" />
          </motion.g>
        )}
      </motion.svg>

      {/* E. Crystallization Particles (Only when saving) */}
      {state === 'crystallizing' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-full h-full border-4 rounded-full"
            style={{ borderColor: colors.primary }}
            animate={{ scale: [1.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      )}
    </div>
  );
};