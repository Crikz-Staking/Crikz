// src/components/LearningHub.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Newspaper } from 'lucide-react';
import TokenAnalytics from './learning/TokenAnalytics';
import CommunityNews from './learning/CommunityNews';

interface LearningHubProps {
  dynamicColor: string;
}

export default function LearningHub({ dynamicColor }: LearningHubProps) {
  const [activeSection, setActiveSection] = useState<'analytics' | 'news'>('analytics');

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Sub-Navigation for Learning Mode */}
      <div className="flex items-center gap-6 mb-8 border-b border-white/10 px-4">
        <button
          onClick={() => setActiveSection('analytics')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeSection === 'analytics' 
              ? `text-white border-[${dynamicColor}]` 
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
          style={{ borderColor: activeSection === 'analytics' ? dynamicColor : 'transparent' }}
        >
          <BarChart2 size={18} />
          Token Analytics
        </button>
        <button
          onClick={() => setActiveSection('news')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeSection === 'news' 
              ? `text-white border-[${dynamicColor}]` 
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
          style={{ borderColor: activeSection === 'news' ? dynamicColor : 'transparent' }}
        >
          <Newspaper size={18} />
          Protocol News & Reading
        </button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeSection === 'analytics' ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <TokenAnalytics dynamicColor={dynamicColor} />
          </motion.div>
        ) : (
          <motion.div
            key="news"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <CommunityNews dynamicColor={dynamicColor} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}