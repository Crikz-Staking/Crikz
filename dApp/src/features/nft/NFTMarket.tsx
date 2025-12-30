import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, PlusCircle, LayoutGrid, Info } from 'lucide-react';
import NFTMinting from './NFTMinting';
import UserCollection from './UserCollection';
import MarketListings from './MarketListings';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI, CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI } from '@/config/index';
import { Language } from '@/types';
import { toast } from 'react-hot-toast';

interface NFTMarketProps {
  dynamicColor: string;
  lang: Language;
}

export default function NFTMarket({ dynamicColor, lang }: NFTMarketProps) {
  const [view, setView] = useState<'market' | 'mint' | 'collection'>('market');
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // --- STATE FOR PURCHASE FLOW ---
  const [pendingBuy, setPendingBuy] = useState<{ listingId: bigint, price: bigint } | null>(null);

  // --- CONTRACT WRITES ---
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isApprovingConfirm, isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: buy, data: buyHash, isPending: isBuying } = useWriteContract();
  const { isLoading: isBuyingConfirm, isSuccess: isBought } = useWaitForTransactionReceipt({ hash: buyHash });

  // --- EFFECTS ---
  useEffect(() => {
    if (isApproved && pendingBuy) {
      toast.success("Token Approved! Processing purchase...");
      buy({
        address: NFT_MARKETPLACE_ADDRESS,
        abi: NFT_MARKETPLACE_ABI,
        functionName: 'buyItem',
        args: [pendingBuy.listingId]
      });
      setPendingBuy(null);
    }
  }, [isApproved]);

  useEffect(() => {
    if (isBought) {
      toast.success("Purchase Successful!");
    }
  }, [isBought]);

  // --- HANDLERS ---
  const handleBuy = async (listingId: bigint, price: bigint) => {
      if (!address || !publicClient) {
        toast.error("Wallet not connected");
        return;
      }

      try {
        const allowance = await publicClient.readContract({
          address: CRIKZ_TOKEN_ADDRESS,
          abi: CRIKZ_TOKEN_ABI,
          functionName: 'allowance',
          args: [address, NFT_MARKETPLACE_ADDRESS]
        }) as bigint;

        if (allowance < price) {
          toast('Approval required. Check wallet.', { icon: '🔐' });
          setPendingBuy({ listingId, price });
          approve({
            address: CRIKZ_TOKEN_ADDRESS,
            abi: CRIKZ_TOKEN_ABI,
            functionName: 'approve',
            args: [NFT_MARKETPLACE_ADDRESS, price * 100n]
          });
        } else {
          buy({
            address: NFT_MARKETPLACE_ADDRESS,
            abi: NFT_MARKETPLACE_ABI,
            functionName: 'buyItem',
            args: [listingId]
          });
        }
      } catch (e: any) {
        console.error(e);
        toast.error("Transaction Error: " + e.message);
      }
  };

  const tabs = [
    { id: 'market', label: 'Marketplace', icon: ShoppingBag },
    { id: 'mint', label: 'Mint Artifact', icon: PlusCircle },
    { id: 'collection', label: 'My Collection', icon: LayoutGrid },
  ];

  return (
    <div className="space-y-6">
      <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/10 w-fit mx-auto mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as any)}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
              view === tab.id ? 'bg-primary-500 text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Info Banner for New Users */}
      <div className="max-w-3xl mx-auto mb-6">
          {view === 'market' && (
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 text-xs text-gray-400">
                  <Info size={16} className="text-primary-500 shrink-0"/>
                  <span>Browse listed artifacts. Click an item to view details or make a private offer to the owner.</span>
              </div>
          )}
          {view === 'mint' && (
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 text-xs text-gray-400">
                  <Info size={16} className="text-primary-500 shrink-0"/>
                  <span>Create new NFTs. You can upload files (Images, Docs, Zips) or link to external content.</span>
              </div>
          )}
          {view === 'collection' && (
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 text-xs text-gray-400">
                  <Info size={16} className="text-primary-500 shrink-0"/>
                  <span>Manage your assets. List items for sale, create auctions, or organize them into collections.</span>
              </div>
          )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {view === 'market' && (
             <MarketListings 
               listings={[]} 
               isPending={isBuying || isBuyingConfirm || isApproving || isApprovingConfirm} 
               isLoading={false} 
               onBuy={handleBuy} 
             />
          )}
          {view === 'mint' && <NFTMinting dynamicColor={dynamicColor} />}
          {view === 'collection' && <UserCollection dynamicColor={dynamicColor} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}