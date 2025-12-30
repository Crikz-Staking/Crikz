import { useState, useEffect } from 'react';
import { usePublicClient, useBlockNumber } from 'wagmi';
import { NFT_MARKETPLACE_ABI, NFT_MARKETPLACE_ADDRESS } from '@/config/index';
import type { Listing } from '@/types';

export interface AuctionItem {
    id: string; // unique key
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
    
    const publicClient = usePublicClient();
    const { data: currentBlock } = useBlockNumber();

    const fetchMarketData = async () => {
        if (!publicClient || !currentBlock) return;
        setIsLoading(true);
        
        try {
            // Scan last 50,000 blocks (approx 2-3 days on BSC)
            // For a production app, you would use a Subgraph or indexer database.
            const fromBlock = currentBlock - 50000n > 0n ? currentBlock - 50000n : 0n;

            // 1. Fetch Fixed Price Events
            const listedLogs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'ItemListed',
                fromBlock
            });
            
            const soldLogs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'ItemSold',
                fromBlock
            });
            
            const canceledLogs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'ItemCanceled',
                fromBlock
            });

            // 2. Fetch Auction Events
            const auctionCreatedLogs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'AuctionCreated',
                fromBlock
            });

            const bidLogs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'NewBid',
                fromBlock
            });

            const auctionEndedLogs = await publicClient.getContractEvents({
                address: NFT_MARKETPLACE_ADDRESS,
                abi: NFT_MARKETPLACE_ABI,
                eventName: 'AuctionEnded',
                fromBlock
            });

            // --- PROCESS FIXED LISTINGS ---
            const activeListings = new Map<string, Listing>();

            listedLogs.forEach(log => {
                const { seller, nftContract, tokenId, price } = log.args;
                if (seller && nftContract && tokenId && price) {
                    const key = `${nftContract.toLowerCase()}-${tokenId.toString()}`;
                    activeListings.set(key, {
                        seller: seller as `0x${string}`,
                        nftContract: nftContract as `0x${string}`,
                        tokenId: tokenId,
                        price: price
                    });
                }
            });

            // Remove sold or canceled
            [...soldLogs, ...canceledLogs].forEach(log => {
                const { nftContract, tokenId } = log.args;
                if (nftContract && tokenId) {
                    const key = `${nftContract.toLowerCase()}-${tokenId.toString()}`;
                    activeListings.delete(key);
                }
            });

            // --- PROCESS AUCTIONS ---
            const activeAuctions = new Map<string, AuctionItem>();

            auctionCreatedLogs.forEach(log => {
                const { seller, nftContract, tokenId, minPrice, endTime } = log.args;
                if (seller && nftContract && tokenId && minPrice && endTime) {
                    const key = `${nftContract.toLowerCase()}-${tokenId.toString()}`;
                    
                    // If an item goes to auction, remove it from fixed listings if it exists there
                    activeListings.delete(key);

                    activeAuctions.set(key, {
                        id: key,
                        nftContract: nftContract,
                        tokenId: tokenId,
                        seller: seller,
                        minPrice: minPrice,
                        highestBid: 0n,
                        highestBidder: '0x0000000000000000000000000000000000000000',
                        endTime: endTime,
                        isActive: true
                    });
                }
            });

            bidLogs.forEach(log => {
                const { nftContract, tokenId, amount, bidder } = log.args;
                if (nftContract && tokenId && amount && bidder) {
                    const key = `${nftContract.toLowerCase()}-${tokenId.toString()}`;
                    const auction = activeAuctions.get(key);
                    if (auction) {
                        auction.highestBid = amount;
                        auction.highestBidder = bidder;
                    }
                }
            });

            auctionEndedLogs.forEach(log => {
                const { nftContract, tokenId } = log.args;
                if (nftContract && tokenId) {
                    const key = `${nftContract.toLowerCase()}-${tokenId.toString()}`;
                    activeAuctions.delete(key);
                }
            });

            setListings(Array.from(activeListings.values()));
            setAuctions(Array.from(activeAuctions.values()));

        } catch (e) {
            console.error("Market Data Fetch Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketData();
        // Poll every 10 seconds
        const interval = setInterval(fetchMarketData, 10000);
        return () => clearInterval(interval);
    }, [publicClient, currentBlock]);

    return { listings, auctions, isLoading, refresh: fetchMarketData };
}