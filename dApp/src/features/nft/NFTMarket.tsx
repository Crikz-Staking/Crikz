import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, PlusCircle, Zap, Grid, Search } from 'lucide-react';
// FIX: Correct import
import { Language } from '@/types';

interface NFTMarketProps {
  dynamicColor: string;
  lang: Language;
  address?: string;
}

export default function NFTMarket({ dynamicColor, lang, address }: NFTMarketProps) {
  const [activeTab, setActiveTab] = useState<'market' | 'mint'>('market');

  return (
    <div className="space-y-8">
      
      {/* Hero / Landing Section */}
      <div className="relative rounded-3xl overflow-hidden bg-background-elevated border border-white/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
           <div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              CRIKZ <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Artifacts</span>
            </h1>
            <p className="text-gray-400 max-w-xl text-lg leading-relaxed">
              Collect exclusive tiered assets. Trade instantly or mint your own private legacy items within the Crikz ecosystem.
            </p>
          </div>
          <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('market')}
              className={`px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'market' ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid size={18} /> Market
            </button>
            <button 
              onClick={() => setActiveTab('mint')}
              className={`px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'mint' ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              <PlusCircle size={18} /> Mint
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'market' ? (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search artifacts..." 
                    className="w-full bg-background-elevated border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary-500/50 transition-colors placeholder:text-gray-600"
                />
            </div>
            <div className="flex gap-2">
                {['All', 'Legendary', 'Rare', 'Common'].map(f => (
                    <button key={f} className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                        {f}
                    </button>
                ))}
            </div>
          </div>

          {/* NFT Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
               <div key={i} className="group glass-card rounded-2xl border border-white/10 overflow-hidden hover:border-primary-500/50 transition-all hover:-translate-y-1">
                 <div className="aspect-square bg-gradient-to-br from-black/40 to-black/80 relative flex items-center justify-center p-8 group-hover:from-black/20 transition-all">
                    <ShoppingBag size={48} className="text-gray-700 group-hover:text-primary-500 transition-colors duration-500" />
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                        #{i.toString().padStart(3, '0')}
                    </div>
                  </div>
                 <div className="p-5">
                    <div className="text-[10px] font-bold text-primary-500 mb-1 uppercase tracking-wider">Genesis Collection</div>
                    <h3 className="font-bold text-white text-lg mb-4">Crikz Artifact #{i}</h3>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Price</span>
                            <span className="font-mono font-bold text-white">0.5 BNB</span>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors border border-white/5">
                            Details
                         </button>
                    </div>
                 </div>
               </div>
             ))}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            {/* Minting Interface */}
            <div className="max-w-xl mx-auto glass-card p-1 bg-gradient-to-b from-white/10 to-transparent rounded-3xl mt-12">
                <div className="bg-[#121212] rounded-[22px] p-8 text-center space-y-8">
                    <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(245,158,11,0.1)] border border-primary-500/20">
                        <Zap size={40} className="text-primary-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white mb-2">Mint Private Artifact</h2>
                        <p className="text-gray-400 text-sm">Minting is currently private. Assets are stored in your wallet and can be listed on the market later.</p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-8 py-6 border-y border-white/5">
                        <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase font-bold">Cost</div>
                            <div className="text-2xl font-black text-white">Free</div>
                        </div>
                        <div className="h-10 w-px bg-white/10"></div>
                        <div className="text-left">
                            <div className="text-xs text-gray-500 uppercase font-bold">Gas</div>
                            <div className="text-2xl font-black text-primary-500">Standard</div>
                        </div>
                    </div>

                    <button 
                        disabled={!address}
                        className="w-full py-4 rounded-xl font-black text-lg bg-primary-500 text-black hover:bg-primary-400 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {address ? 'Mint Artifact Now' : 'Connect Wallet to Mint'}
                    </button>
                </div>
            </div>
        </motion.div>
      )}
    </div>
  );
}