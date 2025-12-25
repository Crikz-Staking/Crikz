import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';

export function useUserNFTs() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Get Balance
  const { data: balance } = useReadContract({
    address: CRIKZ_NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address } // Only run if connected
  });

  const fetchNFTs = useCallback(async () => {
    if (!address || !balance || !publicClient) return;
    
    // Prevent fetching if balance is huge to avoid lag
    const count = Number(balance);
    if (count === 0) {
      setNfts([]);
      return;
    }

    setIsLoading(true);
    try {
      // 2. Batch fetch Token IDs (Limit to 12 recent items for performance)
      // In production, use TheGraph or a backend indexer.
      const limit = Math.min(count, 12); 
      const tokenIdxPromises = [];
      
      // Fetch in reverse (newest first)
      for (let i = count - 1; i >= count - limit; i--) {
        tokenIdxPromises.push(
          publicClient.readContract({
            address: CRIKZ_NFT_ADDRESS,
            abi: CRIKZ_NFT_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [address, BigInt(i)]
          })
        );
      }

      const tokenIds = await Promise.all(tokenIdxPromises) as bigint[];

      // 3. Batch fetch URIs
      const uriPromises = tokenIds.map(id => 
        publicClient.readContract({
          address: CRIKZ_NFT_ADDRESS,
          abi: CRIKZ_NFT_ABI,
          functionName: 'tokenURI',
          args: [id]
        })
      );

      const uris = await Promise.all(uriPromises) as string[];

      // 4. Format Data
      const formatted = tokenIds.map((id, i) => {
        let meta = { name: `Artifact #${id}`, image: '', attributes: [], collection: 'General' };
        try {
          const parsed = JSON.parse(uris[i]);
          meta = { ...meta, ...parsed };
        } catch (e) { /* Ignore parsing errors */ }
        
        return { id, uri: uris[i], ...meta };
      });

      setNfts(formatted);
    } catch (e) {
      console.error("NFT Fetch Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [address, balance, publicClient]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return { nfts, isLoading, balance: Number(balance || 0), refetch: fetchNFTs };
}