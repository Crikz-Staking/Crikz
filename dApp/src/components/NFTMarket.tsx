// src/components/NFTMarket.tsx
import React, { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, PlusCircle, Search, Filter, Grid, List, 
  ChevronDown, Upload, SlidersHorizontal, Wallet, 
  LayoutGrid, Tag, Layers
} from 'lucide-react';
import { CRIKZ_NFT_ABI, NFT_ADDRESS } from '../config'; 
import type { Language } from '../App';
import NFTCard from './NFTCard';

// --- Sub-Component: Filter Sidebar ---
const FilterSection = ({ title, isOpen, toggle, children }: any) => (
  <div className="border-b border-white/5 py-4 last:border-0">
    <button onClick={toggle} className="flex items-center justify-between w-full font-bold text-sm text-gray-300 hover:text-white transition-colors group">
      <span className="group-hover:text-primary-500 transition-colors">{title}</span>
      <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: 'auto', opacity: 1 }} 
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="pt-4 space-y-2">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface NFTMarketProps {
  dynamicColor: string;
  lang: Language;
  address: `0x${string}` | undefined;
}

export default function NFTMarket({ dynamicColor, lang, address }: NFTMarketProps) {
  const [activeTab, setActiveTab] = useState<'market' | 'mint'>('market');
  const [filterOpen, setFilterOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Minting State
  const [mintData, setMintData] = useState({
    name: '', description: '', royalty: 5, royaltyRecipient: address || ''
  });

  // --- REAL DATA FETCHING ---
  const { data: totalSupply, isLoading: isSupplyLoading } = useReadContract({
    address: NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'totalSupply',
    query: { refetchInterval: 5000 } // Poll every 5s
  });

  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleMintSubmit = () => {
    // Note: In production, upload image to IPFS -> Get URI.
    // Here we assume a placeholder URI for the demo.
    const mockURI = `ipfs://placeholder/${mintData.name}`;
    const fee = BigInt(Math.floor(mintData.royalty * 100));
    // 5% = 500 basis points

    if (!address) return; // Ensure address exists

    writeContract({
      address: NFT_ADDRESS,
      abi: CRIKZ_NFT_ABI,
      functionName: 'mintItem',
      args: [address, mockURI, mintData.royaltyRecipient as `0x${string}`, fee],
      account: address, // <--- ADD THIS: Fixes the TS2345 error by explicitly providing the account
    });
  };

  // Convert bigint supply to array of indices: [0, 1, 2, ... total-1]
  const totalItems = totalSupply ? Number(totalSupply) : 0;
  const itemIndices = Array.from({ length: totalItems }, (_, i) => i);

  const t = {
    en: { 
      market: "Artifacts", mint: "Forge", 
      emptyTitle: "The Archive is Empty", 
      emptyDesc: "No artifacts have been forged on the spiral yet. Be the first to create history.",
      createTitle: "Forge Artifact",
      uploadTitle: "Artifact Visualization",
      connectReq: "Link Your Spiral",
      connectMsg: "Connect your wallet to forge a permanent mark on the Crikz Protocol."
    },
    sq: { 
      market: "Artefakte", mint: "Krijo", 
      emptyTitle: "Arkiva është Bosh", 
      emptyDesc: "Asnjë artefakt nuk është krijuar ende. Bëhu i pari që krijon histori.",
      createTitle: "Krijo Artefakt",
      uploadTitle: "Vizualizimi i Artefaktit",
      connectReq: "Lidh Spiralen Tënde",
      connectMsg: "Lidhni portofolin tuaj për të lënë një gjurmë të përhershme në Protokollin Crikz."
    }
  }[lang];

  return (
    <div className="space-y-6">
      {/* --- Navigation --- */}
      <div className="flex items-center justify-between bg-background-elevated/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/5">
        <div className="flex gap-1">
          <button 
            onClick={() => setActiveTab('market')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'market' ? 'bg-white/10 text-white shadow-glow-sm' : 'text-gray-500 hover:text-white'}`}
          >
            <Layers size={16} /> {t.market}
          </button>
          <button 
            onClick={() => setActiveTab('mint')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'mint' ? 'bg-white/10 text-white shadow-glow-sm' : 'text-gray-500 hover:text-white'}`}
          >
            <PlusCircle size={16} /> {t.mint}
          </button>
        </div>

        {activeTab === 'market' && (
          <div className="flex items-center gap-2 pr-2">
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-2 rounded-lg transition-all ${filterOpen ? 'text-primary-500 bg-primary-500/10' : 'text-gray-500 hover:text-white'}`}
            >
              <Filter size={18} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'text-white bg-white/10' : 'text-gray-500'}`}><Grid size={16} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'text-white bg-white/10' : 'text-gray-500'}`}><List size={16} /></button>
          </div>
        )}
      </div>

      {/* --- MARKET TAB --- */}
      {activeTab === 'market' && (
        <div className="flex gap-6 items-start min-h-[500px]">
          {/* Sidebar Filter */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div 
                initial={{ width: 0, opacity: 0, marginRight: 0 }}
                animate={{ width: 260, opacity: 1, marginRight: 0 }}
                exit={{ width: 0, opacity: 0, marginRight: 0 }}
                className="hidden md:block shrink-0 overflow-hidden"
              >
                <div className="glass-card p-4 rounded-2xl border border-white/10 sticky top-24">
                  <div className="flex items-center gap-2 mb-6 text-white font-black text-sm uppercase tracking-wider">
                    <SlidersHorizontal size={14} className="text-primary-500" /> Filters
                  </div>
                  
                  <FilterSection title="Status" isOpen={true} toggle={() => {}}>
                    <div className="space-y-2">
                       <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-white">
                         <input type="checkbox" className="rounded border-white/20 bg-black/50 text-primary-500 focus:ring-0" />
                         Buy Now
                       </label>
                       <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-white">
                         <input type="checkbox" className="rounded border-white/20 bg-black/50 text-primary-500 focus:ring-0" />
                         New
                       </label>
                    </div>
                  </FilterSection>

                  <FilterSection title="Collections" isOpen={true} toggle={() => {}}>
                     <div className="text-xs text-gray-500 italic">No collections found</div>
                  </FilterSection>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid Area */}
          <div className="flex-1">
            {isSupplyLoading ? (
               <div className="flex items-center justify-center h-64">
                 <div className="w-8 h-8 border-4 border-white/10 border-t-primary-500 rounded-full animate-spin"></div>
               </div>
            ) : totalItems === 0 ? (
              // EMPTY STATE
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card flex flex-col items-center justify-center py-24 text-center rounded-3xl border border-white/10"
              >
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner-glow">
                  <ShoppingBag size={40} className="text-gray-600 opacity-50" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{t.emptyTitle}</h3>
                <p className="text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">{t.emptyDesc}</p>
                {address && (
                  <button onClick={() => setActiveTab('mint')} className="px-8 py-3 bg-primary-500 text-black font-bold rounded-xl hover:scale-105 transition-transform">
                    {t.createTitle}
                  </button>
                )}
              </motion.div>
            ) : (
              // GRID STATE
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {itemIndices.map((idx) => (
                  <NFTCard key={idx} index={idx} viewMode={viewMode} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MINT TAB --- */}
      {activeTab === 'mint' && (
        <div className="max-w-2xl mx-auto">
          {!address ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-12 rounded-3xl border border-white/10 text-center"
            >
              <Wallet size={48} className="mx-auto text-primary-500 mb-6" />
              <h2 className="text-2xl font-black text-white mb-2">{t.connectReq}</h2>
              <p className="text-gray-400 mb-8">{t.connectMsg}</p>
            </motion.div>
          ) : (
            <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="glass-card p-8 rounded-3xl border border-white/10"
            >
               <h2 className="text-2xl font-black text-white mb-6 border-b border-white/5 pb-4">{t.createTitle}</h2>

               {/* Upload Placeholder */}
               <div className="mb-6">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t.uploadTitle}</label>
                 <div className="border-2 border-dashed border-white/10 rounded-2xl h-48 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-primary-500/50 hover:bg-white/5 transition-all cursor-pointer">
                   <Upload size={32} className="mb-2" />
                   <span className="text-xs font-bold">Upload Media</span>
                 </div>
               </div>

               {/* Inputs */}
               <div className="space-y-4 mb-8">
                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Name</label>
                   <input 
                     type="text" 
                     value={mintData.name}
                     onChange={e => setMintData({...mintData, name: e.target.value})}
                     className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none" 
                     placeholder="Artifact Name"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Royalties (%)</label>
                        <input 
                            type="number" 
                            value={mintData.royalty}
                            onChange={e => setMintData({...mintData, royalty: Number(e.target.value)})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Recipient</label>
                        <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-500 text-sm truncate">
                             {address}
                        </div>
                    </div>
                 </div>
               </div>

               <button 
                 onClick={handleMintSubmit}
                 disabled={isWritePending || isConfirming || !mintData.name}
                 className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-black font-black text-lg rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
               >
                 {isWritePending ? 'Confirming...' : isConfirming ? 'Forging on Chain...' : isConfirmed ? 'Forged Successfully!' : 'Forge Artifact'}
               </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}