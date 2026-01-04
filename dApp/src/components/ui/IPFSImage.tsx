import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import { getGatewayUrl, IPFS_GATEWAYS } from '@/lib/ipfs-service';

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
    // Reset state when prop changes
    setHasError(false);
    setIsLoading(true);
    setGatewayIndex(0);

    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Initial Load
    const url = getGatewayUrl(src, 0);
    setCurrentSrc(url);

  }, [src]);

  const handleError = () => {
    const nextIndex = gatewayIndex + 1;
    
    // Try next gateway if available
    if (nextIndex < IPFS_GATEWAYS.length && !src.startsWith('http')) {
      setGatewayIndex(nextIndex);
      const nextUrl = getGatewayUrl(src, nextIndex);
      console.log(`[IPFSImage] Retrying with gateway ${nextIndex}: ${nextUrl}`);
      setCurrentSrc(nextUrl);
    } else {
      // All gateways failed
      console.error(`[IPFSImage] Failed to load image: ${src}`);
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
        <AlertTriangle size={24} className="mb-2 opacity-50 text-amber-500" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Load Failed</span>
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