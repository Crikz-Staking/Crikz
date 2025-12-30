import React, { useState, useRef } from 'react';
import { Upload, Sparkles, FolderPlus, X, Plus, Trash2, Check, Lock, Info } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { useCollectionManager } from '@/hooks/web3/useCollectionManager';

export default function NFTMinting({ dynamicColor }: { dynamicColor: string }) {
  const { collections, createCollection } = useCollectionManager();
  
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('default');
  const [isNewColl, setIsNewColl] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [attributes, setAttributes] = useState<{ trait_type: string, value: string }[]>([]);
  const [unlockableContent, setUnlockableContent] = useState('');
  const [hasUnlockable, setHasUnlockable] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contract Write
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  React.useEffect(() => {
      if (hash && !isConfirming) {
          toast.success("Minted Successfully!");
          // Reset Form
          setFile(null);
          setPreviewUrl(null);
          setName('');
          setDescription('');
          setAttributes([]);
          setUnlockableContent('');
          setHasUnlockable(false);
      }
  }, [hash, isConfirming]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const f = e.target.files[0];
          setFile(f);
          setPreviewUrl(URL.createObjectURL(f));
      }
  };

  const handleMint = async () => {
    if (!name || !file) {
      toast.error("Name and File required");
      return;
    }

    let targetColId = selectedCollectionId;
    if (isNewColl && newCollName) {
        targetColId = createCollection(newCollName, "Created during mint");
    }

    try {
      toast.loading("Uploading assets to IPFS...", { id: 'mint' });
      const ipfsUrl = await uploadToIPFS(file);
      
      const metadataObj: any = {
        name: name,
        description: description,
        image: ipfsUrl,
        attributes: [
            ...attributes,
            { trait_type: "Platform", value: "Crikz Protocol" },
            { trait_type: "Collection", value: isNewColl ? newCollName : collections.find(c => c.id === selectedCollectionId)?.name || "General" }
        ],
      };

      // Add unlockable content to metadata
      if (hasUnlockable && unlockableContent) {
          metadataObj.unlockable_content = unlockableContent;
      }

      const finalMetadata = JSON.stringify(metadataObj);

      toast.loading("Confirming Transaction...", { id: 'mint' });

      writeContract({
        address: CRIKZ_NFT_ADDRESS as `0x${string}`,
        abi: CRIKZ_NFT_ABI,
        functionName: 'mint',
        args: [finalMetadata],
        value: parseEther('0.01')
      });
      
      toast.dismiss('mint');
    } catch (e) {
        console.error(e);
        toast.error("Mint failed", { id: 'mint' });
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
        <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <Sparkles className="text-primary-500" /> Create New Artifact
            </h2>

            {/* File Upload */}
            <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Media File</label>
                <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="border-2 border-dashed border-white/10 hover:border-primary-500/50 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer bg-black/20 transition-colors group"
                >
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*,audio/*" />
                    {file ? (
                        <div className="text-center">
                            <Check size={32} className="text-emerald-500 mx-auto mb-2"/>
                            <span className="font-bold text-white text-sm">{file.name}</span>
                            <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    ) : (
                        <>
                            <Upload size={32} className="text-gray-500 group-hover:text-primary-500 mb-3 transition-colors"/>
                            <span className="text-gray-400 font-bold text-sm">Click to Upload</span>
                            <span className="text-xs text-gray-600 mt-1">JPG, PNG, GIF, MP4, MP3 (Max 100MB)</span>
                        </>
                    )}
                </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4 mb-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Name</label>
                    <input type="text" placeholder="e.g. Cosmic Cube #001" className="input-field" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Description</label>
                    <textarea placeholder="Describe your artifact..." className="input-field h-32" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
            </div>

            {/* Collection */}
            <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Collection</label>
                <div className="flex gap-2">
                    {!isNewColl ? (
                    <select 
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-500"
                        value={selectedCollectionId}
                        onChange={e => setSelectedCollectionId(e.target.value)}
                    >
                        {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    ) : (
                    <input type="text" placeholder="New Collection Name" value={newCollName} onChange={e => setNewCollName(e.target.value)} className="flex-1 input-field" autoFocus />
                    )}
                    <button onClick={() => setIsNewColl(!isNewColl)} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/5">
                        {isNewColl ? <X size={20}/> : <FolderPlus size={20}/>}
                    </button>
                </div>
            </div>

            {/* Attributes */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Properties</label>
                    <button onClick={addAttribute} className="text-xs font-bold text-primary-500 flex items-center gap-1 hover:text-white transition-colors bg-primary-500/10 px-2 py-1 rounded"><Plus size={12}/> Add Trait</button>
                </div>
                <div className="space-y-2">
                    {attributes.map((attr, i) => (
                        <div key={i} className="flex gap-2">
                            <input placeholder="Type (e.g. Color)" className="input-field py-2 text-xs" value={attr.trait_type} onChange={e => updateAttribute(i, 'trait_type', e.target.value)} />
                            <input placeholder="Value (e.g. Gold)" className="input-field py-2 text-xs" value={attr.value} onChange={e => updateAttribute(i, 'value', e.target.value)} />
                            <button onClick={() => removeAttribute(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={14}/></button>
                        </div>
                    ))}
                    {attributes.length === 0 && <div className="text-xs text-gray-600 italic text-center py-2">No properties added</div>}
                </div>
            </div>

            {/* Unlockable Content */}
            <div className="mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Lock size={16} className={hasUnlockable ? "text-primary-500" : "text-gray-500"} />
                        <span className="text-sm font-bold text-white">Unlockable Content</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={hasUnlockable} onChange={e => setHasUnlockable(e.target.checked)} />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                </div>
                <p className="text-[10px] text-gray-500 mb-3">Include access keys, codes, or links that only the owner can reveal.</p>
                
                {hasUnlockable && (
                    <textarea 
                        placeholder="Enter content here (Access Key, Secret Link, etc)..." 
                        className="input-field h-24 font-mono text-xs text-emerald-400"
                        value={unlockableContent}
                        onChange={e => setUnlockableContent(e.target.value)}
                    />
                )}
            </div>

            {/* Earnings Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 mb-6">
                <Info size={16} className="shrink-0 mt-0.5"/>
                <div>
                    <span className="font-bold block mb-1">Earnings Structure</span>
                    You receive 99.382% of the sale price. The protocol takes a 0.618% fee on every sale to fund the ecosystem.
                </div>
            </div>

            <button onClick={handleMint} disabled={isPending || isConfirming} className="btn-primary w-full py-4 text-lg shadow-glow-sm">
                {isPending ? 'Confirming...' : isConfirming ? 'Minting...' : 'Mint Artifact (0.01 BNB)'}
            </button>
        </div>
      </div>

      {/* RIGHT: Preview */}
      <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
              <h3 className="text-lg font-bold text-white">Preview</h3>
              
              <div className="glass-card p-4 rounded-3xl border border-white/10 bg-black/40 overflow-hidden group">
                  <div className="aspect-square bg-black/60 rounded-2xl mb-4 flex items-center justify-center border border-white/5 overflow-hidden relative">
                      {previewUrl ? (
                          <img src={previewUrl} className="w-full h-full object-cover" />
                      ) : (
                          <div className="text-gray-700 font-black text-6xl opacity-20">?</div>
                      )}
                      
                      {hasUnlockable && (
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-primary-500 p-2 rounded-lg border border-primary-500/30" title="Has Unlockable Content">
                              <Lock size={16} />
                          </div>
                      )}
                  </div>
                  
                  <div className="space-y-2">
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="text-xl font-black text-white leading-tight">{name || "Untitled Artifact"}</h3>
                              <p className="text-xs text-gray-500 mt-1">{isNewColl ? newCollName : collections.find(c => c.id === selectedCollectionId)?.name}</p>
                          </div>
                          <div className="text-right">
                              <div className="text-[10px] text-gray-500 uppercase font-bold">Price</div>
                              <div className="text-sm font-bold text-white">-- CRKZ</div>
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