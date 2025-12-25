import React from 'react';
import { motion } from 'framer-motion';
import { CircleDollarSign, Tv, Hammer } from 'lucide-react';
import { MainSection } from '@/types';

interface GlobalNavigationProps {
  currentSection: MainSection;
  setSection: (section: MainSection) => void;
  dynamicColor: string;
}

export default function GlobalNavigation({ currentSection, setSection, dynamicColor }: GlobalNavigationProps) {
  const sections = [
    { 
      id: 'active', 
      icon: CircleDollarSign, 
      label: 'Active',
      description: 'Invest & Trade' 
    },
    { 
      id: 'passive', 
      icon: Tv, 
      label: 'Passive',
      description: 'Media & Games' 
    },
    { 
      id: 'tools', 
      icon: Hammer, 
      label: 'Tools',
      description: 'Utilities' 
    }
  ] as const;

  return (
    <div className="flex justify-center mb-6">
      <div className="flex items-center gap-4 sm:gap-8 bg-black/40 p-2 rounded-3xl border border-white/10 backdrop-blur-md">
        {sections.map((section) => {
          const isActive = currentSection === section.id;
          const Icon = section.icon;

          return (
            <button
              key={section.id}
              onClick={() => setSection(section.id as MainSection)}
              className="relative group flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl transition-all"
            >
              {isActive && (
                <motion.div
                  layoutId="globalNavGlow"
                  className="absolute inset-0 rounded-2xl bg-white/5 border border-white/10"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                <Icon 
                  size={32} 
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ 
                    color: isActive ? dynamicColor : '#6b7280',
                    filter: isActive ? `drop-shadow(0 0 8px ${dynamicColor}50)` : 'none'
                  }} 
                />
              </div>
              
              <span className={`relative z-10 mt-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {section.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}