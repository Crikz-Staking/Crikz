import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutGrid, Code, Shield, Wrench, Search
} from 'lucide-react';

// Import Suites
import DeFiSuite from './DeFiSuite';
import DevSuite from './DevSuite';
import SecuritySuite from './SecuritySuite';
import FileConverter from './FileConverter'; // Use existing file converter as "General"

interface ToolsLayoutProps {
  dynamicColor: string;
}

export default function ToolsLayout({ dynamicColor }: ToolsLayoutProps) {
  const [activeTab, setActiveTab] = useState<'defi' | 'dev' | 'sec' | 'gen'>('defi');

  const tabs = [
    { id: 'defi', label: 'DeFi & Stats', icon: LayoutGrid },
    { id: 'dev', label: 'Developer', icon: Code },
    { id: 'sec', label: 'Security', icon: Shield },
    { id: 'gen', label: 'Utilities', icon: Wrench },
  ];

  return (
    <div className="min-h-[600px]">
      {/* Header & Nav */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
        <div>
            <h2 className="text-3xl font-black text-white mb-2">Protocol Tools</h2>
            <p className="text-gray-400">Essential utilities for the decentralized web.</p>
        </div>

        <div className="bg-background-elevated p-1 rounded-2xl border border-white/10 flex gap-1">
            {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                            isActive 
                            ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20' 
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Icon size={16} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                )
            })}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
        >
            {activeTab === 'defi' && <DeFiSuite />}
            {activeTab === 'dev' && <DevSuite />}
            {activeTab === 'sec' && <SecuritySuite />}
            {activeTab === 'gen' && (
                <div className="grid gap-6">
                    <FileConverter dynamicColor={dynamicColor} />
                    {/* Add more general tools here if needed */}
                </div>
            )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}