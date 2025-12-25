// src/components/layout/TopNavigation.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TopNavigationProps {
  items: NavItem[];
  currentId: string;
  onSelect: (id: any) => void;
  dynamicColor: string;
}

export default function TopNavigation({ items, currentId, onSelect, dynamicColor }: TopNavigationProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex justify-center mb-8">
      <div className="flex gap-2 p-2 bg-background-elevated/80 backdrop-blur-md rounded-2xl border border-white/5 overflow-x-auto max-w-full">
        {items.map((item) => {
          const isActive = currentId === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="relative px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 min-w-[100px] justify-center"
              style={{
                color: isActive ? '#fff' : '#9ca3af',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="subNavHighlight"
                  className="absolute inset-0 rounded-xl"
                  style={{ 
                    background: `${dynamicColor}15`, 
                    border: `1px solid ${dynamicColor}30` 
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <Icon 
                size={18}
                strokeWidth={isActive ? 2.5 : 2}
                style={{ color: isActive ? dynamicColor : 'inherit' }}
                className="relative z-10"
              />
              <span className="relative z-10 text-xs font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}