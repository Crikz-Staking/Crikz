import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, Settings, Trash2, Move, Tag, MoreVertical, Flame, Image as ImageIcon, Check, X, Edit3 } from 'lucide-react';
import { useUserNFTs } from '@/hooks/web3/useUserNFTs';
import { useCollectionManager, Collection } from '@/hooks/web3/useCollectionManager';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
// FIX: Ensure this path is correct based on where you put the file in step 2
import ListingModal from './components/ListingModal';
import { toast } from 'react-hot-toast';

export default function UserCollection({ dynamicColor }: { dynamicColor: string }) {
  const { nfts, refetch: refetchNFTs } = useUserNFTs();
  const { address } = useAccount();
  const { 
      collections, itemMapping, createCollection, editCollection, 
      deleteCollection, moveItem, isItemLocked 
  } = useCollectionManager();

  const [activeCollectionId, setActiveCollectionId] = useState('default');
  const [selectedNft, setSelectedNft] = useState<any | null>(null);
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Collection | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<any | null>(null);
  const [showListModal, setShowListModal] = useState<any | null>(null);

  // Burning Logic
  const { writeContract: burn, data: burnHash } = useWriteContract();
  const { isSuccess: burnSuccess } = useWaitForTransactionReceipt({ hash: burnHash });

  if (burnSuccess) { refetchNFTs(); }

  // --- DERIVED DATA ---
  
  const currentCollection = collections.find(c => c.id === activeCollectionId);
  
  const filteredNFTs = useMemo(() => {
      return nfts.filter(nft => {
          const mappedId = itemMapping[nft.id.toString()] || 'default';
          return mappedId === activeCollectionId;
      });
  }, [nfts, itemMapping, activeCollectionId]);

  // --- HANDLERS ---

  const handleBurn = (id: bigint) => {
      if(!confirm("Are you sure? This action is irreversible.")) return;
      burn({
          address: CRIKZ_NFT_ADDRESS,
          abi: CRIKZ_NFT_ABI, // FIX: Use updated ABI from config
          functionName: 'transferFrom',
          args: [address, '0x000000000000000000000000000000000000dEaD', id]
      } as any);
  };

  const executeMove = (targetColId: string) => {
      if (!showMoveModal) return;
      const res = moveItem(showMoveModal.id.toString(), targetColId);
      if (res.success) {
          toast.success("Item moved!");
          setShowMoveModal(null);
      } else {
          toast.error(res.error || "Failed to move");
      }
  };

  const handleDeleteCollection = () => {
      if (!currentCollection || currentCollection.isDefault) return;
      if (!confirm(`Delete collection "${currentCollection.name}"? Items will move to General.`)) return;
      
      const res = deleteCollection(currentCollection.id);
      if (res.success) {
          toast.success("Collection deleted");
          setActiveCollectionId('default');
      } else {
          toast.error(res.error || "Error deleting");
      }
  };

  return (
    <div className="space-y-8 relative min-h-[600px]">
        
        {/* --- HEADER ACTIONS --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-black text-white">Asset Manager</h2>
                <p className="text-sm text-gray-400">Organize, trade, and manage your Crikz Artifacts.</p>
            </div>
            <button 
                onClick={() => setShowCreateModal(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-black rounded-xl text-sm font-bold hover:scale-105 transition-transform shadow-glow-sm"
            >
                <FolderPlus size={18}/> New Collection
            </button>
        </div>

        {/* --- COLLECTION TABS --- */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {collections.map(col => {
                const isActive = activeCollectionId === col.id;
                // Count items in this collection
                const count = nfts.filter(n => (itemMapping[n.id.toString()] || 'default') === col.id).length;

                return (
                    <button 
                        key={col.id} 
                        onClick={() => setActiveCollectionId(col.id)}
                        className={`relative group px-6 py-6 rounded-2xl border flex flex-col items-start min-w-[160px] transition-all duration-300 ${
                            isActive 
                            ? 'bg-gradient-to-br from-primary-500/20 to-black border-primary-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                            : 'bg-[#12121A] border-white/5 hover:border-white/20'
                        }`}
                    >
                        <div className="flex justify-between w-full mb-2">
                            <span className={`p-2 rounded-lg ${isActive ? 'bg-primary-500 text-black' : 'bg-white/5 text-gray-500'}`}>
                                {isActive ? <Settings size={14}/> : <FolderPlus size={14}/>}
                            </span>
                            <span className="font-mono text-xs text-gray-500">{count}</span>
                        </div>
                        <span className={`font-bold text-sm truncate w-full text-left ${isActive ? 'text-white' : 'text-gray-400'}`}>
                            {col.name}
                        </span>
                        
                        {isActive && (
                            <motion.div layoutId="activeColGlow" className="absolute inset-0 rounded-2xl border-2 border-primary-500/30 blur-sm" />
                        )}
                    </button>
                );
            })}
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <motion.div 
            layout
            className="glass-card p-6 rounded-3xl border border-white/10 min-h-[400px] bg-background-elevated relative overflow-hidden"
        >
            {/* Header of Active Collection */}
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {currentCollection?.name}
                        {currentCollection?.isDefault && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400">DEFAULT</span>}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{currentCollection?.description || "No description"}</p>
                </div>
                
                {!currentCollection?.isDefault && (
                    <div className="flex gap-2">
                        <button onClick={() => setShowEditModal(currentCollection!)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <Edit3 size={16}/>
                        </button>
                        <button onClick={handleDeleteCollection} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                )}
            </div>

            {/* Grid */}
            {filteredNFTs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
                    <ImageIcon size={48} className="opacity-20 mb-4"/>
                    <p>No artifacts in this collection.</p>
                    <button onClick={() => {}} className="text-primary-500 text-sm font-bold mt-2 hover:underline">Mint New</button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredNFTs.map((nft) => {
                        const isLocked = isItemLocked(nft.id.toString());
                        
                        return (
                            <motion.div 
                                key={nft.id.toString()}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#0A0A0F] rounded-2xl border border-white/5 overflow-hidden group relative hover:border-primary-500/50 transition-all hover:shadow-xl"
                            >
                                {/* Badge if Locked */}
                                {isLocked && (
                                    <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur text-amber-500 text-[10px] font-bold px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
                                        <Tag size={10}/> TRADED
                                    </div>
                                )}

                                {/* Image */}
                                <div className="aspect-square bg-white/5 relative">
                                    {nft.image ? (
                                        <img src={nft.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="opacity-20"/></div>
                                    )}
                                    
                                    {/* Quick Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                        <button 
                                            onClick={() => setShowListModal(nft)}
                                            className="w-full py-2 bg-primary-500 text-black text-xs font-bold rounded-lg hover:scale-105 transition-transform"
                                        >
                                            List for Sale
                                        </button>
                                        <div className="flex gap-2 w-full">
                                            <button 
                                                onClick={() => !isLocked && setShowMoveModal(nft)}
                                                disabled={isLocked}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${isLocked ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                            >
                                                Move
                                            </button>
                                            <button 
                                                onClick={() => handleBurn(nft.id)}
                                                className="flex-1 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Burn
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="p-3">
                                    <h4 className="font-bold text-white text-sm truncate">{nft.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-mono">ID: #{nft.id.toString()}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>

        {/* --- MODALS --- */}

        {/* 1. Create Collection Modal */}
        <SimpleModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Collection">
            <Form 
                onSubmit={(name: string, desc: string) => { createCollection(name, desc); setShowCreateModal(false); toast.success("Created!"); }} 
                buttonText="Create Collection"
            />
        </SimpleModal>

        {/* 2. Edit Collection Modal */}
        <SimpleModal isOpen={!!showEditModal} onClose={() => setShowEditModal(null)} title="Edit Collection">
            <Form 
                initialName={showEditModal?.name} 
                initialDesc={showEditModal?.description}
                onSubmit={(name: string, desc: string) => { if(showEditModal) editCollection(showEditModal.id, name, desc); setShowEditModal(null); toast.success("Updated!"); }} 
                buttonText="Save Changes"
            />
        </SimpleModal>

        {/* 3. Move Item Modal */}
        <SimpleModal isOpen={!!showMoveModal} onClose={() => setShowMoveModal(null)} title={`Move ${showMoveModal?.name}`}>
            <div className="space-y-2">
                <p className="text-sm text-gray-400 mb-4">Select destination collection:</p>
                {collections.map(c => (
                    <button 
                        key={c.id} 
                        onClick={() => executeMove(c.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex justify-between items-center ${
                            activeCollectionId === c.id 
                            ? 'bg-white/5 border-white/5 text-gray-500 cursor-default' 
                            : 'bg-black/40 border-white/10 hover:border-primary-500/50 text-white'
                        }`}
                        disabled={activeCollectionId === c.id}
                    >
                        <span className="font-bold text-sm">{c.name}</span>
                        {activeCollectionId === c.id && <span className="text-[10px]">Current</span>}
                    </button>
                ))}
            </div>
        </SimpleModal>

        {/* 4. List Item Modal */}
        {showListModal && (
            <ListingModal 
                tokenId={showListModal.id} 
                onClose={() => setShowListModal(null)} 
                onSuccess={() => refetchNFTs()} 
            />
        )}

    </div>
  );
}

// --- SUB-COMPONENTS ---

function SimpleModal({ isOpen, onClose, title, children }: any) {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#12121A] relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
                {children}
            </motion.div>
        </div>
    );
}

// FIX: Added type definitions for Form props
interface FormProps {
    onSubmit: (name: string, desc: string) => void;
    initialName?: string;
    initialDesc?: string;
    buttonText: string;
}

function Form({ onSubmit, initialName = '', initialDesc = '', buttonText }: FormProps) {
    const [name, setName] = useState(initialName);
    const [desc, setDesc] = useState(initialDesc);
    return (
        <div className="space-y-4">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Collection Name" className="input-field" autoFocus />
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description (Optional)" className="input-field h-24" />
            <button onClick={() => onSubmit(name, desc)} disabled={!name} className="btn-primary w-full py-3">{buttonText}</button>
        </div>
    );
}