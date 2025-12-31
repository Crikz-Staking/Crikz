import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Check, Lock, Info, Image as ImageIcon, Link as LinkIcon, FileText, Package, Trash2 } from 'lucide-react';
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
  const [coverFile, setCoverFile] = useState<File | null>(null); // For preview
  const [externalLink, setExternalLink] = useState('');
  
  // Previews
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

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
  const [royalty, setRoyalty] = useState('5'); // Default 5%

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
          
          // Extract Token ID
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
              } catch (e) {
                  // Ignore decoding errors for non-relevant logs
              }
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
          
          // Size Check (100MB soft limit for browser reliability)
          if (f.size > 100 * 1024 * 1024) {
              toast.error("File too large. Please use files under 100MB.");
              return;
          }

          setMainFile(f);
          
          // If image, auto-set as cover
          if (f.type.startsWith('image/')) {
              const url = URL.createObjectURL(f);
              setMainPreview(url);
              setCoverFile(f);
              setCoverPreview(url);
          } else {
              setMainPreview(null); // Non-image preview logic handled by icon
          }
      }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const f = e.target.files[0];
          if (!f.type.startsWith('image/')) {
              toast.error("Cover must be an image (JPG, PNG, GIF)");
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

    // Collection Logic
    let finalCollectionId = selectedCollectionId;
    if (isNewColl) {
        if (!newCollName) return toast.error("Collection Name Required");
        finalCollectionId = createCollection(newCollName, newCollDesc);
        setSelectedCollectionId(finalCollectionId);
    }

    try {
      let mainContentUri = '';
      let coverImageUri = '';

      // 1. Upload Main Content
      if (mintType === 'file' && mainFile) {
          toast.loading("Uploading main file...", { id: 'mint' });
          const cid = await uploadToIPFS(mainFile);
          mainContentUri = `ipfs://${cid}`;
      } else {
          mainContentUri = externalLink;
      }

      // 2. Upload Cover Image (if different or explicit)
      if (coverFile) {
          // Avoid re-uploading if cover is same as main
          if (mintType === 'file' && mainFile === coverFile) {
              coverImageUri = mainContentUri;
          } else {
              toast.loading("Uploading cover image...", { id: 'mint' });
              const cid = await uploadToIPFS(coverFile);
              coverImageUri = `ipfs://${cid}`;
          }
      }

      // 3. Metadata
      const metadataObj = {
        name: name,
        description: description,
        image: coverImageUri, // Standard display image
        animation_url: mainContentUri, // The actual content (video/audio/html/etc)
        external_url: "https://crikz.protocol",
        attributes: [
            ...attributes,
            { trait_type: "Type", value: mintType === 'link' ? 'External Link' : mainFile?.type || 'Unknown' },
            { trait_type: "Collection", value: isNewColl ? newCollName : collections.find(c => c.id === finalCollectionId)?.name || "General" }
        ],
        seller_fee_basis_points: Math.floor(Number(royalty) * 100),
      };

      if (hasUnlockable && unlockableContent) {
          (metadataObj as any).unlockable_content = unlockableContent;
      }

      // 4. Upload Metadata
      toast.loading("Finalizing metadata...", { id: 'mint' });
      const metaBlob = new Blob([JSON.stringify(metadataObj)], { type: 'application/json' });
      const metaFile = new File([metaBlob], "metadata.json");
      const metaCid = await uploadToIPFS(metaFile);
      
      // 5. Mint
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
      
      {/* LEFT: Form */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-3">
            <Info className="text-blue-400 shrink-0" size={20} />
            <div className="text-xs text-gray-300 space-y-1">
                <p className="font-bold text-blue-400">Minting Guidelines</p>
                <p>• Supported: Images (JPG, PNG, GIF), Video (MP4), Audio (MP3), 3D (GLB), PDFs, ZIP Archives.</p>
                <p>• Max File Size: 100MB (Browser Limit). For larger files, host externally and use "Link Mode".</p>
                <p>• Cover Image: Required for non-image files to display correctly in the marketplace.</p>
            </div>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/10 bg-[#0A0A0F]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Sparkles className="text-primary-500" /> Create Artifact
                </h2>
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                    <button onClick={() => setMintType('file')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mintType === 'file' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Upload File</button>
                    <button onClick={() => setMintType('link')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mintType === 'link' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>External Link</button>
                </div>
            </div>

            {/* Main Asset Upload */}
            <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center">
                    {mintType === 'file' ? 'Main Asset' : 'Asset Link'}
                    <Tooltip content="The primary content of your NFT. Can be an image, video, audio, or any file." />
                </label>
                
                {mintType === 'file' ? (
                    <div 
                        onClick={() => mainInputRef.current?.click()} 
                        className="border-2 border-dashed border-white/10 hover:border-primary-500/50 rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer bg-black/20 transition-colors group"
                    >
                        <input type="file" ref={mainInputRef} className="hidden" onChange={handleMainFileChange} />
                        {mainFile ? (
                            <div className="text-center">
                                <Check size={24} className="text-emerald-500 mx-auto mb-2"/>
                                <span className="font-bold text-white text-sm">{mainFile.name}</span>
                                <p className="text-xs text-gray-500 mt-1">{(mainFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <>
                                <Upload size={24} className="text-gray-500 group-hover:text-primary-500 mb-2 transition-colors"/>
                                <span className="text-gray-400 font-bold text-xs">Click to Upload File</span>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-3">
                        <LinkIcon size={16} className="text-gray-500"/>
                        <input 
                            type="text" 
                            placeholder="https://..." 
                            value={externalLink} 
                            onChange={e => setExternalLink(e.target.value)}
                            className="bg-transparent w-full text-sm text-white outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Cover Image (Conditional) */}
            {(!mainFile?.type.startsWith('image/') || mintType === 'link') && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                        Cover Image <span className="text-red-500">*</span>
                        <span className="text-[9px] normal-case font-normal bg-white/5 px-2 rounded text-gray-400">Required for preview</span>
                    </label>
                    <div 
                        onClick={() => coverInputRef.current?.click()} 
                        className="border-2 border-dashed border-white/10 hover:border-primary-500/50 rounded-2xl h-24 flex flex-col items-center justify-center cursor-pointer bg-black/20 transition-colors group"
                    >
                        <input type="file" ref={coverInputRef} className="hidden" onChange={handleCoverFileChange} accept="image/*" />
                        {coverFile ? (
                            <div className="flex items-center gap-2">
                                <ImageIcon size={16} className="text-emerald-500"/>
                                <span className="font-bold text-white text-xs">{coverFile.name}</span>
                            </div>
                        ) : (
                            <span className="text-gray-400 font-bold text-xs flex items-center gap-2">
                                <ImageIcon size={16}/> Upload Cover (JPG/PNG)
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Name</label>
                    <input type="text" placeholder="Item Name" className="input-field" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Description</label>
                    <textarea placeholder="Describe your artifact..." className="input-field h-24" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
            </div>

            {/* Collection & Attributes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
                            Collection <Tooltip content="Organize your items locally. Does not affect on-chain contract." />
                        </label>
                        <button onClick={() => setIsNewColl(!isNewColl)} className="text-[10px] font-bold text-primary-500 hover:text-white transition-colors">
                            {isNewColl ? 'Cancel' : '+ New'}
                        </button>
                    </div>
                    {!isNewColl ? (
                        <select className="input-field" value={selectedCollectionId} onChange={e => setSelectedCollectionId(e.target.value)}>
                            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    ) : (
                        <input type="text" placeholder="New Collection Name" value={newCollName} onChange={e => setNewCollName(e.target.value)} className="input-field" />
                    )}
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
                            Attributes <Tooltip content="Traits like 'Color', 'Rarity', etc. Displayed in marketplace." />
                        </label>
                        <button onClick={addAttribute} className="text-[10px] font-bold text-primary-500 hover:text-white transition-colors">+ Add</button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                        {attributes.map((attr, i) => (
                            <div key={i} className="flex gap-1">
                                <input placeholder="Type" className="input-field py-1 text-[10px]" value={attr.trait_type} onChange={e => updateAttribute(i, 'trait_type', e.target.value)} />
                                <input placeholder="Value" className="input-field py-1 text-[10px]" value={attr.value} onChange={e => updateAttribute(i, 'value', e.target.value)} />
                                <button onClick={() => removeAttribute(i)} className="text-red-500 hover:text-red-400"><Trash2 size={12}/></button>
                            </div>
                        ))}
                        {attributes.length === 0 && <div className="text-[10px] text-gray-600 italic">No attributes</div>}
                    </div>
                </div>
            </div>

            {/* Unlockable Content */}
            <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={hasUnlockable} onChange={e => setHasUnlockable(e.target.checked)} className="accent-primary-500" />
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Lock size={12}/> Unlockable Content
                        <Tooltip content="Content only visible to the owner of the NFT." />
                    </span>
                </label>
                {hasUnlockable && (
                    <textarea 
                        placeholder="Access keys, links, or hidden data..." 
                        className="input-field h-20 font-mono text-xs text-emerald-400"
                        value={unlockableContent}
                        onChange={e => setUnlockableContent(e.target.value)}
                    />
                )}
            </div>

            {/* Compact Earnings */}
            <div className="mb-8 bg-black/20 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                    <label className="text-xs font-bold text-gray-400 block">Creator Royalties</label>
                    <p className="text-[9px] text-gray-600">Protocol Fee: 0.618% (Fixed)</p>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" min="0" max="20" step="0.1" 
                        value={royalty} onChange={e => setRoyalty(e.target.value)} 
                        className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-sm font-bold text-white outline-none focus:border-primary-500"
                    />
                    <span className="text-xs font-bold text-gray-500">%</span>
                </div>
            </div>

            <button onClick={handleMint} disabled={isPending || isConfirming} className="btn-primary w-full py-4 text-lg shadow-glow-sm" style={{ backgroundColor: dynamicColor }}>
                {isPending ? 'Confirming...' : isConfirming ? 'Minting...' : 'Mint Artifact'}
            </button>
        </div>
      </div>

      {/* RIGHT: Preview */}
      <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
              <h3 className="text-lg font-bold text-white">Preview</h3>
              
              <div className="glass-card p-4 rounded-3xl border border-white/10 bg-[#0A0A0F] overflow-hidden group shadow-2xl">
                  <div className="aspect-square bg-black/60 rounded-2xl mb-4 flex items-center justify-center border border-white/5 overflow-hidden relative">
                      {coverPreview ? (
                          <img src={coverPreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : mainPreview ? (
                          <img src={mainPreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                          <div className="flex flex-col items-center gap-2 opacity-30">
                              {mintType === 'file' && mainFile ? (
                                  mainFile.type.includes('pdf') ? <FileText size={48}/> : <Package size={48}/>
                              ) : (
                                  <ImageIcon size={48}/>
                              )}
                              <span className="text-xs font-bold">No Preview</span>
                          </div>
                      )}
                      
                      {hasUnlockable && (
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-primary-500 p-2 rounded-lg border border-primary-500/30">
                              <Lock size={16} />
                          </div>
                      )}
                  </div>
                  
                  <div className="space-y-2">
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="text-xl font-black text-white leading-tight line-clamp-1">{name || "Untitled"}</h3>
                              <p className="text-xs text-gray-500 mt-1">{isNewColl ? newCollName : collections.find(c => c.id === selectedCollectionId)?.name}</p>
                          </div>
                      </div>
                      
                      {attributes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                              {attributes.map((attr, i) => (
                                  <div key={i} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px]">
                                      <span className="text-gray-500 uppercase font-bold mr-1">{attr.trait_type}:</span>
                                      <span className="text-white font-bold">{attr.value}</span>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}