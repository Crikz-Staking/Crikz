import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Info, X, Image as ImageIcon } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';

interface Attribute {
  trait_type: string;
  value: string;
}

export default function NFTMinting({ dynamicColor }: { dynamicColor: string }) {
  const [metadata, setMetadata] = useState({ name: '', description: '', image: '' });
  const [attributes, setAttributes] = useState<Attribute[]>([{ trait_type: '', value: '' }]);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Track touched fields for validation error highlighting
  const [touched, setTouched] = useState({ name: false, image: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Validation Logic
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
      // For a purely frontend demo without backend, we create a local object URL
      // In production, you would upload `file` to IPFS here and get the CID
      const objectUrl = URL.createObjectURL(file);
      setMetadata({ ...metadata, image: objectUrl });
      setPreview(objectUrl);
      setTouched({ ...touched, image: true });
      toast.success("Image selected! (Note: Using local preview URL)");
    }
  };

  const handleMint = async () => {
    setTouched({ name: true, image: true });
    
    if (errors.name || errors.image) {
      toast.error("Please fill in all required fields marked in red.");
      return;
    }

    // Prepare Token URI (JSON)
    const tokenURI = JSON.stringify({
      ...metadata,
      attributes: attributes.filter(a => a.trait_type && a.value)
    });

    try {
      writeContract({
        address: CRIKZ_NFT_ADDRESS as `0x${string}`,
        abi: CRIKZ_NFT_ABI,
        functionName: 'mint',
        args: [tokenURI],
        value: parseEther('0.01'), 
      });
      toast.loading("Initiating Mint transaction...");
    } catch (err) {
      console.error(err);
      toast.error("Transaction failed to start.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Section */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6 bg-background-elevated">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Sparkles className="text-primary-500" /> Mint Artifact
        </h2>

        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g. Golden Crikz #001"
              className={`w-full bg-black/20 border rounded-xl p-4 text-white focus:outline-none transition-colors ${
                touched.name && errors.name ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-primary-500'
              }`}
              value={metadata.name}
              onChange={(e) => setMetadata({...metadata, name: e.target.value})}
              onBlur={() => setTouched({ ...touched, name: true })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
            <textarea 
              placeholder="Describe your artifact..."
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary-500 outline-none h-24"
              value={metadata.description}
              onChange={(e) => setMetadata({...metadata, description: e.target.value})}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
              Image <span className="text-red-500">*</span>
            </label>
            
            <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors ${
               touched.image && errors.image ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:border-white/20 bg-black/20'
            }`}>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
              
              {preview ? (
                <div className="relative w-full h-40 group">
                  <img src={preview} alt="Upload" className="w-full h-full object-contain rounded-lg" />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview(null);
                      setMetadata({ ...metadata, image: '' });
                      if(fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Upload size={32} />
                    <span className="text-sm font-bold">Upload from Device</span>
                  </button>
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-[10px] text-gray-600 font-bold uppercase">OR</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>
                  <input 
                    type="text"
                    placeholder="Paste Image URL..."
                    className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-center text-white focus:border-primary-500 outline-none"
                    value={metadata.image.startsWith('blob') ? '' : metadata.image}
                    onChange={(e) => {
                       setMetadata({ ...metadata, image: e.target.value });
                       setPreview(e.target.value);
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Attributes */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Attributes (Optional)</label>
            <div className="space-y-2">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex gap-2">
                  <input 
                    placeholder="Trait Type"
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary-500 outline-none text-white"
                    value={attr.trait_type}
                    onChange={(e) => handleAttributeChange(idx, 'trait_type', e.target.value)}
                  />
                  <input 
                    placeholder="Value"
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary-500 outline-none text-white"
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                  />
                  <button onClick={() => removeAttribute(idx)} className="p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button onClick={addAttribute} className="text-xs font-bold text-primary-500 hover:text-primary-400 mt-2">
                + Add Attribute
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleMint}
          disabled={isPending || isConfirming}
          className="w-full py-4 rounded-xl font-black text-black bg-primary-500 hover:bg-primary-400 transition-all shadow-glow-md disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Minting on Chain...' : 'Mint NFT (0.01 BNB)'}
        </button>
      </div>

      {/* Preview Section */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center bg-black/20 h-fit sticky top-24">
        <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-6 text-sm">Preview Artifact</h3>
        <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden border-2 border-white/5 bg-black/40 flex items-center justify-center mb-6">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" onError={() => setPreview(null)} />
          ) : (
            <div className="text-gray-600 flex flex-col items-center gap-2">
              <ImageIcon size={48} className="opacity-50" />
              <span className="text-sm font-bold">No Image Selected</span>
            </div>
          )}
        </div>
        <div className="w-full max-w-sm text-left">
            <h4 className="text-2xl font-black text-white truncate">{metadata.name || 'Untitled Asset'}</h4>
            <p className="text-sm text-gray-400 mt-2 line-clamp-3">{metadata.description || 'No description provided.'}</p>
            
            <div className="grid grid-cols-2 gap-2 mt-6">
              {attributes.filter(a => a.value).map((attr, i) => (
                <div key={i} className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-primary-500 uppercase font-bold">{attr.trait_type}</div>
                  <div className="text-sm font-bold text-white truncate">{attr.value}</div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}