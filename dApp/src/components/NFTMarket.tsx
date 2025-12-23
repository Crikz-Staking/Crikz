// src/components/NFTMarket.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, PlusCircle, User, ArrowUpRight, Tag, Wallet, Grid } from 'lucide-react';
import { useContractData } from '../hooks/useContractData';
import type { Language } from '../App';

interface NFTMarketProps {
  dynamicColor: string;
  lang: Language;
  address: `0x${string}` | undefined;
}

export default function NFTMarket({ dynamicColor, lang, address }: NFTMarketProps) {
  const [activeTab, setActiveTab] = useState<'market' | 'mint'>('market');
  const [assignedName, setAssignedName] = useState("");
  const { balance } = useContractData(); // Check CRIKZ balance

  useEffect(() => {
    if (address) {
      const id = parseInt(address.slice(-4), 16) % 10000;
      setAssignedName(`crikz${id}`);
    }
  }, [address]);

  const t = {
    en: { 
      market: "Market", mintTab: "Mint", 
      createTitle: "Create Private NFT",
      createDesc: "Minting is private. Publish later to list on Market.",
      gasNote: "Gas fees paid via CRIKZ Protocol",
      insufficient: "Insufficient CRIKZ Balance",
      mintBtn: "Mint Item",
      marketTitle: "Ecosystem Items",
      filters: "Most Traded"
    },
    sq: { 
      market: "Tregu", mintTab: "Krijo", 
      createTitle: "Krijo NFT Privat",
      createDesc: "Krijimi është privat. Publikoni më vonë për ta listuar.",
      gasNote: "Tarifat e gazit paguhen përmes Protokollit CRIKZ",
      insufficient: "Balanca e CRIKZ e Pamjaftueshme",
      mintBtn: "Krijo Objekt",
      marketTitle: "Objektet e Ekosistemit",
      filters: "Më të Tregtuarat"
    }
  }[lang];

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('market')}
          className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-all ${activeTab === 'market' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
        >
          <Grid size={16} /> {t.market}
        </button>
        <button 
          onClick={() => setActiveTab('mint')}
          className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-all ${activeTab === 'mint' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
        >
          <PlusCircle size={16} /> {t.mintTab}
        </button>
      </div>

      {activeTab === 'market' ? (
        // MARKET VIEW (Default)
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{t.marketTitle}</h2>
            <div className="text-xs font-bold text-gray-500 border border-white/10 px-3 py-1 rounded-full">{t.filters}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {/* Mock Market Items */}
             {[1, 2, 3].map(i => (
               <div key={i} className="glass-card p-4 rounded-2xl border border-white/10 hover:border-primary-500/30 transition-all cursor-pointer">
                 <div className="h-32 bg-black/30 rounded-xl mb-3 flex items-center justify-center text-gray-600">
                    <ShoppingBag size={24} />
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Crikz Item #{i}</span>
                    <span className="text-xs font-mono text-primary-500">0.5 BNB</span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      ) : (
        // MINT VIEW (Secondary)
        <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-white">{t.createTitle}</h2>
              <p className="text-gray-400 text-sm mt-1">{t.createDesc}</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl">
              <User size={16} className="text-primary-500" />
              <span className="text-sm font-mono text-white font-bold">{assignedName}</span>
            </div>
          </div>

          <div className="p-8 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center bg-black/20">
            <div className="mb-6 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                   <Wallet size={12} /> {t.gasNote}
                </div>
                {(!balance || balance === 0n) && (
                   <span className="text-xs text-red-500 font-bold">{t.insufficient}</span>
                )}
            </div>
            
            <button 
              disabled={!balance || balance === 0n}
              className="px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
              style={{ backgroundColor: dynamicColor, color: '#000' }}
            >
              {t.mintBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}