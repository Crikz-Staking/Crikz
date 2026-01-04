import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface IPFSImageProps {
  src: string;
  alt: string;
  className?: string;
}

const GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];

export default function IPFSImage({ src, alt, className = "" }: IPFSImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    // If it's already a http link, just use it
    if (src.startsWith('http')) {
      setCurrentSrc(src);
      setLoading(true);
      return;
    }

    // Clean the CID
    const cid = src.replace('ipfs://', '');
    
    // Start with the first gateway
    setCurrentSrc(`${GATEWAYS[0]}${cid}`);
    setGatewayIndex(0);
    setLoading(true);
    setError(false);
  }, [src]);

  const handleError = () => {
    const nextIndex = gatewayIndex + 1;
    if (nextIndex < GATEWAYS.length) {
      // Try next gateway
      const cid = src.replace('ipfs://', '');
      setGatewayIndex(nextIndex);
      setCurrentSrc(`${GATEWAYS[nextIndex]}${cid}`);
    } else {
      // All gateways failed
      setError(true);
      setLoading(false);
    }
  };

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-white/5 text-gray-500 ${className}`}>
        <AlertCircle size={24} className="mb-2 opacity-50" />
        <span className="text-[10px] font-bold">Failed to Load</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
          <Loader2 size={24} className="animate-spin text-primary-500" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
}