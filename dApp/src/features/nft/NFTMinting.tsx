import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, File, Box, FolderPlus } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import { uploadToIPFS } from '@/lib/ipfs-service';

export default function NFTMinting({ dynamicColor }: { dynamicColor: string }) {
  const { address } = useAccount();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'audio' | 'document'>('image');
  
  // Collections Logic
  const [collections, setCollections] = useState<string[]>(['Standard Collection']);
  const [selectedCollection, setSelectedCollection] = useState('Standard Collection');
  const [isNewColl, setIsNewColl] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  
  const [metadata, setMetadata] = useState({ name: '', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Load collections from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('crikz_collections');
    if (saved) {
      const parsed = JSON.parse(saved);
      const names = parsed.map((c: any) => c.name);
      setCollections(prev => [...new Set([...prev, ...names])]);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      if (uploadedFile.type.startsWith('video')) setFileType('video');
      else if (uploadedFile.type.startsWith('audio')) setFileType('audio');
      else if (uploadedFile.type.startsWith('image')) setFileType('image');
      else setFileType('document');
      toast.success("File prepared for IPFS");
    }
  };

  const handleMint = async () => {
    if (!metadata.name || !file) {
      toast.error("Name and File are required.");
      return;
    }
    
    // Determine collection name
    const collectionName = isNewColl ? newCollName : selectedCollection;
    if (!collectionName) {
        toast.error("Collection name required");
        return;
    }

    try {
      toast.loading("Uploading to IPFS...", { id: 'ipfs' });
      const ipfsUrl = await uploadToIPFS(file);
      toast.success("IPFS Upload Complete", { id: 'ipfs' });

      const finalMetadata = JSON.stringify({
        name: metadata.name,
        description: metadata.description,
        image: fileType === 'image' ? ipfsUrl : 'https://placehold.co/400x400/png?text=Media+File',
        animation_url: fileType !== 'image' ? ipfsUrl : undefined,
        attributes: [
          { trait_type: "File Type", value: fileType },
          { trait_type: "Collection", value: collectionName }
        ]
      });

      // Save new collection to local storage for future use if it's new
      if (isNewColl) {
         const saved = localStorage.getItem('crikz_collections');
         const current = saved ? JSON.parse(saved) : [];
         const newEntry = { id: `col-${Date.now()}`, name: collectionName, items: [] };
         localStorage.setItem('crikz_collections', JSON.stringify([...current, newEntry]));
      }

      writeContract({
        address: CRIKZ_NFT_ADDRESS as `0x${string}`,
        abi: CRIKZ_NFT_ABI,
        functionName: 'mint',
        args: [finalMetadata],
        value: parseEther('0.01'),
        account: address,
        chain: bscTestnet,
      });
    } catch (err) {
      console.error(err);
      toast.error("Minting failed.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6 bg-background-elevated">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Sparkles className="text-primary-500" /> Mint Artifact
        </h2>

        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Collection</label>
          <div className="flex gap-2">
            {!isNewColl ? (
              <select 
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
              >
                {collections.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input 
                type="text" 
                placeholder="New Collection Name"
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                value={newCollName}
                onChange={(e) => setNewCollName(e.target.value)}
              />
            )}
            
            <button 
                onClick={() => setIsNewColl(!isNewColl)} 
                className={`p-2 rounded-lg hover:bg-white/20 border transition-all ${isNewColl ? 'bg-primary-500 border-primary-500 text-black' : 'bg-white/10 border-transparent'}`}
                title={isNewColl ? "Cancel New Collection" : "Create New Collection"}
            >
              <FolderPlus size={18} />
            </button>
          </div>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/10 hover:border-primary-500/50 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-colors bg-black/20"
        >
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          {file ? (
            <div className="flex flex-col items-center gap-1 text-white text-center px-4">
              <File size={24} className="text-primary-500"/>
              <span className="font-bold truncate w-full">{file.name}</span>
            </div>
          ) : (
            <><Upload size={24} className="text-gray-500 mb-2"/><span className="text-gray-400 font-bold text-sm">Upload Any File</span></>
          )}
        </div>

        <input type="text" placeholder="Asset Name" className="input-field w-full" value={metadata.name} onChange={(e) => setMetadata({...metadata, name: e.target.value})} />
        <textarea placeholder="Description" className="input-field w-full h-24" value={metadata.description} onChange={(e) => setMetadata({...metadata, description: e.target.value})} />

        <button onClick={handleMint} disabled={isPending || isConfirming} className="btn-primary w-full py-4 text-lg">
          {isPending || isConfirming ? 'Processing...' : 'Mint (0.01 BNB)'}
        </button>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-white/10 bg-black/20 h-fit">
        <h3 className="text-gray-500 font-bold uppercase text-xs mb-4">Preview</h3>
        <div className="aspect-square w-full bg-black/40 rounded-2xl mb-4 flex items-center justify-center border border-white/5 overflow-hidden relative">
          {file && fileType === 'image' ? (
              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
          ) : (
              <Box size={48} className="text-gray-800" />
          )}
          {isNewColl && newCollName && (
              <div className="absolute top-2 right-2 bg-primary-500 text-black text-[10px] font-bold px-2 py-1 rounded">
                  NEW
              </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-white">{metadata.name || "Untitled Artifact"}</p>
          <p className="text-sm text-gray-500">{isNewColl ? newCollName : selectedCollection}</p>
        </div>
      </div>
    </div>
  );
}