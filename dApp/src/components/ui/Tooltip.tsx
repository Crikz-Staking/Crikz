import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface TooltipProps {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ content, side = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center ml-2"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)} // Mobile support
    >
      <HelpCircle size={14} className="text-gray-500 hover:text-primary-500 cursor-help transition-colors" />
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className="absolute z-50 w-48 p-3 text-[10px] font-medium text-white bg-black/90 border border-white/10 rounded-xl shadow-xl backdrop-blur-md"
            style={{
              bottom: side === 'top' ? '100%' : 'auto',
              top: side === 'bottom' ? '100%' : 'auto',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: side === 'top' ? '8px' : 0,
              marginTop: side === 'bottom' ? '8px' : 0,
            }}
          >
            {content}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/10" 
                 style={{ display: side === 'top' ? 'block' : 'none' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}