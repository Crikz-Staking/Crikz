import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config/index';

export interface MemorySnapshot {
  id: number;
  timestamp: number;
  ipfsCid: string;
  conceptsCount: bigint;
  evolutionStage: string;
  triggerEvent: string;
  opsCount: number; 
}

export function useMemoryTimeline() {
  const publicClient = usePublicClient();
  const [timeline, setTimeline] = useState<MemorySnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimeline = async () => {
    if (!publicClient) return;
    setLoading(true);
    
    const snapshots: MemorySnapshot[] = [];
    let index = 0;
    let keepFetching = true;

    // Safety limit to prevent infinite loops if something goes wrong, 
    // though realistically it stops on the first error.
    const MAX_FETCH = 100; 

    try {
        while (keepFetching && index < MAX_FETCH) {
            try {
                // Try to read the specific index
                const data = await publicClient.readContract({
                    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
                    abi: CRIKZLING_MEMORY_ABI,
                    functionName: 'memoryTimeline',
                    args: [BigInt(index)]
                });

                if (data) {
                    // Parse result (Solidity generated getter returns array/tuple)
                    // Order: [timestamp, ipfsCid, conceptsCount, evolutionStage, triggerEvent]
                    const timestamp = Number(data[0]);
                    const ipfsCid = data[1];
                    const conceptsCount = data[2];
                    const evolutionStage = data[3];
                    const triggerEvent = data[4];
                    
                    let opsCount = 0;
                    if (triggerEvent && triggerEvent.includes('_')) {
                        opsCount = parseInt(triggerEvent.split('_')[1]) || 0;
                    }

                    snapshots.push({
                        id: index,
                        timestamp,
                        ipfsCid,
                        conceptsCount,
                        evolutionStage,
                        triggerEvent,
                        opsCount
                    });
                    
                    index++;
                } else {
                    keepFetching = false;
                }
            } catch (error) {
                // Contract reverted (Index out of bounds), so we reached the end of the array
                keepFetching = false;
            }
        }

        // Sort by ID descending (newest first)
        setTimeline(snapshots.sort((a, b) => b.id - a.id));

    } catch (e) {
        console.error("Timeline Fetch Critical Error:", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
      fetchTimeline();
  }, [publicClient]);

  return { timeline, loading, refresh: fetchTimeline };
}