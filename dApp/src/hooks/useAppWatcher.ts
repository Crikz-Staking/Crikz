// src/hooks/useAppWatcher.ts
import { useEffect } from 'react';
import { useAccount, useBlockNumber } from 'wagmi';
import { toast } from 'react-hot-toast';

export function useAppWatcher() {
  const { address, isConnected, chainId } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // 1. Monitor Network Alignment
  useEffect(() => {
    if (isConnected && chainId !== 97) {
      // Prevent spamming toasts if possible, but this is a critical alert
      toast.error("Wrong Network. Please switch to BSC Testnet.", { id: 'net-error' });
    }
  }, [isConnected, chainId]);

  // 2. Monitor Liveness
  useEffect(() => {
    if (blockNumber) {
      // Console log removed to clean up dev tools
      // console.log(`[Watcher] Synced Block: ${blockNumber}`);
    }
  }, [blockNumber]);

  // 3. User Session Tracker
  useEffect(() => {
    if (address) {
      localStorage.setItem('crikz_user', address);
    }
  }, [address]);
}