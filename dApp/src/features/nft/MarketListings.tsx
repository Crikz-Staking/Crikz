import React from 'react';
import { formatTokenAmount, shortenAddress } from '@/lib/utils';

interface Listing {
  seller: `0x${string}`;
  nftContract: `0x${string}`;
  tokenId: bigint;
  price: bigint;
}

interface MarketListingsProps {
  listings: Listing[];
  onBuy: (nftContract: string, tokenId: bigint, price: bigint) => void;
  isPending: boolean;
}

export default function MarketListings({ listings, onBuy, isPending }: MarketListingsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((item, idx) => (
        <div key={idx} className="glass-card p-4 rounded-2xl border border-white/10">
          <div className="aspect-square bg-white/5 rounded-xl mb-4 flex items-center justify-center text-4xl">
            🖼️
          </div>
          <h3 className="font-bold text-lg mb-1">Crikz NFT #{item.tokenId.toString()}</h3>
          <p className="text-sm text-gray-500 mb-4">Seller: {shortenAddress(item.seller)}</p>
          <div className="flex justify-between items-center">
            <span className="text-primary-500 font-bold">{formatTokenAmount(item.price)} CRIKZ</span>
            <button 
              onClick={() => onBuy(item.nftContract, item.tokenId, item.price)}
              disabled={isPending}
              className="px-4 py-2 bg-primary-500 text-black rounded-lg font-bold text-sm hover:bg-primary-400 disabled:opacity-50"
            >
              {isPending ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}