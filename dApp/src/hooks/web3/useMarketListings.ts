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
}

// BSC Testnet RPCs are strict. We must fetch in small chunks.
const CHUNK_SIZE = 2000n; 
const MAX_HISTORY_BLOCKS = 200000n; // Approx 7 days of history

export function useMarketListings() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [auctions, setAuctions] = useState<AuctionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    
    const publicClient = usePublicClient();
    const { data: currentBlock } = useBlockNumber();
    const isFetching = useRef(false);

    const addLog = (msg: string) => setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

    // Helper to fetch events in chunks to avoid "Limit Exceeded"
    const fetchEventsInChunks = async (eventName: string, fromBlock: bigint, toBlock: bigint) => {
        let allLogs: any[] = [];
        let cursor = fromBlock;

        while (cursor < toBlock) {
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
                await new Promise(r => setTimeout(r, 50)); 
            } catch (e) {
                console.warn(`Chunk failed ${cursor}-${end}, retrying...`);
                // Simple retry once
                try {
                    const logs = await publicClient!.getContractEvents({
                        address: NFT_MARKETPLACE_ADDRESS,
                        abi: NFT_MARKETPLACE_ABI,
                        eventName: eventName as any,
                        fromBlock: cursor,
                        toBlock: end
                    });
                    allLogs = [...allLogs, ...logs];
                } catch (e2) {
                    addLog(`Failed to fetch ${eventName} chunk ${cursor}-${end}`);
                }
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

            addLog(`Starting Deep Scan: Block ${startBlock} to ${endBlock}`);

            // Fetch all relevant events in parallel but chunked internally
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

            addLog(`Scan Complete. Processing ${listedLogs.length} Listings, ${auctionCreatedLogs.length} Auctions...`);

            // --- 1. PROCESS AUCTIONS (Priority) ---
            const activeAuctions = new Map<string, AuctionItem>();

            auctionCreatedLogs.forEach(log => {
                const args = log.args as any;
                if (args.seller && args.nftContract && args.tokenId) {
                    const key = `${args.nftContract.toLowerCase()}-${args.tokenId.toString()}`;
                    activeAuctions.set(key, {
                        id: key,
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
                        // Only update if bid is higher (logs are chronological usually, but good to check)
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
            const activeListings = new Map<string, Listing>();

            listedLogs.forEach(log => {
                const args = log.args as any;
                if (args.seller && args.nftContract && args.tokenId) {
                    const key = `${args.nftContract.toLowerCase()}-${args.tokenId.toString()}`;
                    
                    // CONFLICT CHECK: If item is currently in an active auction, ignore the fixed listing
                    if (activeAuctions.has(key)) {
                        return;
                    }

                    activeListings.set(key, {
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

            setListings(Array.from(activeListings.values()));
            setAuctions(Array.from(activeAuctions.values()));
            addLog(`Success: ${activeListings.size} Listings, ${activeAuctions.size} Auctions active.`);

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

    return { listings, auctions, isLoading, error, debugLogs, refresh: fetchMarketData };
}