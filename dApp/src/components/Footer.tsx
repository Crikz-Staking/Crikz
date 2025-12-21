// src/components/Footer.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface FooterProps {
  dynamicColor: string;
}

export default function Footer({ dynamicColor }: FooterProps) {
  return (
    <footer className="relative mt-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${dynamicColor}40 0%, ${dynamicColor}10 100%)`
              }}
            >
              <span className="text-lg font-black">Φ</span>
            </div>
            <span className="text-sm font-black">CRIKZ PROTOCOL</span>
          </div>

          {/* Info */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>© 2024 Crikz Protocol</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-mono" style={{ color: dynamicColor }}>
              Fibonacci Sequence
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}