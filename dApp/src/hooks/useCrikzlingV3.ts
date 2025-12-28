import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi';
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
  
  const [brain, setBrain] = useState<CrikzlingBrainV3 | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot' | 'system', content: string, timestamp: number}[]>([]);
  
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentThought, setCurrentThought] = useState<ThoughtProcess | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); 
  const [hasHydrated, setHasHydrated] = useState(false); 
  const [syncAttempts, setSyncAttempts] = useState(0);

  // --- CONTRACT DATA ---
  const {
    balance,
    activeOrders,
    totalReputation,
    pendingYield,
    globalFund,
  } = useContractData();

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

  // --- AUTHENTICATION & SNAPSHOT ---
  const { data: contractOwner } = useReadContract({
    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
    abi: [{ name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }] as const,
    functionName: 'owner',
  });

  // Poll faster to ensure we get data immediately on load
  const { data: latestSnapshot, refetch: refetchSnapshot } = useReadContract({
    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
    abi: CRIKZLING_MEMORY_ABI,
    functionName: 'getLatestMemory',
    query: {
        refetchInterval: 3000 
    }
  });

  const snapshotData = useMemo(() => {
      if (!latestSnapshot) return null;
      const snap = latestSnapshot as any;
      const cid = snap.ipfsCid || snap[1];
      return {
          cid: cid,
          count: snap.conceptsCount || snap[2],
          stage: snap.evolutionStage || snap[3]
      };
  }, [latestSnapshot]);

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
    if (!sessionId || !publicClient) return;
    if (brain) return;

    // Load purely local diff state first
    const diffStateJson = localStorage.getItem(`crikz_brain_diff_${sessionId}`) || undefined;
    
    const initialBrain = new CrikzlingBrainV3(
        undefined, 
        diffStateJson, 
        publicClient,
        CRIKZLING_MEMORY_ADDRESS as `0x${string}`
    );
    
    initialBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(initialBrain);
    
    // Set initial loading message - prevents user from talking until hydrated
    setMessages([{ role: 'bot', content: 'Initializing Neural Graph... Establishing Blockchain Uplink...', timestamp: Date.now() }]);
    
  }, [sessionId, publicClient]);

  // --- 2. HYDRATION LOGIC (BLOCKCHAIN) ---
  useEffect(() => {
      const syncBlockchain = async () => {
          if (!brain || !snapshotData) return;
          
          // Prevent double hydration on same snapshot unless retrying
          if (hasHydrated && syncAttempts === 0) return;

          console.log(`[HOOK] 🔄 Sync Attempt ${syncAttempts + 1}. CID: ${snapshotData.cid}`);

          try {
              const { cid, stage } = snapshotData;
              
              if (cid && cid.length > 5) {
                  const url = downloadFromIPFS(cid);
                  
                  // Force fetch to bypass caching
                  const response = await fetch(url, { cache: "no-store" });
                  if(!response.ok) throw new Error(`IPFS Fetch Failed: ${response.statusText}`);
                  
                  const remoteJson = await response.json();
                  
                  if (remoteJson) {
                      // MERGE LOGIC
                      brain.mergeState(remoteJson);
                      setHasHydrated(true);
                      setSyncAttempts(0); 
                      
                      const stats = brain.getStats();
                      
                      setMessages([
                          { 
                              role: 'system', 
                              content: `[SYSTEM] 🟢 UPLINK SECURE.\nCID: ${cid.substring(0,8)}...\nNodes: ${stats.nodes} | Ops: ${stats.interactions}`, 
                              timestamp: Date.now() 
                          },
                          {
                              role: 'bot',
                              content: `I have successfully crystallized my memory from the blockchain. I hold ${stats.nodes} concepts and ${stats.interactions} operations in my permanent graph.`,
                              timestamp: Date.now() + 100
                          }
                      ]);
                      setForceUpdate(prev => prev + 1);
                  }
              } else {
                  console.log("ℹ️ No CID found. Fresh Start.");
                  if (!hasHydrated) {
                      setMessages([{ role: 'bot', content: 'Genesis complete. No history found on-chain. I am ready to learn.', timestamp: Date.now() }]);
                      setHasHydrated(true);
                  }
              }
          } catch (e) {
              console.warn(`Sync Error:`, e);
              if (syncAttempts < 3) {
                  setTimeout(() => setSyncAttempts(p => p + 1), 3000);
              } else {
                  if (!hasHydrated) {
                       setMessages([{ role: 'bot', content: '⚠️ Connection unstable. Operating on local memory.', timestamp: Date.now() }]);
                       setHasHydrated(true);
                  }
              }
          }
      };

      // Only run if we have a brain and data
      if (brain && snapshotData) {
          syncBlockchain();
      }
  }, [snapshotData, brain, hasHydrated, syncAttempts]);

  // --- SAVE DIFF ON UPDATE ---
  useEffect(() => {
      if (brain && sessionId) {
          const diff = brain.exportDiffState();
          localStorage.setItem(`crikz_brain_diff_${sessionId}`, diff);
      }
  }, [forceUpdate, brain, sessionId]);

  // --- HEARTBEAT ---
  useEffect(() => {
    if (!brain) return;
    const stats = brain.getStats();
    const tickRate = stats.connectivity?.isConnected ? 100 : 8000; 

    const heartbeat = setInterval(() => {
      if (!isThinking && !isTyping && !isSyncing) {
        brain.tick(dappContextRef.current).then(() => {
            setForceUpdate(prev => prev + 1);
        });
      }
    }, tickRate); 
    return () => clearInterval(heartbeat);
  }, [brain, isThinking, isTyping, isSyncing, forceUpdate]);

  const typeStreamResponse = async (fullText: string) => {
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'bot', content: '', timestamp: Date.now() }]);
    
    const chars = fullText.split('');
    let currentText = '';
    
    return new Promise<void>((resolve) => {
        const typeChar = (index: number) => {
            if (index >= chars.length) {
                setIsTyping(false);
                resolve();
                return;
            }
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
    if (!brain || !address || !publicClient) {
      toast.error("Wallet missing.");
      return;
    }
    if (isSyncing) return;

    setIsSyncing(true); 
    const toastId = toast.loading('Exporting Neural Graph...', { id: 'crystallize' });

    try {
        // 1. Export State (Safe for BigInt)
        const exportStr = brain.exportFullState();
        
        const blob = new Blob([exportStr], { type: 'application/json' });
        const file = new File([blob], `crikz_v5_mem_${Date.now()}.json`);
        
        toast.loading('Uploading to IPFS...', { id: toastId });
        const cid = await uploadToIPFS(file);
        
        const state = brain.getState();
        const conceptCount = BigInt(Object.keys(state.concepts).length);
        const stage = state.evolutionStage;
        const trigger = `V5_SYNC_${state.totalInteractions}`;

        toast.loading('Confirming on Blockchain...', { id: toastId });
        const hash = await writeContractAsync({
            address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
            abi: CRIKZLING_MEMORY_ABI,
            functionName: 'crystallizeMemory',
            args: [cid, conceptCount, stage, trigger],
            account: address,
            chain: bscTestnet
        });

        await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

        // 2. Mark Saved locally
        brain.clearUnsavedCount();
        if (sessionId) localStorage.removeItem(`crikz_brain_diff_${sessionId}`);
        
        await refetchSnapshot(); // Force Wagmi to update contract read
        
        toast.success('Memory Crystallized!', { id: toastId });
        
        setMessages(prev => [...prev, { 
            role: 'system', 
            content: `[SYSTEM] Save Successful.\nState: ${state.totalInteractions} Ops.\nCID: ${cid}`, 
            timestamp: Date.now() 
        }]);

    } catch (e: any) {
        console.error("Crystallize Error", e);
        toast.error(`Sync Failed: ${e.message}`, { id: toastId });
    } finally {
        setIsSyncing(false); 
    }
  };

  const sendMessage = async (text: string) => {
    if (!brain || isThinking || isTyping) return;
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
      console.error("Brain Error:", e);
      setIsThinking(false);
      setCurrentThought(null);
      typeStreamResponse("Cognitive anomaly detected.");
    }
  };

  const resetBrain = () => {
    if (!brain || !sessionId) return;
    brain.wipe();
    localStorage.removeItem(`crikz_brain_diff_${sessionId}`);
    
    const newBrain = new CrikzlingBrainV3(undefined, undefined, publicClient, CRIKZLING_MEMORY_ADDRESS as `0x${string}`);
    newBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(newBrain);
    setHasHydrated(false); 
    
    setMessages([{ role: 'bot', content: 'Local state purged. Re-scanning chain...', timestamp: Date.now() }]);
    setForceUpdate(prev => prev + 1);
  };

  const uploadFile = async (content: string) => {
    if (!brain) return;
    setIsThinking(true);
    const count = brain.assimilateFile(content);
    setIsThinking(false);
    typeStreamResponse(`Knowledge assimilation complete. Integrated ${count} concepts.`);
  };

  const updateDrives = (drives: InternalDrives) => {
      if (brain) {
          brain.updateDrives(drives);
          setForceUpdate(prev => prev + 1);
      }
  };

  const trainConcept = (concept: AtomicConcept) => {
      if (brain) {
          brain.injectConcept(concept);
          toast.success(`Trained: ${concept.id}`);
          setForceUpdate(prev => prev + 1);
      }
  };

  const simpleTrain = (text: string) => {
      if (brain) {
          brain.simpleTrain(text);
          toast.success("Input Processed");
          setForceUpdate(prev => prev + 1);
      }
  };

  const toggleNeuralLink = (active: boolean) => {
      if (brain) {
          brain.toggleNeuralLink(active);
          setForceUpdate(prev => prev + 1);
          if(active) toast.success("Hyper-Link Active");
          else toast('Link Severed', { icon: '🔌' });
      }
  };

  const stats = brain ? brain.getStats() : undefined;
  const logs = brain ? brain.getHistory(isOwner) : [];

  return {
    messages,
    sendMessage,
    uploadFile,
    crystallize,
    resetBrain,
    updateDrives,
    trainConcept,
    simpleTrain,
    toggleNeuralLink,
    needsSave: brain?.needsCrystallization() || false,
    isSyncing,
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
    logs, 
    isThinking,
    isTyping,
    currentThought,
    isOwner,
    dappConnected: !!address,
  };
}