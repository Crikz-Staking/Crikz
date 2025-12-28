import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI, NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI } from '@/config/index';
import { useCollectionManager } from './useCollectionManager';

export interface RichNFT {
  uniqueKey: string; // contract-id
  id: bigint;
  contract: string;
  name: string;
  image: string;
  collectionId: string;
  isListed: boolean;
  isImported: boolean;
  metadata: any;
}

export function useRealNFTIndexer() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { itemMapping, importedItems } = useCollectionManager();
  
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
        const nativeCount = Number(balance || 0n);
        const tasks = [];

        // A. Fetch Native NFTs
        for (let i = 0; i < nativeCount; i++) {
            tasks.push(async () => {
                try {
                    const id = await publicClient.readContract({
                        address: CRIKZ_NFT_ADDRESS,
                        abi: CRIKZ_NFT_ABI,
                        functionName: 'tokenOfOwnerByIndex',
                        args: [address, BigInt(i)]
                    });
                    
                    const uri = await publicClient.readContract({
                        address: CRIKZ_NFT_ADDRESS,
                        abi: CRIKZ_NFT_ABI,
                        functionName: 'tokenURI',
                        args: [id]
                    });

                    return processNFTData(CRIKZ_NFT_ADDRESS, id, uri, false);
                } catch { return null; }
            });
        }

        // B. Fetch Imported NFTs
        importedItems.forEach(item => {
            tasks.push(async () => {
                try {
                    // Generic ERC721 URI Check
                    const uri = await publicClient.readContract({
                        address: item.contract as `0x${string}`,
                        abi: [{name:'tokenURI',type:'function',inputs:[{name:'tokenId',type:'uint256'}],outputs:[{name:'',type:'string'}],stateMutability:'view'}],
                        functionName: 'tokenURI',
                        args: [BigInt(item.tokenId)]
                    }) as string;
                    
                    // Verify ownership again to filter sold items
                    const owner = await publicClient.readContract({
                        address: item.contract as `0x${string}`,
                        abi: [{name:'ownerOf',type:'function',inputs:[{name:'tokenId',type:'uint256'}],outputs:[{name:'',type:'address'}],stateMutability:'view'}],
                        functionName: 'ownerOf',
                        args: [BigInt(item.tokenId)]
                    }) as string;

                    if (owner.toLowerCase() !== address.toLowerCase()) return null;

                    return processNFTData(item.contract, BigInt(item.tokenId), uri, true);
                } catch { return null; }
            });
        });

        // Resolve all
        const results = await Promise.all(tasks.map(t => t()));
        setNfts(results.filter(n => n !== null) as RichNFT[]);

    } catch (e) {
        console.error("Indexer Error", e);
    } finally {
        setIsLoading(false);
    }
  }, [address, balance, publicClient, importedItems]);

  const processNFTData = async (contract: string, id: bigint, uri: string, isImported: boolean): Promise<RichNFT> => {
      let meta = { name: `Item #${id}`, image: '', attributes: [] };
      try {
          const httpUrl = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
          const res = await fetch(httpUrl);
          meta = await res.json();
      } catch (e) {}

      const key = `${contract.toLowerCase()}-${id.toString()}`;
      // Map to collection from LocalStorage, default to 'default'
      const colId = itemMapping[key] || 'default';

      return {
          uniqueKey: key,
          id,
          contract,
          name: meta.name || `Item #${id}`,
          image: meta.image?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') || '',
          collectionId: colId,
          isListed: false, // Indexer focuses on wallet items
          isImported,
          metadata: meta
      };
  };

  useEffect(() => {
      fetchIndexer();
  }, [fetchIndexer]);

  return { nfts, isLoading, refetch: () => { refetchBalance(); fetchIndexer(); } };
}