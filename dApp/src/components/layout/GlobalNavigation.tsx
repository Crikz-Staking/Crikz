import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShoppingBag, Gamepad2, Tv, Wrench } from 'lucide-react';
import { MainSection } from '@/types';
import { triggerInteraction } from '@/lib/interaction-events'; // Import Event Bus

interface GlobalNavigationProps {
  currentSection: MainSection;
  setSection: (section: MainSection) => void;
  dynamicColor: string;
}

export default function GlobalNavigation({ currentSection, setSection, dynamicColor }: GlobalNavigationProps) {
  const navItems = [
    { id: 'active', label: 'Dashboard', icon: LayoutDashboard, desc: 'Staking & Orders' },
    { id: 'nft', label: 'Marketplace', icon: ShoppingBag, desc: 'NFT Trading' },
    { id: 'arcade', label: 'Arcade', icon: Gamepad2, desc: 'Games & Betting' },
    { id: 'passive', label: 'Media Hub', icon: Tv, desc: 'Stream & Learn' },
    { id: 'tools', label: 'Utilities', icon: Wrench, desc: 'Dev Tools' }
  ];

  const handleNav = (id: string) => {
      // Trigger Background Effect
      triggerInteraction('NAVIGATION');
      
      if (['active', 'nft', 'arcade'].includes(id)) setSection('active');
      else setSection(id as MainSection);
  };

  return (
    <div className="flex justify-center mb-10">
      <div className="flex items-center gap-2 bg-[#12121A]/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
        {navItems.map((item) => {
          let isActive = false;
          if (currentSection === 'active' && (item.id === 'active' || item.id === 'nft' || item.id === 'arcade')) isActive = true;
          if (currentSection === item.id) isActive = true;

          const isMainActive = currentSection === (['nft','arcade'].includes(item.id) ? 'active' : item.id);

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className="relative group flex items-center gap-3 px-5 py-3 rounded-xl transition-all overflow-hidden"
            >
              {isMainActive && (
                <motion.div
                  layoutId="navGlow"
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <item.icon 
                size={20} 
                className={`relative z-10 transition-colors ${isMainActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}
                style={{ color: isMainActive ? dynamicColor : undefined }}
              />
              
              <div className="flex flex-col items-start relative z-10">
                <span className={`text-sm font-bold leading-none ${isMainActive ? 'text-white' : 'text-gray-400'}`}>
                    {item.label}
                </span>
                {isMainActive && (
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