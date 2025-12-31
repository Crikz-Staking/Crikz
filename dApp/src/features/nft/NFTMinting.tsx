import React, { useState, useRef, useEffect } from 'react';
import { 
    Upload, Sparkles, Check, Lock, Info, Image as ImageIcon, 
    Link as LinkIcon, FileText, Package, Trash2, Video, Music, 
    Box, Layers, Settings, ShieldCheck, Cpu, Zap, XCircle, AlertCircle,
    Plus, Grid, List, Copy, CheckSquare, Square, ArrowRight, RefreshCw,
    Database, Globe, Smartphone
} from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { toast } from 'react-hot-toast';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { useCollectionManager } from '@/hooks/web3/useCollectionManager';
import Tooltip from '@/components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
interface BatchItem {
    id: string;
    file: File | null;
    cover: File | null;
    preview: string;
    name: string;
    description: string;
    attributes: { trait_type: string, value: string }[];
    selected: boolean;
}

export default function NFTMinting({ dynamicColor }: { dynamicColor: string }) {
  const { collections, createCollection, assignMintedItem } = useCollectionManager();
  
  // --- MODES ---
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [batchView, setBatchView] = useState<'grid' | 'list'>('grid');

  // --- SINGLE MINT STATE ---
  const [mintType, setMintType] = useState<'file' | 'link'>('file');
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null); 
  const [externalLink, setExternalLink] = useState('');
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'audio' | 'other'>('image');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState<{ trait_type: string, value: string }[]>([]);
  
  // --- BATCH MINT STATE ---
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchUploadRef, setBatchUploadRef] = useState<HTMLInputElement | null>(null);

  // --- SHARED CONFIG ---
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [isNewColl, setIsNewColl] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [newCollDesc, setNewCollDesc] = useState('');
  const [unlockableContent, setUnlockableContent] = useState('');
  const [hasUnlockable, setHasUnlockable] = useState(false);
  const [royalty, setRoyalty] = useState('0'); 

  // --- REFS ---
  const mainInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // --- VALIDATION ---
  const isNameValid = mode === 'single' ? name.trim().length > 0 : batchItems.every(i => i.name.trim().length > 0);
  const isAssetValid = mode === 'single' ? (mintType === 'file' ? !!mainFile : !!externalLink) : batchItems.length > 0;
  const canMint = isNameValid && isAssetValid;

  // Set default collection
  useEffect(() => {
      if (collections.length > 0 && !selectedCollectionId) {
          setSelectedCollectionId(collections[0].id);
      }
  }, [collections]);

  // --- CONTRACT WRITE ---
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  // --- SUCCESS HANDLER ---
  useEffect(() => {
      if (isSuccess && receipt) {
          toast.success("Creation Successful! Welcome to the Crikz ecosystem.");
          
          if (mode === 'single') {
              setMainFile(null); setCoverFile(null); setExternalLink('');
              setMainPreview(null); setCoverPreview(null);
              setName(''); setDescription(''); setAttributes([]);
              setUnlockableContent(''); setHasUnlockable(false);
          } else {
              setBatchItems([]);
          }
      }
  }, [isSuccess, receipt]);

  // --- HANDLERS: SINGLE ---
  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const f = e.target.files[0];
          if (f.size > 100 * 1024 * 1024) {
              toast.error("File too large. Max 100MB.");
              return;
          }
          setMainFile(f);
          const url = URL.createObjectURL(f);
          setMainPreview(url);
          detectFileType(f, url);
      }
  };

  const detectFileType = (f: File, url: string) => {
      if (f.type.startsWith('image/')) {
          setFileType('image');
          setCoverFile(f);
          setCoverPreview(url);
      } else if (f.type.startsWith('video/')) setFileType('video');
      else if (f.type.startsWith('audio/')) setFileType('audio');
      else setFileType('other');
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const f = e.target.files[0];
          setCoverFile(f);
          setCoverPreview(URL.createObjectURL(f));
      }
  };

  // --- ATTRIBUTES HANDLERS ---
  const addAttribute = () => setAttributes([...attributes, { trait_type: '', value: '' }]);
  const removeAttribute = (i: number) => setAttributes(attributes.filter((_, idx) => idx !== i));
  const updateAttribute = (i: number, field: 'trait_type' | 'value', val: string) => {
      const newAttrs = [...attributes];
      newAttrs[i][field] = val;
      setAttributes(newAttrs);
  };

  // --- HANDLERS: BATCH ---
  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newItems: BatchItem[] = Array.from(e.target.files).map(f => ({
              id: Math.random().toString(36).substr(2, 9),
              file: f,
              cover: f.type.startsWith('image/') ? f : null,
              preview: URL.createObjectURL(f),
              name: f.name.split('.')[0], // Default name is filename
              description: '',
              attributes: [],
              selected: true
          }));
          setBatchItems(prev => [...prev, ...newItems]);
          toast.success(`Added ${newItems.length} items to the lab.`);
      }
  };

  const updateBatchItem = (id: string, field: keyof BatchItem, value: any) => {
      setBatchItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const applyToAll = (field: 'description' | 'attributes', value: any) => {
      setBatchItems(prev => prev.map(item => ({ ...item, [field]: value })));
      toast.success(`Applied ${field} to all items.`);
  };

  const removeBatchItem = (id: string) => {
      setBatchItems(prev => prev.filter(i => i.id !== id));
  };

  // --- MINTING LOGIC ---
  const processMint = async () => {
      if (!canMint) return;

      // 1. Collection Setup
      let finalCollectionId = selectedCollectionId;
      if (isNewColl) {
          if (!newCollName) return toast.error("Collection Name Required");
          finalCollectionId = createCollection(newCollName, newCollDesc);
          setSelectedCollectionId(finalCollectionId);
      }

      const collectionName = isNewColl ? newCollName : collections.find(c => c.id === finalCollectionId)?.name || "General";

      // 2. Processing Loop (Simulating Batch if Contract doesn't support it)
      const itemsToMint = mode === 'single' 
          ? [{ file: mainFile, cover: coverFile, name, description, attributes, type: fileType }] 
          : batchItems;

      toast.loading(`Initializing creation of ${itemsToMint.length} artifacts...`, { id: 'mint' });

      try {
          for (let i = 0; i < itemsToMint.length; i++) {
              const item = itemsToMint[i];
              
              // A. Upload Assets
              let mainUri = externalLink;
              if (mintType === 'file' || mode === 'batch') {
                  if (item.file) {
                      const cid = await uploadToIPFS(item.file);
                      mainUri = `ipfs://${cid}`;
                  }
              }

              let coverUri = mainUri;
              if (item.cover && item.cover !== item.file) {
                  const cid = await uploadToIPFS(item.cover);
                  coverUri = `ipfs://${cid}`;
              }

              // B. Metadata
              const metadata = {
                  name: item.name,
                  description: item.description,
                  image: coverUri,
                  animation_url: mainUri,
                  external_url: "https://crikz.protocol",
                  attributes: [
                      ...(item.attributes || []),
                      { trait_type: "Collection", value: collectionName },
                      { trait_type: "Type", value: mode === 'single' ? fileType : 'Batch Asset' }
                  ],
                  seller_fee_basis_points: Math.floor(Number(royalty) * 100),
                  ...(hasUnlockable ? { unlockable_content: unlockableContent } : {})
              };

              // C. Upload Metadata
              const metaBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
              const metaFile = new File([metaBlob], "metadata.json");
              const metaCid = await uploadToIPFS(metaFile);

              // D. Contract Call
              if (i === itemsToMint.length - 1) {
                  writeContract({
                      address: CRIKZ_NFT_ADDRESS as `0x${string}`,
                      abi: CRIKZ_NFT_ABI,
                      functionName: 'mint',
                      args: [`ipfs://${metaCid}`],
                      value: parseEther('0.01') 
                  });
              } else {
                  await new Promise(r => setTimeout(r, 500)); 
              }
          }
      } catch (e: any) {
          console.error(e);
          toast.error("Minting Sequence Failed");
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans text-white">
      
      {/* LEFT PANEL: CREATION LAB */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Mode Switcher */}
        <div className="flex items-center justify-between bg-[#12121A] border border-white/10 p-2 rounded-2xl">
            <div className="flex gap-2">
                <button 
                    onClick={() => setMode('single')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'single' ? 'bg-primary-500 text-black shadow-glow-sm' : 'text-gray-500 hover:text-white'}`}
                >
                    <Sparkles size={16}/> Single
                </button>
                {/* Hidden on Mobile */}
                <button 
                    onClick={() => setMode('batch')}
                    className={`hidden md:flex px-6 py-2 rounded-xl text-sm font-bold transition-all items-center gap-2 ${mode === 'batch' ? 'bg-primary-500 text-black shadow-glow-sm' : 'text-gray-500 hover:text-white'}`}
                >
                    <Layers size={16}/> Batch
                </button>
            </div>
            <div className="text-[10px] font-mono text-gray-500 px-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> LAB ONLINE
            </div>
        </div>

        {/* Mobile Warning for Batch */}
        <div className="md:hidden bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 text-xs text-gray-400">
            <Smartphone size={16} className="text-primary-500"/>
            <span>Batch minting is optimized for desktop. Switch to a larger screen for bulk operations.</span>
        </div>

        {/* MAIN WORKSPACE */}
        <div className="bg-[#0A0A0F] p-6 md:p-8 border border-white/10 relative overflow-hidden rounded-3xl shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.05),transparent_50%)] pointer-events-none" />

            {/* --- SINGLE MODE --- */}
            {mode === 'single' && (
                <div className="space-y-8 relative z-10">
                    {/* 1. ASSET */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isAssetValid ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-500'}`}>1</div>
                                Asset Source
                            </h3>
                            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                                <button onClick={() => setMintType('file')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${mintType === 'file' ? 'bg-white/20 text-white' : 'text-gray-500'}`}>File</button>
                                <button onClick={() => setMintType('link')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${mintType === 'link' ? 'bg-white/20 text-white' : 'text-gray-500'}`}>Link</button>
                            </div>
                        </div>

                        {mintType === 'file' ? (
                            <div 
                                onClick={() => mainInputRef.current?.click()} 
                                className={`group relative border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${mainFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-primary-500/50 hover:bg-white/5'}`}
                            >
                                <input type="file" ref={mainInputRef} className="hidden" onChange={handleMainFileChange} />
                                {mainFile ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                                            <Check size={32} className="text-black" />
                                        </div>
                                        <span className="font-bold text-white text-lg block">{mainFile.name}</span>
                                        <span className="text-xs text-emerald-400 font-mono mt-1">Ready for Minting</span>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:text-primary-500 group-hover:scale-110 transition-all">
                                            <Upload size={28} />
                                        </div>
                                        <span className="text-gray-300 font-bold text-sm uppercase tracking-wider group-hover:text-white">Drop Artifact Here</span>
                                        <p className="text-xs text-gray-600 mt-2">Max 100MB • JPG, PNG, MP4, GLB</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center gap-3 focus-within:border-primary-500/50 transition-colors">
                                <LinkIcon className="text-gray-500" size={20}/>
                                <input 
                                    type="text" 
                                    placeholder="https://ipfs.io/ipfs/..." 
                                    value={externalLink} 
                                    onChange={e => setExternalLink(e.target.value)}
                                    className="bg-transparent w-full text-white outline-none font-mono text-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* 2. IDENTITY */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isNameValid ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-500'}`}>2</div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Identity</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Artifact Name" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)}
                                    className={`w-full bg-black/40 border rounded-xl p-4 text-white outline-none transition-colors text-sm ${!isNameValid && name.length > 0 ? 'border-red-500/50' : 'border-white/10 focus:border-primary-500'}`}
                                />
                                {!isNameValid && name.length > 0 && <XCircle size={18} className="absolute right-4 top-4 text-red-500"/>}
                            </div>
                            <textarea 
                                placeholder="Description & Lore..." 
                                value={description} 
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-primary-500 outline-none transition-colors h-32 resize-none"
                            />
                        </div>
                    </div>

                    {/* 3. TRAITS (Re-added) */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${attributes.length > 0 ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-500'}`}>3</div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Traits</h3>
                            </div>
                            <button onClick={addAttribute} className="text-[10px] font-bold text-primary-500 hover:text-white transition-colors uppercase flex items-center gap-1">
                                <Plus size={12}/> Add Trait
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {attributes.length === 0 && (
                                <div className="text-center py-4 border border-dashed border-white/10 rounded-xl text-xs text-gray-600">
                                    No traits added. Click "+ Add Trait" to define properties.
                                </div>
                            )}
                            <AnimatePresence>
                                {attributes.map((attr, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex gap-2 items-center"
                                    >
                                        <input 
                                            placeholder="Type (e.g. Color)" 
                                            className="w-1/3 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-xs outline-none focus:border-primary-500/50" 
                                            value={attr.trait_type} 
                                            onChange={e => updateAttribute(i, 'trait_type', e.target.value)} 
                                        />
                                        <input 
                                            placeholder="Value (e.g. Gold)" 
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-xs outline-none focus:border-primary-500/50" 
                                            value={attr.value} 
                                            onChange={e => updateAttribute(i, 'value', e.target.value)} 
                                        />
                                        <button onClick={() => removeAttribute(i)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors">
                                            <Trash2 size={14}/>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}

            {/* --- BATCH MODE --- */}
            {mode === 'batch' && (
                <div className="space-y-6 relative z-10">
                    {/* Batch Header */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h3 className="text-lg font-bold text-white">Batch Processor</h3>
                            <p className="text-xs text-gray-500">Mint multiple items in one sequence.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setBatchView('grid')} className={`p-2 rounded-lg ${batchView === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Grid size={16}/></button>
                            <button onClick={() => setBatchView('list')} className={`p-2 rounded-lg ${batchView === 'list' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><List size={16}/></button>
                        </div>
                    </div>

                    {/* Batch Upload */}
                    {batchItems.length === 0 ? (
                        <div 
                            onClick={() => batchUploadRef?.click()}
                            className="border-2 border-dashed border-white/10 hover:border-primary-500/50 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer bg-black/20 transition-all group"
                        >
                            <input 
                                type="file" 
                                multiple 
                                className="hidden" 
                                ref={el => setBatchUploadRef(el)} 
                                onChange={handleBatchUpload} 
                            />
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-gray-400 group-hover:text-primary-500 group-hover:scale-110 transition-all">
                                <Layers size={40} />
                            </div>
                            <span className="text-xl font-bold text-white">Drag & Drop Multiple Files</span>
                            <p className="text-sm text-gray-500 mt-2">or click to browse</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Batch Actions */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                <button onClick={() => batchUploadRef?.click()} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap">
                                    <Plus size={14}/> Add More
                                </button>
                                <button onClick={() => applyToAll('description', description)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap">
                                    <Copy size={14}/> Apply Desc to All
                                </button>
                                <button onClick={() => setBatchItems([])} className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap ml-auto">
                                    <Trash2 size={14}/> Clear All
                                </button>
                            </div>

                            {/* Items Container */}
                            <div className={`max-h-[400px] overflow-y-auto custom-scrollbar ${batchView === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-2'}`}>
                                {batchItems.map((item, idx) => (
                                    <div key={item.id} className={`bg-black/40 border border-white/10 rounded-xl p-3 relative group ${batchView === 'list' ? 'flex gap-4 items-center' : ''}`}>
                                        <button onClick={() => removeBatchItem(item.id)} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"><XCircle size={14}/></button>
                                        
                                        <div className={`${batchView === 'list' ? 'w-16 h-16' : 'aspect-square mb-3'} bg-black/50 rounded-lg overflow-hidden flex items-center justify-center`}>
                                            <img src={item.preview} className="w-full h-full object-cover" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <input 
                                                value={item.name} 
                                                onChange={e => updateBatchItem(item.id, 'name', e.target.value)}
                                                className="bg-transparent text-sm font-bold text-white w-full outline-none mb-1 placeholder-gray-600"
                                                placeholder="Item Name"
                                            />
                                            <input 
                                                value={item.description} 
                                                onChange={e => updateBatchItem(item.id, 'description', e.target.value)}
                                                className="bg-transparent text-xs text-gray-400 w-full outline-none placeholder-gray-700"
                                                placeholder="Description..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- SHARED CONFIGURATION --- */}
            <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center text-purple-500 text-xs font-bold">4</div>
                    <label className="text-xs font-bold text-white uppercase tracking-wider">Configuration <span className="text-gray-500 normal-case">(Optional)</span></label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Collection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Collection</label>
                        {!isNewColl ? (
                            <div className="relative">
                                <select 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none appearance-none text-sm" 
                                    value={selectedCollectionId} 
                                    onChange={e => setSelectedCollectionId(e.target.value)}
                                >
                                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><Box size={14}/></div>
                            </div>
                        ) : (
                            <input type="text" placeholder="New Collection Name" value={newCollName} onChange={e => setNewCollName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none text-sm" />
                        )}
                        <button onClick={() => setIsNewColl(!isNewColl)} className="text-[10px] font-bold text-primary-500 hover:text-white transition-colors uppercase flex items-center gap-1">
                            {isNewColl ? 'Cancel' : '+ Create New Collection'}
                        </button>
                    </div>

                    {/* Royalties */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Creator Royalties</label>
                        <div className="flex items-center bg-black/40 rounded-xl border border-white/10 px-3 py-3">
                            <input 
                                type="number" min="0" max="20" step="0.1" 
                                value={royalty} onChange={e => setRoyalty(e.target.value)} 
                                className="w-full bg-transparent text-sm font-bold text-white outline-none"
                            />
                            <span className="text-xs font-bold text-gray-500">%</span>
                        </div>
                    </div>
                </div>

                {/* MYSTERY VAULT (Encrypted Content) */}
                <div className="mt-6">
                    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${hasUnlockable ? 'bg-[#1a0b2e] border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]' : 'bg-white/5 border-white/5'}`}>
                        <div 
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => setHasUnlockable(!hasUnlockable)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${hasUnlockable ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                                    <Lock size={16} />
                                </div>
                                <div>
                                    <span className={`text-sm font-bold block ${hasUnlockable ? 'text-purple-200' : 'text-gray-400'}`}>Mystery Vault</span>
                                    <span className="text-[10px] text-gray-500">Add encrypted content visible only to the owner</span>
                                </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border ${hasUnlockable ? 'bg-purple-500 border-purple-500' : 'border-gray-600'}`} />
                        </div>
                        
                        <AnimatePresence>
                            {hasUnlockable && (
                                <motion.div 
                                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} 
                                    className="px-4 pb-4"
                                >
                                    <textarea 
                                        placeholder="Enter access keys, download links, or secret messages..." 
                                        className="w-full bg-black/40 border border-purple-500/30 rounded-lg p-3 text-purple-300 focus:border-purple-500 outline-none font-mono text-xs h-24 placeholder-purple-900/50"
                                        value={unlockableContent}
                                        onChange={e => setUnlockableContent(e.target.value)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ACTION BAR */}
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                <button 
                    onClick={processMint} 
                    disabled={isPending || isConfirming || !canMint} 
                    className={`px-10 py-4 font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-3 ${
                        canMint 
                        ? 'bg-primary-500 text-black hover:bg-primary-400 hover:scale-105 active:scale-95 shadow-primary-500/20' 
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isPending ? <RefreshCw className="animate-spin" size={18}/> : <Zap size={18} fill="currentColor"/>}
                    {isPending ? 'MINTING...' : isConfirming ? 'CONFIRMING...' : 'MINT'}
                </button>
            </div>
        </div>
      </div>

      {/* RIGHT: Preview (Holographic Display) */}
      <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Box size={14}/> Output Preview
                  </h3>
                  <div className="text-[10px] font-mono text-primary-500 animate-pulse">LIVE RENDER</div>
              </div>
              
              <div className="bg-[#0A0A0F] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl group">
                  {/* Holographic Glow */}
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

                  <div className="aspect-square bg-black/40 rounded-2xl mb-6 flex items-center justify-center border border-white/5 overflow-hidden relative shadow-inner">
                      {/* Dynamic Preview Logic */}
                      {fileType === 'video' && mainPreview ? (
                          <video src={mainPreview} autoPlay loop muted className="w-full h-full object-cover" />
                      ) : fileType === 'audio' && mainPreview ? (
                          <div className="flex flex-col items-center gap-4 w-full p-4">
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center animate-pulse border border-white/10">
                                  <Music size={40} className="text-white"/>
                              </div>
                              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary-500 w-1/3 animate-[shimmer_2s_infinite]" />
                              </div>
                          </div>
                      ) : coverPreview ? (
                          <img src={coverPreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : mainPreview ? (
                          <img src={mainPreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                          <div className="flex flex-col items-center gap-3 opacity-30">
                              <Box size={64} strokeWidth={1} />
                              <span className="text-xs font-bold font-mono tracking-widest">NO_SIGNAL</span>
                          </div>
                      )}
                      
                      {hasUnlockable && (
                          <div className="absolute top-3 right-3 bg-[#1a0b2e] text-purple-400 p-2 rounded-lg border border-purple-500/30 backdrop-blur-md shadow-lg">
                              <Lock size={16} />
                          </div>
                      )}
                  </div>
                  
                  <div className="space-y-4 font-mono">
                      {/* Official System Tags */}
                      <div className="flex flex-wrap gap-2">
                          <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                              <Globe size={10}/> BSC Testnet
                          </div>
                          <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                              <ShieldCheck size={10}/> Official Protocol
                          </div>
                          <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[8px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                              Unlisted
                          </div>
                      </div>

                      <div>
                          <h3 className="text-2xl font-black text-white leading-tight line-clamp-1 uppercase tracking-tight">{name || "UNTITLED_ASSET"}</h3>
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{isNewColl ? newCollName : collections.find(c => c.id === selectedCollectionId)?.name || "GENERAL_COLLECTION"}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10">
                          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                              <div className="text-[8px] text-gray-500 uppercase font-bold mb-1">Type</div>
                              <div className="text-xs text-white font-bold">{fileType.toUpperCase()}</div>
                          </div>
                          {attributes.slice(0, 3).map((attr, i) => (
                              <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                  <div className="text-[8px] text-gray-500 uppercase font-bold mb-1">{attr.trait_type || 'PARAM'}</div>
                                  <div className="text-xs text-white font-bold truncate">{attr.value || 'VALUE'}</div>
                              </div>
                          ))}
                          {attributes.length > 3 && (
                              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-center">
                                  <span className="text-xs text-gray-500 font-bold">+{attributes.length - 3} MORE</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
              
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <Database size={16} className="text-blue-400 mb-2"/>
                      <h4 className="text-xs font-bold text-white">IPFS Storage</h4>
                      <p className="text-[10px] text-gray-500 mt-1">Decentralized & Permanent</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <ShieldCheck size={16} className="text-emerald-400 mb-2"/>
                      <h4 className="text-xs font-bold text-white">Verified Contract</h4>
                      <p className="text-[10px] text-gray-500 mt-1">Standard ERC-721</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}