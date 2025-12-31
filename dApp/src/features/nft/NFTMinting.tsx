import React, { useState, useRef, useEffect } from 'react';
import { 
    Upload, Sparkles, Check, Lock, Info, Image as ImageIcon, 
    Link as LinkIcon, FileText, Package, Trash2, Video, Music, 
    Box, Layers, Settings, ShieldCheck, Cpu, Zap 
} from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { toast } from 'react-hot-toast';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { useCollectionManager } from '@/hooks/web3/useCollectionManager';
import Tooltip from '@/components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';

export default function NFTMinting({ dynamicColor }: { dynamicColor: string }) {
  const { collections, createCollection, assignMintedItem } = useCollectionManager();
  
  // Minting Mode
  const [mintType, setMintType] = useState<'file' | 'link'>('file');

  // Files
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null); 
  const [externalLink, setExternalLink] = useState('');
  
  // Previews
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'audio' | 'other'>('image');

  // Metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  
  // New Collection Logic
  const [isNewColl, setIsNewColl] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [newCollDesc, setNewCollDesc] = useState('');
  
  // Attributes & Unlockable
  const [attributes, setAttributes] = useState<{ trait_type: string, value: string }[]>([]);
  const [unlockableContent, setUnlockableContent] = useState('');
  const [hasUnlockable, setHasUnlockable] = useState(false);
  const [royalty, setRoyalty] = useState('5'); 

  const mainInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Set default collection
  useEffect(() => {
      if (collections.length > 0 && !selectedCollectionId) {
          setSelectedCollectionId(collections[0].id);
      }
  }, [collections]);

  // Contract Write
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  // Success Handler
  useEffect(() => {
      if (isSuccess && receipt) {
          toast.success("Minted Successfully!");
          
          let mintedId = null;
          for (const log of receipt.logs) {
              try {
                  const decoded = decodeEventLog({
                      abi: CRIKZ_NFT_ABI,
                      data: log.data,
                      topics: log.topics,
                  });
                  const args = decoded.args as any;
                  if (decoded.eventName === 'Transfer' && args.from === '0x0000000000000000000000000000000000000000') {
                      mintedId = args.tokenId?.toString();
                      break;
                  }
              } catch (e) {}
          }

          if (mintedId) {
              let targetColId = selectedCollectionId;
              if (isNewColl && newCollName) {
                  const existing = collections.find(c => c.name === newCollName);
                  if (existing) targetColId = existing.id;
              }
              assignMintedItem(mintedId, targetColId);
          }

          // Reset Form
          setMainFile(null); setCoverFile(null); setExternalLink('');
          setMainPreview(null); setCoverPreview(null);
          setName(''); setDescription(''); setAttributes([]);
          setUnlockableContent(''); setHasUnlockable(false);
      }
  }, [isSuccess, receipt]);

  // File Handlers
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

          if (f.type.startsWith('image/')) {
              setFileType('image');
              setCoverFile(f);
              setCoverPreview(url);
          } else if (f.type.startsWith('video/')) {
              setFileType('video');
          } else if (f.type.startsWith('audio/')) {
              setFileType('audio');
          } else {
              setFileType('other');
          }
      }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const f = e.target.files[0];
          if (!f.type.startsWith('image/')) {
              toast.error("Cover must be an image");
              return;
          }
          setCoverFile(f);
          setCoverPreview(URL.createObjectURL(f));
      }
  };

  const handleMint = async () => {
    if (!name) return toast.error("Name is required");
    if (mintType === 'file' && !mainFile) return toast.error("Main file is required");
    if (mintType === 'link' && !externalLink) return toast.error("External link is required");
    if (!coverFile && mintType === 'file' && !mainFile?.type.startsWith('image/')) {
        return toast.error("Cover image required for non-image files");
    }

    let finalCollectionId = selectedCollectionId;
    if (isNewColl) {
        if (!newCollName) return toast.error("Collection Name Required");
        finalCollectionId = createCollection(newCollName, newCollDesc);
        setSelectedCollectionId(finalCollectionId);
    }

    try {
      let mainContentUri = '';
      let coverImageUri = '';

      if (mintType === 'file' && mainFile) {
          toast.loading("Uploading main file...", { id: 'mint' });
          const cid = await uploadToIPFS(mainFile);
          mainContentUri = `ipfs://${cid}`;
      } else {
          mainContentUri = externalLink;
      }

      if (coverFile) {
          if (mintType === 'file' && mainFile === coverFile) {
              coverImageUri = mainContentUri;
          } else {
              toast.loading("Uploading cover image...", { id: 'mint' });
              const cid = await uploadToIPFS(coverFile);
              coverImageUri = `ipfs://${cid}`;
          }
      }

      const metadataObj = {
        name: name,
        description: description,
        image: coverImageUri, 
        animation_url: mainContentUri, 
        external_url: "https://crikz.protocol",
        attributes: [
            ...attributes,
            { trait_type: "Type", value: fileType.charAt(0).toUpperCase() + fileType.slice(1) },
            { trait_type: "Collection", value: isNewColl ? newCollName : collections.find(c => c.id === finalCollectionId)?.name || "General" }
        ],
        seller_fee_basis_points: Math.floor(Number(royalty) * 100),
      };

      if (hasUnlockable && unlockableContent) {
          (metadataObj as any).unlockable_content = unlockableContent;
      }

      toast.loading("Finalizing metadata...", { id: 'mint' });
      const metaBlob = new Blob([JSON.stringify(metadataObj)], { type: 'application/json' });
      const metaFile = new File([metaBlob], "metadata.json");
      const metaCid = await uploadToIPFS(metaFile);
      
      toast.loading("Confirming in Wallet...", { id: 'mint' });
      writeContract({
        address: CRIKZ_NFT_ADDRESS as `0x${string}`,
        abi: CRIKZ_NFT_ABI,
        functionName: 'mint',
        args: [`ipfs://${metaCid}`],
        value: parseEther('0.01') 
      });
      
      toast.dismiss('mint');
    } catch (e: any) {
        console.error(e);
        toast.error("Mint failed: " + (e.message || "Unknown error"), { id: 'mint' });
    }
  };

  const addAttribute = () => setAttributes([...attributes, { trait_type: '', value: '' }]);
  const removeAttribute = (i: number) => setAttributes(attributes.filter((_, idx) => idx !== i));
  const updateAttribute = (i: number, field: 'trait_type' | 'value', val: string) => {
      const newAttrs = [...attributes];
      newAttrs[i][field] = val;
      setAttributes(newAttrs);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT: Form (Technical Lab Look) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Status Bar */}
        <div className="flex items-center justify-between bg-[#12121A] border border-white/10 p-3 rounded-xl">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Ready</span>
            </div>
            <div className="text-[10px] font-mono text-gray-500">
                Protocol v2.1
            </div>
        </div>

        {/* Main Card */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 bg-[#0A0A0F] relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Cpu className="text-primary-500" /> Minting Lab
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Create and deploy digital assets to the blockchain.</p>
                </div>
                
                {/* Toggle Switch */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                    <button 
                        onClick={() => setMintType('file')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${mintType === 'file' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Upload size={12}/> File
                    </button>
                    <button 
                        onClick={() => setMintType('link')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${mintType === 'link' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                    >
                        <LinkIcon size={12}/> Link
                    </button>
                </div>
            </div>

            {/* MODULE 1: ASSET INGESTION */}
            <div className="mb-8 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded bg-primary-500/10 flex items-center justify-center text-primary-500 text-xs font-bold">1</div>
                    <label className="text-xs font-bold text-white uppercase tracking-wider">Asset Ingestion</label>
                </div>
                
                {mintType === 'file' ? (
                    <div 
                        onClick={() => mainInputRef.current?.click()} 
                        className="group relative border-2 border-dashed border-white/10 hover:border-primary-500/50 rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer bg-black/20 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <input type="file" ref={mainInputRef} className="hidden" onChange={handleMainFileChange} />
                        
                        {mainFile ? (
                            <div className="text-center relative z-10">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-500">
                                    <Check size={24} />
                                </div>
                                <span className="font-bold text-white text-sm block">{mainFile.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono uppercase bg-black/40 px-2 py-1 rounded mt-2 inline-block">
                                    {(mainFile.size / 1024 / 1024).toFixed(2)} MB • {fileType.toUpperCase()}
                                </span>
                            </div>
                        ) : (
                            <div className="text-center relative z-10">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all">
                                    <Upload size={20} />
                                </div>
                                <span className="text-gray-400 font-bold text-xs uppercase tracking-wider group-hover:text-primary-500 transition-colors">Drop Artifact Here</span>
                                <p className="text-[10px] text-gray-600 mt-1">Max 100MB (JPG, PNG, MP4, MP3, GLB)</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-4 focus-within:border-primary-500/50 transition-colors">
                        <LinkIcon size={18} className="text-gray-500"/>
                        <input 
                            type="text" 
                            placeholder="https://..." 
                            value={externalLink} 
                            onChange={e => setExternalLink(e.target.value)}
                            className="bg-transparent w-full text-sm text-white outline-none font-mono placeholder-gray-700"
                        />
                    </div>
                )}
            </div>

            {/* Cover Image (Conditional) */}
            {(!mainFile?.type.startsWith('image/') || mintType === 'link') && (
                <div className="mb-8 relative z-10 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            Cover Thumbnail <Tooltip content="Required for Audio/Video/3D files to display in marketplace." />
                        </label>
                    </div>
                    <div 
                        onClick={() => coverInputRef.current?.click()} 
                        className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                        <input type="file" ref={coverInputRef} className="hidden" onChange={handleCoverFileChange} accept="image/*" />
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white">
                            <ImageIcon size={20}/>
                        </div>
                        <div className="flex-1">
                            <span className="text-xs font-bold text-white block">{coverFile ? coverFile.name : "Upload Cover Image"}</span>
                            <span className="text-[10px] text-gray-500">{coverFile ? "Ready to upload" : "JPG, PNG, GIF supported"}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* MODULE 2: METADATA */}
            <div className="mb-8 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center text-blue-500 text-xs font-bold">2</div>
                    <label className="text-xs font-bold text-white uppercase tracking-wider">Identity Data</label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Cosmic Cube #001" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none transition-colors text-sm" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Description</label>
                        <textarea 
                            placeholder="Enter detailed description..." 
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none transition-colors text-sm h-24 resize-none" 
                            value={description} 
                            onChange={e => setDescription(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            {/* MODULE 3: CONFIGURATION */}
            <div className="mb-8 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center text-purple-500 text-xs font-bold">3</div>
                    <label className="text-xs font-bold text-white uppercase tracking-wider">Configuration</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Collection Select */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Collection</label>
                            <button onClick={() => setIsNewColl(!isNewColl)} className="text-[10px] font-bold text-primary-500 hover:text-white transition-colors uppercase">
                                {isNewColl ? 'Cancel' : '+ New'}
                            </button>
                        </div>
                        {!isNewColl ? (
                            <div className="relative">
                                <select 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none appearance-none text-sm" 
                                    value={selectedCollectionId} 
                                    onChange={e => setSelectedCollectionId(e.target.value)}
                                >
                                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <Box size={14}/>
                                </div>
                            </div>
                        ) : (
                            <input 
                                type="text" 
                                placeholder="New Collection Name" 
                                value={newCollName} 
                                onChange={e => setNewCollName(e.target.value)} 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none text-sm" 
                            />
                        )}
                    </div>
                    
                    {/* Attributes */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Traits</label>
                            <button onClick={addAttribute} className="text-[10px] font-bold text-primary-500 hover:text-white transition-colors uppercase">+ Add</button>
                        </div>
                        <div className="bg-black/40 border border-white/10 rounded-xl p-2 min-h-[46px] max-h-32 overflow-y-auto custom-scrollbar space-y-2">
                            {attributes.length === 0 && <div className="text-[10px] text-gray-600 text-center py-2">No traits added</div>}
                            {attributes.map((attr, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input placeholder="Type" className="w-1/3 bg-white/5 border border-white/5 rounded p-1.5 text-white text-[10px] outline-none focus:border-white/20" value={attr.trait_type} onChange={e => updateAttribute(i, 'trait_type', e.target.value)} />
                                    <input placeholder="Value" className="flex-1 bg-white/5 border border-white/5 rounded p-1.5 text-white text-[10px] outline-none focus:border-white/20" value={attr.value} onChange={e => updateAttribute(i, 'value', e.target.value)} />
                                    <button onClick={() => removeAttribute(i)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={12}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Unlockable Content */}
            <div className="mb-8 relative z-10 bg-white/5 rounded-xl p-4 border border-white/5">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${hasUnlockable ? 'bg-emerald-500' : 'bg-white/10'}`}>
                        <input type="checkbox" checked={hasUnlockable} onChange={e => setHasUnlockable(e.target.checked)} className="opacity-0 w-full h-full cursor-pointer absolute z-10" />
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${hasUnlockable ? 'left-6' : 'left-1'}`} />
                    </div>
                    <span className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <Lock size={12} className={hasUnlockable ? 'text-emerald-400' : 'text-gray-500'}/> Encrypted Content
                    </span>
                </label>
                
                <AnimatePresence>
                    {hasUnlockable && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <textarea 
                                placeholder="Enter secret data, access keys, or links..." 
                                className="w-full bg-black/60 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 focus:border-emerald-500 outline-none font-mono text-xs h-24"
                                value={unlockableContent}
                                onChange={e => setUnlockableContent(e.target.value)}
                            />
                            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1"><ShieldCheck size={10}/> Only visible to the item owner.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Royalties</span>
                    <div className="flex items-center bg-black/40 rounded-lg border border-white/10 px-2 py-1">
                        <input 
                            type="number" min="0" max="20" step="0.1" 
                            value={royalty} onChange={e => setRoyalty(e.target.value)} 
                            className="w-8 bg-transparent text-right text-xs font-bold text-white outline-none"
                        />
                        <span className="text-[10px] font-bold text-gray-500 ml-1">%</span>
                    </div>
                </div>

                <button 
                    onClick={handleMint} 
                    disabled={isPending || isConfirming} 
                    className="px-8 py-3 bg-primary-500 text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-primary-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                >
                    {isPending ? <Zap className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                    {isPending ? 'Confirming...' : isConfirming ? 'Minting...' : 'Initialize Mint'}
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
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none" />
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
                          <div className="absolute top-3 right-3 bg-black/80 text-emerald-500 p-2 rounded-lg border border-emerald-500/30 backdrop-blur-md">
                              <Lock size={16} />
                          </div>
                      )}
                  </div>
                  
                  <div className="space-y-4 font-mono">
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
          </div>
      </div>
    </div>
  );
}