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
  opsCount: number; // Parsed from triggerEvent
}

export function useMemoryTimeline() {
  const publicClient = usePublicClient();
  const [timeline, setTimeline] = useState<MemorySnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimeline = async () => {
    if (!publicClient) return;
    setLoading(true);
    
    try {
        // 1. Get all 'MemoryCrystallized' events
        const logs = await publicClient.getContractEvents({
            address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
            abi: CRIKZLING_MEMORY_ABI,
            eventName: 'MemoryCrystallized',
            fromBlock: 0n // Or 'earliest'
        });

        // 2. Fetch details for each ID found in logs
        // Note: logs give us the ID. We then read the struct from the array.
        // Optimization: Run in parallel
        const promises = logs.map(async (log) => {
            const id = Number(log.args.snapshotId);
            
            const data = await publicClient.readContract({
                address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
                abi: CRIKZLING_MEMORY_ABI,
                functionName: 'memoryTimeline',
                args: [BigInt(id)]
            });

            // Parse result
            const timestamp = Number(data[0]);
            const ipfsCid = data[1];
            const conceptsCount = data[2];
            const evolutionStage = data[3];
            const triggerEvent = data[4];
            
            let opsCount = 0;
            if (triggerEvent && triggerEvent.includes('_')) {
                opsCount = parseInt(triggerEvent.split('_')[1]) || 0;
            }

            return {
                id,
                timestamp,
                ipfsCid,
                conceptsCount,
                evolutionStage,
                triggerEvent,
                opsCount
            };
        });

        const results = await Promise.all(promises);
        
        // Sort by ID descending (newest first)
        setTimeline(results.sort((a, b) => b.id - a.id));

    } catch (e) {
        console.error("Timeline Fetch Error:", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
      fetchTimeline();
  }, [publicClient]);

  return { timeline, loading, refresh: fetchTimeline };
}