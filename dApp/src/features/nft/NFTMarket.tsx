import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, PlusCircle, LayoutGrid } from 'lucide-react';
import NFTMinting from './NFTMinting';
import UserCollection from './UserCollection';
import MarketListings from './MarketListings';
import { useMarketListings } from '@/hooks/web3/useMarketListings';
import { useContractWrite } from '@/hooks/web3/useContractWrite'; // Assuming this exists
import { Language } from '@/types';

interface NFTMarketProps {
  dynamicColor: string;
  lang: Language;
}

export default function NFTMarket({ dynamicColor, lang }: NFTMarketProps) {
  const [view, setView] = useState<'market' | 'mint' | 'collection'>('market');
  const { listings, isLoading, refresh } = useMarketListings();
  const { isPending } = useContractWrite(); // Simplified for brevity

  const tabs = [
    { id: 'market', label: 'Marketplace', icon: ShoppingBag },
    { id: 'mint', label: 'Mint Artifact', icon: PlusCircle },
    { id: 'collection', label: 'My Collection', icon: LayoutGrid },
  ];

  return (
    <div className="space-y-6">
      <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/10 w-fit mx-auto mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as any)}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
              view === tab.id ? 'bg-primary-500 text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {view === 'market' && (
             <MarketListings listings={listings} isPending={isPending} isLoading={isLoading} onBuy={() => {}} />
          )}
          {view === 'mint' && <NFTMinting dynamicColor={dynamicColor} />}
          {view === 'collection' && <UserCollection dynamicColor={dynamicColor} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}