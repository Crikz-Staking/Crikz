import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, Info, X } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config'; // You need to export ABI in config
import { useAccount, useConfig } from 'wagmi';


interface Attribute {
  trait_type: string;
  value: string;
}

export default function NFTMinting({ dynamicColor }: { dynamicColor: string }) {
  const [metadata, setMetadata] = useState({ name: '', description: '', image: '' });
  const [attributes, setAttributes] = useState<Attribute[]>([{ trait_type: '', value: '' }]);
  const [preview, setPreview] = useState<string | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleAttributeChange = (index: number, field: keyof Attribute, value: string) => {
    const newAttrs = [...attributes];
    newAttrs[index][field] = value;
    setAttributes(newAttrs);
  };

  const addAttribute = () => setAttributes([...attributes, { trait_type: '', value: '' }]);
  const removeAttribute = (index: number) => setAttributes(attributes.filter((_, i) => i !== index));

  const handleMint = async () => {
    if (!metadata.name || !metadata.image) {
      toast.error("Name and Image URL are required!");
      return;
    }

    // In a real app, you would upload this JSON to IPFS here.
    // For this demo, we simulate the URI string.
    const tokenURI = JSON.stringify({
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      attributes: attributes.filter(a => a.trait_type && a.value)
    });
    
    // For testnet, we can use a data URI or a mock IPFS hash
    // const finalURI = `data:application/json;base64,${btoa(tokenURI)}`; 
    // Using a placeholder string for simplicity in the contract call:
    const mockIpfsUri = `ipfs://mock-hash/${Date.now()}`; 
const { chain } = useAccount();


    writeContract({
      address: CRIKZ_NFT_ADDRESS,
      abi: CRIKZ_NFT_ABI,
      functionName: 'mint',
      args: [mockIpfsUri],
      value: parseEther('0.01'), // 0.01 BNB Mint Price
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Section */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Sparkles className="text-primary-500" /> Create Artifact
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asset Name</label>
            <input 
              type="text" 
              placeholder="e.g. Golden Crikz #001"
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary-500 outline-none"
              value={metadata.name}
              onChange={(e) => setMetadata({...metadata, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
            <textarea 
              placeholder="Describe your artifact..."
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary-500 outline-none h-32"
              value={metadata.description}
              onChange={(e) => setMetadata({...metadata, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
            <input 
              type="text" 
              placeholder="https://..."
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary-500 outline-none"
              value={metadata.image}
              onChange={(e) => {
                setMetadata({...metadata, image: e.target.value});
                setPreview(e.target.value);
              }}
            />
            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
              <Info size={10} /> Supports JPG, PNG, GIF (Use IPFS URL for permanence)
            </p>
          </div>

          {/* Attributes */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Attributes (Optional)</label>
            <div className="space-y-2">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex gap-2">
                  <input 
                    placeholder="Trait Type (e.g. Color)"
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-sm"
                    value={attr.trait_type}
                    onChange={(e) => handleAttributeChange(idx, 'trait_type', e.target.value)}
                  />
                  <input 
                    placeholder="Value (e.g. Gold)"
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-sm"
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                  />
                  <button onClick={() => removeAttribute(idx)} className="p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button onClick={addAttribute} className="text-xs font-bold text-primary-500 hover:text-primary-400">
                + Add Attribute
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleMint}
          disabled={isPending || isConfirming}
          className="w-full py-4 rounded-xl font-black text-black bg-primary-500 hover:bg-primary-400 transition-all shadow-glow-md disabled:opacity-50"
        >
          {isPending ? 'Confirming in Wallet...' : isConfirming ? 'Minting...' : 'Mint NFT (0.01 BNB)'}
        </button>
      </div>

      {/* Preview Section */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center bg-black/20">
        <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-6 text-sm">Preview</h3>
        <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden border-2 border-white/5 bg-black/40 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" onError={() => setPreview(null)} />
          ) : (
            <div className="text-gray-600 flex flex-col items-center gap-2">
              <Upload size={40} />
              <span className="text-sm font-bold">Image Preview</span>
            </div>
          )}
        </div>
        <div className="mt-6 w-full max-w-sm text-left">
            <h4 className="text-xl font-black text-white">{metadata.name || 'Untitled Asset'}</h4>
            <p className="text-sm text-gray-400 mt-1">{metadata.description || 'No description provided.'}</p>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {attributes.filter(a => a.value).map((attr, i) => (
                <div key={i} className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-primary-500 uppercase font-bold">{attr.trait_type}</div>
                  <div className="text-sm font-bold text-white">{attr.value}</div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}