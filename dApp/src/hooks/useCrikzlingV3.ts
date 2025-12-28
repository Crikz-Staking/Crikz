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
  const [hasHydrated, setHasHydrated] = useState(false); // Tracks if blockchain data has been loaded

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

  const { data: latestSnapshot, refetch: refetchSnapshot } = useReadContract({
    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
    abi: CRIKZLING_MEMORY_ABI,
    functionName: 'getLatestMemory',
    query: {
        refetchInterval: 10000 
    }
  });

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
    if (!sessionId || !publicClient) return;
    if (brain) return;

    // Load purely local diff state first
    const diffStateJson = localStorage.getItem(`crikz_brain_diff_${sessionId}`) || undefined;
    
    const initialBrain = new CrikzlingBrainV3(
        undefined, // baseState load deferred
        diffStateJson, 
        publicClient,
        CRIKZLING_MEMORY_ADDRESS as `0x${string}`
    );
    
    initialBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(initialBrain);
    
    // NOTE: We do NOT set initial messages here anymore. 
    // We wait for hydration logic to determine if we are Genesis or Synced.
  }, [sessionId, publicClient]);

  // --- HYDRATION & SYNC LOGIC ---
  useEffect(() => {
      const syncBlockchain = async () => {
          if (!brain || !latestSnapshot) return;
          
          // Prevent double hydration on same snapshot
          if (hasHydrated) return;

          try {
              // Handle potential array return from wagmi if ABI isn't perfectly mapped
              const cid = (latestSnapshot as any).ipfsCid || (latestSnapshot as any)[1];
              const evolution = (latestSnapshot as any).evolutionStage || (latestSnapshot as any)[3];
              
              if (cid && cid.length > 0) {
                  const url = downloadFromIPFS(cid);
                  console.log("🔗 Connecting to Neural Hive Mind:", url);
                  
                  const response = await fetch(url);
                  if(!response.ok) throw new Error("IPFS Fetch Failed");
                  
                  const remoteJson = await response.json();
                  
                  if (remoteJson && remoteJson.concepts) {
                      // MERGE LOGIC - CognitiveProcessor.mergeExternalState handles the heavy lifting
                      brain.mergeState(remoteJson);
                      setHasHydrated(true);
                      
                      const stats = brain.getStats();
                      
                      // RESET messages to start fresh with the Hive Mind context
                      setMessages([
                          { 
                              role: 'system', 
                              content: `[SYSTEM] 🔗 Blockchain Uplink Established.\nCID: ${cid.substring(0,10)}...\nStage: ${evolution}\nNodes: ${stats.nodes} | Total Ops: ${stats.interactions}`, 
                              timestamp: Date.now() 
                          },
                          {
                              role: 'bot',
                              content: `I have restored my memory from the immutable ledger. I am operating at stage ${stats.stage} with access to ${stats.nodes} crystallized concepts and ${stats.interactions} recorded operations.`,
                              timestamp: Date.now() + 100
                          }
                      ]);
                      
                      setForceUpdate(prev => prev + 1);
                  }
              } else {
                  // No blockchain memory found (New deployment)
                  if (!hasHydrated) {
                      setMessages([{ role: 'bot', content: 'Genesis complete. No on-chain memory found. Starting fresh cognitive sequence.', timestamp: Date.now() }]);
                      setHasHydrated(true);
                  }
              }
          } catch (e) {
              console.warn("Background Sync Failed:", e);
              // Fallback if IPFS fails
              if (!hasHydrated) {
                   setMessages([{ role: 'bot', content: 'Connection to Hive Mind unstable. Operating on local cache.', timestamp: Date.now() }]);
                   setHasHydrated(true);
              }
          }
      };

      if (brain && latestSnapshot) {
          syncBlockchain();
      }
  }, [latestSnapshot, brain, hasHydrated]);

  // --- SAVE DIFF ON UPDATE ---
  useEffect(() => {
      if (brain && sessionId) {
          const diff = brain.exportDiffState();
          localStorage.setItem(`crikz_brain_diff_${sessionId}`, diff);
      }
  }, [forceUpdate, brain, sessionId]);

  // --- HIGH-SPEED HEARTBEAT ---
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
            let delay = 15 + (crypto.getRandomValues(new Uint32Array(1))[0] % 25);
            if (chars[index] === ' ') delay *= 0.3;
            if (['.', '!', '?', ','].includes(chars[index])) delay *= 2;
            setTimeout(() => typeChar(index + 1), delay);
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
    const toastId = toast.loading('Initiating Neural Sync...', { id: 'crystallize' });

    try {
        // 1. Export Full State (Includes new Nodes + Ops Count)
        const exportStr = brain.exportFullState();
        const blob = new Blob([exportStr], { type: 'application/json' });
        const file = new File([blob], `crikz_v5_mem_${Date.now()}.json`);
        
        toast.loading('Uploading merged state to IPFS...', { id: toastId });
        const cid = await uploadToIPFS(file);
        
        const state = brain.getState();
        const conceptCount = BigInt(Object.keys(state.concepts).length);
        const stage = state.evolutionStage;
        const trigger = `V5_SYNC_${state.totalInteractions}`;

        toast.loading('Signing transaction...', { id: toastId });
        const hash = await writeContractAsync({
            address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
            abi: CRIKZLING_MEMORY_ABI,
            functionName: 'crystallizeMemory',
            args: [cid, conceptCount, stage, trigger],
            account: address,
            chain: bscTestnet
        });

        toast.loading('Confirming block...', { id: toastId });
        await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

        // 2. Mark Saved & Clear Local Diff
        brain.clearUnsavedCount();
        if (sessionId) {
            localStorage.removeItem(`crikz_brain_diff_${sessionId}`);
        }
        
        await refetchSnapshot(); 
        toast.success('Crystallization Complete!', { id: toastId });
        typeStreamResponse('Memory block merged & confirmed. Local cache cleared. Running on distributed state.');

    } catch (e: any) {
        console.error(e);
        toast.error("Sync Failed", { id: toastId });
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

      if (actionPlan?.type === 'EXECUTE_COMMAND_SAVE') {
          setTimeout(() => crystallize(), 500); 
      }
      if (actionPlan?.type === 'EXECUTE_COMMAND_RESET') {
          resetBrain(); 
      }

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
    
    // Force re-create brain
    const newBrain = new CrikzlingBrainV3(undefined, undefined, publicClient, CRIKZLING_MEMORY_ADDRESS as `0x${string}`);
    newBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(newBrain);
    
    setMessages([{ role: 'bot', content: 'Local state purged. Re-synchronizing...', timestamp: Date.now() }]);
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
          toast.success(`Trained concept: ${concept.id}`);
          setForceUpdate(prev => prev + 1);
      }
  };

  const simpleTrain = (text: string) => {
      if (brain) {
          const result = brain.simpleTrain(text);
          toast.success("Input Processed");
          setForceUpdate(prev => prev + 1);
      }
  };

  const toggleNeuralLink = (active: boolean) => {
      if (brain) {
          brain.toggleNeuralLink(active);
          setForceUpdate(prev => prev + 1);
          if(active) toast.success("Hyper-Link Established");
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