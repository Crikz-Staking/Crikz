import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingBag, LayoutGrid, List as ListIcon, SlidersHorizontal, X, Gavel, Clock, Loader2 } from 'lucide-react';
import { formatTokenAmount, shortenAddress, formatTimeRemaining } from '@/lib/utils';
import { Listing } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI, CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI } from '@/config/index';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { useMarketListings, AuctionItem } from '@/hooks/web3/useMarketListings';

interface MarketListingsProps {
  listings?: Listing[]; 
  onBuy: (nftContract: string, tokenId: bigint, price: bigint) => void;
  isPending: boolean;
  isLoading: boolean;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc';
type ViewMode = 'grid' | 'list';
type MarketType = 'fixed' | 'auction';

export default function MarketListings({ onBuy, isPending: isParentPending }: MarketListingsProps) {
  const { listings, auctions, isLoading } = useMarketListings();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [marketType, setMarketType] = useState<MarketType>('fixed');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Auction Interaction State
  const [bidAmount, setBidAmount] = useState('');
  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(null);
  const [pendingBid, setPendingBid] = useState<{ amount: bigint } | null>(null);

  // --- CONTRACT WRITES ---
  // 1. Approve
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isApprovingConfirm, isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });

  // 2. Bid
  const { writeContract: placeBid, data: bidHash, isPending: isBidding } = useWriteContract();
  const { isLoading: isBiddingConfirm, isSuccess: bidSuccess } = useWaitForTransactionReceipt({ hash: bidHash });

  const isActionPending = isParentPending || isApproving || isApprovingConfirm || isBidding || isBiddingConfirm;

  // --- EFFECTS ---
  useEffect(() => {
      if(bidSuccess) {
          toast.success("Bid Placed Successfully!");
          setSelectedAuction(null);
          setBidAmount('');
      }
  }, [bidSuccess]);

  useEffect(() => {
      if (isApproved && pendingBid && selectedAuction) {
          toast.success("Approved! Placing bid...");
          placeBid({
              address: NFT_MARKETPLACE_ADDRESS,
              abi: NFT_MARKETPLACE_ABI,
              functionName: 'bid',
              args: [selectedAuction.nftContract as `0x${string}`, selectedAuction.tokenId, pendingBid.amount]
          });
          setPendingBid(null);
      }
  }, [isApproved]);

  // --- HANDLERS ---
  const handleBid = async () => {
      if(!selectedAuction || !bidAmount || !address || !publicClient) return;
      
      const amountWei = parseEther(bidAmount);

      try {
          const allowance = await publicClient.readContract({
              address: CRIKZ_TOKEN_ADDRESS,
              abi: CRIKZ_TOKEN_ABI,
              functionName: 'allowance',
              args: [address, NFT_MARKETPLACE_ADDRESS]
          }) as bigint;

          if (allowance < amountWei) {
              toast('Approval required for bidding.', { icon: '🔐' });
              setPendingBid({ amount: amountWei });
              
              approve({
                  address: CRIKZ_TOKEN_ADDRESS,
                  abi: CRIKZ_TOKEN_ABI,
                  functionName: 'approve',
                  args: [NFT_MARKETPLACE_ADDRESS, amountWei * 10n]
              });
          } else {
              placeBid({
                  address: NFT_MARKETPLACE_ADDRESS,
                  abi: NFT_MARKETPLACE_ABI,
                  functionName: 'bid',
                  args: [selectedAuction.nftContract as `0x${string}`, selectedAuction.tokenId, amountWei]
              });
          }
      } catch (e: any) {
          toast.error("Bid Failed: " + e.message);
      }
  };

  // Filter Logic
  const filteredItems = useMemo(() => {
    let result: any[] = marketType === 'fixed' ? [...listings] : [...auctions];

    if (search) {
        const q = search.toLowerCase();
        result = result.filter(item => 
            item.tokenId.toString().includes(q) || 
            item.seller.toLowerCase().includes(q)
        );
    }

    if (minPrice) {
        const minWei = Number(minPrice) * 1e18;
        result = result.filter(item => {
            const val = marketType === 'fixed' ? (item as Listing).price : (item as AuctionItem).highestBid || (item as AuctionItem).minPrice;
            return Number(val) >= minWei;
        });
    }
    if (maxPrice) {
        const maxWei = Number(maxPrice) * 1e18;
        result = result.filter(item => {
            const val = marketType === 'fixed' ? (item as Listing).price : (item as AuctionItem).highestBid || (item as AuctionItem).minPrice;
            return Number(val) <= maxWei;
        });
    }

    switch (sort) {
        case 'price_asc': 
            result.sort((a, b) => {
                const valA = marketType === 'fixed' ? (a as Listing).price : (a as AuctionItem).highestBid;
                const valB = marketType === 'fixed' ? (b as Listing).price : (b as AuctionItem).highestBid;
                return Number(valA) - Number(valB);
            });
            break;
        case 'price_desc': 
            result.sort((a, b) => {
                const valA = marketType === 'fixed' ? (a as Listing).price : (a as AuctionItem).highestBid;
                const valB = marketType === 'fixed' ? (b as Listing).price : (b as AuctionItem).highestBid;
                return Number(valB) - Number(valA);
            });
            break;
        case 'newest': 
        default: 
            result.sort((a, b) => Number(b.tokenId) - Number(a.tokenId)); 
            break;
    }
    return result;
  }, [listings, auctions, marketType, search, sort, minPrice, maxPrice]);

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Syncing blockchain data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* --- CONTROL BAR --- */}
        <div className="flex flex-col gap-4">
            {/* Market Type Tabs */}
            <div className="flex justify-center">
                <div className="bg-black/40 p-1 rounded-xl border border-white/10 flex gap-1">
                    <button onClick={() => setMarketType('fixed')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${marketType === 'fixed' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                        Fixed Price ({listings.length})
                    </button>
                    <button onClick={() => setMarketType('auction')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${marketType === 'auction' ? 'bg-primary-500 text-black' : 'text-gray-500 hover:text-white'}`}>
                        <Gavel size={14}/> Auctions ({auctions.length})
                    </button>
                </div>
            </div>

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
        {marketType === 'fixed' ? (
            filteredItems.length === 0 ? (
                <div className="glass-card p-20 rounded-3xl border border-white/10 text-center border-dashed">
                    <ShoppingBag size={40} className="mx-auto mb-4 text-gray-700" />
                    <h3 className="text-xl font-bold text-white mb-2">No listings found</h3>
                    <p className="text-gray-500 text-sm">Try adjusting your filters.</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-3"}>
                    <AnimatePresence>
                        {filteredItems.map((item) => {
                            const listingItem = item as Listing;
                            return (
                                <motion.div 
                                    key={`${listingItem.nftContract}-${listingItem.tokenId}`}
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
                                                #{listingItem.tokenId.toString()}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className={viewMode === 'list' ? 'flex-1' : 'mb-4'}>
                                        <h3 className="font-bold text-white text-sm mb-1">
                                            Crikz Artifact {viewMode === 'list' && <span className="text-gray-500 font-mono text-xs">#{listingItem.tokenId.toString()}</span>}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                            Seller: <span className="text-gray-400">{shortenAddress(listingItem.seller)}</span>
                                        </p>
                                    </div>

                                    <div className={`flex items-center ${viewMode === 'list' ? 'gap-6' : 'justify-between bg-black/20 p-2 rounded-lg border border-white/5'}`}>
                                        <div className="flex flex-col">
                                            {viewMode === 'grid' && <span className="text-[10px] text-gray-500 uppercase font-bold">Price</span>}
                                            <span className="text-primary-500 font-black text-sm">{formatTokenAmount(listingItem.price)} CRKZ</span>
                                        </div>
                                        <button 
                                            onClick={() => onBuy(listingItem.nftContract, listingItem.tokenId, listingItem.price)}
                                            disabled={isActionPending}
                                            className="px-4 py-2 bg-white/10 text-white rounded-lg font-bold text-xs hover:bg-primary-500 hover:text-black transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isActionPending ? <Loader2 size={12} className="animate-spin" /> : 'Buy'}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )
        ) : (
            // --- AUCTION VIEW ---
            filteredItems.length === 0 ? (
                <div className="text-center py-20">
                    <Gavel size={48} className="mx-auto mb-4 text-gray-700" />
                    <h3 className="text-xl font-bold text-white mb-2">No Active Auctions</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Check back later or start your own auction from the collection.
                    </p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-3"}>
                    <AnimatePresence>
                        {filteredItems.map((item) => {
                            const auctionItem = item as AuctionItem;
                            const now = Math.floor(Date.now() / 1000);
                            const timeLeft = Number(auctionItem.endTime) - now;
                            const isEnded = timeLeft <= 0;

                            return (
                                <motion.div 
                                    key={`${auctionItem.nftContract}-${auctionItem.tokenId}`}
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
                                                #{auctionItem.tokenId.toString()}
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2 text-center">
                                            <div className={`text-[10px] font-bold flex items-center justify-center gap-1 ${isEnded ? 'text-red-500' : 'text-emerald-400'}`}>
                                                <Clock size={10} /> {isEnded ? 'Ended' : formatTimeRemaining(timeLeft)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={viewMode === 'list' ? 'flex-1' : 'mb-4'}>
                                        <h3 className="font-bold text-white text-sm mb-1">
                                            Crikz Artifact {viewMode === 'list' && <span className="text-gray-500 font-mono text-xs">#{auctionItem.tokenId.toString()}</span>}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                            Seller: <span className="text-gray-400">{shortenAddress(auctionItem.seller)}</span>
                                        </p>
                                    </div>

                                    <div className={`flex items-center ${viewMode === 'list' ? 'gap-6' : 'justify-between bg-black/20 p-2 rounded-lg border border-white/5'}`}>
                                        <div className="flex flex-col">
                                            {viewMode === 'grid' && <span className="text-[10px] text-gray-500 uppercase font-bold">Current Bid</span>}
                                            <span className="text-primary-500 font-black text-sm">
                                                {formatTokenAmount(auctionItem.highestBid > 0n ? auctionItem.highestBid : auctionItem.minPrice)} CRKZ
                                            </span>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setSelectedAuction(auctionItem)}
                                            disabled={isEnded || isActionPending}
                                            className="px-4 py-2 bg-primary-500 text-black rounded-lg font-bold text-xs hover:bg-primary-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isEnded ? 'Closed' : 'Bid'}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )
        )}

        {/* Bid Modal */}
        {selectedAuction && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#12121A] relative">
                    <button onClick={() => setSelectedAuction(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Gavel className="text-primary-500"/> Place Bid
                    </h3>
                    
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-6 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Min Price</span>
                            <span className="text-gray-300 font-mono">{formatTokenAmount(selectedAuction.minPrice)} CRKZ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Highest Bid</span>
                            <span className="text-primary-500 font-bold font-mono">{formatTokenAmount(selectedAuction.highestBid)} CRKZ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Highest Bidder</span>
                            <span className="text-gray-300 font-mono text-xs">{shortenAddress(selectedAuction.highestBidder)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Your Bid (CRKZ)</label>
                            <input 
                                type="number" 
                                value={bidAmount} 
                                onChange={e => setBidAmount(e.target.value)} 
                                className="input-field text-xl font-bold text-white" 
                                placeholder={(Number(formatTokenAmount(selectedAuction.highestBid)) + 1).toString()}
                            />
                        </div>
                        <button onClick={handleBid} disabled={isActionPending} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                            {isActionPending ? <Loader2 className="animate-spin" /> : 'Place Bid'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}