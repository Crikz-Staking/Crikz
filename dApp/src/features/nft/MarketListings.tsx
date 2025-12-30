import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingBag, Gavel, Clock, Loader2, Terminal, RefreshCw, Tag } from 'lucide-react';
import { formatTokenAmount, shortenAddress, formatTimeRemaining } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI, CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI } from '@/config/index';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { useMarketListings, MarketItem, AuctionItem } from '@/hooks/web3/useMarketListings';

interface MarketListingsProps {
  onBuy: (nftContract: string, tokenId: bigint, price: bigint) => void;
  isPending: boolean;
  isLoading: boolean;
  listings: any[]; // Kept for compatibility but ignored in favor of hook
}

export default function MarketListings({ onBuy, isPending: isParentPending }: MarketListingsProps) {
  const { items, isLoading, debugLogs, refresh } = useMarketListings();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [displayItems, setDisplayItems] = useState<MarketItem[]>([]);
  const [timerProgress, setTimerProgress] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  
  // Auction State
  const [bidAmount, setBidAmount] = useState('');
  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(null);

  // --- CONTRACT WRITES ---
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: placeBid, data: bidHash } = useWriteContract();
  const { isSuccess: bidSuccess } = useWaitForTransactionReceipt({ hash: bidHash });

  // --- ROTATION LOGIC ---
  useEffect(() => {
      if (items.length === 0) return;

      const rotate = () => {
          // Shuffle and pick 9
          const shuffled = [...items].sort(() => 0.5 - Math.random());
          setDisplayItems(shuffled.slice(0, 9));
          setTimerProgress(0);
      };

      // Initial set
      if (displayItems.length === 0) rotate();

      const interval = setInterval(rotate, 9000);
      
      // Smooth progress bar
      const progressInterval = setInterval(() => {
          setTimerProgress(prev => Math.min(prev + (100 / 90), 100));
      }, 100);

      return () => {
          clearInterval(interval);
          clearInterval(progressInterval);
      };
  }, [items]);

  // --- BIDDING LOGIC ---
  useEffect(() => {
      if (isApproved && selectedAuction && bidAmount) {
          toast.loading("Placing Bid...");
          placeBid({
              address: NFT_MARKETPLACE_ADDRESS,
              abi: NFT_MARKETPLACE_ABI,
              functionName: 'bid',
              args: [selectedAuction.nftContract as `0x${string}`, selectedAuction.tokenId, parseEther(bidAmount)]
          });
      }
  }, [isApproved]);

  useEffect(() => {
      if (bidSuccess) {
          toast.dismiss();
          toast.success("Bid Placed!");
          setSelectedAuction(null);
          refresh();
      }
  }, [bidSuccess]);

  const handleBid = async () => {
      if (!selectedAuction || !bidAmount) return;
      const val = parseEther(bidAmount);
      
      try {
          const allowance = await publicClient.readContract({
              address: CRIKZ_TOKEN_ADDRESS,
              abi: CRIKZ_TOKEN_ABI,
              functionName: 'allowance',
              args: [address, NFT_MARKETPLACE_ADDRESS]
          }) as bigint;

          if (allowance < val) {
              toast("Approving Token...");
              approve({
                  address: CRIKZ_TOKEN_ADDRESS,
                  abi: CRIKZ_TOKEN_ABI,
                  functionName: 'approve',
                  args: [NFT_MARKETPLACE_ADDRESS, val * 10n]
              });
          } else {
              toast.loading("Placing Bid...");
              placeBid({
                  address: NFT_MARKETPLACE_ADDRESS,
                  abi: NFT_MARKETPLACE_ABI,
                  functionName: 'bid',
                  args: [selectedAuction.nftContract as `0x${string}`, selectedAuction.tokenId, val]
              });
          }
      } catch (e) { toast.error("Bid Failed"); }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="text-center py-20">
        <Loader2 size={40} className="animate-spin mx-auto text-primary-500 mb-4"/>
        <p className="text-gray-500">Scanning Blockchain...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header / Debug Toggle */}
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-primary-500 font-bold text-sm">
                <RefreshCw size={14} className="animate-spin" /> Live Market Feed
            </div>
            <button onClick={() => setShowDebug(!showDebug)} className="text-gray-600 hover:text-white"><Terminal size={16}/></button>
        </div>

        {/* Timer Bar */}
        <div className="h-1 bg-white/5 rounded-full overflow-hidden w-full">
            <motion.div className="h-full bg-primary-500" style={{ width: `${timerProgress}%` }} />
        </div>

        {/* Debug Logs */}
        {showDebug && (
            <div className="bg-black/80 p-4 rounded-xl font-mono text-[10px] text-green-400 h-32 overflow-y-auto border border-white/10">
                {debugLogs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        )}

        {/* Grid */}
        {displayItems.length === 0 ? (
            <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-3xl">
                <ShoppingBag size={40} className="mx-auto mb-4 opacity-20"/>
                <p>No active listings found in recent blocks.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {displayItems.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                            className="glass-card p-4 rounded-2xl border border-white/10 bg-background-elevated group hover:border-primary-500/30 transition-all"
                        >
                            {/* Image Placeholder */}
                            <div className="aspect-square bg-black/40 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                                <span className="text-4xl relative z-10">💠</span>
                                
                                {/* Badge */}
                                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${item.type === 'auction' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {item.type === 'auction' ? <Gavel size={10}/> : <Tag size={10}/>}
                                    {item.type === 'auction' ? 'AUCTION' : 'FIXED'}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-bold text-white text-sm">Artifact #{item.tokenId.toString()}</h3>
                                <p className="text-[10px] text-gray-500 font-mono">Seller: {shortenAddress(item.seller)}</p>
                            </div>

                            <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">
                                        {item.type === 'auction' ? 'Current Bid' : 'Price'}
                                    </div>
                                    <div className="text-primary-500 font-black text-sm">
                                        {formatTokenAmount(item.type === 'auction' ? (item.highestBid > 0n ? item.highestBid : item.minPrice) : item.price)} CRKZ
                                    </div>
                                </div>

                                {item.type === 'fixed' ? (
                                    <button 
                                        onClick={() => onBuy(item.nftContract, item.tokenId, item.price)}
                                        className="px-4 py-2 bg-white/10 hover:bg-primary-500 hover:text-black text-white rounded-lg text-xs font-bold transition-all"
                                    >
                                        Buy
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setSelectedAuction(item as AuctionItem)}
                                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500 hover:text-white text-purple-400 rounded-lg text-xs font-bold transition-all"
                                    >
                                        Bid
                                    </button>
                                )}
                            </div>
                            
                            {item.type === 'auction' && (
                                <div className="mt-2 text-center text-[10px] text-gray-500 flex items-center justify-center gap-1">
                                    <Clock size={10}/> Ends in {formatTimeRemaining(Number(item.endTime) - Math.floor(Date.now()/1000))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )}

        {/* Bid Modal */}
        {selectedAuction && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#12121A] relative">
                    <button onClick={() => setSelectedAuction(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                    <h3 className="text-xl font-bold text-white mb-6">Place Bid</h3>
                    <input 
                        type="number" 
                        value={bidAmount} 
                        onChange={e => setBidAmount(e.target.value)} 
                        className="input-field text-xl font-bold text-white mb-4" 
                        placeholder="Amount"
                    />
                    <button onClick={handleBid} className="btn-primary w-full py-3">Confirm Bid</button>
                </div>
            </div>
        )}
    </div>
  );
}