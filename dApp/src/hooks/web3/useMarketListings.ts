import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { NFT_MARKETPLACE_ABI, NFT_MARKETPLACE_ADDRESS } from '@/config/index';

export interface AuctionItem {
    id: string;
    auctionId: bigint;
    nftContract: string;
    tokenId: bigint;
    seller: string;
    minPrice: bigint;
    highestBid: bigint;
    highestBidder: string;
    endTime: bigint;
    isActive: boolean;
    type: 'auction';
}

export interface FixedItem {
    id: string;
    listingId: bigint;
    seller: string;
    nftContract: string;
    tokenId: bigint;
    price: bigint;
    isActive: boolean;
    type: 'fixed';
}

export type MarketItem = AuctionItem | FixedItem;

export function useMarketListings() {
    const [items, setItems] = useState<MarketItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const publicClient = usePublicClient();

    const fetchMarketData = useCallback(async () => {
        if (!publicClient) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const [activeListings, activeAuctions] = await Promise.all([
                publicClient.readContract({
                    address: NFT_MARKETPLACE_ADDRESS,
                    abi: NFT_MARKETPLACE_ABI,
                    functionName: 'getActiveListings',
                }),
                publicClient.readContract({
                    address: NFT_MARKETPLACE_ADDRESS,
                    abi: NFT_MARKETPLACE_ABI,
                    functionName: 'getActiveAuctions',
                })
            ]);

            const parsedListings: FixedItem[] = (activeListings as any[]).map(l => ({
                id: `${l.nftContract}-${l.tokenId}`,
                listingId: l.listingId,
                seller: l.seller,
                nftContract: l.nftContract,
                tokenId: l.tokenId,
                price: l.price,
                isActive: l.isActive,
                type: 'fixed'
            }));

            const parsedAuctions: AuctionItem[] = (activeAuctions as any[]).map(a => ({
                id: `${a.nftContract}-${a.tokenId}`,
                auctionId: a.auctionId,
                nftContract: a.nftContract,
                tokenId: a.tokenId,
                seller: a.seller,
                minPrice: a.minPrice,
                highestBid: a.highestBid,
                highestBidder: a.highestBidder,
                endTime: a.endTime,
                isActive: a.isActive,
                type: 'auction'
            }));

            setItems([...parsedAuctions, ...parsedListings]);

        } catch (e: any) {
            console.error("Market Data Fetch Error:", e);
            setError("Failed to load market data.");
        } finally {
            setIsLoading(false);
        }
    }, [publicClient]);

    // Initial fetch only. No auto-polling here.
    useEffect(() => {
        fetchMarketData();
    }, [fetchMarketData]);

    return { 
        items, 
        listings: items.filter(i => i.type === 'fixed') as FixedItem[],
        auctions: items.filter(i => i.type === 'auction') as AuctionItem[],
        isLoading, 
        error, 
        refresh: fetchMarketData 
    };
}