// src/hooks/useContractWrite.ts
import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI } from '../config';
import toast from 'react-hot-toast';

export function useContractWrite(onSuccessCallback?: () => void) {
  const { address } = useAccount(); // Get current account
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  
  const { 
    writeContract, 
    data: writeData, 
    error: writeError,
    isPending: isWritePending 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Watch for Write Data (when user signs in wallet)
  useEffect(() => {
    if (writeData) {
      setTxHash(writeData);
      toast.loading('Transaction submitted...', { id: 'tx-toast' });
    }
  }, [writeData]);

  // Watch for Receipt (when block is mined)
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Confirmed!', { id: 'tx-toast' });
      setTxHash(undefined);
      if (onSuccessCallback) onSuccessCallback();
    }
    if (receiptError || writeError) {
      toast.error('Transaction failed.', { id: 'tx-toast' });
    }
  }, [isConfirmed, receiptError, writeError, onSuccessCallback]);

  const createOrder = (amount: string, orderType: number, currentAllowance: bigint = 0n) => {
    const amountWei = parseEther(amount);

    // Check Allowance
    if (currentAllowance < amountWei) {
        toast('Approving tokens...', { icon: '🔐' });
        writeContract({
            address: CRIKZ_TOKEN_ADDRESS,
            abi: CRIKZ_TOKEN_ABI,
            functionName: 'approve',
            args: [CRIKZ_TOKEN_ADDRESS, amountWei],
            account: address,
        } as any);
        return; 
    }

    // Call createOrder (matches Solidity)
    writeContract({
      address: CRIKZ_TOKEN_ADDRESS,
      abi: CRIKZ_TOKEN_ABI,
      functionName: 'createOrder',
      args: [amountWei, orderType],
      account: address,
    } as any);
  };

  const completeOrder = (index: number) => {
    writeContract({
      address: CRIKZ_TOKEN_ADDRESS,
      abi: CRIKZ_TOKEN_ABI,
      functionName: 'completeOrder',
      args: [BigInt(index)],
      account: address,
    } as any);
  };

  const claimYield = () => {
    writeContract({
      address: CRIKZ_TOKEN_ADDRESS,
      abi: CRIKZ_TOKEN_ABI,
      functionName: 'claimYield',
      args: [],
      account: address,
    } as any);
  };

  const fundPool = (amount: string, currentAllowance: bigint = 0n) => {
    const amountWei = parseEther(amount);
    if (currentAllowance < amountWei) {
        toast('Approving tokens...', { icon: '🔐' });
        writeContract({
            address: CRIKZ_TOKEN_ADDRESS,
            abi: CRIKZ_TOKEN_ABI,
            functionName: 'approve',
            args: [CRIKZ_TOKEN_ADDRESS, amountWei],
            account: address,
        } as any);
        return;
    }

    writeContract({
        address: CRIKZ_TOKEN_ADDRESS,
        abi: CRIKZ_TOKEN_ABI,
        functionName: 'fundProductionPool',
        args: [amountWei],
        account: address,
    } as any);
  };

  return {
    createOrder,
    completeOrder,
    claimYield,
    fundPool,
    isPending: isWritePending || isConfirming,
    txHash,
    txStatus: isConfirmed ? 'success' : (receiptError || writeError ? 'error' : 'idle')
  };
}