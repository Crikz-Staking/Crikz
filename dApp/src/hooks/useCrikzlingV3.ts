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

  // --- BRAIN INITIALIZATION & HYDRATION ---
  useEffect(() => {
    if (!sessionId || !publicClient) return;
    if (brain) return;

    const initializeBrain = async () => {
        let baseStateJson: string | undefined = undefined;
        let diffStateJson: string | undefined = localStorage.getItem(`crikz_brain_diff_${sessionId}`) || undefined;
        let recoveryMode = false;

        // 1. Fetch Blockchain State (Base)
        if (latestSnapshot) {
            try {
                // @ts-ignore
                const cid = latestSnapshot.ipfsCid || latestSnapshot[1];
                if (cid) {
                    const url = downloadFromIPFS(cid);
                    const toastId = toast.loading("Downloading Neural Matrix from Chain...");
                    
                    const response = await fetch(url);
                    const json = await response.json();
                    
                    if (json && json.concepts) {
                        baseStateJson = JSON.stringify(json);
                        recoveryMode = true;
                        toast.success("Blockchain State Downloaded.", { id: toastId });
                    } else {
                        toast.dismiss(toastId);
                    }
                }
            } catch (e) {
                console.error("Failed to hydrate from IPFS:", e);
                toast.error("Failed to download remote memory. Using Local Diff only.", { id: 'hydrate-err' });
            }
        }

        // 2. Initialize with (Base + Diff)
        const initialBrain = new CrikzlingBrainV3(
            baseStateJson,
            diffStateJson,
            publicClient,
            CRIKZLING_MEMORY_ADDRESS as `0x${string}`
        );
        
        initialBrain.setThoughtUpdateCallback(thoughtCallback);
        setBrain(initialBrain);
        
        setMessages(prev => {
            if (prev.length > 0) return prev;
            const welcomeMsg = recoveryMode 
                ? 'Systems online. Blockchain state synchronized. Local diff applied.' 
                : diffStateJson
                    ? 'Offline mode. Local memory active.'
                    : 'Genesis complete. Crikzling V5 online. Awaiting input.';
            return [{ role: 'bot', content: welcomeMsg, timestamp: Date.now() }];
        });
    };

    initializeBrain();
  }, [sessionId, publicClient, latestSnapshot]);

  // --- SAVE DIFF ON UPDATE ---
  // Whenever the brain updates (after thoughts/responses), save only the Diff to local storage
  useEffect(() => {
      if (brain && sessionId) {
          // Compact Save: Only save new changes
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
        // 1. Export Full State (Combines Base + Diff into one Truth)
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
        // Now that the full state is on chain, the "Diff" is effectively zero.
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
    
    // Create fresh instance (will likely re-hydrate from chain unless chain is also wiped)
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
    // Diff saved via useEffect trigger
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