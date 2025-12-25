import React from 'react';
import { formatTokenAmount, shortenAddress } from '@/lib/utils';
import { Listing } from '@/types';

interface MarketListingsProps {
  listings: Listing[];
  onBuy: (nftContract: string, tokenId: bigint, price: bigint) => void;
  isPending: boolean;
  isLoading: boolean;
}

export default function MarketListings({ listings, onBuy, isPending, isLoading }: MarketListingsProps) {
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading marketplace...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="glass-card p-20 rounded-3xl border border-white/10 text-center">
        <h3 className="text-2xl font-black text-white mb-2">No Active Listings</h3>
        <p className="text-gray-400">Be the first to list your NFT on the marketplace!</p>
      </div>
    );
  }

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