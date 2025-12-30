import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderPlus, Settings, Trash2, Tag, Image as ImageIcon, X, Edit3, Download, Lock, Gavel, Clock, Eye } from 'lucide-react';
import { useRealNFTIndexer, RichNFT } from '@/hooks/web3/useRealNFTIndexer';
import { useCollectionManager } from '@/hooks/web3/useCollectionManager';
import { useMarketListings } from '@/hooks/web3/useMarketListings';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI, NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI } from '@/config/index';
import ListingModal from './ListingModal';
import { toast } from 'react-hot-toast';
import { formatTokenAmount, formatTimeRemaining } from '@/lib/utils';

export default function UserCollection({ dynamicColor }: { dynamicColor: string }) {
  const { address } = useAccount();
  const { nfts, isLoading, refetch } = useRealNFTIndexer();
  const { auctions, listings, refresh: refreshMarket } = useMarketListings();
  
  const { 
      collections, createCollection, editCollection, 
      deleteCollection, moveItem, importNFT, isLocked 
  } = useCollectionManager();

  const [activeCollectionId, setActiveCollectionId] = useState('default');
  const [viewMode, setViewMode] = useState<'wallet' | 'listings' | 'auctions'>('wallet');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<any>(null);
  const [showMoveModal, setShowMoveModal] = useState<RichNFT | null>(null);
  const [showListModal, setShowListModal] = useState<RichNFT | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewUnlockable, setViewUnlockable] = useState<RichNFT | null>(null);

  // Contract Logic
  const { writeContract: burn, data: burnHash } = useWriteContract();
  const { isSuccess: burnSuccess } = useWaitForTransactionReceipt({ hash: burnHash });
  
  const { writeContract: endAuction, data: endHash } = useWriteContract();
  const { isSuccess: endSuccess } = useWaitForTransactionReceipt({ hash: endHash });

  React.useEffect(() => { if(burnSuccess) { toast.success("Burned"); refetch(); } }, [burnSuccess]);
  React.useEffect(() => { if(endSuccess) { toast.success("Auction Finalized"); refreshMarket(); } }, [endSuccess]);

  // Filter Data
  const currentCollection = collections.find(c => c.id === activeCollectionId);
  
  const walletNFTs = useMemo(() => {
      return nfts.filter(nft => nft.collectionId === activeCollectionId);
  }, [nfts, activeCollectionId]);

  const myListings = useMemo(() => {
      if (!address) return [];
      return listings.filter(l => l.seller.toLowerCase() === address.toLowerCase());
  }, [listings, address]);

  const myAuctions = useMemo(() => {
      if (!address) return [];
      return auctions.filter(a => a.seller.toLowerCase() === address.toLowerCase());
  }, [auctions, address]);

  const handleMove = (targetId: string) => {
      if(!showMoveModal) return;
      try {
          moveItem(showMoveModal.contract, showMoveModal.id.toString(), targetId);
          toast.success("Moved successfully");
          setShowMoveModal(null);
          refetch();
      } catch (e: any) {
          toast.error(e.message);
      }
  };

  const handleBurn = (id: bigint) => {
      if(!confirm("Irreversible action. Burn item?")) return;
      burn({
          address: CRIKZ_NFT_ADDRESS,
          abi: CRIKZ_NFT_ABI,
          functionName: 'transferFrom',
          args: [address, '0x000000000000000000000000000000000000dEaD', id]
      } as any);
  };

  // Fixed: Now accepts auctionId
  const handleEndAuction = (auctionId: bigint) => {
      endAuction({
          address: NFT_MARKETPLACE_ADDRESS,
          abi: NFT_MARKETPLACE_ABI,
          functionName: 'endAuction',
          args: [auctionId]
      });
  };

  return (
    <div className="space-y-8 relative min-h-[600px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
            <div>
                <h2 className="text-2xl font-black text-white">Asset Manager</h2>
                <p className="text-sm text-gray-400">Manage your wallet items and active listings.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <Download size={16}/> Import External
                </button>
                <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-primary-500 text-black rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-glow-sm">
                    <FolderPlus size={16}/> New Collection
                </button>
            </div>
        </div>

        {/* View Switcher */}
        <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/10 w-fit">
            <button onClick={() => setViewMode('wallet')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'wallet' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>In Wallet</button>
            <button onClick={() => setViewMode('listings')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'listings' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>My Listings ({myListings.length})</button>
            <button onClick={() => setViewMode('auctions')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'auctions' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>My Auctions ({myAuctions.length})</button>
        </div>

        {/* --- WALLET VIEW --- */}
        {viewMode === 'wallet' && (
            <>
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
                                    {col.hasSales ? <Lock size={14} className="text-amber-500"/> : <Settings size={14} className="text-gray-600"/>}
                                    <span className="font-mono text-xs text-gray-500">{count}</span>
                                </div>
                                <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>{col.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="glass-card p-6 rounded-3xl border border-white/10 min-h-[400px] bg-background-elevated">
                    <div className="flex justify-between border-b border-white/5 pb-4 mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">{currentCollection?.name}</h3>
                            <p className="text-xs text-gray-500">{currentCollection?.description}</p>
                        </div>
                        {!currentCollection?.isDefault && !currentCollection?.hasSales && (
                            <div className="flex gap-2">
                                <button onClick={() => setShowEditModal(currentCollection!)} className="p-2 bg-white/5 rounded hover:bg-white/10"><Edit3 size={14}/></button>
                                <button onClick={() => deleteCollection(currentCollection!.id)} className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20"><Trash2 size={14}/></button>
                            </div>
                        )}
                    </div>

                    {walletNFTs.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                            <FolderPlus size={48} className="opacity-20 mb-4"/>
                            <p>Collection Empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {walletNFTs.map(nft => {
                                const locked = isLocked(nft.contract, nft.id.toString());
                                const hasUnlockable = nft.metadata?.unlockable_content;
                                
                                return (
                                    <div key={nft.uniqueKey} className="bg-[#0A0A0F] rounded-2xl border border-white/5 overflow-hidden group relative hover:border-primary-500/50 transition-all">
                                        <div className="aspect-square bg-white/5 relative">
                                            {nft.image ? <img src={nft.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="opacity-20"/></div>}
                                            {locked && <div className="absolute top-2 right-2 bg-black/60 text-amber-500 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><Tag size={10}/> TRADED</div>}
                                            {nft.status === 'listed' && <div className="absolute top-2 left-2 bg-primary-500 text-black text-[10px] font-bold px-2 py-1 rounded">LISTED</div>}
                                            {nft.status === 'auction' && <div className="absolute top-2 left-2 bg-purple-500 text-white text-[9px] font-bold px-2 py-1 rounded">AUCTION</div>}
                                            {hasUnlockable && <div className="absolute bottom-2 right-2 bg-black/60 text-primary-500 p-1 rounded border border-primary-500/30"><Lock size={12}/></div>}
                                            
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-2">
                                                {nft.status === 'wallet' && (
                                                    <button onClick={() => setShowListModal(nft)} className="w-full py-2 bg-primary-500 text-black text-xs font-bold rounded">List / Auction</button>
                                                )}
                                                <div className="flex gap-2 w-full">
                                                    <button onClick={() => setShowMoveModal(nft)} disabled={locked} className={`flex-1 py-2 text-xs font-bold rounded ${locked ? 'bg-white/5 text-gray-600' : 'bg-white/10 text-white hover:bg-white/20'}`}>Move</button>
                                                    {hasUnlockable && <button onClick={() => setViewUnlockable(nft)} className="flex-1 py-2 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded hover:bg-emerald-500/20 flex items-center justify-center gap-1"><Eye size={12}/> Reveal</button>}
                                                </div>
                                                {!nft.contract.toLowerCase().includes('crikz') && <div className="text-[9px] text-gray-500">External</div>}
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
            </>
        )}

        {/* --- LISTINGS VIEW --- */}
        {viewMode === 'listings' && (
            <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
                <h3 className="text-xl font-bold text-white mb-6">Active Fixed Price Listings</h3>
                {myListings.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No active listings.</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {myListings.map(item => (
                            <div key={item.id} className="bg-[#0A0A0F] rounded-2xl border border-white/5 p-4">
                                <div className="aspect-square bg-white/5 rounded-xl mb-3 flex items-center justify-center">
                                    <span className="text-4xl">💠</span>
                                </div>
                                <div className="font-bold text-white text-sm">Token #{item.tokenId.toString()}</div>
                                <div className="text-primary-500 font-bold text-xs mb-3">{formatTokenAmount(item.price)} CRKZ</div>
                                <div className="text-[10px] text-gray-500 text-center">Listed on Market</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- AUCTIONS VIEW --- */}
        {viewMode === 'auctions' && (
            <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
                <h3 className="text-xl font-bold text-white mb-6">My Active Auctions</h3>
                {myAuctions.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No active auctions.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {myAuctions.map(auction => {
                            const now = Math.floor(Date.now() / 1000);
                            const timeLeft = Number(auction.endTime) - now;
                            const isEnded = timeLeft <= 0;

                            return (
                                <div key={auction.id} className="bg-[#0A0A0F] rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="font-bold text-white">Token #{auction.tokenId.toString()}</div>
                                        <div className={`text-[10px] font-bold px-2 py-1 rounded ${isEnded ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                            {isEnded ? 'Ended' : 'Active'}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Highest Bid</span>
                                            <span className="text-white font-bold">{formatTokenAmount(auction.highestBid)} CRKZ</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Time Left</span>
                                            <span className="text-white font-mono">{isEnded ? '00:00:00' : formatTimeRemaining(timeLeft)}</span>
                                        </div>
                                    </div>

                                    {isEnded && (
                                        <button 
                                            onClick={() => handleEndAuction(auction.auctionId)} // Fixed: Passing auctionId
                                            className="w-full py-2 bg-primary-500 text-black font-bold rounded-lg text-xs hover:bg-primary-400"
                                        >
                                            Finalize & Claim
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

        {/* --- MODALS --- */}
        
        <SimpleModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import External NFT">
            <ImportForm onImport={(c: string, i: string) => { 
                importNFT(c, i).then(() => { toast.success("Imported!"); setShowImportModal(false); refetch(); }).catch((e: any) => toast.error(e.message)); 
            }} />
        </SimpleModal>

        <SimpleModal isOpen={!!showMoveModal} onClose={() => setShowMoveModal(null)} title="Move to Collection">
            <div className="space-y-2">
                {collections.map(c => (
                    <button key={c.id} onClick={() => handleMove(c.id)} disabled={c.id === activeCollectionId} className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                        {c.name}
                    </button>
                ))}
            </div>
        </SimpleModal>

        <SimpleModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Collection">
            <Form onSubmit={(n, d) => { createCollection(n, d); setShowCreateModal(false); toast.success("Created"); }} btn="Create"/>
        </SimpleModal>

        <SimpleModal isOpen={!!showEditModal} onClose={() => setShowEditModal(null)} title="Edit Collection">
            <Form 
                initName={showEditModal?.name} initDesc={showEditModal?.description}
                onSubmit={(n, d) => { editCollection(showEditModal!.id, n, d); setShowEditModal(null); toast.success("Updated"); }} 
                btn="Save"
            />
        </SimpleModal>

        {/* Unlockable Content Modal */}
        <SimpleModal isOpen={!!viewUnlockable} onClose={() => setViewUnlockable(null)} title="Unlockable Content">
            <div className="bg-black/40 p-4 rounded-xl border border-white/10 font-mono text-sm text-emerald-400 break-all">
                {viewUnlockable?.metadata?.unlockable_content}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
                This content is only visible to you as the owner of this artifact.
            </p>
        </SimpleModal>

        {/* Fixed: Passing nftContract to ListingModal */}
        {showListModal && (
            <ListingModal 
                tokenId={showListModal.id} 
                nftContract={showListModal.contract} // New Prop
                onClose={() => setShowListModal(null)} 
                onSuccess={() => { refetch(); refreshMarket(); }} 
            />
        )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function SimpleModal({ isOpen, onClose, title, children }: any) {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#12121A] relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
                {children}
            </motion.div>
        </div>
    );
}

function ImportForm({ onImport }: { onImport: (c: string, id: string) => void }) {
    const [contract, setContract] = useState('');
    const [id, setId] = useState('');
    return (
        <div className="space-y-4">
            <input value={contract} onChange={e=>setContract(e.target.value)} placeholder="Contract Address (0x...)" className="input-field font-mono text-xs"/>
            <input value={id} onChange={e=>setId(e.target.value)} placeholder="Token ID" type="number" className="input-field"/>
            <button onClick={() => onImport(contract, id)} disabled={!contract || !id} className="btn-primary w-full py-3">Verify & Import</button>
        </div>
    );
}

interface FormProps {
    onSubmit: (name: string, desc: string) => void;
    initName?: string;
    initDesc?: string;
    btn: string;
}

function Form({ onSubmit, initName='', initDesc='', btn }: FormProps) {
    const [name, setName] = useState(initName);
    const [desc, setDesc] = useState(initDesc);
    return (
        <div className="space-y-4">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Collection Name" className="input-field"/>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description" className="input-field h-24"/>
            <button onClick={() => onSubmit(name, desc)} disabled={!name} className="btn-primary w-full py-3">{btn}</button>
        </div>
    );
}