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
import { MemorySnapshot } from './web3/useMemoryTimeline';

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
  const [hasHydrated, setHasHydrated] = useState(false); 

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

  const { data: latestSnapshot, refetch: refetchSnapshot } = useReadContract({
    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
    abi: CRIKZLING_MEMORY_ABI,
    functionName: 'getLatestMemory',
    query: { retry: false } 
  });

  // --- IMPROVED PARSER ---
  const parseSnapshot = (data: any) => {
      if (!data) return null;
      // Handle both Array (Wagmi default) and Object returns
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

  // --- BRAIN INITIALIZATION ---
  useEffect(() => {
    if (!sessionId) return;
    if (brain) return;

    // Load local diff if available
    const diffStateJson = localStorage.getItem(`crikz_brain_diff_${sessionId}`) || undefined;
    
    // Initialize Brain
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
        content: 'Hello, I am Crikzling. Please synchronize my neural state from the blockchain to begin.', 
        timestamp: Date.now() 
    }]);
    
  }, [sessionId, publicClient]);

  // --- ROBUST SYNC FUNCTION ---
  const syncWithBlockchain = useCallback(async () => {
    if (!brain) return;

    try {
      setInitialLoading(true);
      
      // 1. Authenticate Intent (Optional but good for UX flow)
      await signMessageAsync({ 
        message: `Authenticate Neural Uplink\nTimestamp: ${Date.now()}\nRequest: Sync State` 
      });

      toast.loading("Fetching On-Chain Data...", { duration: 2000, id: 'sync' });
      
      const { data: freshData, error } = await refetchSnapshot();
      
      if (error || !freshData) {
          toast.error("Genesis State (No History)", { id: 'sync' });
          setHasHydrated(true); 
          setMessages(prev => [...prev, { role: 'system', content: `[GENESIS STATE] Blockchain memory is empty. Starting fresh.`, timestamp: Date.now() }]);
          return;
      }

      const { cid, count, trigger } = parseSnapshot(freshData)!;
      
      // 2. PARSE OPS FROM TRIGGER STRING
      let blockchainOps = 0;
      if (trigger && typeof trigger === 'string') {
         // Looks for digits at the end of a string like "SYNC_250" or "manual_100"
         const match = trigger.match(/(\d+)$/);
         if (match) {
             blockchainOps = parseInt(match[1], 10);
         }
      }

      if (cid && cid.length > 5) {
          const url = downloadFromIPFS(cid);
          const response = await fetch(url);
          if (!response.ok) throw new Error("IPFS Fetch Failed");
          
          const remoteJson = await response.json();

          if (remoteJson) {
              // 3. FORCE OPS UPDATE if blockchain has higher count, or if IPFS missed it
              if (blockchainOps > (remoteJson.totalInteractions || 0)) {
                  remoteJson.totalInteractions = blockchainOps;
              }

              // Merge into Brain
              brain.mergeState(remoteJson);
              
              const stats = brain.getStats();
              
              localStorage.removeItem(`crikz_brain_diff_${sessionId}`);
              setHasHydrated(true); 
              
              toast.success(`Synced: ${stats.nodes} Nodes | ${stats.interactions} Ops`, { id: 'sync' });
              
              setMessages(prev => [
                  ...prev, 
                  { 
                      role: 'system', 
                      content: `[UPLINK ESTABLISHED]\nNeural Nodes: ${stats.nodes}\nInteractions: ${stats.interactions}\nCID: ${cid.substring(0,8)}...`, 
                      timestamp: Date.now() 
                  }
              ]);
              setForceUpdate(p => p + 1);
          }
      } else {
          toast.error("Invalid CID on chain", { id: 'sync' });
          setHasHydrated(true);
      }
    } catch (error: any) {
      console.error("Sync Failed:", error);
      if (error.message?.includes("User rejected")) {
          toast.error("Authentication Cancelled", { id: 'sync' });
      } else {
          toast.error("Sync Error: Check Console", { id: 'sync' });
      }
    } finally {
      setInitialLoading(false);
    }
  }, [brain, signMessageAsync, refetchSnapshot, sessionId]);

  // --- RESTORE SNAPSHOT ---
  const restoreMemory = async (snapshot: MemorySnapshot) => {
      if (!isOwner || !publicClient) return;
      const toastId = toast.loading("Restoring snapshot...");
      
      try {
          const hash = await writeContractAsync({
              address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
              abi: CRIKZLING_MEMORY_ABI,
              functionName: 'crystallizeMemory',
              args: [
                  snapshot.ipfsCid, 
                  snapshot.conceptsCount, 
                  snapshot.evolutionStage, 
                  `RESTORE_${snapshot.opsCount}`
              ],
              account: address,
              chain: bscTestnet
          });

          await publicClient!.waitForTransactionReceipt({ hash, confirmations: 1 });
          toast.success("Snapshot Restored!", { id: toastId });
          setForceUpdate(p => p + 1);
      } catch (e) {
          console.error(e);
          toast.error("Restore Failed", { id: toastId });
      }
  };

  // Auto-Save Diff locally
  useEffect(() => {
      if (brain && sessionId) {
          const diff = brain.exportDiffState();
          localStorage.setItem(`crikz_brain_diff_${sessionId}`, diff);
      }
  }, [forceUpdate, brain, sessionId]);

  // Heartbeat
  useEffect(() => {
    if (!brain) return;
    const tickRate = 1000; 
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
    const toastId = toast.loading('Building neural snapshot...');

    try {
        const state = brain.getState();
        const exportStr = brain.exportFullState();
        
        // --- 1. IPFS Upload ---
        const blob = new Blob([exportStr], { type: 'application/json' });
        const file = new File([blob], `crikz_mem_${Date.now()}.json`);
        
        toast.loading('Uploading to IPFS...', { id: toastId });
        const cid = await uploadToIPFS(file);
        
        // --- 2. On-Chain Commit ---
        const conceptCount = BigInt(Object.keys(state.concepts).length);
        const trigger = `SYNC_${state.totalInteractions}`; // Save ops count in trigger string

        toast.loading('Confirming On-Chain...', { id: toastId });
        const hash = await writeContractAsync({
            address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
            abi: CRIKZLING_MEMORY_ABI,
            functionName: 'crystallizeMemory',
            args: [cid, conceptCount, state.evolutionStage, trigger],
            account: address,
            chain: bscTestnet
        });

        await publicClient!.waitForTransactionReceipt({ hash, confirmations: 1 });

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
      if (brain) { brain.toggleNeuralLink(active); setForceUpdate(p => p + 1); }
  };

  const stats = brain ? brain.getStats() : undefined;
  const logs = brain ? brain.getHistory(isOwner) : [];

  return {
    messages, sendMessage, uploadFile, crystallize, resetBrain, updateDrives, trainConcept, simpleTrain, toggleNeuralLink,
    syncWithBlockchain, initialLoading, isSynced: hasHydrated, restoreMemory,
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