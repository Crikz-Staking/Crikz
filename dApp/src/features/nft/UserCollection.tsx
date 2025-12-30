import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderPlus, Settings, Trash2, Tag, Image as ImageIcon, X, Edit3, Download, Lock } from 'lucide-react';
import { useRealNFTIndexer, RichNFT } from '@/hooks/web3/useRealNFTIndexer';
import { useCollectionManager, Collection } from '@/hooks/web3/useCollectionManager';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import ListingModal from './ListingModal';
import { toast } from 'react-hot-toast';

export default function UserCollection({ dynamicColor }: { dynamicColor: string }) {
  const { nfts, isLoading, refetch } = useRealNFTIndexer();
  const { address } = useAccount();
  const { 
      collections, createCollection, editCollection, 
      deleteCollection, moveItem, importNFT, isLocked 
  } = useCollectionManager();

  const [activeCollectionId, setActiveCollectionId] = useState('default');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Collection | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<RichNFT | null>(null);
  const [showListModal, setShowListModal] = useState<RichNFT | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewUnlockable, setViewUnlockable] = useState<RichNFT | null>(null);

  // Contract Logic
  const { writeContract: burn, data: burnHash } = useWriteContract();
  const { isSuccess: burnSuccess } = useWaitForTransactionReceipt({ hash: burnHash });

  React.useEffect(() => { if(burnSuccess) { toast.success("Burned"); refetch(); } }, [burnSuccess]);

  const currentCollection = collections.find(c => c.id === activeCollectionId);
  
  const filteredNFTs = useMemo(() => {
      return nfts.filter(nft => nft.collectionId === activeCollectionId);
  }, [nfts, activeCollectionId]);

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

  return (
    <div className="space-y-8 relative min-h-[600px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
            <div>
                <h2 className="text-2xl font-black text-white">Asset Manager</h2>
                <p className="text-sm text-gray-400">Inventory: {nfts.length} Items</p>
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

        {/* Tabs */}
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

        {/* Grid */}
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

            {filteredNFTs.length === 0 ? (
                <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                    <FolderPlus size={48} className="opacity-20 mb-4"/>
                    <p>Collection Empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredNFTs.map(nft => {
                        const locked = isLocked(nft.contract, nft.id.toString());
                        const hasUnlockable = nft.metadata?.unlockable_content;
                        
                        return (
                            <div key={nft.uniqueKey} className="bg-[#0A0A0F] rounded-2xl border border-white/5 overflow-hidden group relative hover:border-primary-500/50 transition-all">
                                <div className="aspect-square bg-white/5 relative">
                                    {nft.image ? <img src={nft.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="opacity-20"/></div>}
                                    {locked && <div className="absolute top-2 right-2 bg-black/60 text-amber-500 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><Tag size={10}/> TRADED</div>}
                                    {nft.isImported && <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded">EXTERNAL</div>}
                                    {hasUnlockable && <div className="absolute bottom-2 right-2 bg-black/60 text-primary-500 p-1 rounded"><Lock size={12}/></div>}
                                    
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-2">
                                        <button onClick={() => setShowListModal(nft)} className="w-full py-2 bg-primary-500 text-black text-xs font-bold rounded">List / Auction</button>
                                        <div className="flex gap-2 w-full">
                                            <button onClick={() => setShowMoveModal(nft)} disabled={locked} className={`flex-1 py-2 text-xs font-bold rounded ${locked ? 'bg-white/5 text-gray-600' : 'bg-white/10 text-white hover:bg-white/20'}`}>Move</button>
                                            {hasUnlockable && <button onClick={() => setViewUnlockable(nft)} className="flex-1 py-2 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded hover:bg-emerald-500/20">Reveal</button>}
                                        </div>
                                        {!nft.isImported && <button onClick={() => handleBurn(nft.id)} className="w-full py-2 bg-red-500/10 text-red-500 text-xs font-bold rounded hover:bg-red-500/20">Burn</button>}
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

        {showListModal && <ListingModal tokenId={showListModal.id} onClose={() => setShowListModal(null)} onSuccess={refetch} />}
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