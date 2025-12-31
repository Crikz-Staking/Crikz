import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, LayoutGrid, List as ListIcon, Gavel, Tag, Loader2, Eye, ChevronLeft, ChevronRight, Layers, RefreshCw } from 'lucide-react';
import { formatTokenAmount, shortenAddress } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketListings, AuctionItem, FixedItem } from '@/hooks/web3/useMarketListings';
import { usePublicClient } from 'wagmi';
import { CRIKZ_NFT_ABI } from '@/config/index';
import NFTDetailModal from './NFTDetailModal';
import Tooltip from '@/components/ui/Tooltip';

interface MarketListingsProps {
  onBuy: (listingId: bigint, price: bigint) => void;
  isPending: boolean;
  isLoading: boolean;
  listings: any[];
}

export default function MarketListings({ onBuy, isPending }: MarketListingsProps) {
  const { items, isLoading, refresh } = useMarketListings();
  const publicClient = usePublicClient();
  
  const [marketType, setMarketType] = useState<'all' | 'fixed' | 'auction'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Metadata Cache
  const [metadataCache, setMetadataCache] = useState<Record<string, any>>({});
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 9 : 27;

  // Timer Logic Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPreviewOpenRef = useRef(false);

  // --- FILTERING & SORTING ---
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
          // Newest (by ID usually implies newer mint, or reverse array for listing time)
          result.sort((a, b) => Number(b.tokenId - a.tokenId));
      }
      return result;
  }, [items, marketType, search, sort]);

  const paginatedItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // --- METADATA FETCHING ---
  useEffect(() => {
    const fetchMetadata = async () => {
        if (!publicClient || paginatedItems.length === 0) return;
        
        const missingMeta = paginatedItems.filter(i => !metadataCache[i.id]);
        if (missingMeta.length === 0) return;

        setLoadingMeta(true);
        const newMeta: Record<string, any> = {};

        await Promise.all(missingMeta.map(async (item) => {
            try {
                const uri = await publicClient.readContract({
                    address: item.nftContract as `0x${string}`,
                    abi: CRIKZ_NFT_ABI,
                    functionName: 'tokenURI',
                    args: [item.tokenId]
                }) as string;

                const httpUrl = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                const res = await fetch(httpUrl);
                const json = await res.json();
                
                // Normalize Image
                if (json.image && json.image.startsWith('ipfs://')) {
                    json.image = json.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                }
                newMeta[item.id] = json;
            } catch (e) {
                newMeta[item.id] = { name: `Item #${item.tokenId}`, description: 'Metadata unavailable' };
            }
        }));

        setMetadataCache(prev => ({ ...prev, ...newMeta }));
        setLoadingMeta(false);
    };

    fetchMetadata();
  }, [paginatedItems, publicClient]);

  // --- AUTO REFRESH LOGIC ---
  const startTimer = (duration: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
          if (!isPreviewOpenRef.current) {
              refresh();
          }
      }, duration);
  };

  useEffect(() => {
      // Initial Timer: 27 seconds
      startTimer(27000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Handle Preview State Changes
  useEffect(() => {
      isPreviewOpenRef.current = !!selectedItem;
      
      if (!selectedItem) {
          // Preview closed: Reset to 18s, then back to 27s loop
          if (timerRef.current) clearInterval(timerRef.current);
          
          timerRef.current = setTimeout(() => {
              refresh();
              startTimer(27000); // Resume normal 27s cycle
          }, 18000);
      } else {
          // Preview Open: Stop timer
          if (timerRef.current) clearInterval(timerRef.current);
      }
  }, [selectedItem]);


  if (isLoading && items.length === 0) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" size={40}/></div>;

  return (
    <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between bg-gradient-to-r from-[#1a1a24] to-[#12121a] p-4 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex gap-2 overflow-x-auto items-center">
                {['all', 'fixed', 'auction'].map(t => (
                    <button 
                        key={t} 
                        onClick={() => setMarketType(t as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${marketType === t ? 'bg-primary-500 text-black shadow-glow-sm' : 'bg-black/40 text-gray-500 hover:text-white'}`}
                    >
                        {t}
                    </button>
                ))}
                <Tooltip content="Filter items by sale type. Fixed price items are instant buy, Auctions require bidding." />
            </div>

            <div className="flex gap-2 flex-1 justify-end items-center">
                <div className="relative w-full md:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input 
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search ID or Seller..." 
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-primary-500 outline-none transition-colors"
                    />
                </div>
                <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                    <button onClick={() => { setViewMode('grid'); setPage(1); }} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500'}`} title="Grid View (9 items)"><LayoutGrid size={14}/></button>
                    <button onClick={() => { setViewMode('list'); setPage(1); }} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500'}`} title="List View (27 items)"><ListIcon size={14}/></button>
                </div>
                <button onClick={() => refresh()} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors" title="Force Refresh">
                    <RefreshCw size={14} />
                </button>
            </div>
        </div>

        {/* Grid/List */}
        {paginatedItems.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                <p>No items found matching your criteria.</p>
            </div>
        ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}>
                <AnimatePresence mode="popLayout">
                    {paginatedItems.map((item) => {
                        const meta = metadataCache[item.id] || {};
                        const isAuction = item.type === 'auction';
                        const price = isAuction ? (item as AuctionItem).highestBid || (item as AuctionItem).minPrice : (item as FixedItem).price;

                        return (
                            <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => setSelectedItem({ ...item, metadata: meta })}
                                className={`glass-card rounded-2xl border border-white/10 hover:border-primary-500/50 transition-all group bg-[#12121A] cursor-pointer overflow-hidden relative shadow-lg hover:shadow-primary-500/10 ${viewMode === 'list' ? 'flex flex-row items-center p-3 gap-4 h-24' : 'p-4 flex flex-col'}`}
                            >
                                {/* Image Area */}
                                <div className={`bg-black/40 rounded-xl flex items-center justify-center relative overflow-hidden border border-white/5 ${viewMode === 'list' ? 'w-20 h-full shrink-0' : 'aspect-square mb-4 w-full'}`}>
                                    {meta.image ? (
                                        <img src={meta.image} alt={meta.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <span className="text-4xl group-hover:scale-110 transition-transform">💠</span>
                                    )}
                                    
                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 backdrop-blur-md ${isAuction ? 'bg-purple-500/80 text-white' : 'bg-emerald-500/80 text-black'}`}>
                                            {isAuction ? <Gavel size={8}/> : <Tag size={8}/>}
                                            {isAuction ? 'Auction' : 'Buy Now'}
                                        </div>
                                    </div>
                                    
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <div className="bg-white text-black px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                            <Eye size={14}/> View Details
                                        </div>
                                    </div>
                                </div>

                                {/* Info Area */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-black text-white text-sm truncate pr-2 group-hover:text-primary-500 transition-colors">
                                                {meta.name || `Artifact #${item.tokenId}`}
                                            </h3>
                                            <Tooltip content="Verified Collection" />
                                        </div>
                                        <p className="text-[10px] text-gray-500 truncate mb-2">
                                            By <span className="text-gray-300 font-mono">{shortenAddress(item.seller)}</span>
                                        </p>
                                        
                                        {/* Attributes Preview (Grid Only) */}
                                        {viewMode === 'grid' && meta.attributes && (
                                            <div className="flex gap-1 mb-3 overflow-hidden">
                                                {meta.attributes.slice(0, 2).map((attr: any, i: number) => (
                                                    <span key={i} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 border border-white/5 truncate max-w-[80px]">
                                                        {attr.value}
                                                    </span>
                                                ))}
                                                {meta.attributes.length > 2 && <span className="text-[9px] text-gray-600">+{meta.attributes.length - 2}</span>}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-between items-end mt-auto">
                                        <div>
                                            <div className="text-[9px] text-gray-500 uppercase font-bold">{isAuction ? 'Current Bid' : 'Price'}</div>
                                            <div className="text-lg font-black text-white flex items-baseline gap-1">
                                                {formatTokenAmount(price)} <span className="text-[10px] text-primary-500 font-bold">CRKZ</span>
                                            </div>
                                        </div>
                                        
                                        {!isAuction && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onBuy((item as FixedItem).listingId, (item as FixedItem).price); }}
                                                disabled={isPending}
                                                className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-black rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-glow-sm hover:scale-105 active:scale-95"
                                            >
                                                {isPending ? <Loader2 size={12} className="animate-spin"/> : 'Purchase'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 bg-black/20 p-2 rounded-2xl border border-white/5 w-fit mx-auto">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronLeft size={16}/></button>
                <span className="text-xs font-bold text-gray-400 font-mono">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronRight size={16}/></button>
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