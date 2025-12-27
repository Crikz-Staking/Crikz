import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import type { Address } from 'viem';

export function useUserNFTs() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: balance } = useReadContract({
    address: CRIKZ_NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const fetchNFTs = useCallback(async () => {
    if (!address || !balance || !publicClient) return;
    
    const count = Number(balance);
    if (count === 0) {
      setNfts([]);
      return;
    }

    setIsLoading(true);
    try {
      const limit = Math.min(count, 12);
      const tokenIdxPromises = [];
      
      for (let i = count - 1; i >= count - limit; i--) {
        tokenIdxPromises.push(
          publicClient.readContract({
            address: CRIKZ_NFT_ADDRESS,
            abi: CRIKZ_NFT_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [address as Address, BigInt(i)],
          })
        );
      }

      const tokenIds = await Promise.all(tokenIdxPromises) as bigint[];

      const uriPromises = tokenIds.map(id => 
        publicClient.readContract({
          address: CRIKZ_NFT_ADDRESS,
          abi: CRIKZ_NFT_ABI,
          functionName: 'tokenURI',
          args: [id],
        })
      );

      const uris = await Promise.all(uriPromises) as string[];

      const formatted = tokenIds.map((id, i) => {
        let meta = { 
          name: `Artifact #${id}`, 
          image: '', 
          attributes: [] as Array<{ trait_type: string; value: string }>,
          collection: 'General' 
        };
        try {
          const parsed = JSON.parse(uris[i]);
          meta = { ...meta, ...parsed };
        } catch (e) { /* Ignore */ }
        
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