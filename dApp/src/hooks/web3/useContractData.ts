import { useEffect } from 'react';
import { useReadContracts, useBlockNumber, useAccount } from 'wagmi';
import { CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI, BASE_APR } from '@/config/index';
import type { Order } from '@/types';

export function useContractData() {
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  
  const targetAddress = address || '0x0000000000000000000000000000000000000000';

  const { data, refetch, isLoading: isReadLoading, isRefetching } = useReadContracts({
    contracts: [
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'balanceOf', args: [targetAddress] },
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'allowance', args: [targetAddress, CRIKZ_TOKEN_ADDRESS] },
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'totalCreatorReputation', args: [targetAddress] },
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'creatorYieldDebt', args: [targetAddress] },
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'getActiveOrders', args: [targetAddress] },
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'productionFund', args: [] },
    ],
    query: { 
      enabled: true, 
      staleTime: 3000 // Reduced stale time for fresher data
    }
  });

  const balance = data?.[0]?.result as bigint | undefined;
  const allowance = data?.[1]?.result as bigint | undefined;
  const totalReputation = data?.[2]?.result as bigint | undefined;
  const yieldDebt = data?.[3]?.result as bigint | undefined;
  
  // SAFE PARSING: Ensure activeOrders is always an array
  const rawOrders = data?.[4]?.result;
  const activeOrders: Order[] = Array.isArray(rawOrders) 
    ? rawOrders.map((o: any) => ({
        amount: o.amount,
        reputation: o.reputation,
        orderType: o.orderType,
        startTime: o.startTime,
        duration: o.duration
      }))
    : [];
  
  const fundRaw = data?.[5]?.result;
  let globalFund = {
    balance: 0n,
    totalReputation: 0n,
    yieldPerRep: 0n,
    lastUpdate: 0n
  };

  if (fundRaw) {
    if (Array.isArray(fundRaw)) {
      globalFund = {
        balance: fundRaw[0],
        totalReputation: fundRaw[1],
        yieldPerRep: fundRaw[2],
        lastUpdate: fundRaw[3]
      };
    } else if (typeof fundRaw === 'object') {
        // Fallback for object return style
        globalFund = {
            balance: (fundRaw as any).balance || 0n,
            totalReputation: (fundRaw as any).totalReputation || 0n,
            yieldPerRep: (fundRaw as any).accumulatedYieldPerReputation || 0n,
            lastUpdate: (fundRaw as any).lastUpdateTime || 0n
        };
    }
  }

  // Pending Yield Calculation
  let pendingYield = 0n;
  if (totalReputation && globalFund.yieldPerRep && yieldDebt !== undefined) {
    const theoreticalShare = (totalReputation * globalFund.yieldPerRep) / 1_000_000_000_000_000_000n;
    if (theoreticalShare > yieldDebt) {
      pendingYield = theoreticalShare - yieldDebt;
    }
  }

  useEffect(() => {
    if (blockNumber) refetch();
  }, [blockNumber, refetch]);

  return {
    balance: balance || 0n,
    allowance: allowance || 0n,
    activeOrders,
    totalReputation: totalReputation || 0n,
    yieldDebt: yieldDebt || 0n,
    pendingYield,
    globalFund,
    currentAPR: BASE_APR,
    refetchAll: refetch,
    isLoading: isReadLoading || isRefetching,
    isConnected: !!address
  };
}