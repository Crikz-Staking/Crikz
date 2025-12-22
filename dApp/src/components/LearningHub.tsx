// src/components/LearningHub.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, BookOpen } from 'lucide-react';
import TokenAnalytics from './learning/TokenAnalytics';
import Reading from './learning/Reading';
import type { Language } from '../App';

interface LearningHubProps {
  dynamicColor: string;
  lang: Language;
}

export default function LearningHub({ dynamicColor, lang }: LearningHubProps) {
  // Default set to 'reading' as requested
  const [activeSection, setActiveSection] = useState<'reading' | 'analytics'>('reading');

  const t = {
    en: { analytics: "Token Analytics", reading: "Reading" },
    sq: { analytics: "Analitika e Tokenit", reading: "Leximi" }
  }[lang];

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Sub-Navigation */}
      <div className="flex items-center gap-8 mb-8 border-b border-white/10 px-4">
        <button
          onClick={() => setActiveSection('reading')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2`}
          style={{ 
            borderColor: activeSection === 'reading' ? dynamicColor : 'transparent',
            color: activeSection === 'reading' ? 'white' : '#6b7280'
          }}
        >
          <BookOpen size={18} />
          {t.reading}
        </button>
        <button
          onClick={() => setActiveSection('analytics')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2`}
          style={{ 
            borderColor: activeSection === 'analytics' ? dynamicColor : 'transparent',
            color: activeSection === 'analytics' ? 'white' : '#6b7280'
          }}
        >
          <BarChart2 size={18} />
          {t.analytics}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'analytics' ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <TokenAnalytics dynamicColor={dynamicColor} lang={lang} />
          </motion.div>
        ) : (
          <motion.div
            key="reading"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Reading dynamicColor={dynamicColor} lang={lang} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}