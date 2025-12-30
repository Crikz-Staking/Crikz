// src/features/nft/UserCollection.tsx
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderPlus, Settings, Trash2, Tag, Image as ImageIcon, X, Edit3, Download, Lock, Gavel, Clock, Eye } from 'lucide-react';
import { useRealNFTIndexer, RichNFT } from '@/hooks/web3/useRealNFTIndexer';
import { useCollectionManager } from '@/hooks/web3/useCollectionManager';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI, NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI } from '@/config/index';
import ListingModal from './ListingModal';
import { toast } from 'react-hot-toast';

export default function UserCollection({ dynamicColor }: { dynamicColor: string }) {
  const { address } = useAccount();
  const { nfts, isLoading, refetch } = useRealNFTIndexer();
  const { collections, createCollection, editCollection, deleteCollection, moveItem, importNFT } = useCollectionManager();

  const [activeCollectionId, setActiveCollectionId] = useState('default');
  const [showListModal, setShowListModal] = useState<RichNFT | null>(null);
  const [viewUnlockable, setViewUnlockable] = useState<RichNFT | null>(null);

  // Filter Data
  const currentCollection = collections.find(c => c.id === activeCollectionId);
  
  const collectionNFTs = useMemo(() => {
      return nfts.filter(nft => nft.collectionId === activeCollectionId);
  }, [nfts, activeCollectionId]);

  return (
    <div className="space-y-8 relative min-h-[600px]">
        {/* Header */}
        <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
            <div>
                <h2 className="text-2xl font-black text-white">Asset Manager</h2>
                <p className="text-sm text-gray-400">Manage your wallet items and active listings.</p>
            </div>
        </div>

        {/* Collection Tabs */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {collections.map(col => {
                const isActive = activeCollectionId === col.id;
                const count = nfts.filter(n => n.collectionId === col.id).length;
                return (
                    <button 
                        key={col.id} 
                        onClick={() => setActiveCollectionId(col.id)}
                        className={`px-6 py-4 rounded-2xl border flex flex-col items-start min-w-[150px] transition-all ${isActive ? 'bg-primary-500/10 border-primary-500' : 'bg-[#12121A] border-white/5 hover:border-white/20'}`}
                    >
                        <div className="flex justify-between w-full mb-2">
                            <Settings size={14} className="text-gray-600"/>
                            <span className="font-mono text-xs text-gray-500">{count}</span>
                        </div>
                        <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>{col.name}</span>
                    </button>
                );
            })}
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10 min-h-[400px] bg-background-elevated">
            {collectionNFTs.length === 0 ? (
                <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                    <FolderPlus size={48} className="opacity-20 mb-4"/>
                    <p>Collection Empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {collectionNFTs.map(nft => {
                        const hasUnlockable = nft.metadata?.unlockable_content;
                        
                        return (
                            <div key={nft.uniqueKey} className="bg-[#0A0A0F] rounded-2xl border border-white/5 overflow-hidden group relative hover:border-primary-500/50 transition-all">
                                <div className="aspect-square bg-white/5 relative">
                                    {nft.image ? <img src={nft.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="opacity-20"/></div>}
                                    
                                    {/* Status Badges */}
                                    {nft.status === 'listed' && <div className="absolute top-2 left-2 bg-emerald-500 text-black text-[9px] font-bold px-2 py-1 rounded">LISTED</div>}
                                    {nft.status === 'auction' && <div className="absolute top-2 left-2 bg-purple-500 text-white text-[9px] font-bold px-2 py-1 rounded">AUCTION</div>}
                                    
                                    {hasUnlockable && <div className="absolute bottom-2 right-2 bg-black/60 text-primary-500 p-1 rounded border border-primary-500/30"><Lock size={12}/></div>}
                                    
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-2">
                                        {nft.status === 'wallet' && (
                                            <button onClick={() => setShowListModal(nft)} className="w-full py-2 bg-primary-500 text-black text-xs font-bold rounded">List Item</button>
                                        )}
                                        {hasUnlockable && <button onClick={() => setViewUnlockable(nft)} className="w-full py-2 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded flex items-center justify-center gap-1"><Eye size={12}/> Reveal</button>}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <div className="font-bold text-white text-sm truncate">{nft.name}</div>
                                    <div className="text-[10px] text-gray-500 font-mono">#{nft.id.toString()}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Unlockable Content Modal */}
        {viewUnlockable && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div initial={{scale:0.95}} animate={{scale:1}} className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#12121A] relative">
                    <button onClick={() => setViewUnlockable(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                    <h3 className="text-xl font-bold text-white mb-6">Unlockable Content</h3>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/10 font-mono text-sm text-emerald-400 break-all">
                        {viewUnlockable.metadata?.unlockable_content}
                    </div>
                </motion.div>
            </div>
        )}

        {showListModal && <ListingModal tokenId={showListModal.id} onClose={() => setShowListModal(null)} onSuccess={() => refetch()} />}
    </div>
  );
}