import React, { useState, useRef } from 'react';
import { Upload, Sparkles, X, Image as ImageIcon } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { bscTestnet } from 'wagmi/chains'; // Import the chain object
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';

interface Attribute {
  trait_type: string;
  value: string;
}

export default function NFTMinting({ dynamicColor }: { dynamicColor: string }) {
  const { address } = useAccount();
  const [metadata, setMetadata] = useState({ name: '', description: '', image: '' });
  const [attributes, setAttributes] = useState<Attribute[]>([{ trait_type: '', value: '' }]);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [touched, setTouched] = useState({ name: false, image: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const errors = {
    name: !metadata.name,
    image: !metadata.image
  };

  const handleAttributeChange = (index: number, field: keyof Attribute, value: string) => {
    const newAttrs = [...attributes];
    newAttrs[index][field] = value;
    setAttributes(newAttrs);
  };

  const addAttribute = () => setAttributes([...attributes, { trait_type: '', value: '' }]);
  const removeAttribute = (index: number) => setAttributes(attributes.filter((_, i) => i !== index));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setMetadata({ ...metadata, image: objectUrl });
      setPreview(objectUrl);
      setTouched({ ...touched, image: true });
      toast.success("Image selected!");
    }
  };

  const handleMint = async () => {
    setTouched({ name: true, image: true });
    if (errors.name || errors.image) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    const tokenURI = JSON.stringify({
      ...metadata,
      attributes: attributes.filter(a => a.trait_type && a.value)
    });

    try {
      // The fix: explicitly pass address as 'account' and bscTestnet as 'chain'
      writeContract({
        address: CRIKZ_NFT_ADDRESS as `0x${string}`,
        abi: CRIKZ_NFT_ABI,
        functionName: 'mint',
        args: [tokenURI],
        value: parseEther('0.01'), 
        account: address, 
        chain: bscTestnet,
      });
      toast.loading("Initiating Mint transaction...");
    } catch (err) {
      console.error(err);
      toast.error("Transaction failed to start.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6 bg-background-elevated">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Sparkles className="text-primary-500" /> Mint Artifact
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asset Name *</label>
            <input 
              type="text" 
              className={`w-full bg-black/20 border rounded-xl p-4 text-white focus:outline-none transition-colors ${
                touched.name && errors.name ? 'border-red-500' : 'border-white/10'
              }`}
              value={metadata.name}
              onChange={(e) => setMetadata({...metadata, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image *</label>
            <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${
               touched.image && errors.image ? 'border-red-500' : 'border-white/10'
            }`}>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              {preview ? (
                <div className="relative group">
                   <img src={preview} className="max-h-40 object-contain rounded-lg" alt="Preview" />
                   <button onClick={() => {setPreview(null); setMetadata({...metadata, image: ''})}} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X size={14}/></button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload size={32} />
                  <span>Upload Image</span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Attributes</label>
            <div className="space-y-2">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex gap-2">
                  <input placeholder="Type" className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white" value={attr.trait_type} onChange={(e) => handleAttributeChange(idx, 'trait_type', e.target.value)} />
                  <input placeholder="Value" className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white" value={attr.value} onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)} />
                  <button onClick={() => removeAttribute(idx)} className="text-red-500 px-2"><X size={16}/></button>
                </div>
              ))}
              <button onClick={addAttribute} className="text-xs font-bold text-primary-500">+ Add Attribute</button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleMint}
          disabled={isPending || isConfirming}
          className="w-full py-4 rounded-xl font-black text-black bg-primary-500 hover:bg-primary-400 transition-all disabled:opacity-50"
        >
          {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Minting...' : 'Mint NFT (0.01 BNB)'}
        </button>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-white/10 bg-black/20 h-fit">
        <h3 className="text-gray-500 font-bold uppercase text-xs mb-4">Preview</h3>
        <div className="aspect-square w-full bg-black/40 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-white/5">
           {preview ? <img src={preview} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-700" size={48} />}
        </div>
        <div className="text-white font-bold text-xl">{metadata.name || 'Untitled'}</div>
        <div className="text-gray-400 text-sm mt-1 line-clamp-2">{metadata.description || 'No description'}</div>
      </div>
    </div>
  );
}