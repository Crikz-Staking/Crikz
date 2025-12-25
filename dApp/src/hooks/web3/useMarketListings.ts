import { useState, useEffect } from 'react';
import { usePublicClient, useBlockNumber } from 'wagmi';
import { NFT_MARKETPLACE_ABI, NFT_MARKETPLACE_ADDRESS } from '@/config/index';
import type { MarketItem } from '@/types';

export function useMarketListings() {
    const [listings, setListings] = useState<MarketItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const publicClient = usePublicClient();
    const { data: currentBlock } = useBlockNumber();

    const fetchListings = async () => {
        if (!publicClient || !currentBlock) return;
        setIsLoading(true);
        
        try {
            // Optimization: Only scan last 50,000 blocks to prevent RPC timeouts
            // In production, use TheGraph
            const fromBlock = currentBlock - 50000n > 0n ? currentBlock - 50000n : 0n;

            const logs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'ItemListed',
                fromBlock: fromBlock
            });

            const soldLogs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'ItemSold',
                fromBlock: fromBlock
            });

            const canceledLogs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'ItemCanceled',
                fromBlock: fromBlock
            });

            const activeMap = new Map<string, any>();

            logs.forEach(log => {
                const { seller, nftContract, tokenId, price } = log.args;
                if (nftContract && tokenId) {
                    const key = `${nftContract}-${tokenId}`;
                    activeMap.set(key, { seller, nftContract, tokenId, price, isActive: true });
                }
            });

            soldLogs.forEach(log => {
                const key = `${log.args.nftContract}-${log.args.tokenId}`;
                activeMap.delete(key);
            });

            canceledLogs.forEach(log => {
                const key = `${log.args.nftContract}-${log.args.tokenId}`;
                activeMap.delete(key);
            });

            const marketItems: MarketItem[] = Array.from(activeMap.values()).map((item: any) => ({
                id: item.tokenId,
                uri: '', 
                name: `Artifact #${item.tokenId}`,
                description: 'Listed on Crikz Market',
                image: '', 
                attributes: [],
                price: item.price,
                seller: item.seller,
                nftContract: item.nftContract,
                isActive: true
            }));

            setListings(marketItems);
        } catch (e) {
            console.error("Error fetching market events (likely RPC limit):", e);
            // Fallback for demo if RPC fails
            setListings([]); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, [publicClient, currentBlock]);

    return { listings, isLoading, refresh: fetchListings };
}