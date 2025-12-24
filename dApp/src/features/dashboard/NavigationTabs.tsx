import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, List, BarChart2, LucideIcon } from 'lucide-react';
import { DashboardTab, Language } from '@/types';

interface NavigationTabsProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  dynamicColor: string;
  lang: Language;
  orderCount: number;
}

export default function NavigationTabs({ 
  activeTab, 
  setActiveTab, 
  dynamicColor, 
  lang,
  orderCount 
}: NavigationTabsProps) {
  
  const t = {
    en: { create: "Create Order", orders: "My Orders", analytics: "Analytics" },
    sq: { create: "Krijo Urdhër", orders: "Urdhërat e Mi", analytics: "Analitika" }
  }[lang];

  // FIX: Explicitly type the array to handle optional 'count' property
  const tabs: { id: string; label: string; icon: LucideIcon; count?: number }[] = [
    { id: 'create', label: t.create, icon: PlusCircle },
    { id: 'orders', label: t.orders, icon: List, count: orderCount },
    { id: 'analytics', label: t.analytics, icon: BarChart2 },
  ];

  return (
    <div className="flex flex-wrap items-center justify-start gap-2 border-b border-white/5 pb-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DashboardTab)}
            className="relative px-6 py-4 flex items-center gap-2 transition-all group"
          >
            <Icon 
              size={18} 
              className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} 
              style={{ color: isActive ? dynamicColor : undefined }}
            />
            <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
              {tab.label}
            </span>
            
            {/* FIX: count is now recognized */}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400">
                {tab.count}
              </span>
            )}

            {isActive && (
              <motion.div 
                layoutId="activeDashboardTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 z-10"
                style={{ backgroundColor: dynamicColor }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}