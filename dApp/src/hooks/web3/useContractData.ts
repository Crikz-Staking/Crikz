import { useEffect } from 'react';
import { useReadContracts, useBlockNumber, useAccount } from 'wagmi';
import { CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI, BASE_APR } from '@/config/index';
import type { Order } from '@/types';

export function useContractData() {
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const isConnected = !!address;
  
  // Use a null address for read calls when not connected to prevent errors
  const targetAddress = address || '0x0000000000000000000000000000000000000000';

  const { data, refetch, isLoading: isReadLoading, isRefetching } = useReadContracts({
    contracts: [
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'balanceOf', args: [targetAddress] },
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'allowance', args: [targetAddress, CRIKZ_TOKEN_ADDRESS] },
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'totalCreatorReputation', args: [targetAddress] },
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'creatorYieldDebt', args: [targetAddress] },
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'getActiveOrders', args: [targetAddress] },
      // Index 5: Global Production Fund
      { address: CRIKZ_TOKEN_ADDRESS, abi: CRIKZ_TOKEN_ABI, functionName: 'productionFund', args: [] },
    ],
    query: { 
      enabled: true, // Always enable to fetch global stats even if wallet not connected (if needed)
      staleTime: 5000 
    }
  });

  const balance = data?.[0]?.result as bigint | undefined;
  const allowance = data?.[1]?.result as bigint | undefined;
  const totalReputation = data?.[2]?.result as bigint | undefined;
  const yieldDebt = data?.[3]?.result as bigint | undefined;
  const activeOrders = data?.[4]?.result as Order[] | undefined;
  
  // Parse Global Fund Data
  const productionFundData = data?.[5]?.result as [bigint, bigint, bigint, bigint] | undefined;
  const globalFund = productionFundData ? {
    balance: productionFundData[0],
    totalReputation: productionFundData[1],
    yieldPerRep: productionFundData[2],
    lastUpdate: productionFundData[3]
  } : undefined;

  // Calculate Pending Yield (User Side)
  // Logic: (UserRep * GlobalAccumulatedYield) - UserYieldDebt
  let pendingYield = 0n;
  if (totalReputation && globalFund && yieldDebt !== undefined) {
    const theoreticalShare = (totalReputation * globalFund.yieldPerRep) / 1_000_000_000_000_000_000n; // Div by WAD
    if (theoreticalShare > yieldDebt) {
      pendingYield = theoreticalShare - yieldDebt;
    }
  }

  // Refetch on new blocks
  useEffect(() => {
    if (blockNumber) refetch();
  }, [blockNumber, refetch]);

  return {
    balance,
    allowance,
    activeOrders,
    totalReputation,
    yieldDebt,
    pendingYield,
    globalFund, // Export global data
    currentAPR: BASE_APR,
    refetchAll: refetch,
    isLoading: isReadLoading || isRefetching,
    isConnected
  };
}