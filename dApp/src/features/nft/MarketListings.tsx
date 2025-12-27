import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Filter, ShoppingBag } from 'lucide-react';
import { formatTokenAmount, shortenAddress } from '@/lib/utils';
import { Listing } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketListingsProps {
  listings: Listing[];
  onBuy: (nftContract: string, tokenId: bigint, price: bigint) => void;
  isPending: boolean;
  isLoading: boolean;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc';

export default function MarketListings({ listings, onBuy, isPending, isLoading }: MarketListingsProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');

  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Filter
    if (search) {
        const q = search.toLowerCase();
        result = result.filter(item => 
            item.tokenId.toString().includes(q) || 
            item.seller.toLowerCase().includes(q)
        );
    }

    // Sort
    switch (sort) {
        case 'price_asc':
            result.sort((a, b) => Number(a.price) - Number(b.price));
            break;
        case 'price_desc':
            result.sort((a, b) => Number(b.price) - Number(a.price));
            break;
        case 'newest':
        default:
            // Assuming listings come in chronological, reverse them for newest first
            // Or sort by tokenId DESC as proxy for newest
            result.sort((a, b) => Number(b.tokenId) - Number(a.tokenId));
            break;
    }

    return result;
  }, [listings, search, sort]);

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Syncing ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
            <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input 
                    type="text" 
                    placeholder="Search ID or Seller..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary-500 outline-none transition-colors"
                />
            </div>
            
            <div className="flex gap-2">
                <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:border-white/20 transition-all">
                        <ArrowUpDown size={16} />
                        {sort === 'newest' ? 'Newest' : sort === 'price_asc' ? 'Price: Low to High' : 'Price: High to Low'}
                    </button>
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#15151A] border border-white/10 rounded-xl overflow-hidden shadow-2xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-20">
                        <button onClick={() => setSort('newest')} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-white/5 text-gray-400 hover:text-white">Newest Listed</button>
                        <button onClick={() => setSort('price_asc')} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-white/5 text-gray-400 hover:text-white">Price: Low to High</button>
                        <button onClick={() => setSort('price_desc')} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-white/5 text-gray-400 hover:text-white">Price: High to Low</button>
                    </div>
                </div>
            </div>
        </div>

        {/* Grid */}
        {filteredListings.length === 0 ? (
            <div className="glass-card p-20 rounded-3xl border border-white/10 text-center border-dashed">
                <ShoppingBag size={40} className="mx-auto mb-4 text-gray-700" />
                <h3 className="text-xl font-bold text-white mb-2">No listings found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {filteredListings.map((item) => (
                        <motion.div 
                            key={`${item.nftContract}-${item.tokenId}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card p-4 rounded-2xl border border-white/10 hover:border-primary-500/30 transition-all group bg-background-elevated"
                        >
                            <div className="aspect-square bg-black/40 rounded-xl mb-4 flex items-center justify-center text-4xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                                <span className="relative z-10 group-hover:scale-110 transition-transform duration-300">💠</span>
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono text-gray-400 border border-white/5">
                                    #{item.tokenId.toString()}
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <h3 className="font-bold text-white text-sm mb-1">Crikz Artifact</h3>
                                <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                    Seller: <span className="text-gray-400">{shortenAddress(item.seller)}</span>
                                </p>
                            </div>

                            <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Price</span>
                                    <span className="text-primary-500 font-black text-sm">{formatTokenAmount(item.price)} CRKZ</span>
                                </div>
                                <button 
                                    onClick={() => onBuy(item.nftContract, item.tokenId, item.price)}
                                    disabled={isPending}
                                    className="px-4 py-2 bg-white/10 text-white rounded-lg font-bold text-xs hover:bg-primary-500 hover:text-black transition-all disabled:opacity-50"
                                >
                                    {isPending ? '...' : 'Buy'}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )}
    </div>
  );
}