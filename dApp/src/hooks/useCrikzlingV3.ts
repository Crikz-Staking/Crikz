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
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string, timestamp: number}[]>([]);
  
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentThought, setCurrentThought] = useState<ThoughtProcess | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); 

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

  // --- INIT & HYDRATION ---
  useEffect(() => {
    if (!sessionId || !publicClient) return;
    if (brain) return;

    const initializeBrain = async () => {
        let initialState: string | undefined = localStorage.getItem(`crikz_brain_v3_${sessionId}`) || undefined;
        let loadedFromChain = false;

        // Smart Hydration: If local is missing OR requested, check blockchain first
        if (!initialState && latestSnapshot) {
            try {
                // @ts-ignore
                const cid = latestSnapshot.ipfsCid || latestSnapshot[1];
                if (cid) {
                    const url = downloadFromIPFS(cid);
                    const toastId = toast.loading("Restoring Neural Matrix...");
                    
                    const response = await fetch(url);
                    const json = await response.json();
                    
                    if (json && json.concepts) {
                        initialState = JSON.stringify(json);
                        loadedFromChain = true;
                        toast.success("Memory Restored.", { id: toastId });
                    } else {
                        toast.dismiss(toastId);
                    }
                }
            } catch (e) {
                console.error("Hydration Error:", e);
                toast.error("Network sync failed. Starting local.", { id: 'hydrate-err' });
            }
        }

        const initialBrain = new CrikzlingBrainV3(
            initialState,
            publicClient,
            CRIKZLING_MEMORY_ADDRESS as `0x${string}`
        );
        
        initialBrain.setThoughtUpdateCallback(thoughtCallback);
        setBrain(initialBrain);
        
        setMessages(prev => {
            if (prev.length > 0) return prev;
            const welcomeMsg = loadedFromChain
                ? 'Systems online. Remote consciousness fully restored.'
                : initialState
                    ? 'Neural lattice active. Local memory detected.'
                    : 'Genesis complete. Crikzling V5 online. Awaiting input.';
            return [{ role: 'bot', content: welcomeMsg, timestamp: Date.now() }];
        });
    };

    initializeBrain();
  }, [sessionId, publicClient, latestSnapshot]);

  // --- LOOP ---
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

  // --- STREAMING UI ---
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

  // --- SMART CRYSTALLIZATION ---
  const crystallize = async () => {
    if (!brain || !address || !publicClient) {
      toast.error("Wallet missing.");
      return;
    }
    if (isSyncing) return;

    setIsSyncing(true); 
    const toastId = toast.loading('Initiating Neural Sync...', { id: 'crystallize' });

    try {
        // 1. Fetch Remote State (if exists)
        if (latestSnapshot) {
            try {
                toast.loading('Merging with Blockchain...', { id: toastId });
                // @ts-ignore
                const cid = latestSnapshot.ipfsCid || latestSnapshot[1];
                if (cid) {
                    const url = downloadFromIPFS(cid);
                    const response = await fetch(url);
                    const remoteJson = await response.json();
                    
                    // 2. Merge Remote into Local
                    brain.mergeState(remoteJson);
                }
            } catch (e) {
                console.warn("Merge skipped, pushing local only");
            }
        }

        // 3. Prepare Upload
        const state = brain.getState();
        const exportStr = brain.exportState();
        const blob = new Blob([exportStr], { type: 'application/json' });
        const file = new File([blob], `crikz_v5_mem_${Date.now()}.json`);
        
        toast.loading('Uploading merged state to IPFS...', { id: toastId });
        
        // 4. Upload
        const newCid = await uploadToIPFS(file);
        
        const conceptCount = BigInt(Object.keys(state.concepts).length);
        const stage = state.evolutionStage;
        // Store totalOps in trigger string for easy parsing later
        const trigger = `V5_SYNC_${state.totalInteractions}`;

        // 5. Write to Chain
        toast.loading('Signing transaction...', { id: toastId });
        const hash = await writeContractAsync({
            address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
            abi: CRIKZLING_MEMORY_ABI,
            functionName: 'crystallizeMemory',
            args: [newCid, conceptCount, stage, trigger],
            account: address,
            chain: bscTestnet
        });

        toast.loading('Confirming block...', { id: toastId });
        await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

        // 6. Cleanup Local
        brain.clearUnsavedCount();
        if (sessionId) {
            // Keep the merged state in RAM, but clear disk to enforce "Compact Local Storage" rule
            localStorage.removeItem(`crikz_brain_v3_${sessionId}`);
        }
        
        await refetchSnapshot(); // Update hook state
        toast.success('Crystallization Complete!', { id: toastId });
        typeStreamResponse(`Memory block merged & confirmed. Local cache cleared. Running on distributed state.`);

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
      
      // Save temp state to local storage just in case of crash before crystallize
      if (sessionId) localStorage.setItem(`crikz_brain_v3_${sessionId}`, brain.exportState());
      
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
    localStorage.removeItem(`crikz_brain_v3_${sessionId}`);
    
    const newBrain = new CrikzlingBrainV3(undefined, publicClient, CRIKZLING_MEMORY_ADDRESS as `0x${string}`);
    newBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(newBrain);
    
    setMessages([{ role: 'bot', content: 'Neural matrices purged. Genesis state restored.', timestamp: Date.now() }]);
    setForceUpdate(prev => prev + 1);
  };

  const uploadFile = async (content: string) => {
    if (!brain) return;
    setIsThinking(true);
    const count = brain.assimilateFile(content);
    if (sessionId) localStorage.setItem(`crikz_brain_v3_${sessionId}`, brain.exportState());
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