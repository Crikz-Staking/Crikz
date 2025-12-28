import React, { useState, useRef } from 'react';
import { Upload, Sparkles, File, Box, FolderPlus, Check, X } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { toast } from 'react-hot-toast';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { useCollectionManager } from '@/hooks/web3/useCollectionManager';

export default function NFTMinting({ dynamicColor }: { dynamicColor: string }) {
  const { address } = useAccount();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'audio' | 'document'>('image');
  
  // Use the Manager Hook for consistent state
  const { collections, createCollection, assignToCollection } = useCollectionManager();
  
  const [selectedCollectionId, setSelectedCollectionId] = useState('default');
  const [isNewColl, setIsNewColl] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  
  const [metadata, setMetadata] = useState({ name: '', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ 
    hash,
    query: {
        enabled: !!hash,
    }
  });

  // Watch for success
  React.useEffect(() => {
      if (hash && !isConfirming) {
          toast.success("Minted Successfully!");
          setFile(null);
          setMetadata({ name: '', description: '' });
          setNewCollName('');
          setIsNewColl(false);
      }
  }, [hash, isConfirming]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      if (uploadedFile.type.startsWith('video')) setFileType('video');
      else if (uploadedFile.type.startsWith('audio')) setFileType('audio');
      else if (uploadedFile.type.startsWith('image')) setFileType('image');
      else setFileType('document');
      toast.success("File ready");
    }
  };

  const handleMint = async () => {
    if (!metadata.name || !file) {
      toast.error("Name and File are required.");
      return;
    }
    
    // 1. Handle Collection Creation if needed
    let targetColId = selectedCollectionId;
    let targetColName = collections.find(c => c.id === selectedCollectionId)?.name || 'General';

    if (isNewColl && newCollName) {
        targetColId = createCollection(newCollName, "Created during mint");
        targetColName = newCollName;
    }

    try {
      toast.loading("Uploading to IPFS...", { id: 'mint-proc' });
      const ipfsUrl = await uploadToIPFS(file);
      
      const finalMetadata = JSON.stringify({
        name: metadata.name,
        description: metadata.description,
        image: fileType === 'image' ? ipfsUrl : 'https://placehold.co/400x400/png?text=Media+File',
        animation_url: fileType !== 'image' ? ipfsUrl : undefined,
        attributes: [
          { trait_type: "File Type", value: fileType },
          { trait_type: "Collection", value: targetColName }, // Fallback for metadata readers
          { trait_type: "CollectionID", value: targetColId }  // For potential future indexing
        ]
      });

      toast.loading("Confirm in Wallet...", { id: 'mint-proc' });

      writeContract({
        address: CRIKZ_NFT_ADDRESS as `0x${string}`,
        abi: CRIKZ_NFT_ABI,
        functionName: 'mint',
        args: [finalMetadata],
        value: parseEther('0.01')
      });
      
      toast.dismiss('mint-proc');
    } catch (err) {
      console.error(err);
      toast.error("Minting failed.", { id: 'mint-proc' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6 bg-background-elevated">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Sparkles className="text-primary-500" /> Mint Artifact
        </h2>

        {/* Collection Selector */}
        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Destination Collection</label>
          <div className="flex gap-2">
            {!isNewColl ? (
              <select 
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary-500 transition-colors"
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
              >
                {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                placeholder="New Collection Name"
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary-500"
                value={newCollName}
                onChange={(e) => setNewCollName(e.target.value)}
                autoFocus
              />
            )}
            
            <button 
                onClick={() => setIsNewColl(!isNewColl)} 
                className={`p-2 rounded-lg border transition-all ${isNewColl ? 'bg-white/10 border-white/20 text-white' : 'bg-primary-500/10 border-primary-500/30 text-primary-500 hover:bg-primary-500/20'}`}
                title={isNewColl ? "Cancel New" : "Create New"}
            >
              {isNewColl ? <X size={18} /> : <FolderPlus size={18} />}
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/10 hover:border-primary-500/50 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-colors bg-black/20 group"
        >
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          {file ? (
            <div className="flex flex-col items-center gap-1 text-white text-center px-4">
              <Check size={24} className="text-emerald-500 mb-1"/>
              <span className="font-bold truncate w-full text-sm">{file.name}</span>
              <span className="text-[10px] text-gray-500 uppercase">Ready to Upload</span>
            </div>
          ) : (
            <>
              <Upload size={24} className="text-gray-500 mb-2 group-hover:text-primary-500 transition-colors"/>
              <span className="text-gray-400 font-bold text-sm">Upload File</span>
              <span className="text-[10px] text-gray-600 mt-1">Images, Audio, Video</span>
            </>
          )}
        </div>

        <div className="space-y-4">
            <input 
                type="text" 
                placeholder="Artifact Name" 
                className="input-field w-full" 
                value={metadata.name} 
                onChange={(e) => setMetadata({...metadata, name: e.target.value})} 
            />
            <textarea 
                placeholder="Description / Backstory" 
                className="input-field w-full h-24 resize-none" 
                value={metadata.description} 
                onChange={(e) => setMetadata({...metadata, description: e.target.value})} 
            />
        </div>

        <button 
            onClick={handleMint} 
            disabled={isPending || isConfirming || !file} 
            className="btn-primary w-full py-4 text-lg shadow-glow-sm"
        >
          {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Minting on Chain...' : 'Mint (0.01 BNB)'}
        </button>
      </div>

      {/* Preview Card */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 bg-black/20 h-fit sticky top-24">
        <h3 className="text-gray-500 font-bold uppercase text-xs mb-4">Live Preview</h3>
        <div className="aspect-square w-full bg-black/40 rounded-2xl mb-4 flex items-center justify-center border border-white/5 overflow-hidden relative">
          {file && fileType === 'image' ? (
              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
          ) : (
              <Box size={48} className="text-gray-800" />
          )}
          
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
              <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10">
                  #{Math.floor(Math.random() * 1000) + 1}
              </span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-white mb-1">{metadata.name || "Untitled Artifact"}</p>
          <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-500/10 text-primary-500 border border-primary-500/20">
                {isNewColl ? newCollName || 'New Collection' : collections.find(c => c.id === selectedCollectionId)?.name}
              </span>
          </div>
        </div>
      </div>
    </div>
  );
}