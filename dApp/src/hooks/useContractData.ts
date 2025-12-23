// src/hooks/useContractData.ts
import { useEffect, useMemo } from 'react';
import { useReadContracts, useBlockNumber, useAccount } from 'wagmi';
import { CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI, BASE_APR } from '../config';
import type { Order } from '../types';

export function useContractData() {
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const isConnected = !!address;
  const targetAddress = address || '0x0000000000000000000000000000000000000000';

  // ==================== MULTICALL FETCHING ====================
  const { 
    data, 
    refetch, 
    isLoading: isReadLoading, 
    isRefetching 
  } = useReadContracts({
    contracts: [
      {
        address: CRIKZ_TOKEN_ADDRESS,
        abi: CRIKZ_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [targetAddress],
      },
      {
        address: CRIKZ_TOKEN_ADDRESS,
        abi: CRIKZ_TOKEN_ABI,
        functionName: 'allowance',
        args: [targetAddress, CRIKZ_TOKEN_ADDRESS],
      },
      {
        address: CRIKZ_TOKEN_ADDRESS,
        abi: CRIKZ_TOKEN_ABI,
        functionName: 'totalCreatorReputation',
        args: [targetAddress],
      },
      {
        address: CRIKZ_TOKEN_ADDRESS,
        abi: CRIKZ_TOKEN_ABI,
        functionName: 'creatorYieldDebt',
        args: [targetAddress],
      },
      {
        address: CRIKZ_TOKEN_ADDRESS,
        abi: CRIKZ_TOKEN_ABI,
        functionName: 'getActiveOrders',
        args: [targetAddress],
      },
    ],
    query: {
      enabled: isConnected,
      staleTime: 5000, 
    }
  });

  // ==================== DATA PARSING ====================
  // Safely access data using Optional Chaining (?.) to prevent black screen
  const balance = data?.[0]?.result as bigint | undefined;
  const allowance = data?.[1]?.result as bigint | undefined;
  const totalReputation = data?.[2]?.result as bigint | undefined;
  const yieldDebt = data?.[3]?.result as bigint | undefined;
  
  // NOTE: activeOrders is now at Index 4 (shifted up because productionFund was removed)
  const activeOrders = data?.[4]?.result as Order[] | undefined;

  // ==================== DERIVED STATE ====================
  // Without productionFund struct, we simply return 0 for pending yield for now
  // to respect the "remove productionFund" request while keeping the UI stable.
  const pendingYield = 0n;

  const currentAPR = BASE_APR;

  // Auto-refetch on new blocks
  useEffect(() => {
    if (blockNumber) {
      refetch();
    }
  }, [blockNumber, refetch]);

  return {
    balance,
    allowance,
    activeOrders,
    totalReputation,
    yieldDebt,
    pendingYield,
    currentAPR,
    refetchAll: refetch,
    isLoading: isReadLoading || isRefetching,
    isConnected
  };
}