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

// REDUCED CHUNK SIZE FOR STABILITY
const CHUNK_SIZE = 500n; 
const MAX_HISTORY_BLOCKS = 50000n; // Reduced scan range for speed

export function useMarketListings() {
    const [items, setItems] = useState<MarketItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    
    const publicClient = usePublicClient();
    const { data: currentBlock } = useBlockNumber();
    const isFetching = useRef(false);

    const addLog = (msg: string) => setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

    // Helper to fetch events in chunks
    const fetchEventsInChunks = async (eventName: string, fromBlock: bigint, toBlock: bigint) => {
        let allLogs: any[] = [];
        let cursor = fromBlock;
        let errors = 0;

        while (cursor < toBlock) {
            // Safety break if too many errors
            if (errors > 3) {
                addLog(`Aborting ${eventName} scan due to RPC errors.`);
                break;
            }

            const end = (cursor + CHUNK_SIZE) > toBlock ? toBlock : (cursor + CHUNK_SIZE);
            try {
                const logs = await publicClient!.getContractEvents({
                    address: NFT_MARKETPLACE_ADDRESS,
                    abi: NFT_MARKETPLACE_ABI,
                    eventName: eventName as any,
                    fromBlock: cursor,
                    toBlock: end
                });
                allLogs = [...allLogs, ...logs];
                // Small delay to be nice to the RPC
                await new Promise(r => setTimeout(r, 20)); 
            } catch (e) {
                console.warn(`Chunk failed ${cursor}-${end}`);
                errors++;
                // Skip this chunk and continue, don't crash the whole app
            }
            cursor = end + 1n;
        }
        return allLogs;
    };

    const fetchMarketData = useCallback(async () => {
        if (!publicClient || !currentBlock || isFetching.current) return;
        
        isFetching.current = true;
        setIsLoading(true);
        setError(null);
        
        try {
            const endBlock = currentBlock;
            const startBlock = endBlock - MAX_HISTORY_BLOCKS > 0n ? endBlock - MAX_HISTORY_BLOCKS : 0n;

            addLog(`Scanning ${startBlock} -> ${endBlock} (Chain: ${publicClient.chain.id})`);

            // Fetch all relevant events in parallel
            const [
                listedLogs, soldLogs, canceledLogs,
                auctionCreatedLogs, bidLogs, auctionEndedLogs
            ] = await Promise.all([
                fetchEventsInChunks('ItemListed', startBlock, endBlock),
                fetchEventsInChunks('ItemSold', startBlock, endBlock),
                fetchEventsInChunks('ItemCanceled', startBlock, endBlock),
                fetchEventsInChunks('AuctionCreated', startBlock, endBlock),
                fetchEventsInChunks('NewBid', startBlock, endBlock),
                fetchEventsInChunks('AuctionEnded', startBlock, endBlock),
            ]);

            addLog(`Processing ${listedLogs.length} Listings, ${auctionCreatedLogs.length} Auctions...`);

            // --- 1. PROCESS AUCTIONS (Priority) ---
            const activeAuctions = new Map<string, AuctionItem>();

            auctionCreatedLogs.forEach(log => {
                const args = log.args as any;
                if (args.seller && args.nftContract && args.tokenId) {
                    const key = `${args.nftContract.toLowerCase()}-${args.tokenId.toString()}`;
                    activeAuctions.set(key, {
                        id: key,
                        type: 'auction',
                        nftContract: args.nftContract,
                        tokenId: args.tokenId,
                        seller: args.seller,
                        minPrice: args.minPrice || 0n,
                        highestBid: 0n,
                        highestBidder: '0x0000000000000000000000000000000000000000',
                        endTime: args.endTime || 0n,
                        isActive: true
                    });
                }
            });

            // Apply Bids
            bidLogs.forEach(log => {
                const args = log.args as any;
                if (args.nftContract && args.tokenId) {
                    const key = `${args.nftContract.toLowerCase()}-${args.tokenId.toString()}`;
                    const auction = activeAuctions.get(key);
                    if (auction) {
                        if ((args.amount || 0n) > auction.highestBid) {
                            auction.highestBid = args.amount || 0n;
                            auction.highestBidder = args.bidder || auction.highestBidder;
                        }
                    }
                }
            });

            // Remove Ended Auctions
            auctionEndedLogs.forEach(log => {
                const args = log.args as any;
                if (args.nftContract && args.tokenId) {
                    const key = `${args.nftContract.toLowerCase()}-${args.tokenId.toString()}`;
                    activeAuctions.delete(key);
                }
            });

            // --- 2. PROCESS FIXED LISTINGS ---
            const activeListings = new Map<string, FixedItem>();

            listedLogs.forEach(log => {
                const args = log.args as any;
                if (args.seller && args.nftContract && args.tokenId) {
                    const key = `${args.nftContract.toLowerCase()}-${args.tokenId.toString()}`;
                    
                    // CONFLICT CHECK: If item is currently in an active auction, ignore the fixed listing
                    if (activeAuctions.has(key)) {
                        return;
                    }

                    activeListings.set(key, {
                        id: key,
                        type: 'fixed',
                        seller: args.seller,
                        nftContract: args.nftContract,
                        tokenId: args.tokenId,
                        price: args.price || 0n
                    });
                }
            });

            // Remove Sold or Canceled
            [...soldLogs, ...canceledLogs].forEach(log => {
                const args = log.args as any;
                if (args.nftContract && args.tokenId) {
                    const key = `${args.nftContract.toLowerCase()}-${args.tokenId.toString()}`;
                    activeListings.delete(key);
                }
            });

            const allItems = [...Array.from(activeAuctions.values()), ...Array.from(activeListings.values())];
            setItems(allItems);
            addLog(`Success: ${allItems.length} Total Items.`);

        } catch (e: any) {
            console.error("Market Data Fetch Error:", e);
            setError(e.message || "Failed to fetch market data");
            addLog(`CRITICAL ERROR: ${e.message}`);
        } finally {
            setIsLoading(false);
            isFetching.current = false;
        }
    }, [publicClient, currentBlock]);

    useEffect(() => {
        fetchMarketData();
    }, [fetchMarketData]);

    return { 
        items, 
        listings: items.filter(i => i.type === 'fixed') as FixedItem[],
        auctions: items.filter(i => i.type === 'auction') as AuctionItem[],
        isLoading, 
        error, 
        debugLogs, 
        refresh: fetchMarketData 
    };
}