// src/hooks/web3/useRealNFTIndexer.ts
import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import { useCollectionManager } from './useCollectionManager';
import { useMarketListings } from './useMarketListings';

export interface RichNFT {
  uniqueKey: string;
  id: bigint;
  contract: string;
  name: string;
  image: string;
  collectionId: string;
  status: 'wallet' | 'listed' | 'auction';
  metadata: any;
}

export function useRealNFTIndexer() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { itemMapping, importedItems } = useCollectionManager();
  const { listings, auctions } = useMarketListings(); 
  
  const [nfts, setNfts] = useState<RichNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Get Balance of Native Contract
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CRIKZ_NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined
  });

  const fetchIndexer = useCallback(async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    try {
        const tasks = [];
        const processedKeys = new Set<string>();

        // A. Fetch Native NFTs in Wallet
        const nativeCount = Number(balance || 0n);
        for (let i = 0; i < nativeCount; i++) {
            tasks.push(async () => {
                try {
                    const id = await publicClient.readContract({
                        address: CRIKZ_NFT_ADDRESS,
                        abi: CRIKZ_NFT_ABI,
                        functionName: 'tokenOfOwnerByIndex',
                        args: [address, BigInt(i)]
                    });
                    return processNFTData(CRIKZ_NFT_ADDRESS, id, 'wallet');
                } catch { return null; }
            });
        }

        // B. Fetch Items in Auction (Escrowed)
        // Filter auctions where seller == user
        const myAuctions = auctions.filter(a => a.seller.toLowerCase() === address.toLowerCase() && a.isActive);
        myAuctions.forEach(auction => {
            tasks.push(async () => {
                return processNFTData(auction.nftContract, auction.tokenId, 'auction');
            });
        });

        // C. Fetch Imported NFTs
        importedItems.forEach(item => {
            tasks.push(async () => {
                try {
                    const owner = await publicClient.readContract({
                        address: item.contract as `0x${string}`,
                        abi: [{name:'ownerOf',type:'function',inputs:[{name:'tokenId',type:'uint256'}],outputs:[{name:'',type:'address'}],stateMutability:'view'}],
                        functionName: 'ownerOf',
                        args: [BigInt(item.tokenId)]
                    }) as string;

                    if (owner.toLowerCase() === address.toLowerCase()) {
                        return processNFTData(item.contract, BigInt(item.tokenId), 'wallet');
                    }
                    return null;
                } catch { return null; }
            });
        });

        // Resolve all
        const results = await Promise.all(tasks.map(t => t()));
        const validResults = results.filter(n => n !== null) as RichNFT[];
        
        // Deduplicate (in case logic overlaps)
        const uniqueResults = validResults.filter(item => {
            if (processedKeys.has(item.uniqueKey)) return false;
            processedKeys.add(item.uniqueKey);
            return true;
        });

        setNfts(uniqueResults);

    } catch (e) {
        console.error("Indexer Error", e);
    } finally {
        setIsLoading(false);
    }
  }, [address, balance, publicClient, importedItems, listings, auctions]);

  const processNFTData = async (contract: string, id: bigint, status: 'wallet' | 'auction'): Promise<RichNFT> => {
      // FIX 1: Ensure publicClient is defined before usage
      if (!publicClient) throw new Error("Public client not initialized");

      let meta = { name: `Item #${id}`, image: '', attributes: [] };
      let uri = '';
      
      try {
          uri = await publicClient.readContract({
            address: contract as `0x${string}`,
            abi: CRIKZ_NFT_ABI,
            functionName: 'tokenURI',
            args: [id]
          }) as string;

          const httpUrl = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
          const res = await fetch(httpUrl);
          meta = await res.json();
      } catch (e) {}

      const key = `${contract.toLowerCase()}-${id.toString()}`;
      const colId = itemMapping[key] || 'default';

      // Check if listed in Fixed Price Market (Status override)
      // FIX 2: Explicitly type finalStatus to allow 'listed' assignment
      let finalStatus: 'wallet' | 'listed' | 'auction' = status;
      
      if (status === 'wallet') {
          const isListed = listings.some(l => 
              l.nftContract.toLowerCase() === contract.toLowerCase() && 
              l.tokenId === id && 
              l.seller.toLowerCase() === address?.toLowerCase()
          );
          if (isListed) finalStatus = 'listed';
      }

      return {
          uniqueKey: key,
          id,
          contract,
          name: meta.name || `Item #${id}`,
          image: meta.image?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') || '',
          collectionId: colId,
          status: finalStatus,
          metadata: meta
      };
  };

  useEffect(() => {
      fetchIndexer();
  }, [fetchIndexer]);

  return { nfts, isLoading, refetch: () => { refetchBalance(); fetchIndexer(); } };
}