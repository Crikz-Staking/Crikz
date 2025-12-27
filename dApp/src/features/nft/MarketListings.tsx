import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Filter, ShoppingBag, LayoutGrid, List as ListIcon, SlidersHorizontal, X } from 'lucide-react';
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
type ViewMode = 'grid' | 'list';

export default function MarketListings({ listings, onBuy, isPending, isLoading }: MarketListingsProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // New Filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const filteredListings = useMemo(() => {
    let result = [...listings];

    // 1. Search Filter
    if (search) {
        const q = search.toLowerCase();
        result = result.filter(item => 
            item.tokenId.toString().includes(q) || 
            item.seller.toLowerCase().includes(q)
        );
    }

    // 2. Price Range Filter
    // Note: item.price is BigInt (wei). Input is user-friendly (ether).
    if (minPrice) {
        const minWei = Number(minPrice) * 1e18;
        result = result.filter(item => Number(item.price) >= minWei);
    }
    if (maxPrice) {
        const maxWei = Number(maxPrice) * 1e18;
        result = result.filter(item => Number(item.price) <= maxWei);
    }

    // 3. Sort
    switch (sort) {
        case 'price_asc':
            result.sort((a, b) => Number(a.price) - Number(b.price));
            break;
        case 'price_desc':
            result.sort((a, b) => Number(b.price) - Number(a.price));
            break;
        case 'newest':
        default:
            // Assuming higher Token ID = Newest for this simplified model
            result.sort((a, b) => Number(b.tokenId) - Number(a.tokenId));
            break;
    }

    return result;
  }, [listings, search, sort, minPrice, maxPrice]);

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
        {/* --- CONTROL BAR --- */}
        <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input 
                        type="text" 
                        placeholder="Search ID or Seller Address..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary-500 outline-none transition-colors"
                    />
                </div>
                
                {/* Right Actions */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-bold transition-all ${showFilters ? 'bg-primary-500 text-black border-primary-500' : 'bg-black/40 border-white/10 text-gray-300 hover:text-white'}`}
                    >
                        <SlidersHorizontal size={16} /> Filters
                    </button>

                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><LayoutGrid size={18}/></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><ListIcon size={18}/></button>
                    </div>
                </div>
            </div>

            {/* --- EXPANDABLE FILTER PANEL --- */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[#12121A] border border-white/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Min Price (CRKZ)</label>
                                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="input-field py-2 text-sm" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Max Price (CRKZ)</label>
                                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="input-field py-2 text-sm" placeholder="Any" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Sort Order</label>
                                <select 
                                    value={sort} 
                                    onChange={(e) => setSort(e.target.value as SortOption)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-primary-500 outline-none transition-colors"
                                >
                                    <option value="newest">Newest Listed</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* --- LISTING GRID / LIST --- */}
        {filteredListings.length === 0 ? (
            <div className="glass-card p-20 rounded-3xl border border-white/10 text-center border-dashed">
                <ShoppingBag size={40} className="mx-auto mb-4 text-gray-700" />
                <h3 className="text-xl font-bold text-white mb-2">No listings found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters.</p>
                {(minPrice || maxPrice || search) && (
                    <button onClick={() => { setMinPrice(''); setMaxPrice(''); setSearch(''); }} className="mt-4 text-primary-500 text-xs font-bold hover:underline">
                        Clear all filters
                    </button>
                )}
            </div>
        ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-3"}>
                <AnimatePresence>
                    {filteredListings.map((item) => (
                        <motion.div 
                            key={`${item.nftContract}-${item.tokenId}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            layout
                            className={`glass-card rounded-2xl border border-white/10 hover:border-primary-500/30 transition-all group bg-background-elevated ${viewMode === 'list' ? 'flex flex-row items-center p-4 gap-4' : 'p-4'}`}
                        >
                            <div className={`bg-black/40 rounded-xl flex items-center justify-center relative overflow-hidden ${viewMode === 'list' ? 'w-16 h-16 text-xl' : 'aspect-square mb-4 text-4xl'}`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                                <span className="relative z-10 group-hover:scale-110 transition-transform duration-300">💠</span>
                                {viewMode === 'grid' && (
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono text-gray-400 border border-white/5">
                                        #{item.tokenId.toString()}
                                    </div>
                                )}
                            </div>
                            
                            <div className={viewMode === 'list' ? 'flex-1' : 'mb-4'}>
                                <h3 className="font-bold text-white text-sm mb-1">
                                    Crikz Artifact {viewMode === 'list' && <span className="text-gray-500 font-mono text-xs">#{item.tokenId.toString()}</span>}
                                </h3>
                                <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                    Seller: <span className="text-gray-400">{shortenAddress(item.seller)}</span>
                                </p>
                            </div>

                            <div className={`flex items-center ${viewMode === 'list' ? 'gap-6' : 'justify-between bg-black/20 p-2 rounded-lg border border-white/5'}`}>
                                <div className="flex flex-col">
                                    {viewMode === 'grid' && <span className="text-[10px] text-gray-500 uppercase font-bold">Price</span>}
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