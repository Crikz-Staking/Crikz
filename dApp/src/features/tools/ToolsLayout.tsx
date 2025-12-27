import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutGrid, Code, Shield, Wrench, PenTool
} from 'lucide-react';

// Import Suites
import DeFiSuite from './DeFiSuite';
import DevSuite from './DevSuite';
import SecuritySuite from './SecuritySuite';
import FileConverter from './FileConverter';
import SignatureTool from './SignatureTool';
import VanityGen from './VanityGen';
import TokenInspector from './TokenInspector'; // <--- NEW
import QRCodeGen from './QRCodeGen';           // <--- NEW
import DataTransformer from './DataTransformer'; // <--- NEW

interface ToolsLayoutProps {
  dynamicColor: string;
}

export default function ToolsLayout({ dynamicColor }: ToolsLayoutProps) {
  const [activeTab, setActiveTab] = useState<'defi' | 'dev' | 'sec' | 'crypto' | 'gen'>('defi');

  const tabs = [
    { id: 'defi', label: 'DeFi Data', icon: LayoutGrid },
    { id: 'dev', label: 'Dev Utils', icon: Code },
    { id: 'sec', label: 'Security', icon: Shield },
    { id: 'crypto', label: 'Crypto Tools', icon: PenTool },
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

        <div className="bg-background-elevated p-1 rounded-2xl border border-white/10 flex gap-1 flex-wrap sm:flex-nowrap">
            {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all flex-1 sm:flex-none justify-center ${
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
            {activeTab === 'defi' && (
                <div className="grid gap-6">
                    <DeFiSuite />
                    <TokenInspector />
                </div>
            )}
            {activeTab === 'dev' && (
                <div className="grid gap-6">
                    <DevSuite />
                    <DataTransformer />
                </div>
            )}
            {activeTab === 'sec' && <SecuritySuite />}
            {activeTab === 'crypto' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SignatureTool />
                    <VanityGen />
                </div>
            )}
            {activeTab === 'gen' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileConverter dynamicColor={dynamicColor} />
                    <QRCodeGen />
                </div>
            )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}