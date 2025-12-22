// src/components/NFTMarket.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, PlusCircle, User, ArrowUpRight, Tag } from 'lucide-react';
import type { Language } from '../App';

interface NFTMarketProps {
  dynamicColor: string;
  lang: Language;
  address: `0x${string}` | undefined;
}

export default function NFTMarket({ dynamicColor, lang, address }: NFTMarketProps) {
  const [assignedName, setAssignedName] = useState("");

  useEffect(() => {
    if (address) {
      // Logic: Simulation of default naming based on historical order. 
      // In production, this would fetch from the Smart Contract 'getDefaultName' view function.
      const id = parseInt(address.slice(-4), 16) % 10000;
      setAssignedName(`crikz${id}`);
    }
  }, [address]);

  const t = {
    en: { 
      title: "NFT Marketplace", 
      mint: "Mint New Item", 
      nameLabel: "Assigned Identity", 
      price: "Listing Price", 
      publish: "Publish to Market",
      desc: "Create and trade unique ecosystem items.",
      fee: "Gas fees apply"
    },
    sq: { 
      title: "Tregu i NFT", 
      mint: "Krijo Objekt të Ri", 
      nameLabel: "Identiteti i Caktuar", 
      price: "Çmimi i Listimit", 
      publish: "Publiko në Treg",
      desc: "Krijoni dhe tregtoni objekte unike të ekosistemit.",
      fee: "Tarifat e gazit zbatohen"
    }
  }[lang];

  return (
    <div className="space-y-6">
      <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <ShoppingBag style={{ color: dynamicColor }} /> {t.title}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{t.desc}</p>
          </div>
          
          {address && (
            <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
              <div className="bg-primary-500/20 p-2 rounded-lg">
                 <User size={16} className="text-primary-500" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold">{t.nameLabel}</div>
                <span className="text-sm font-mono text-white font-bold">{assignedName}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mint Section */}
          <div className="p-8 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center bg-black/20 hover:border-primary-500/30 transition-colors group">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PlusCircle size={32} className="text-gray-400 group-hover:text-primary-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t.mint}</h3>
            <p className="text-xs text-gray-500 mb-6 text-center max-w-xs">{t.fee}</p>
            <button className="px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg" style={{ backgroundColor: dynamicColor, color: '#000' }}>
              {t.mint}
            </button>
          </div>
          
          {/* List Section */}
          <div className="space-y-4 p-6 bg-background-surface rounded-2xl border border-white/5">
            <h3 className="font-bold text-white flex items-center gap-2">
                <Tag size={18} className="text-gray-400" />
                {t.publish}
            </h3>
            
            <div className="p-4 bg-black/20 rounded-xl border border-white/5 focus-within:border-primary-500/50 transition-colors">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.price}</label>
              <div className="flex items-center justify-between">
                <input type="number" placeholder="0.00" className="w-full bg-transparent border-none text-2xl font-black text-white focus:ring-0 placeholder:text-gray-700 focus:outline-none" />
                <span className="text-sm font-bold text-gray-500">BNB</span>
              </div>
            </div>
            
            <button className="w-full py-4 rounded-xl border-2 font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2" style={{ borderColor: dynamicColor, color: dynamicColor }}>
              {t.publish} <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}