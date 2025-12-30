import React, { useState, useMemo } from 'react';
import { Search, LayoutGrid, List as ListIcon, Gavel, Tag, Loader2, Eye, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { formatTokenAmount, shortenAddress } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketListings, AuctionItem, FixedItem } from '@/hooks/web3/useMarketListings';
import NFTDetailModal from './NFTDetailModal';

interface MarketListingsProps {
  onBuy: (listingId: bigint, price: bigint) => void;
  isPending: boolean;
  isLoading: boolean;
  listings: any[];
}

export default function MarketListings({ onBuy, isPending }: MarketListingsProps) {
  const { items, isLoading } = useMarketListings();
  
  const [marketType, setMarketType] = useState<'all' | 'fixed' | 'auction'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 9 : 27;

  const filteredItems = useMemo(() => {
      let result = items;
      if (marketType !== 'all') result = result.filter(i => i.type === marketType);
      if (search) {
          result = result.filter(i => 
              i.tokenId.toString().includes(search) || 
              i.seller.toLowerCase().includes(search.toLowerCase())
          );
      }
      if (sort === 'price_asc') {
          result.sort((a, b) => {
              const pA = a.type === 'fixed' ? a.price : (a as AuctionItem).highestBid || (a as AuctionItem).minPrice;
              const pB = b.type === 'fixed' ? b.price : (b as AuctionItem).highestBid || (b as AuctionItem).minPrice;
              return Number(pA - pB);
          });
      } else if (sort === 'price_desc') {
          result.sort((a, b) => {
              const pA = a.type === 'fixed' ? a.price : (a as AuctionItem).highestBid || (a as AuctionItem).minPrice;
              const pB = b.type === 'fixed' ? b.price : (b as AuctionItem).highestBid || (b as AuctionItem).minPrice;
              return Number(pB - pA);
          });
      } else {
          result.sort((a, b) => Number(b.tokenId - a.tokenId));
      }
      return result;
  }, [items, marketType, search, sort]);

  const paginatedItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" size={40}/></div>;

  return (
    <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
            <div className="flex gap-2 overflow-x-auto">
                {['all', 'fixed', 'auction'].map(t => (
                    <button 
                        key={t} 
                        onClick={() => setMarketType(t as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${marketType === t ? 'bg-primary-500 text-black' : 'bg-black/40 text-gray-500 hover:text-white'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 flex-1 justify-end">
                <div className="relative w-full md:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input 
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search ID or Seller..." 
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-primary-500 outline-none"
                    />
                </div>
                <select 
                    value={sort} onChange={e => setSort(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                </select>
                <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                    <button onClick={() => { setViewMode('grid'); setPage(1); }} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><LayoutGrid size={14}/></button>
                    <button onClick={() => { setViewMode('list'); setPage(1); }} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><ListIcon size={14}/></button>
                </div>
            </div>
        </div>

        {/* Grid/List */}
        {paginatedItems.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No items found.</div>
        ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-2"}>
                <AnimatePresence mode="popLayout">
                    {paginatedItems.map((item) => (
                        <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={() => setSelectedItem(item)}
                            className={`glass-card rounded-xl border border-white/10 hover:border-primary-500/30 transition-all group bg-background-elevated cursor-pointer ${viewMode === 'list' ? 'flex flex-row items-center p-3 gap-4' : 'p-3'}`}
                        >
                            {/* Image Placeholder */}
                            <div className={`bg-black/40 rounded-lg flex items-center justify-center relative overflow-hidden ${viewMode === 'list' ? 'w-12 h-12' : 'aspect-square mb-3'}`}>
                                <span className="text-3xl group-hover:scale-110 transition-transform">💠</span>
                                <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 ${item.type === 'auction' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {item.type === 'auction' ? <Gavel size={8}/> : <Tag size={8}/>}
                                    {item.type === 'auction' ? 'AUC' : 'FIX'}
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="text-white" size={20} />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-white text-xs truncate">#{item.tokenId.toString()}</h3>
                                    <div className="flex items-center gap-1 text-[9px] text-gray-500 bg-white/5 px-1.5 rounded">
                                        <Layers size={8}/> Attrs
                                    </div>
                                </div>
                                <p className="text-[9px] text-gray-500 truncate">Seller: {shortenAddress(item.seller)}</p>
                                
                                <div className="mt-2 flex justify-between items-end">
                                    <div>
                                        <div className="text-primary-500 font-black text-sm">
                                            {formatTokenAmount(item.type === 'fixed' ? (item as FixedItem).price : (item as AuctionItem).highestBid || (item as AuctionItem).minPrice)}
                                        </div>
                                    </div>
                                    
                                    {item.type === 'fixed' ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onBuy((item as FixedItem).listingId, (item as FixedItem).price); }}
                                            disabled={isPending}
                                            className="px-3 py-1.5 bg-white/10 hover:bg-primary-500 hover:text-black text-white rounded text-[10px] font-bold transition-all disabled:opacity-50"
                                        >
                                            {isPending ? <Loader2 size={10} className="animate-spin"/> : 'Buy'}
                                        </button>
                                    ) : (
                                        <button className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold">
                                            Bid
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronLeft size={16}/></button>
                <span className="text-xs font-bold text-gray-400">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronRight size={16}/></button>
            </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
            <NFTDetailModal 
                item={selectedItem} 
                onClose={() => setSelectedItem(null)} 
                onBuy={onBuy}
                isPending={isPending}
            />
        )}
    </div>
  );
}