import React, { useState, useRef } from 'react';
import { Upload, Sparkles, File, FolderPlus, X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { useCollectionManager } from '@/hooks/web3/useCollectionManager';

export default function NFTMinting({ dynamicColor }: { dynamicColor: string }) {
  // Collection State
  const { collections, createCollection, assignMintedItem } = useCollectionManager();
  const [selectedCollectionId, setSelectedCollectionId] = useState('default');
  const [isNewColl, setIsNewColl] = useState(false);
  const [newCollName, setNewCollName] = useState('');

  // NFT State
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({ name: '', description: '' });
  const [attributes, setAttributes] = useState<{ trait_type: string, value: string }[]>([]);
  const [royalties, setRoyalties] = useState(5); // %
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contract Write
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  React.useEffect(() => {
      if (hash && !isConfirming) {
          toast.success("Minted Successfully!");
          // NOTE: In a real indexer without Subgraph, we can't easily get the TokenID 
          // of the item just minted without parsing logs manually or fetching balance-1.
          // For this demo, we assume the user will see it in "General" or we need to poll.
          // To assign it to a collection *locally*, we technically need the ID.
          // Fallback: It lands in 'default' (General) via useCollectionManager logic, 
          // user moves it manually if the indexer doesn't catch the ID immediately.
          
          setFile(null);
          setMetadata({ name: '', description: '' });
          setAttributes([]);
          setIsNewColl(false);
          setNewCollName('');
      }
  }, [hash, isConfirming]);

  const handleMint = async () => {
    if (!metadata.name || !file) {
      toast.error("Name and File required");
      return;
    }

    let targetColId = selectedCollectionId;
    if (isNewColl && newCollName) {
        targetColId = createCollection(newCollName, "Created during mint");
    }

    try {
      toast.loading("Uploading to IPFS...", { id: 'mint' });
      const ipfsUrl = await uploadToIPFS(file);
      
      const finalMetadata = JSON.stringify({
        name: metadata.name,
        description: metadata.description,
        image: ipfsUrl,
        attributes: [
            ...attributes,
            { trait_type: "Creator Royalty", value: `${royalties}%` },
            { trait_type: "Minted via", value: "Crikz Protocol" }
        ],
        seller_fee_basis_points: royalties * 100, // Standard OpenSea/EIP2981 format hint
        fee_recipient: "0x..." // Your wallet would go here in a robust implementation
      });

      toast.loading("Confirming...", { id: 'mint' });

      writeContract({
        address: CRIKZ_NFT_ADDRESS as `0x${string}`,
        abi: CRIKZ_NFT_ABI,
        functionName: 'mint',
        args: [finalMetadata],
        value: parseEther('0.01')
      });
      
      toast.dismiss('mint');
    } catch (e) {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6 bg-background-elevated">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Sparkles className="text-primary-500" /> Mint Artifact
        </h2>

        {/* Collection */}
        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Collection</label>
          <div className="flex gap-2">
            {!isNewColl ? (
              <select 
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary-500"
                value={selectedCollectionId}
                onChange={e => setSelectedCollectionId(e.target.value)}
              >
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <input type="text" placeholder="New Collection Name" value={newCollName} onChange={e => setNewCollName(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary-500" autoFocus />
            )}
            <button onClick={() => setIsNewColl(!isNewColl)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                {isNewColl ? <X size={18}/> : <FolderPlus size={18}/>}
            </button>
          </div>
        </div>

        {/* File */}
        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 hover:border-primary-500/50 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer bg-black/20">
            <input type="file" ref={fileInputRef} className="hidden" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
            {file ? (
                <div className="text-center">
                    <Check size={24} className="text-emerald-500 mx-auto mb-1"/>
                    <span className="font-bold text-white text-sm">{file.name}</span>
                </div>
            ) : (
                <><Upload size={24} className="text-gray-500 mb-2"/><span className="text-gray-400 font-bold text-sm">Upload File</span></>
            )}
        </div>

        {/* Metadata */}
        <input type="text" placeholder="Artifact Name" className="input-field" value={metadata.name} onChange={e => setMetadata({...metadata, name: e.target.value})} />
        <textarea placeholder="Description" className="input-field h-24" value={metadata.description} onChange={e => setMetadata({...metadata, description: e.target.value})} />

        {/* Attributes */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Attributes</label>
                <button onClick={addAttribute} className="text-xs font-bold text-primary-500 flex items-center gap-1 hover:text-white transition-colors"><Plus size={12}/> Add</button>
            </div>
            <div className="space-y-2">
                {attributes.map((attr, i) => (
                    <div key={i} className="flex gap-2">
                        <input placeholder="Trait (e.g. Color)" className="input-field py-2 text-xs" value={attr.trait_type} onChange={e => updateAttribute(i, 'trait_type', e.target.value)} />
                        <input placeholder="Value (e.g. Gold)" className="input-field py-2 text-xs" value={attr.value} onChange={e => updateAttribute(i, 'value', e.target.value)} />
                        <button onClick={() => removeAttribute(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={14}/></button>
                    </div>
                ))}
            </div>
        </div>

        {/* Earnings & Fees */}
        <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex justify-between">
                <span className="text-xs text-gray-400">Creator Earnings</span>
                <span className="text-xs font-bold text-white">{royalties}%</span>
            </div>
            <input type="range" min="0" max="10" step="0.5" value={royalties} onChange={e => setRoyalties(Number(e.target.value))} className="w-full accent-primary-500" />
            
            <div className="pt-3 border-t border-white/5 flex justify-between text-xs">
                <span className="text-gray-500">Platform Fee (per sale)</span>
                <span className="text-primary-500 font-bold">0.618%</span>
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-gray-500">Payment Token</span>
                <span className="text-white font-bold flex items-center gap-1"><img src="/crikz-icon.svg" className="w-3 h-3"/> CRIKZ</span>
            </div>
        </div>

        <button onClick={handleMint} disabled={isPending || isConfirming} className="btn-primary w-full py-4 text-lg">
            {isPending ? 'Confirm...' : isConfirming ? 'Minting...' : 'Mint (0.01 BNB)'}
        </button>
      </div>

      {/* Preview */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 bg-black/20 h-fit sticky top-24">
          <div className="aspect-square bg-black/40 rounded-2xl mb-4 flex items-center justify-center border border-white/5 overflow-hidden">
              {file ? <img src={URL.createObjectURL(file)} className="w-full h-full object-cover"/> : <div className="text-gray-800 font-black text-6xl">?</div>}
          </div>
          <div className="text-center">
              <h3 className="text-xl font-black text-white">{metadata.name || "Untitled"}</h3>
              <p className="text-sm text-gray-500">{isNewColl ? newCollName : collections.find(c => c.id === selectedCollectionId)?.name}</p>
          </div>
      </div>
    </div>
  );
}