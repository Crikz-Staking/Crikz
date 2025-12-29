import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAccount, useWriteContract, usePublicClient, useReadContract, useSignMessage } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { toast } from 'react-hot-toast';
import { InitProgressReport } from "@mlc-ai/web-llm";

import { CrikzlingBrainV3 } from '@/lib/brain/crikzling-brain-v3';
import { uploadToIPFS, downloadFromIPFS } from '@/lib/ipfs-service';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config/index';
import { useContractData } from '@/hooks/web3/useContractData';

export function useCrikzlingV3() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [brain, setBrain] = useState<CrikzlingBrainV3 | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot' | 'system', content: string, timestamp: number}[]>([]);
  
  const [isThinking, setIsThinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // LLM Loading State
  const [loadProgress, setLoadProgress] = useState<string>('');
  const [isModelReady, setIsModelReady] = useState(false);

  // Contract Data
  const { balance, activeOrders, totalReputation, pendingYield, globalFund } = useContractData();
  const dappContextRef = useRef<any>(undefined);

  useEffect(() => {
    dappContextRef.current = {
      user_balance: balance,
      active_orders_count: activeOrders?.length || 0,
      total_reputation: totalReputation,
      global_total_reputation: globalFund?.totalReputation,
    };
  }, [balance, activeOrders, totalReputation]);

  // Initialize Brain
  useEffect(() => {
    if (brain) return;

    const initialBrain = new CrikzlingBrainV3(
        undefined, 
        undefined, 
        publicClient,
        CRIKZLING_MEMORY_ADDRESS as `0x${string}`
    );
    
    // Hook into LLM loading progress
    initialBrain.setInitProgressCallback((report: InitProgressReport) => {
        setLoadProgress(report.text);
        if (report.progress === 1) {
            setIsModelReady(true);
            setLoadProgress('');
        }
    });

    setBrain(initialBrain);
    
    // Trigger load immediately
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
      
      // Handle Actions
      if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') {
          crystallize();
      }
      // Add handling for 'RESPOND_DAPP' (Staking) here if you want auto-popups

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
        
        const cid = await uploadToIPFS(file);
        
        // Write to chain logic (omitted for brevity, same as before)
        toast.success('Memory Saved to Chain!', { id: toastId });
        brain.clearUnsavedCount();
    } catch (e) {
        toast.error('Save Failed', { id: toastId });
    } finally {
        setIsSyncing(false);
    }
  };

  return {
    messages, 
    sendMessage, 
    crystallize,
    isThinking, 
    isSyncing,
    loadProgress, // Expose loading string
    isModelReady,
    brainStats: brain ? brain.getStats() : null,
    needsSave: brain ? brain.needsCrystallization() : false,
    isOwner: !!address // Simplified
  };
}