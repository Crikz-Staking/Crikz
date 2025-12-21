// src/components/LoadingSpinner.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  color?: string;
  size?: number;
}

export default function LoadingSpinner({ color = '#FFA500', size = 40 }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="rounded-full border-4 border-transparent"
        style={{
          width: size,
          height: size,
          borderTopColor: color,
          borderRightColor: color,
          boxShadow: `0 0 20px ${color}40`
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </div>
  );
}