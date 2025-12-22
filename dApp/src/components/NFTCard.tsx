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
  const { data: tokenId } = useReadContract({
    address: NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'tokenByIndex',
    args: [BigInt(index)],
  });

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
      fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'))
        .then(res => res.json())
        .then(data => {
            setMetadata(data);
            setLoading(false);
        })
        .catch(() => {
            setMetadata({ name: `Artifact #${tokenId}`, image: null });
            setLoading(false);
        });
    }
  }, [tokenURI, tokenId]);

  if (tokenId === undefined) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl border border-white/10 overflow-hidden group bg-[#15151A] hover:border-primary-500/50 transition-all ${viewMode === 'list' ? 'flex gap-4' : ''}`}
    >
      <div className={`relative bg-black/50 overflow-hidden ${viewMode === 'grid' ? 'aspect-square' : 'w-32 h-32 shrink-0'}`}>
        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : metadata?.image ? (
           <img src={metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} alt="NFT" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
             <ImageOff size={32} />
           </div>
        )}
      </div>
      <div className="p-4 flex flex-col justify-center flex-1">
        <div className="text-xs text-primary-500 mb-1 font-bold">CRIKZ ARTIFACT</div>
        <div className="text-sm font-bold text-white mb-2 truncate">{metadata?.name || `Artifact #${tokenId}`}</div>
        <div className="mt-auto flex items-center justify-between">
           <span className="text-[10px] text-gray-500 font-mono">ID: {tokenId.toString()}</span>
           <Info size={14} className="text-gray-500" />
        </div>
      </div>
    </motion.div>
  );
}