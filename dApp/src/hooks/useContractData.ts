// src/hooks/useContractData.ts
import { useEffect, useMemo } from 'react';
import {
  useReadContract,
  useBlockNumber
} from 'wagmi';
import { CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI, BASE_APR } from '../config';
import { calculatePendingYield } from '../utils/calculations';
import type { Order, ProductionFund } from '../types';

export function useContractData(address: `0x${string}` | undefined, blockNumber: bigint | undefined) {
  const isConnected = !!address;

  // Balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: isConnected }
  });

  // Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'allowance',
    args: [address || '0x0000000000000000000000000000000000000000', CRIKZ_TOKEN_ADDRESS],
    query: { enabled: isConnected }
  });

  // Active Orders
  const { data: activeOrders, refetch: refetchOrders } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'getActiveOrders',
    args: [address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: isConnected }
  }) as { data: Order[] | undefined; refetch: () => void };

  // Total Reputation
  const { data: totalReputation, refetch: refetchReputation } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'totalCreatorReputation',
    args: [address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: isConnected }
  });

  // Yield Debt
  const { data: yieldDebt, refetch: refetchYieldDebt } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'creatorYieldDebt',
    args: [address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: isConnected }
  });

  // Production Fund
  const { data: productionFund, refetch: refetchFund } = useReadContract({
    address: CRIKZ_TOKEN_ADDRESS,
    abi: CRIKZ_TOKEN_ABI,
    functionName: 'productionFund',
    query: { enabled: true }
  }) as { data: ProductionFund | undefined; refetch: () => void };

  // Calculate pending yield
  const pendingYield = useMemo(() => {
    if (!totalReputation || !productionFund || !yieldDebt) return 0n;
    return calculatePendingYield(
      totalReputation as bigint,
      productionFund.accumulatedYieldPerReputation,
      yieldDebt as bigint
    );
  }, [totalReputation, productionFund, yieldDebt, blockNumber]);

  // Current APR
  const currentAPR = useMemo(() => {
    if (!productionFund || productionFund.totalReputation === 0n) return 0;
    return BASE_APR;
  }, [productionFund]);

  // Refetch on block change
  useEffect(() => {
    if (blockNumber) {
      refetchOrders();
      refetchFund();
      refetchBalance();
      refetchReputation();
      refetchYieldDebt();
    }
  }, [blockNumber]);

  const refetchAll = () => {
    refetchBalance();
    refetchAllowance();
    refetchOrders();
    refetchReputation();
    refetchYieldDebt();
    refetchFund();
  };

  return {
    balance: balance as bigint | undefined,
    allowance: allowance as bigint | undefined,
    activeOrders,
    totalReputation: totalReputation as bigint | undefined,
    yieldDebt: yieldDebt as bigint | undefined,
    productionFund,
    pendingYield,
    currentAPR,
    refetchAll,
    isLoading: false
  };
}