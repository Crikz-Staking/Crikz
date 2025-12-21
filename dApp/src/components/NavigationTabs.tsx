// src/components/NavigationTabs.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Droplets, BarChart3 } from 'lucide-react';
import type { TabType } from '../types';

interface NavigationTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  themeColor: string;
}

export default function NavigationTabs({ activeTab, setActiveTab, themeColor }: NavigationTabsProps) {
  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'create', label: 'Create Order', icon: Plus },
    { id: 'orders', label: 'Active Orders', icon: Package },
    { id: 'fund', label: 'Production Fund', icon: Droplets },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative px-6 py-3 rounded-xl font-bold transition-all overflow-hidden"
            style={{
              background: isActive ? `${themeColor}20` : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isActive ? themeColor : 'rgba(255, 255, 255, 0.1)'}`,
              color: isActive ? '#fff' : '#888'
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${themeColor}30, ${themeColor}10)`,
                  borderRadius: '0.75rem'
                }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <span className="relative flex items-center gap-2 z-10">
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}