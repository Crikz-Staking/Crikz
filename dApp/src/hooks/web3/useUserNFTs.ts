import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';

export function useUserNFTs() {
  const { address } = useAccount();
  
  // 1. Get Balance
  const { data: balance } = useReadContract({
    address: CRIKZ_NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  });

  // 2. Prepare calls for tokenOfOwnerByIndex
  const balanceNum = balance ? Number(balance) : 0;
  
  // Limit to first 20 to prevent excessive RPC calls in this demo
  const fetchCount = Math.min(balanceNum, 20); 
  const indexCalls = Array.from({ length: fetchCount }, (_, i) => ({
    address: CRIKZ_NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [address!, BigInt(i)]
  }));

  const { data: tokenIds } = useReadContracts({
    contracts: indexCalls,
    query: { enabled: fetchCount > 0 }
  });

  // 3. Prepare calls for tokenURI
  const validTokenIds = tokenIds?.map(r => r.result).filter(Boolean) as bigint[] || [];
  
  const uriCalls = validTokenIds.map(id => ({
    address: CRIKZ_NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'tokenURI',
    args: [id]
  }));

  const { data: tokenURIs, isLoading } = useReadContracts({
    contracts: uriCalls,
    query: { enabled: validTokenIds.length > 0 }
  });

  // 4. Combine Data
  const [nfts, setNfts] = useState<any[]>([]);

  useEffect(() => {
    if (!tokenIds || !tokenURIs) return;

    const formatted = validTokenIds.map((id, i) => {
      const uri = tokenURIs[i]?.result as string;
      let metadata = { name: `Artifact #${id}`, image: '', attributes: [] };
      
      try {
        if (uri && uri.startsWith('{')) {
           metadata = JSON.parse(uri);
        } else if (uri) {
           // Handle external IPFS fetching here if needed
           // For now assume logic stores JSON string directly or handle manually
        }
      } catch (e) { console.error("Error parsing metadata", e); }

      return {
        id: id,
        uri: uri,
        ...metadata
      };
    });
    setNfts(formatted);
  }, [tokenIds, tokenURIs]);

  return { nfts, isLoading, balance: balanceNum };
}