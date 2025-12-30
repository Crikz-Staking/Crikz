import { useState, useEffect, useCallback } from 'react';
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

export function useMarketListings() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [auctions, setAuctions] = useState<AuctionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    
    const publicClient = usePublicClient();
    const { data: currentBlock } = useBlockNumber();

    const addLog = (msg: string) => setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

    const fetchMarketData = useCallback(async () => {
        if (!publicClient) return;
        setIsLoading(true);
        setError(null);
        
        try {
            // 1. Determine Block Range (Scan last 49k blocks to be safe on BSC Testnet)
            const endBlock = currentBlock || await publicClient.getBlockNumber();
            const startBlock = endBlock - 49000n > 0n ? endBlock - 49000n : 0n;

            addLog(`Scanning blocks ${startBlock} to ${endBlock}...`);

            // 2. Fetch Events in Parallel
            const [
                listedLogs, soldLogs, canceledLogs,
                auctionCreatedLogs, bidLogs, auctionEndedLogs
            ] = await Promise.all([
                publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'ItemListed', fromBlock: startBlock }),
                publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'ItemSold', fromBlock: startBlock }),
                publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'ItemCanceled', fromBlock: startBlock }),
                publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'AuctionCreated', fromBlock: startBlock }),
                publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'NewBid', fromBlock: startBlock }),
                publicClient.getContractEvents({ address: NFT_MARKETPLACE_ADDRESS, abi: NFT_MARKETPLACE_ABI, eventName: 'AuctionEnded', fromBlock: startBlock }),
            ]);

            addLog(`Events Found: ${listedLogs.length} Listings, ${auctionCreatedLogs.length} Auctions`);

            // --- PROCESS AUCTIONS FIRST (Priority) ---
            const activeAuctions = new Map<string, AuctionItem>();

            auctionCreatedLogs.forEach(log => {
                const { seller, nftContract, tokenId, minPrice, endTime } = log.args;
                if (seller && nftContract && tokenId) {
                    const key = `${nftContract.toLowerCase()}-${tokenId.toString()}`;
                    activeAuctions.set(key, {
                        id: key,
                        nftContract: nftContract,
                        tokenId: tokenId,
                        seller: seller,
                        minPrice: minPrice || 0n,
                        highestBid: 0n,
                        highestBidder: '0x0000000000000000000000000000000000000000',
                        endTime: endTime || 0n,
                        isActive: true
                    });
                }
            });

            // Update Bids
            bidLogs.forEach(log => {
                const { nftContract, tokenId, amount, bidder } = log.args;
                if (nftContract && tokenId) {
                    const key = `${nftContract.toLowerCase()}-${tokenId.toString()}`;
                    const auction = activeAuctions.get(key);
                    if (auction) {
                        auction.highestBid = amount || 0n;
                        auction.highestBidder = bidder || auction.highestBidder;
                    }
                }
            });

            // Remove Ended Auctions
            auctionEndedLogs.forEach(log => {
                const { nftContract, tokenId } = log.args;
                if (nftContract && tokenId) {
                    const key = `${nftContract.toLowerCase()}-${tokenId.toString()}`;
                    activeAuctions.delete(key);
                }
            });

            // --- PROCESS FIXED LISTINGS ---
            const activeListings = new Map<string, Listing>();

            listedLogs.forEach(log => {
                const { seller, nftContract, tokenId, price } = log.args;
                if (seller && nftContract && tokenId) {
                    const key = `${nftContract.toLowerCase()}-${tokenId.toString()}`;
                    
                    // CONFLICT RESOLUTION: If item is in auction, ignore fixed listing
                    if (activeAuctions.has(key)) {
                        addLog(`Skipping fixed listing for ${key} (Active Auction detected)`);
                        return;
                    }

                    activeListings.set(key, {
                        seller: seller as `0x${string}`,
                        nftContract: nftContract as `0x${string}`,
                        tokenId: tokenId,
                        price: price || 0n
                    });
                }
            });

            // Remove Sold or Canceled
            [...soldLogs, ...canceledLogs].forEach(log => {
                const { nftContract, tokenId } = log.args;
                if (nftContract && tokenId) {
                    const key = `${nftContract.toLowerCase()}-${tokenId.toString()}`;
                    activeListings.delete(key);
                }
            });

            // --- FINAL VERIFICATION (Optional but recommended for consistency) ---
            // We trust the event log reconstruction for speed, but in production, 
            // you might want to multicall check `listings(contract, id)` to be 100% sure.
            
            setListings(Array.from(activeListings.values()));
            setAuctions(Array.from(activeAuctions.values()));
            addLog(`State Updated: ${activeListings.size} Active Listings, ${activeAuctions.size} Active Auctions`);

        } catch (e: any) {
            console.error("Market Data Fetch Error:", e);
            setError(e.message || "Failed to fetch market data");
            addLog(`CRITICAL ERROR: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [publicClient, currentBlock]);

    useEffect(() => {
        fetchMarketData();
    }, [fetchMarketData]);

    return { listings, auctions, isLoading, error, debugLogs, refresh: fetchMarketData };
}