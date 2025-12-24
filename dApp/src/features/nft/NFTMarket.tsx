import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, PlusCircle, LayoutGrid } from 'lucide-react';
import NFTMinting from './NFTMinting';
import UserCollection from './UserCollection';
import MarketListings from './MarketListings'; 
import { Language } from '@/types';

interface NFTMarketProps {
  dynamicColor: string;
  lang: Language;
  address?: string;
}

export default function NFTMarket({ dynamicColor, lang, address }: NFTMarketProps) {
  const [view, setView] = useState<'market' | 'mint' | 'collection'>('market');

  const tabs = [
    { id: 'market', label: 'Marketplace', icon: ShoppingBag },
    { id: 'mint', label: 'Mint Artifact', icon: PlusCircle },
    { id: 'collection', label: 'My Collection', icon: LayoutGrid },
  ];

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="relative rounded-3xl overflow-hidden bg-background-elevated border border-white/10 p-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
              CRIKZ <span className="text-primary-500">Market</span>
            </h1>
            <p className="text-gray-400">Mint, Trade, and Import NFTs on BSC Testnet.</p>
          </div>
          <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                  view === tab.id ? 'bg-primary-500 text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {view === 'market' && <div className="text-center text-gray-500 py-20">Marketplace Listings Coming Soon (Requires Indexer)</div>}
          {view === 'mint' && <NFTMinting dynamicColor={dynamicColor} />}
          {view === 'collection' && <UserCollection dynamicColor={dynamicColor} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}