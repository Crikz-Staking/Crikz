import { useState, useEffect, useRef } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { toast } from 'react-hot-toast';
import { InitProgressReport } from "@mlc-ai/web-llm";

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
  
  const [loadProgress, setLoadProgress] = useState<string>('');
  const [isModelReady, setIsModelReady] = useState(false);

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
    
    initialBrain.setInitProgressCallback((report: InitProgressReport) => {
        setLoadProgress(report.text);
        if (report.progress === 1) {
            setIsModelReady(true);
            setLoadProgress('');
        }
    });

    setBrain(initialBrain);
    
    initialBrain.initLLM().catch(e => {
        console.error(e);
        setLoadProgress("Error: WebGPU not supported or Model failed.");
    });

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

  // Stub for compatibility
  const restoreMemory = async (snapshot: MemorySnapshot) => {
      console.log("Restore requested for", snapshot.id);
      toast.success("Restore functionality coming in v2.1");
  };

  // Stub for compatibility
  const updateDrives = (drives: any) => {
      console.log("Drives updated", drives);
  };

  // Stub for compatibility
  const toggleNeuralLink = (active: boolean) => {
      console.log("Neural link toggled", active);
  };

  return {
    messages, 
    sendMessage, 
    crystallize,
    restoreMemory, // Added back
    updateDrives, // Added back
    toggleNeuralLink, // Added back
    isThinking, 
    isSyncing,
    loadProgress, 
    isModelReady,
    brainStats: brain ? brain.getStats() : null,
    needsSave: brain ? brain.needsCrystallization() : false,
    isOwner: !!address,
    // Legacy props to prevent crashes if accessed
    uploadFile: () => {},
    resetBrain: () => {},
    trainConcept: () => {},
    simpleTrain: () => {},
    logs: [], // Logs are now internal to brain state if needed, or can be exposed later
    syncWithBlockchain: async () => {},
    initialLoading: false,
    isSynced: true
  };
}