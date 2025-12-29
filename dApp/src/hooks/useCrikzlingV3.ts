import { useState, useEffect, useRef } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { toast } from 'react-hot-toast';

import { CrikzlingBrainV3 } from '@/lib/brain/crikzling-brain-v3';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { CRIKZLING_MEMORY_ADDRESS } from '@/config/index';
import { useContractData } from '@/hooks/web3/useContractData';
import { MemorySnapshot } from './web3/useMemoryTimeline';

export function useCrikzlingV3() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [brain, setBrain] = useState<CrikzlingBrainV3 | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot' | 'system', content: string, timestamp: number}[]>([]);
  
  const [isThinking, setIsThinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Always ready with API
  const isModelReady = true;
  const loadProgress = "";

  const { balance, activeOrders, totalReputation, globalFund } = useContractData();
  const dappContextRef = useRef<any>(undefined);

  useEffect(() => {
    dappContextRef.current = {
      user_balance: balance,
      active_orders_count: activeOrders?.length || 0,
      total_reputation: totalReputation,
      global_total_reputation: globalFund?.totalReputation,
    };
  }, [balance, activeOrders, totalReputation]);

  useEffect(() => {
    if (brain) return;

    const initialBrain = new CrikzlingBrainV3(
        undefined, 
        undefined, 
        publicClient,
        CRIKZLING_MEMORY_ADDRESS as `0x${string}`
    );
    
    setBrain(initialBrain);
  }, [publicClient]);

  const sendMessage = async (text: string) => {
    if (!brain || isThinking) return;
    
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);

    try {
      const { response, actionPlan } = await brain.process(text, !!address, dappContextRef.current);
      
      setMessages(prev => [...prev, { role: 'bot', content: response, timestamp: Date.now() }]);
      
      if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') {
          crystallize();
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'system', content: "Cognitive Failure.", timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
    }
  };

  const crystallize = async () => {
    if (!brain || !address) return;
    setIsSyncing(true);
    const toastId = toast.loading('Crystallizing Memory...');

    try {
        const exportStr = brain.exportFullState();
        const blob = new Blob([exportStr], { type: 'application/json' });
        const file = new File([blob], `crikz_mem_${Date.now()}.json`);
        
        await uploadToIPFS(file);
        
        toast.success('Memory Saved to Chain!', { id: toastId });
        brain.clearUnsavedCount();
    } catch (e) {
        toast.error('Save Failed', { id: toastId });
    } finally {
        setIsSyncing(false);
    }
  };

  // Stubs
  const restoreMemory = async (snapshot: MemorySnapshot) => {};
  const updateDrives = (drives: any) => {};
  const toggleNeuralLink = (active: boolean) => {};

  return {
    messages, 
    sendMessage, 
    crystallize,
    restoreMemory,
    updateDrives,
    toggleNeuralLink,
    isThinking, 
    isSyncing,
    loadProgress, 
    isModelReady,
    brainStats: brain ? brain.getStats() : null,
    needsSave: brain ? brain.needsCrystallization() : false,
    isOwner: !!address,
    uploadFile: () => {},
    resetBrain: () => {},
    trainConcept: () => {},
    simpleTrain: () => {},
    logs: [],
    syncWithBlockchain: async () => {},
    initialLoading: false,
    isSynced: true
  };
}