// src/components/NFTCard.tsx
import React, { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { motion } from 'framer-motion';
import { Info, ImageOff } from 'lucide-react';
import { CRIKZ_NFT_ABI, NFT_ADDRESS } from '../config';

interface NFTCardProps {
  index: number;
  viewMode: 'grid' | 'list';
}

export default function NFTCard({ index, viewMode }: NFTCardProps) {
  // 1. Get Token ID from Index
  const { data: tokenId } = useReadContract({
    address: NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'tokenByIndex',
    args: [BigInt(index)],
  });

  // 2. Get URI from Token ID
  const { data: tokenURI } = useReadContract({
    address: NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'tokenURI',
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId }
  });

  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tokenURI) {
      setLoading(true);
      // In a real app, fetch from IPFS. Here we try/catch typical fetch
      fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'))
        .then(res => res.json())
        .then(data => {
            setMetadata(data);
            setLoading(false);
        })
        .catch(() => {
            // If fetch fails (or simple URI string), just use placeholder
            setMetadata({ name: `Item #${tokenId}`, image: null });
            setLoading(false);
        });
    }
  }, [tokenURI, tokenId]);

  if (!tokenId) return null;

  const displayName = metadata?.name || `Artifact #${tokenId}`;
  const displayImage = metadata?.image ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl border border-white/10 overflow-hidden group cursor-pointer bg-[#15151A] hover:border-primary-500/50 transition-all ${viewMode === 'list' ? 'flex gap-4' : ''}`}
    >
      {/* Image Container */}
      <div className={`relative bg-black/50 overflow-hidden ${viewMode === 'grid' ? 'aspect-square' : 'w-32 h-32 shrink-0'}`}>
        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : displayImage ? (
           <img src={displayImage} alt={displayName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
             <ImageOff size={32} />
             <span className="text-[10px] mt-2">No Image</span>
           </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col justify-center flex-1">
        <div className="text-xs text-primary-500 mb-1 font-bold tracking-wider">CRIKZ NFT</div>
        <div className="text-sm font-bold text-white mb-2 truncate">{displayName}</div>
        
        <div className="mt-auto flex items-center justify-between">
           <span className="text-[10px] text-gray-500 font-mono">ID: {tokenId.toString()}</span>
           <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
             <Info size={14} />
           </button>
        </div>
      </div>
    </motion.div>
  );
}