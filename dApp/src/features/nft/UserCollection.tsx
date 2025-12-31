import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderPlus, Settings, Trash2, Tag, Image as ImageIcon, X, Edit3, Download, Lock, Gavel, Eye, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useRealNFTIndexer, RichNFT } from '@/hooks/web3/useRealNFTIndexer';
import { useCollectionManager, Collection } from '@/hooks/web3/useCollectionManager';
import { useMarketListings } from '@/hooks/web3/useMarketListings';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI, NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI } from '@/config/index';
import ListingModal from './ListingModal';
import { toast } from 'react-hot-toast';
import { formatTokenAmount, formatTimeRemaining } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';

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
  const [showEditModal, setShowEditModal] = useState<Collection | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<RichNFT | null>(null);
  const [showListModal, setShowListModal] = useState<RichNFT | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewUnlockable, setViewUnlockable] = useState<RichNFT | null>(null);

  // Move & Relist Logic State
  const [moveRelistStep, setMoveRelistStep] = useState<'confirm' | 'cancel' | 'move' | 'relist' | 'done'>('confirm');
  const [relistPrice, setRelistPrice] = useState<bigint>(0n);

  // Contract Logic
  const { writeContract: burn, data: burnHash } = useWriteContract();
  const { isSuccess: burnSuccess } = useWaitForTransactionReceipt({ hash: burnHash });
  
  const { writeContract: cancelListing, data: cancelHash } = useWriteContract();
  const { isSuccess: cancelSuccess } = useWaitForTransactionReceipt({ hash: cancelHash });

  const { writeContract: endAuction, data: endHash } = useWriteContract();
  const { isSuccess: endSuccess } = useWaitForTransactionReceipt({ hash: endHash });

  useEffect(() => { if(burnSuccess) { toast.success("Item Burned Forever 🔥"); refetch(); } }, [burnSuccess]);
  useEffect(() => { if(endSuccess) { toast.success("Auction Finalized"); refreshMarket(); } }, [endSuccess]);
  
  // Handle Cancel Success for Move & Relist Flow
  useEffect(() => { 
      if(cancelSuccess) { 
          toast.success("Listing Cancelled"); 
          refreshMarket(); 
          refetch();
          if (moveRelistStep === 'cancel') {
              setMoveRelistStep('move'); // Proceed to move step
          }
      } 
  }, [cancelSuccess]);

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

  // --- ACTIONS ---

  const initiateMove = (nft: RichNFT) => {
      // Check if listed
      const listing = listings.find(l => l.nftContract.toLowerCase() === nft.contract.toLowerCase() && l.tokenId === nft.id);
      
      if (listing) {
          setRelistPrice(listing.price);
          setMoveRelistStep('confirm');
      } else {
          setMoveRelistStep('move'); // Skip cancel step
      }
      setShowMoveModal(nft);
  };

  const executeMove = (targetId: string, shouldRelist: boolean) => {
      if(!showMoveModal) return;

      // 1. If listed, must cancel first
      if (moveRelistStep === 'confirm') {
          // Trigger Cancel
          setMoveRelistStep('cancel');
          const listing = listings.find(l => l.nftContract.toLowerCase() === showMoveModal.contract.toLowerCase() && l.tokenId === showMoveModal.id);
          if (listing) {
              cancelListing({
                  address: NFT_MARKETPLACE_ADDRESS,
                  abi: NFT_MARKETPLACE_ABI,
                  functionName: 'cancelListing',
                  args: [listing.listingId]
              });
          }
          return; // Wait for effect
      }

      // 2. Move (Local)
      try {
          moveItem(showMoveModal.contract, showMoveModal.id.toString(), targetId);
          toast.success("Moved to new collection");
          
          if (shouldRelist && relistPrice > 0n) {
              // 3. Open List Modal for Relist
              setShowMoveModal(null);
              setShowListModal(showMoveModal); // This will trigger the listing flow
          } else {
              setShowMoveModal(null);
              refetch();
          }
      } catch (e: any) {
          toast.error(e.message);
      }
  };

  const handleBurn = (id: bigint) => {
      if(!confirm("Are you sure? This action cannot be undone and the item will be destroyed.")) return;
      burn({
          address: CRIKZ_NFT_ADDRESS,
          abi: CRIKZ_NFT_ABI,
          functionName: 'transferFrom',
          args: [address, '0x000000000000000000000000000000000000dEaD', id]
      } as any);
  };

  const handleCancelListing = (listingId: bigint) => {
      cancelListing({
          address: NFT_MARKETPLACE_ADDRESS,
          abi: NFT_MARKETPLACE_ABI,
          functionName: 'cancelListing',
          args: [listingId]
      });
  };

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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-[#1a1a24] to-[#12121a] p-6 rounded-3xl border border-white/5 shadow-lg">
            <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <FolderPlus className="text-primary-500" /> Asset Manager
                </h2>
                <p className="text-sm text-gray-400 mt-1">Organize, trade, and manage your digital artifacts.</p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setShowImportModal(true)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-white/5">
                    <Download size={16}/> Import
                </button>
                <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-primary-500 text-black rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-glow-sm">
                    <FolderPlus size={16}/> New Collection
                </button>
            </div>
        </div>

        {/* View Switcher */}
        <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 w-fit">
            <button onClick={() => setViewMode('wallet')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'wallet' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}>In Wallet</button>
            <button onClick={() => setViewMode('listings')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'listings' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}>My Listings ({myListings.length})</button>
            <button onClick={() => setViewMode('auctions')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'auctions' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}>My Auctions ({myAuctions.length})</button>
        </div>

        {/* --- WALLET VIEW --- */}
        {viewMode === 'wallet' && (
            <>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {collections.map(col => {
                        const isActive = activeCollectionId === col.id;
                        const count = nfts.filter(n => n.collectionId === col.id).length;
                        return (
                            <button 
                                key={col.id} 
                                onClick={() => setActiveCollectionId(col.id)}
                                className={`px-6 py-4 rounded-2xl border flex flex-col items-start min-w-[160px] transition-all relative overflow-hidden group ${isActive ? 'bg-primary-500/10 border-primary-500' : 'bg-[#12121A] border-white/5 hover:border-white/20'}`}
                            >
                                {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-primary-500" />}
                                <div className="flex justify-between w-full mb-3">
                                    {col.hasSales ? <Lock size={16} className="text-amber-500"/> : <Settings size={16} className="text-gray-600 group-hover:text-white transition-colors"/>}
                                    <span className="font-mono text-xs font-bold bg-black/40 px-2 py-0.5 rounded text-gray-400">{count}</span>
                                </div>
                                <span className={`font-bold text-sm truncate w-full text-left ${isActive ? 'text-white' : 'text-gray-400'}`}>{col.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="glass-card p-8 rounded-3xl border border-white/10 min-h-[400px] bg-[#0A0A0F]">
                    <div className="flex justify-between border-b border-white/5 pb-6 mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-white mb-1">{currentCollection?.name}</h3>
                            <p className="text-sm text-gray-500">{currentCollection?.description}</p>
                        </div>
                        {!currentCollection?.isDefault && !currentCollection?.hasSales && (
                            <div className="flex gap-2">
                                <button onClick={() => setShowEditModal(currentCollection!)} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"><Edit3 size={16}/></button>
                                <button onClick={() => deleteCollection(currentCollection!.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        )}
                    </div>

                    {walletNFTs.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <FolderPlus size={32} className="opacity-30"/>
                            </div>
                            <p className="font-bold">Collection Empty</p>
                            <p className="text-xs mt-1">Mint new items or move them here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {walletNFTs.map(nft => {
                                const locked = isLocked(nft.contract, nft.id.toString());
                                const hasUnlockable = nft.metadata?.unlockable_content;
                                
                                return (
                                    <motion.div 
                                        key={nft.uniqueKey} 
                                        whileHover={{ y: -5 }}
                                        className="bg-[#15151A] rounded-2xl border border-white/5 overflow-hidden group relative hover:border-primary-500/50 transition-all shadow-lg"
                                    >
                                        <div className="aspect-square bg-black/40 relative flex items-center justify-center">
                                            {nft.image ? <img src={nft.image} className="w-full h-full object-cover" /> : <ImageIcon className="opacity-20 text-white" size={32}/>}
                                            
                                            {/* Status Badges */}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                {locked && <div className="bg-black/80 text-amber-500 text-[9px] font-bold px-2 py-1 rounded backdrop-blur-md border border-amber-500/30 flex items-center gap-1"><Tag size={8}/> TRADED</div>}
                                                {nft.status === 'listed' && <div className="bg-primary-500 text-black text-[9px] font-bold px-2 py-1 rounded shadow-lg">LISTED</div>}
                                                {nft.status === 'auction' && <div className="bg-purple-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg">AUCTION</div>}
                                            </div>
                                            
                                            {hasUnlockable && <div className="absolute bottom-2 right-2 bg-black/60 text-primary-500 p-1.5 rounded-lg border border-primary-500/30 backdrop-blur-md"><Lock size={12}/></div>}
                                            
                                            {/* Hover Actions */}
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-4 backdrop-blur-[2px]">
                                                {nft.status === 'wallet' && (
                                                    <button onClick={() => setShowListModal(nft)} className="w-full py-2.5 bg-primary-500 text-black text-xs font-bold rounded-xl hover:scale-105 transition-transform">List For Sale</button>
                                                )}
                                                <div className="flex gap-2 w-full">
                                                    <button onClick={() => initiateMove(nft)} className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">Move</button>
                                                    {hasUnlockable && <button onClick={() => setViewUnlockable(nft)} className="flex-1 py-2.5 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-xl hover:bg-emerald-500/20 flex items-center justify-center gap-1"><Eye size={12}/> Reveal</button>}
                                                </div>
                                                {!locked && (
                                                    <button onClick={() => handleBurn(nft.id)} className="w-full py-2.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                                                        <Trash2 size={12}/> Burn
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="font-bold text-white text-sm truncate mb-1">{nft.name}</div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-[10px] text-gray-500 font-mono">#{nft.id.toString()}</div>
                                                {locked && <Tooltip content="Item has been traded previously. Cannot be burned." />}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </>
        )}

        {/* --- LISTINGS VIEW --- */}
        {viewMode === 'listings' && (
            <div className="glass-card p-8 rounded-3xl border border-white/10 bg-[#0A0A0F]">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Tag className="text-primary-500"/> Active Listings</h3>
                {myListings.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No active listings.</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {myListings.map(item => (
                            <div key={item.id} className="bg-[#15151A] rounded-2xl border border-white/5 p-4 relative group hover:border-primary-500/30 transition-colors">
                                <div className="aspect-square bg-black/40 rounded-xl mb-4 flex items-center justify-center border border-white/5">
                                    <span className="text-4xl">💠</span>
                                </div>
                                <div className="font-bold text-white text-sm mb-1">Token #{item.tokenId.toString()}</div>
                                <div className="text-primary-500 font-black text-lg mb-4">{formatTokenAmount(item.price)} CRKZ</div>
                                
                                <button onClick={() => handleCancelListing(item.listingId)} className="w-full py-2.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-colors">Cancel Listing</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- AUCTIONS VIEW --- */}
        {viewMode === 'auctions' && (
            <div className="glass-card p-8 rounded-3xl border border-white/10 bg-[#0A0A0F]">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Gavel className="text-purple-500"/> Active Auctions</h3>
                {myAuctions.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No active auctions.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {myAuctions.map(auction => {
                            const now = Math.floor(Date.now() / 1000);
                            const timeLeft = Number(auction.endTime) - now;
                            const isEnded = timeLeft <= 0;

                            return (
                                <div key={auction.id} className="bg-[#15151A] rounded-2xl border border-white/5 p-5 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="font-bold text-white">Token #{auction.tokenId.toString()}</div>
                                        <div className={`text-[10px] font-bold px-2 py-1 rounded ${isEnded ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                            {isEnded ? 'Ended' : 'Active'}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 mb-6 bg-black/20 p-3 rounded-xl">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 font-bold uppercase">Highest Bid</span>
                                            <span className="text-white font-bold">{formatTokenAmount(auction.highestBid)} CRKZ</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 font-bold uppercase">Time Left</span>
                                            <span className="text-white font-mono">{isEnded ? '00:00:00' : formatTimeRemaining(timeLeft)}</span>
                                        </div>
                                    </div>

                                    {isEnded && (
                                        <button 
                                            onClick={() => handleEndAuction(auction.auctionId)}
                                            className="w-full py-3 bg-primary-500 text-black font-bold rounded-xl text-xs hover:bg-primary-400 shadow-glow-sm"
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
        
        {/* Move Modal with Relist Logic */}
        <SimpleModal isOpen={!!showMoveModal} onClose={() => setShowMoveModal(null)} title="Move Item">
            {moveRelistStep === 'confirm' ? (
                <div className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-start">
                        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                        <div className="text-xs text-amber-200">
                            <p className="font-bold mb-1">Item is currently listed!</p>
                            <p>Moving this item requires cancelling the active listing first.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowMoveModal(null)} className="flex-1 py-3 bg-white/5 rounded-xl text-sm font-bold text-gray-400 hover:text-white">Cancel</button>
                        <button onClick={() => executeMove('', false)} className="flex-1 py-3 bg-primary-500 text-black rounded-xl text-sm font-bold hover:bg-primary-400">Proceed (Cancel & Move)</button>
                    </div>
                </div>
            ) : moveRelistStep === 'cancel' ? (
                <div className="text-center py-8">
                    <RefreshCw className="animate-spin mx-auto text-primary-500 mb-4" size={32} />
                    <p className="text-sm font-bold text-white">Cancelling Listing...</p>
                    <p className="text-xs text-gray-500 mt-2">Please confirm transaction in wallet.</p>
                </div>
            ) : (
                <MoveForm 
                    collections={collections} 
                    currentId={activeCollectionId}
                    onMove={(targetId, relist) => executeMove(targetId, relist)}
                    showRelistOption={relistPrice > 0n}
                />
            )}
        </SimpleModal>

        <SimpleModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import External NFT">
            <ImportForm onImport={(c: string, i: string) => { 
                importNFT(c, i).then(() => { toast.success("Imported!"); setShowImportModal(false); refetch(); }).catch((e: any) => toast.error(e.message)); 
            }} />
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

        <SimpleModal isOpen={!!viewUnlockable} onClose={() => setViewUnlockable(null)} title="Unlockable Content">
            <div className="bg-black/40 p-6 rounded-2xl border border-white/10 font-mono text-sm text-emerald-400 break-all shadow-inner">
                {viewUnlockable?.metadata?.unlockable_content}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-2">
                <Lock size={12}/> Only visible to you as the owner.
            </p>
        </SimpleModal>

        {showListModal && (
            <ListingModal 
                tokenId={showListModal.id} 
                nftContract={showListModal.contract} 
                onClose={() => setShowListModal(null)} 
                onSuccess={() => { refetch(); refreshMarket(); }} 
            />
        )}
    </div>
  );
}

function SimpleModal({ isOpen, onClose, title, children }: any) {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{scale:0.95, opacity: 0}} animate={{scale:1, opacity: 1}} className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#12121A] relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
                <h3 className="text-xl font-black text-white mb-6">{title}</h3>
                {children}
            </motion.div>
        </div>
    );
}

// Explicitly typed props for MoveForm to fix TS7006
interface MoveFormProps {
    collections: Collection[];
    currentId: string;
    onMove: (targetId: string, relist: boolean) => void;
    showRelistOption: boolean;
}

function MoveForm({ collections, currentId, onMove, showRelistOption }: MoveFormProps) {
    const [target, setTarget] = useState(collections[0]?.id || '');
    const [relist, setRelist] = useState(false);

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Destination</label>
                <select value={target} onChange={e => setTarget(e.target.value)} className="input-field">
                    {collections.filter((c) => c.id !== currentId).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
            
            {showRelistOption && (
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <input type="checkbox" checked={relist} onChange={e => setRelist(e.target.checked)} className="w-5 h-5 accent-primary-500 rounded cursor-pointer" />
                    <div className="text-sm text-gray-300">
                        <span className="font-bold text-white block">Relist Item?</span>
                        <span className="text-xs text-gray-500">Automatically open listing modal after move.</span>
                    </div>
                </div>
            )}

            <button onClick={() => onMove(target, relist)} className="btn-primary w-full py-3 mt-2">Move Item</button>
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