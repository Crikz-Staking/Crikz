// src/hooks/useContractData.ts
import { useEffect, useMemo } from 'react';
import { useReadContracts, useBlockNumber, useAccount } from 'wagmi';
import { CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI, BASE_APR } from '../config';
import { calculatePendingYield } from '../utils/calculations';
import type { Order, ProductionFund } from '../types';

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
  const balance = data?.[0]?.result as bigint | undefined;
  const allowance = data?.[1]?.result as bigint | undefined;
  const totalReputation = data?.[2]?.result as bigint | undefined;
  const yieldDebt = data?.[3]?.result as bigint | undefined;
  
  // FIX: Manually map the tuple to the object
  const fundResult = data?.[4]?.result as [bigint, bigint, bigint, bigint] | undefined;
  const productionFund: ProductionFund | undefined = fundResult ? {
      balance: fundResult[0],
      totalReputation: fundResult[1],
      accumulatedYieldPerReputation: fundResult[2],
      lastUpdateTime: fundResult[3]
  } : undefined;

  const activeOrders = data?.[5]?.result as Order[] | undefined;

  // ==================== DERIVED STATE ====================
  const pendingYield = useMemo(() => {
    if (!totalReputation || !yieldDebt) return 0n;
    return calculatePendingYield(
      totalReputation,
      productionFund.accumulatedYieldPerReputation,
      yieldDebt
    );
  }, [totalReputation, productionFund, yieldDebt]);

  const currentAPR = useMemo(() => {
    if (!productionFund || productionFund.totalReputation === 0n) return 0;
    return BASE_APR;
  }, [productionFund]);

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
    productionFund,
    pendingYield,
    currentAPR,
    refetchAll: refetch,
    isLoading: isReadLoading || isRefetching,
    isConnected
  };
}