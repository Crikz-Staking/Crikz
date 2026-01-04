import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface IPFSImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Priority Order: Pinata (Source) -> Cloudflare (Fast) -> IPFS.io (Canonical) -> Dweb (Backup)
const GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/'
];

export default function IPFSImage({ src, alt, className = "" }: IPFSImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Reset state when src changes
    setHasError(false);
    setIsLoading(true);
    setGatewayIndex(0);

    // If it's a normal URL (http/https), use it directly
    if (src.startsWith('http')) {
      setCurrentSrc(src);
      return;
    }

    // If it's IPFS, start with the first gateway
    const cid = src.replace('ipfs://', '');
    setCurrentSrc(`${GATEWAYS[0]}${cid}`);

  }, [src]);

  const handleError = () => {
    const nextIndex = gatewayIndex + 1;
    
    if (nextIndex < GATEWAYS.length) {
      // Try the next gateway
      const cid = src.replace('ipfs://', '');
      setGatewayIndex(nextIndex);
      setCurrentSrc(`${GATEWAYS[nextIndex]}${cid}`);
    } else {
      // All gateways failed
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[#1A1A24] text-gray-600 border border-white/5 ${className}`}>
        <ImageIcon size={24} className="mb-2 opacity-50" />
        <span className="text-[9px] font-bold uppercase tracking-wider">No Preview</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#1A1A24] ${className}`}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#1A1A24]">
          <Loader2 size={20} className="animate-spin text-primary-500" />
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
}