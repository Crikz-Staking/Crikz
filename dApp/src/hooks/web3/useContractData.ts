import { useEffect } from 'react';
import { useReadContracts, useAccount } from 'wagmi';
import { CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI, BASE_APR } from '@/config/index';
import type { Order } from '@/types';

export function useContractData() {
  const { address } = useAccount();
  
  const targetAddress = address || '0x0000000000000000000000000000000000000000';

  const { data, refetch, isLoading: isReadLoading, isRefetching } = useReadContracts({
    contracts: [
      { 
        address: CRIKZ_TOKEN_ADDRESS, 
        abi: CRIKZ_TOKEN_ABI, 
        functionName: 'balanceOf', 
        args: [targetAddress] 
      },
      { 
        address: CRIKZ_TOKEN_ADDRESS, 
        abi: CRIKZ_TOKEN_ABI, 
        functionName: 'allowance', 
        args: [targetAddress, CRIKZ_TOKEN_ADDRESS] 
      },
      { 
        address: CRIKZ_TOKEN_ADDRESS, 
        abi: CRIKZ_TOKEN_ABI, 
        functionName: 'totalCreatorReputation', 
        args: [targetAddress] 
      },
      { 
        address: CRIKZ_TOKEN_ADDRESS, 
        abi: CRIKZ_TOKEN_ABI, 
        functionName: 'creatorYieldDebt', 
        args: [targetAddress] 
      },
      { 
        address: CRIKZ_TOKEN_ADDRESS, 
        abi: CRIKZ_TOKEN_ABI, 
        functionName: 'getActiveOrders', 
        args: [targetAddress] 
      },
      { 
        address: CRIKZ_TOKEN_ADDRESS,
        abi: CRIKZ_TOKEN_ABI,
        functionName: 'productionFund',
        args: []
      },
    ],
    query: {
      enabled: true,
      // STABILITY FIX: Increased staleTime to 30s to prevent UI flickering
      // The data will be considered "fresh" for 30 seconds, preventing loading spinners
      staleTime: 30000, 
      refetchInterval: 30000, // Poll every 30s
      refetchOnWindowFocus: false, // Prevent refetching just because user clicked the window
    }
  });

  const balance = data?.[0]?.result as bigint | undefined;
  const allowance = data?.[1]?.result as bigint | undefined;
  const totalReputation = data?.[2]?.result as bigint | undefined;
  const yieldDebt = data?.[3]?.result as bigint | undefined;
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
      globalFund = {
        balance: (fundRaw as any).balance || 0n,
        totalReputation: (fundRaw as any).totalReputation || 0n,
        yieldPerRep: (fundRaw as any).accumulatedYieldPerReputation || 0n,
        lastUpdate: (fundRaw as any).lastUpdateTime || 0n
      };
    }
  }

  let pendingYield = 0n;
  if (totalReputation && globalFund.yieldPerRep && yieldDebt !== undefined) {
    const theoreticalShare = (totalReputation * globalFund.yieldPerRep) / 1_000_000_000_000_000_000n;
    if (theoreticalShare > yieldDebt) {
      pendingYield = theoreticalShare - yieldDebt;
    }
  }

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
    // Only show loading on initial load, not on background refetches
    isLoading: isReadLoading, 
    isConnected: !!address
  };
}