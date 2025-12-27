import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CRIKZ_MEDIA_ADDRESS, CRIKZ_MEDIA_ABI } from '@/config/index';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export interface Web3MediaItem {
  id: bigint;
  author: string;
  cid: string;
  title: string;
  mediaType: number; // 0 = Video, 1 = Audio
  timestamp: bigint;
  tipsReceived: bigint;
}

export function useMediaRegistry() {
  const [mediaList, setMediaList] = useState<Web3MediaItem[]>([]);

  // 1. Read from Blockchain
  const { data, refetch, isLoading } = useReadContract({
    address: CRIKZ_MEDIA_ADDRESS as `0x${string}`,
    abi: CRIKZ_MEDIA_ABI,
    functionName: 'getAllMedia',
  });

  // 2. Write to Blockchain (Publish)
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash: txHash 
  });

  useEffect(() => {
    if (data) {
      // Sort by newest first (handling BigInt comparison)
      const sorted = [...(data as Web3MediaItem[])].sort((a, b) => {
        if (a.timestamp > b.timestamp) return -1;
        if (a.timestamp < b.timestamp) return 1;
        return 0;
      });
      setMediaList(sorted);
    }
  }, [data]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Media Registered on Blockchain!");
      refetch(); // Refresh list
    }
  }, [isConfirmed, refetch]);

  const publishToBlockchain = (cid: string, title: string, type: 'video' | 'audio') => {
    // Enum: 0 = VIDEO, 1 = AUDIO
    const typeInt = type === 'video' ? 0 : 1;
    
    writeContract({
      address: CRIKZ_MEDIA_ADDRESS as `0x${string}`,
      abi: CRIKZ_MEDIA_ABI,
      functionName: 'publishMedia',
      args: [cid, title, typeInt]
    });
  };

  return {
    mediaList,
    isLoading,
    publishToBlockchain,
    isPublishing: isPending,
    refresh: refetch
  };
}