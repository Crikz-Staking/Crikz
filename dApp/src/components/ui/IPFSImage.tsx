import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { IPFS_GATEWAYS } from '@/lib/ipfs-service';

interface IPFSImageProps {
  src: string;
  alt: string;
  className?: string;
}

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

    setHasError(false);
    setIsLoading(true);
    setGatewayIndex(0);

    // Handle HTTP/Blob directly
    if (src.startsWith('http') || src.startsWith('blob:')) {
      setCurrentSrc(src);
      return;
    }

    // Handle IPFS
    const cid = src.replace('ipfs://', '');
    setCurrentSrc(`${IPFS_GATEWAYS[0]}${cid}`);

  }, [src]);

  const handleError = () => {
    const nextIndex = gatewayIndex + 1;
    
    if (nextIndex < IPFS_GATEWAYS.length) {
      const cid = src.replace('ipfs://', '');
      setGatewayIndex(nextIndex);
      setCurrentSrc(`${IPFS_GATEWAYS[nextIndex]}${cid}`);
    } else {
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