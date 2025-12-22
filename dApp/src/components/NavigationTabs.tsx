// src/components/NavigationTabs.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, BarChart3 } from 'lucide-react';
import type { TabType } from '../types';
import type { Language } from '../App';

interface NavigationTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dynamicColor: string;
  lang: Language;
}

export default function NavigationTabs({ activeTab, setActiveTab, dynamicColor, lang }: NavigationTabsProps) {
  const t = {
    en: { create: "Create Order", orders: "My Orders", analytics: "Analytics" },
    sq: { create: "Krijo Urdhër", orders: "Urdhërat e Mi", analytics: "Analitika" }
  }[lang];

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'create', label: t.create, icon: Plus },
    { id: 'orders', label: t.orders, icon: Package },
    { id: 'analytics', label: t.analytics, icon: BarChart3 }
  ];

  return (
    <div className="flex gap-3 bg-background-surface/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 flex-1"
            style={{
              background: isActive ? `${dynamicColor}15` : 'transparent',
              border: isActive ? `1px solid ${dynamicColor}40` : '1px solid transparent',
              color: isActive ? '#fff' : '#d1d5db', // Increased contrast (gray-300)
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
            
            <tab.icon 
              size={18} 
              className="relative z-10" 
              strokeWidth={isActive ? 2.5 : 2}
              style={{ color: isActive ? dynamicColor : 'inherit' }}
            />
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}