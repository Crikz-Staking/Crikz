import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAccount, useWriteContract, usePublicClient, useReadContract, useSignMessage } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { toast } from 'react-hot-toast';

import { CrikzlingBrainV3 } from '@/lib/brain/crikzling-brain-v3';
import { ThoughtProcess, DAppContext, InternalDrives } from '@/lib/brain/types';
import { AtomicConcept } from '@/lib/crikzling-atomic-knowledge';
import { uploadToIPFS, downloadFromIPFS } from '@/lib/ipfs-service';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config/index';
import { useContractData } from '@/hooks/web3/useContractData';

export function useCrikzlingV3() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { signMessageAsync } = useSignMessage();
  
  const [brain, setBrain] = useState<CrikzlingBrainV3 | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot' | 'system', content: string, timestamp: number}[]>([]);
  
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentThought, setCurrentThought] = useState<ThoughtProcess | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); 
  
  const [initialLoading, setInitialLoading] = useState(false);

  // --- CONTRACT DATA ---
  const { balance, activeOrders, totalReputation, pendingYield, globalFund } = useContractData();
  const dappContextRef = useRef<DAppContext | undefined>(undefined);

  useEffect(() => {
    dappContextRef.current = {
      user_balance: balance,
      active_orders_count: activeOrders?.length || 0,
      total_reputation: totalReputation,
      pending_yield: pendingYield,
      global_fund_balance: globalFund?.balance,
      global_total_reputation: globalFund?.totalReputation,
      current_block: BigInt(Date.now()),
    };
  }, [balance, activeOrders, totalReputation, pendingYield, globalFund]);

  const { data: contractOwner } = useReadContract({
    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
    abi: [{ name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }] as const,
    functionName: 'owner',
  });

  // We keep this hook for passive updates, but we also manually refetch in the sync function
  const { data: latestSnapshot, refetch: refetchSnapshot } = useReadContract({
    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
    abi: CRIKZLING_MEMORY_ABI,
    functionName: 'getLatestMemory',
    query: { 
        retry: false, // Don't retry if it reverts (Genesis state)
    } 
  });

  // Helper to parse raw contract data
  const parseSnapshot = (data: any) => {
      if (!data) return null;
      // Handle both array and object returns depending on wagmi version/abi
      const cid = data.ipfsCid || data[1];
      const count = data.conceptsCount || data[2];
      const stage = data.evolutionStage || data[3];
      const trigger = data.triggerEvent || data[4];
      return { cid, count, stage, trigger };
  };

  const isOwner = useMemo(() => {
    if (!address || !contractOwner) return false;
    return address.toLowerCase() === (contractOwner as string).toLowerCase();
  }, [address, contractOwner]);

  const sessionId = useMemo(() => {
    if (address) return address;
    let stored = localStorage.getItem('crikz_guest_id');
    if (!stored) {
      stored = `guest_${crypto.randomUUID()}`;
      localStorage.setItem('crikz_guest_id', stored);
    }
    return stored;
  }, [address]);

  const { writeContractAsync } = useWriteContract();

  const thoughtCallback = useCallback((thought: ThoughtProcess | null) => {
    setCurrentThought(thought);
    setForceUpdate(prev => prev + 1); 
  }, []);

  // --- 1. BRAIN INITIALIZATION ---
  useEffect(() => {
    if (!sessionId) return;
    if (brain) return;

    const diffStateJson = localStorage.getItem(`crikz_brain_diff_${sessionId}`) || undefined;
    
    const initialBrain = new CrikzlingBrainV3(
        undefined, 
        diffStateJson, 
        publicClient,
        CRIKZLING_MEMORY_ADDRESS as `0x${string}`
    );
    
    initialBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(initialBrain);
    
    setMessages([{ 
        role: 'system', 
        content: 'SYSTEM ONLINE. Neural Link ready for synchronization.', 
        timestamp: Date.now() 
    }]);
    
  }, [sessionId, publicClient]);

  // --- 2. MANUAL SYNC WITH SIGNATURE ---
  const syncWithBlockchain = useCallback(async () => {
    if (!brain) return;

    try {
      setInitialLoading(true);

      // 1. Request Signature FIRST (Interaction Layer)
      await signMessageAsync({ 
        message: `Authenticate Neural Uplink\nTimestamp: ${Date.now()}\nRequest: Sync State` 
      });

      toast.loading("Scanning Blockchain Layer...", { duration: 2000, id: 'sync-load' });
      
      // 2. Fetch Fresh Data (Network Layer)
      const { data: freshData, error } = await refetchSnapshot();
      
      // 3. Logic Layer
      if (freshData) {
          const { cid, count, trigger } = parseSnapshot(freshData)!;
          
          let blockchainOps = 0;
          if (trigger && trigger.includes('_')) {
             blockchainOps = parseInt(trigger.split('_')[1]) || 0;
          }

          if (cid && cid.length > 5) {
              const url = downloadFromIPFS(cid);
              const response = await fetch(url);
              if (!response.ok) throw new Error("IPFS Fetch Failed");
              
              const remoteJson = await response.json();

              if (remoteJson) {
                  // Authority Check: Ensure blockchain Ops count overrides local
                  if (blockchainOps > 0) {
                      remoteJson.totalInteractions = blockchainOps;
                  }

                  brain.mergeState(remoteJson);
                  
                  // Clear local overrides after successful sync
                  localStorage.removeItem(`crikz_brain_diff_${sessionId}`);
                  
                  toast.success("Neural Link Established", { id: 'sync-load' });
                  setMessages(prev => [
                      ...prev, 
                      { 
                          role: 'system', 
                          content: `[UPLINK ESTABLISHED]\n\nBlockchain Nodes: ${count}\nBlockchain Ops: ${blockchainOps}\n\nGraph Synchronized.`, 
                          timestamp: Date.now() 
                      }
                  ]);
                  setForceUpdate(p => p + 1);
              }
          }
      } else {
          // Handle Empty/Genesis State gracefully
          // Usually caused by a fresh contract deployment with no memories yet
          toast.success("Genesis State Confirmed", { id: 'sync-load' });
          setMessages(prev => [
              ...prev, 
              { 
                  role: 'system', 
                  content: `[GENESIS STATE]\nNo history found on blockchain.\nStarting fresh neural pathway.`, 
                  timestamp: Date.now() 
              }
          ]);
      }
    } catch (error: any) {
      console.error("Sync Process:", error);
      if (error.message?.includes("User rejected")) {
          toast.error("Authentication Cancelled", { id: 'sync-load' });
      } else {
          toast.error("Network Error: Could not reach Neural Net", { id: 'sync-load' });
      }
    } finally {
      setInitialLoading(false);
    }
  }, [brain, signMessageAsync, refetchSnapshot, sessionId]);

  // --- SAVE DIFF ---
  useEffect(() => {
      if (brain && sessionId) {
          const diff = brain.exportDiffState();
          localStorage.setItem(`crikz_brain_diff_${sessionId}`, diff);
      }
  }, [forceUpdate, brain, sessionId]);

  // --- HEARTBEAT ---
  useEffect(() => {
    if (!brain) return;
    const tickRate = 8000; 
    const heartbeat = setInterval(() => {
      if (!isThinking && !isTyping && !isSyncing) {
        brain.tick(dappContextRef.current).then(() => setForceUpdate(p => p + 1));
      }
    }, tickRate); 
    return () => clearInterval(heartbeat);
  }, [brain, isThinking, isTyping, isSyncing]);

  const typeStreamResponse = async (fullText: string) => {
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'bot', content: '', timestamp: Date.now() }]);
    const chars = fullText.split('');
    let currentText = '';
    return new Promise<void>((resolve) => {
        const typeChar = (index: number) => {
            if (index >= chars.length) { setIsTyping(false); resolve(); return; }
            currentText += chars[index];
            setMessages(prev => {
                const newMsgs = [...prev];
                if (newMsgs.length > 0) newMsgs[newMsgs.length - 1].content = currentText;
                return newMsgs;
            });
            setTimeout(() => typeChar(index + 1), 10);
        };
        typeChar(0);
    });
  };

  const crystallize = async () => {
    if (!brain || !address) { toast.error("Wallet missing"); return; }
    if (!publicClient) { toast.error("Client not ready"); return; }
    
    setIsSyncing(true); 
    const toastId = toast.loading('Exporting state...');

    try {
        const exportStr = brain.exportFullState();
        const blob = new Blob([exportStr], { type: 'application/json' });
        const file = new File([blob], `crikz_mem.json`);
        
        const cid = await uploadToIPFS(file);
        const state = brain.getState();
        const conceptCount = BigInt(Object.keys(state.concepts).length);
        const trigger = `SYNC_${state.totalInteractions}`;

        const hash = await writeContractAsync({
            address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
            abi: CRIKZLING_MEMORY_ABI,
            functionName: 'crystallizeMemory',
            args: [cid, conceptCount, state.evolutionStage, trigger],
            account: address,
            chain: bscTestnet
        });

        await publicClient!.waitForTransactionReceipt({ hash, confirmations: 1 });

        // IMPORTANT: Clear local diffs because we just saved EVERYTHING to chain
        brain.clearUnsavedCount();
        if (sessionId) localStorage.removeItem(`crikz_brain_diff_${sessionId}`);
        
        await refetchSnapshot(); 
        
        toast.success('Saved to Chain!', { id: toastId });
        setMessages(prev => [...prev, { role: 'system', content: `[SYSTEM] State Saved.\nCID: ${cid}\nOps: ${state.totalInteractions}`, timestamp: Date.now() }]);

    } catch (e: any) {
        console.error(e);
        toast.error('Save Failed', { id: toastId });
    } finally {
        setIsSyncing(false); 
    }
  };

  const sendMessage = async (text: string) => {
    if (!brain || isThinking || initialLoading) return;
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);

    try {
      const { response, actionPlan } = await brain.process(text, isOwner, dappContextRef.current);
      setIsThinking(false);
      setCurrentThought(null);
      await typeStreamResponse(response);
      if (actionPlan?.type === 'EXECUTE_COMMAND_SAVE') setTimeout(() => crystallize(), 500); 
      if (actionPlan?.type === 'EXECUTE_COMMAND_RESET') resetBrain(); 
    } catch (e) {
      console.error(e);
      setIsThinking(false);
      setCurrentThought(null);
      typeStreamResponse("Error processing input.");
    }
  };

  const resetBrain = () => {
    if (!brain || !sessionId) return;
    brain.wipe();
    localStorage.removeItem(`crikz_brain_diff_${sessionId}`);
    setForceUpdate(prev => prev + 1);
  };

  const uploadFile = async (content: string) => {
    if (!brain) return;
    setIsThinking(true);
    const count = brain.assimilateFile(content);
    setIsThinking(false);
    typeStreamResponse(`Assimilated ${count} concepts.`);
  };

  const updateDrives = (drives: InternalDrives) => {
      if (brain) { brain.updateDrives(drives); setForceUpdate(p => p + 1); }
  };
  const trainConcept = (concept: AtomicConcept) => {
      if (brain) { brain.injectConcept(concept); setForceUpdate(p => p + 1); }
  };
  const simpleTrain = (text: string) => {
      if (brain) { brain.simpleTrain(text); setForceUpdate(p => p + 1); }
  };
  
  const toggleNeuralLink = (active: boolean) => {
      if (brain) { 
          brain.toggleNeuralLink(active); 
          if(active) brain.optimizeNeuralGraph();
          setForceUpdate(p => p + 1); 
      }
  };

  const stats = brain ? brain.getStats() : undefined;
  const logs = brain ? brain.getHistory(isOwner) : [];

  return {
    messages, sendMessage, uploadFile, crystallize, resetBrain, updateDrives, trainConcept, simpleTrain, toggleNeuralLink,
    syncWithBlockchain, initialLoading,
    needsSave: brain?.needsCrystallization() || false, isSyncing, 
    brainStats: {
      stage: stats?.stage || 'GENESIS',
      nodes: stats?.nodes || 0,
      relations: stats?.relations || 0,
      unsaved: stats?.unsaved || 0,
      drives: stats?.drives || { curiosity: 0, stability: 0, efficiency: 0, social: 0, energy: 0 },
      connectivity: stats?.connectivity || { isConnected: false, bandwidthUsage: 0, stamina: 100, lastWebSync: 0 }, 
      memories: stats?.memories || { short: 0, mid: 0, long: 0, blockchain: 0 },
      interactions: stats?.interactions || 0,
      learningRate: stats?.learningRate || 0.15,
      lastBlockchainSync: stats?.lastBlockchainSync || 0,
    },
    logs, isThinking, isTyping, currentThought, isOwner, dappConnected: !!address,
  };
}