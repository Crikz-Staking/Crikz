import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Check, Lock, Info, Image as ImageIcon, Link as LinkIcon, FileText, Package, Trash2, Video, Music, Box } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { toast } from 'react-hot-toast';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { useCollectionManager } from '@/hooks/web3/useCollectionManager';
import Tooltip from '@/components/ui/Tooltip';

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono">
      
      {/* LEFT: Form (Technical Lab Look) */}
      <div className="lg:col-span-7 space-y-6">
        
        <div className="bg-[#050508] border border-white/10 p-4 rounded-none border-l-4 border-l-blue-500 flex gap-3">
            <Info className="text-blue-500 shrink-0" size={20} />
            <div className="text-xs text-gray-400 space-y-1">
                <p className="font-bold text-blue-500 uppercase tracking-widest">Minting Protocol v1.0</p>
                <p>Supported Formats: JPG, PNG, GIF, MP4, MP3, GLB. Max Size: 100MB.</p>
            </div>
        </div>

        <div className="bg-[#0A0A0F] p-8 border border-white/10 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            <div className="flex justify-between items-center mb-8 relative z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                    <Box className="text-primary-500" /> Artifact Lab
                </h2>
                <div className="flex bg-black border border-white/20 p-1">
                    <button onClick={() => setMintType('file')} className={`px-4 py-1 text-xs font-bold uppercase transition-all ${mintType === 'file' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>File</button>
                    <button onClick={() => setMintType('link')} className={`px-4 py-1 text-xs font-bold uppercase transition-all ${mintType === 'link' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Link</button>
                </div>
            </div>

            {/* Main Asset Upload */}
            <div className="mb-8 relative z-10">
                <label className="text-[10px] font-bold text-primary-500 uppercase mb-2 block flex items-center gap-2">
                    Input Source <div className="h-px flex-1 bg-primary-500/20"></div>
                </label>
                
                {mintType === 'file' ? (
                    <div 
                        onClick={() => mainInputRef.current?.click()} 
                        className="border border-dashed border-white/20 hover:border-primary-500 h-32 flex flex-col items-center justify-center cursor-pointer bg-black/40 transition-colors group"
                    >
                        <input type="file" ref={mainInputRef} className="hidden" onChange={handleMainFileChange} />
                        {mainFile ? (
                            <div className="text-center">
                                <Check size={24} className="text-emerald-500 mx-auto mb-2"/>
                                <span className="font-bold text-white text-sm">{mainFile.name}</span>
                                <p className="text-xs text-gray-500 mt-1 font-mono">{(mainFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <>
                                <Upload size={24} className="text-gray-500 group-hover:text-primary-500 mb-2 transition-colors"/>
                                <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">Initialize Upload</span>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-black border border-white/20 px-3 py-3">
                        <LinkIcon size={16} className="text-gray-500"/>
                        <input 
                            type="text" 
                            placeholder="https://..." 
                            value={externalLink} 
                            onChange={e => setExternalLink(e.target.value)}
                            className="bg-transparent w-full text-sm text-white outline-none font-mono"
                        />
                    </div>
                )}
            </div>

            {/* Cover Image (Conditional) */}
            {(!mainFile?.type.startsWith('image/') || mintType === 'link') && (
                <div className="mb-8 relative z-10">
                    <label className="text-[10px] font-bold text-primary-500 uppercase mb-2 block flex items-center gap-2">
                        Cover Thumbnail <div className="h-px flex-1 bg-primary-500/20"></div>
                    </label>
                    <div 
                        onClick={() => coverInputRef.current?.click()} 
                        className="border border-dashed border-white/20 hover:border-primary-500 h-24 flex flex-col items-center justify-center cursor-pointer bg-black/40 transition-colors group"
                    >
                        <input type="file" ref={coverInputRef} className="hidden" onChange={handleCoverFileChange} accept="image/*" />
                        {coverFile ? (
                            <div className="flex items-center gap-2">
                                <ImageIcon size={16} className="text-emerald-500"/>
                                <span className="font-bold text-white text-xs">{coverFile.name}</span>
                            </div>
                        ) : (
                            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon size={16}/> Upload Cover
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-6 mb-8 relative z-10">
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Artifact Name</label>
                    <input type="text" placeholder="IDENTIFIER" className="w-full bg-black border border-white/20 p-3 text-white focus:border-primary-500 outline-none font-mono text-sm" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Description Data</label>
                    <textarea placeholder="Enter technical specifications..." className="w-full bg-black border border-white/20 p-3 text-white focus:border-primary-500 outline-none font-mono text-sm h-24" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
            </div>

            {/* Collection & Attributes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Collection</label>
                        <button onClick={() => setIsNewColl(!isNewColl)} className="text-[10px] font-bold text-primary-500 hover:text-white transition-colors uppercase">
                            {isNewColl ? 'Cancel' : '+ New'}
                        </button>
                    </div>
                    {!isNewColl ? (
                        <select className="w-full bg-black border border-white/20 p-3 text-white focus:border-primary-500 outline-none font-mono text-sm" value={selectedCollectionId} onChange={e => setSelectedCollectionId(e.target.value)}>
                            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    ) : (
                        <input type="text" placeholder="NEW_COLLECTION_ID" value={newCollName} onChange={e => setNewCollName(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-white focus:border-primary-500 outline-none font-mono text-sm" />
                    )}
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Attributes</label>
                        <button onClick={addAttribute} className="text-[10px] font-bold text-primary-500 hover:text-white transition-colors uppercase">+ Add Param</button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                        {attributes.map((attr, i) => (
                            <div key={i} className="flex gap-1">
                                <input placeholder="TYPE" className="w-1/2 bg-black border border-white/20 p-2 text-white text-[10px] font-mono" value={attr.trait_type} onChange={e => updateAttribute(i, 'trait_type', e.target.value)} />
                                <input placeholder="VALUE" className="w-1/2 bg-black border border-white/20 p-2 text-white text-[10px] font-mono" value={attr.value} onChange={e => updateAttribute(i, 'value', e.target.value)} />
                                <button onClick={() => removeAttribute(i)} className="text-red-500 hover:text-red-400"><Trash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Unlockable Content */}
            <div className="mb-8 relative z-10">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={hasUnlockable} onChange={e => setHasUnlockable(e.target.checked)} className="accent-primary-500" />
                    <span className="text-[10px] font-bold text-white flex items-center gap-1 uppercase tracking-wider">
                        <Lock size={10}/> Encrypted Content
                    </span>
                </label>
                {hasUnlockable && (
                    <textarea 
                        placeholder="Enter secret data..." 
                        className="w-full bg-black border border-emerald-500/30 p-3 text-emerald-500 focus:border-emerald-500 outline-none font-mono text-xs h-20"
                        value={unlockableContent}
                        onChange={e => setUnlockableContent(e.target.value)}
                    />
                )}
            </div>

            <button onClick={handleMint} disabled={isPending || isConfirming} className="w-full py-4 bg-primary-500 text-black font-black text-lg uppercase tracking-widest hover:bg-primary-400 transition-all relative z-10">
                {isPending ? 'CONFIRMING...' : isConfirming ? 'MINTING...' : 'INITIALIZE MINT'}
            </button>
        </div>
      </div>

      {/* RIGHT: Preview */}
      <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Output Preview</h3>
              
              <div className="bg-[#0A0A0F] border border-white/10 p-4 relative overflow-hidden shadow-2xl">
                  <div className="aspect-square bg-black/60 mb-4 flex items-center justify-center border border-white/5 overflow-hidden relative">
                      {/* Dynamic Preview Logic */}
                      {fileType === 'video' && mainPreview ? (
                          <video src={mainPreview} autoPlay loop muted className="w-full h-full object-cover" />
                      ) : fileType === 'audio' && mainPreview ? (
                          <div className="flex flex-col items-center gap-4">
                              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                                  <Music size={32} className="text-white"/>
                              </div>
                              <audio src={mainPreview} controls className="w-48 h-8" />
                          </div>
                      ) : coverPreview ? (
                          <img src={coverPreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : mainPreview ? (
                          <img src={mainPreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                          <div className="flex flex-col items-center gap-2 opacity-30">
                              <Box size={48}/>
                              <span className="text-xs font-bold font-mono">NO_SIGNAL</span>
                          </div>
                      )}
                      
                      {hasUnlockable && (
                          <div className="absolute top-3 right-3 bg-black/80 text-emerald-500 p-2 border border-emerald-500/30">
                              <Lock size={16} />
                          </div>
                      )}
                  </div>
                  
                  <div className="space-y-4 font-mono">
                      <div>
                          <h3 className="text-xl font-bold text-white leading-tight line-clamp-1 uppercase">{name || "UNTITLED_ASSET"}</h3>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase">{isNewColl ? newCollName : collections.find(c => c.id === selectedCollectionId)?.name}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10">
                          <div className="bg-white/5 p-2 border border-white/5">
                              <div className="text-[8px] text-gray-500 uppercase">Type</div>
                              <div className="text-xs text-white font-bold">{fileType.toUpperCase()}</div>
                          </div>
                          {attributes.map((attr, i) => (
                              <div key={i} className="bg-white/5 p-2 border border-white/5">
                                  <div className="text-[8px] text-gray-500 uppercase">{attr.trait_type || 'PARAM'}</div>
                                  <div className="text-xs text-white font-bold">{attr.value || 'VALUE'}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}