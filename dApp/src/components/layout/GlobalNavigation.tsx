import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Layers, Wrench, Info } from 'lucide-react';
import { MainSection } from '@/types';
import { triggerInteraction } from '@/lib/interaction-events';

interface GlobalNavigationProps {
  currentSection: MainSection;
  setSection: (section: MainSection) => void;
  dynamicColor: string;
}

export default function GlobalNavigation({ currentSection, setSection, dynamicColor }: GlobalNavigationProps) {
  const navItems = [
    { 
      id: 'active', 
      label: 'Active', 
      icon: Zap, 
      desc: 'Trade, Play & Earn' 
    },
    { 
      id: 'passive', 
      label: 'Passive', 
      icon: Layers, 
      desc: 'Media & Analytics' 
    },
    { 
      id: 'tools', 
      label: 'Tools', 
      icon: Wrench, 
      desc: 'Utilities & Dev' 
    },
    { 
      id: 'about', 
      label: 'About', 
      icon: Info, 
      desc: 'Project Info' 
    }
  ];

  const handleNav = (id: string) => {
      triggerInteraction('NAVIGATION');
      setSection(id as MainSection);
  };

  return (
    <div className="flex justify-center mb-10">
      <div className="flex items-center gap-2 bg-[#12121A]/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className="relative group flex items-center gap-3 px-6 py-3 rounded-xl transition-all overflow-hidden"
            >
              {isActive && (
                <motion.div
                  layoutId="navGlow"
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <item.icon 
                size={20} 
                className={`relative z-10 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}
                style={{ color: isActive ? dynamicColor : undefined }}
              />
              
              <div className="flex flex-col items-start relative z-10">
                <span className={`text-sm font-bold leading-none ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {item.label}
                </span>
                {isActive && (
                    <motion.span 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                        className="text-[9px] text-gray-400 font-mono mt-1"
                    >
                        {item.desc}
                    </motion.span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}