// src/hooks/useContractWrite.ts
import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import toast from 'react-hot-toast';
import { CRIKZ_TOKEN_ADDRESS, CRIKZ_TOKEN_ABI } from '../config';

export function useContractWrite(refetchAll: () => void) {
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError } = useWaitForTransactionReceipt({ hash });

  const isPending = isWritePending || isConfirming;

  useEffect(() => {
    if (isConfirmed) {
      setTxStatus('success');
      toast.success('Transaction successful!');
      refetchAll();
    }
  }, [isConfirmed, refetchAll]);

  useEffect(() => {
    if (isError) {
      setTxStatus('error');
      toast.error('Transaction failed');
    }
  }, [isError]);

  const createOrder = async (amount: string, orderType: number, allowance: bigint | undefined) => {
    try {
      const val = parseEther(amount || '0');
      if (val === 0n) {
        toast.error('Please enter an amount');
        return;
      }

      if (!allowance || allowance < val) {
        setTxStatus('pending');
        writeContract({
          address: CRIKZ_TOKEN_ADDRESS,
          abi: CRIKZ_TOKEN_ABI,
          functionName: 'approve',
          args: [CRIKZ_TOKEN_ADDRESS, val]
        });
        toast.loading('Approving tokens...');
      } else {
        setTxStatus('pending');
        writeContract({
          address: CRIKZ_TOKEN_ADDRESS,
          abi: CRIKZ_TOKEN_ABI,
          functionName: 'createOrder',
          args: [val, orderType]
        });
        toast.loading('Creating production order...');
      }
    } catch (error) {
      toast.error('Invalid amount');
      setTxStatus('error');
    }
  };

  const completeOrder = async (index: number) => {
    setTxStatus('pending');
    writeContract({
      address: CRIKZ_TOKEN_ADDRESS,
      abi: CRIKZ_TOKEN_ABI,
      functionName: 'completeOrder',
      args: [BigInt(index)]
    });
    toast.loading('Completing order...');
  };

  const claimYield = async () => {
    setTxStatus('pending');
    writeContract({
      address: CRIKZ_TOKEN_ADDRESS,
      abi: CRIKZ_TOKEN_ABI,
      functionName: 'claimYield'
    });
    toast.loading('Claiming yield...');
  };

  const fundPool = async (amount: string, allowance: bigint | undefined) => {
    try {
      const val = parseEther(amount || '0');
      if (val === 0n) {
        toast.error('Please enter an amount');
        return;
      }

      if (!allowance || allowance < val) {
        setTxStatus('pending');
        writeContract({
          address: CRIKZ_TOKEN_ADDRESS,
          abi: CRIKZ_TOKEN_ABI,
          functionName: 'approve',
          args: [CRIKZ_TOKEN_ADDRESS, val]
        });
        toast.loading('Approving tokens...');
      } else {
        setTxStatus('pending');
        writeContract({
          address: CRIKZ_TOKEN_ADDRESS,
          abi: CRIKZ_TOKEN_ABI,
          functionName: 'fundProductionPool',
          args: [val]
        });
        toast.loading('Funding production pool...');
      }
    } catch (error) {
      toast.error('Invalid amount');
      setTxStatus('error');
    }
  };

  return {
    createOrder,
    completeOrder,
    claimYield,
    fundPool,
    isPending,
    txHash: hash,
    txStatus
  };
}