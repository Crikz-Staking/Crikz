// src/components/NavigationTabs.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Droplets, BarChart3 } from 'lucide-react';
import type { TabType } from '../types';

interface NavigationTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dynamicColor: string;
}

export default function NavigationTabs({ activeTab, setActiveTab, dynamicColor }: NavigationTabsProps) {
  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'fund', label: 'Fund', icon: Droplets },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 flex-1 sm:flex-initial"
            style={{
              background: isActive ? `${dynamicColor}20` : 'rgba(26, 26, 36, 0.6)',
              border: `1px solid ${isActive ? `${dynamicColor}60` : 'rgba(255, 255, 255, 0.1)'}`,
              color: isActive ? '#fff' : '#888',
              boxShadow: isActive ? `0 0 20px ${dynamicColor}25` : 'none'
            }}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 opacity-10 rounded-xl"
                style={{ background: dynamicColor }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <tab.icon size={16} className="relative z-10" />
            <span className="hidden sm:inline relative z-10">{tab.label}</span>

            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: dynamicColor }}
                transition={{ type: 'spring', bounce: 0.2 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}