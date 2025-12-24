import React from 'react';
import { motion } from 'framer-motion';

export default function BrandLogo({ size = 'md', withText = true }: { size?: 'sm' | 'md' | 'lg', withText?: boolean }) {
  const sizes = {
    sm: { w: 34, h: 34, text: 'text-lg', sub: 'text-[8px]' }, // 34 is Fibonacci
    md: { w: 55, h: 55, text: 'text-xl', sub: 'text-[10px]' }, // 55 is Fibonacci
    lg: { w: 89, h: 89, text: 'text-3xl', sub: 'text-xs' }    // 89 is Fibonacci
  };
  const c = sizes[size];

  return (
    <div className="flex items-center gap-4 select-none">
      <div className="relative" style={{ width: c.w, height: c.h }}>
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none">
          <defs>
            <linearGradient id="fiberGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d="M85,30 A40,40 0 1,0 85,70 M50,10 L50,90" className="stroke-white/5" strokeWidth="8" strokeLinecap="round" />
          <motion.path 
            d="M85,30 A40,40 0 1,0 85,70 M50,10 L50,90"
            stroke="url(#fiberGrad1)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="50 150"
            animate={{ strokeDashoffset: [0, -200] }}
            transition={{ duration: 1.618, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle cx="50" cy="50" r="3" fill="#F59E0B" />
        </svg>
      </div>
      {withText && (
        <div className="flex flex-col border-l border-white/10 pl-3">
          <span className={`font-black text-white leading-tight ${c.text}`}>CRIKZ</span>
          <span className={`text-primary-500 font-bold tracking-[0.3em] uppercase ${c.sub}`}>Protocol</span>
        </div>
      )}
    </div>
  );
}