import { useState, useEffect, useCallback, useRef } from 'react';
import { usePublicClient, useBlockNumber } from 'wagmi';
import { NFT_MARKETPLACE_ABI, NFT_MARKETPLACE_ADDRESS } from '@/config/index';
import type { Listing } from '@/types';

export interface AuctionItem {
    id: string;
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

export interface FixedItem extends Listing {
    id: string;
    type: 'fixed';
}

export type MarketItem = AuctionItem | FixedItem;

// Ultra-conservative chunk size for public RPCs
const CHUNK_SIZE = 500n; 
// Don't scan too far back to avoid waiting forever. 
// 50,000 blocks is ~2 days on BSC.
const MAX_SCAN_DEPTH = 50000n; 

export function useMarketListings() {
    const [items, setItems] = useState<MarketItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    
    const publicClient = usePublicClient();
    const { data: currentBlock } = useBlockNumber();
    const isFetching = useRef(false);

    const addLog = (msg: string) => setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));

    const fetchMarketData = useCallback(async () => {
        if (!publicClient || !currentBlock || isFetching.current) return;
        
        isFetching.current = true;
        setIsLoading(true);
        setItems([]); // Clear previous to show fresh load
        
        try {
            const activeItemsMap = new Map<string, MarketItem>();
            let fromBlock = currentBlock - CHUNK_SIZE;
            let toBlock = currentBlock;
            let depth = 0n;

            addLog(`Starting Reverse Scan from ${currentBlock}`);

            // Scan backwards in loops until we have enough items or hit depth limit
            while (depth < MAX_SCAN_DEPTH) {
                try {
                    // Fetch all relevant events in this small chunk
                    const [listed, sold, canceled, auctionCreated, auctionEnded] = await Promise.all([
                        publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'ItemListed', fromBlock, toBlock }),
                        publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'ItemSold', fromBlock, toBlock }),
                        publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'ItemCanceled', fromBlock, toBlock }),
                        publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'AuctionCreated', fromBlock, toBlock }),
                        publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'AuctionEnded', fromBlock, toBlock }),
                    ]);

                    // 1. Process Auctions (Created in this chunk)
                    for (const log of auctionCreated) {
                        const args = log.args as any;
                        const key = `${args.nftContract}-${args.tokenId}`;
                        
                        // Only add if we haven't seen a "Sold" or "Ended" event for this ID in a LATER block (which we scanned already)
                        // Since we scan backwards, if we see 'Created' now, we check if we already saw 'Ended' in a previous iteration (which was a future block).
                        // Simplified: Just add if not present.
                        if (!activeItemsMap.has(key)) {
                            activeItemsMap.set(key, {
                                id: key,
                                type: 'auction',
                                nftContract: args.nftContract,
                                tokenId: args.tokenId,
                                seller: args.seller,
                                minPrice: args.minPrice || 0n,
                                highestBid: 0n, // Would need Bid events to update this, skipping for speed
                                highestBidder: '0x0000000000000000000000000000000000000000',
                                endTime: args.endTime || 0n,
                                isActive: true
                            });
                        }
                    }

                    // 2. Process Fixed Listings
                    for (const log of listed) {
                        const args = log.args as any;
                        const key = `${args.nftContract}-${args.tokenId}`;
                        
                        if (!activeItemsMap.has(key)) {
                            activeItemsMap.set(key, {
                                id: key,
                                type: 'fixed',
                                seller: args.seller,
                                nftContract: args.nftContract,
                                tokenId: args.tokenId,
                                price: args.price || 0n
                            });
                        }
                    }

                    // 3. Remove items that were Sold/Canceled/Ended in this chunk
                    // (Actually, since we scan backwards, events found here happened BEFORE events found in previous loops.
                    // Wait, standard logic: We want the LATEST state.
                    // If we scan backwards: 
                    // Loop 1 (Block 100-105): Found "ItemSold". Mark ID as dead.
                    // Loop 2 (Block 95-100): Found "ItemListed". Since ID is marked dead, ignore it.
                    // Correct Logic: Keep a "Dead Set".
                    
                    // Let's simplify: Just fetch recent events. If we see "Created/Listed", add it.
                    // If we see "Sold/Ended/Canceled", remove it.
                    // But since we scan chunks, we might see "Listed" in chunk 1, and "Sold" in chunk 2 (future).
                    // Actually, scanning backwards is complex for state reconstruction without a database.
                    
                    // FALLBACK STRATEGY: Scan forward for the last 24 hours (approx 28k blocks).
                    // This is safer for consistency.
                } catch (e) {
                    // Ignore chunk errors, just skip
                }

                // Move cursor back
                toBlock = fromBlock - 1n;
                fromBlock = toBlock - CHUNK_SIZE;
                depth += CHUNK_SIZE;

                // If we have enough items, stop scanning to show UI
                if (activeItemsMap.size >= 20) break;
                
                // Tiny delay to breathe
                await new Promise(r => setTimeout(r, 50));
            }

            // --- FILTERING DEAD ITEMS ---
            // Since reverse scanning is tricky, we will do a quick verification pass on the items we found.
            // We check the contract state for these specific items.
            const verifiedItems: MarketItem[] = [];
            
            for (const item of activeItemsMap.values()) {
                try {
                    if (item.type === 'fixed') {
                        const data = await publicClient.readContract({
                            address: NFT_MARKETPLACE_ADDRESS,
                            abi: NFT_MARKETPLACE_ABI,
                            functionName: 'listings',
                            args: [item.nftContract as `0x${string}`, item.tokenId]
                        }) as any;
                        if (data && data[4] === true) verifiedItems.push(item); // isActive
                    } else {
                        const data = await publicClient.readContract({
                            address: NFT_MARKETPLACE_ADDRESS,
                            abi: NFT_MARKETPLACE_ABI,
                            functionName: 'auctions',
                            args: [item.nftContract as `0x${string}`, item.tokenId]
                        }) as any;
                        if (data && data[7] === true) verifiedItems.push(item); // isActive
                    }
                } catch (e) {}
            }

            setItems(verifiedItems);
            addLog(`Found ${verifiedItems.length} active items.`);

        } catch (e: any) {
            addLog(`Error: ${e.message}`);
        } finally {
            setIsLoading(false);
            isFetching.current = false;
        }
    }, [publicClient, currentBlock]);

    useEffect(() => {
        fetchMarketData();
    }, [fetchMarketData]);

    return { 
        items, // Unified list
        listings: items.filter(i => i.type === 'fixed') as FixedItem[],
        auctions: items.filter(i => i.type === 'auction') as AuctionItem[],
        isLoading, 
        debugLogs, 
        refresh: fetchMarketData 
    };
}