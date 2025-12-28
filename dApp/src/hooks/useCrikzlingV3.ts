import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { toast } from 'react-hot-toast';

import { CrikzlingBrainV3 } from '@/lib/brain/crikzling-brain-v3';
import { ThoughtProcess, DAppContext, InternalDrives } from '@/lib/brain/types';
import { AtomicConcept } from '@/lib/crikzling-atomic-knowledge';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config/index';
import { useContractData } from '@/hooks/web3/useContractData';

const ARCHITECT_ADDRESS = "0x7072F8955FEb6Cdac4cdA1e069f864969Da4D379";

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

  const sessionId = useMemo(() => {
    if (address) return address;
    let stored = localStorage.getItem('crikz_guest_id');
    if (!stored) {
      stored = `guest_${crypto.randomUUID()}`;
      localStorage.setItem('crikz_guest_id', stored);
    }
    return stored;
  }, [address]);

  const isOwner = address?.toLowerCase() === ARCHITECT_ADDRESS.toLowerCase();

  const { writeContractAsync } = useWriteContract();

  const thoughtCallback = useCallback((thought: ThoughtProcess | null) => {
    setCurrentThought(thought);
    setForceUpdate(prev => prev + 1); 
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    if (brain) return;

    const savedLocal = localStorage.getItem(`crikz_brain_v3_${sessionId}`);
    
    const initialBrain = new CrikzlingBrainV3(
      savedLocal || undefined,
      publicClient,
      CRIKZLING_MEMORY_ADDRESS as `0x${string}`
    );
    
    initialBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(initialBrain);
    
    setMessages(prev => {
      if (prev.length > 0) return prev;
      const welcomeMsg = savedLocal 
        ? 'Neural lattice restored. Subconscious systems active.'
        : 'Genesis complete. Crikzling V5 online. Awaiting input.';
      return [{ role: 'bot', content: welcomeMsg, timestamp: Date.now() }];
    });
  }, [sessionId, publicClient]);

  // DYNAMIC HEARTBEAT
  useEffect(() => {
    if (!brain) return;
    
    const stats = brain.getStats();
    // Fast tick when connected (2s), slow when idle (8s)
    const tickRate = stats.connectivity?.isConnected ? 2000 : 8000; 

    const heartbeat = setInterval(() => {
      // Don't tick if we are syncing (prevents race conditions during save)
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

  // --- FIXED CRYSTALLIZATION LOGIC ---
  const crystallize = async () => {
    if (!brain || !address || !publicClient) {
      toast.error("Wallet or Provider missing.");
      return;
    }
    if (isSyncing) return;

    setIsSyncing(true); // LOCK STATE
    const toastId = toast.loading('Encoding neural state...', { id: 'crystallize' });

    try {
      // 1. IPFS Upload
      const state = brain.getState();
      const exportStr = brain.exportState();
      const blob = new Blob([exportStr], { type: 'application/json' });
      const file = new File([blob], `crikz_v5_mem_${Date.now()}.json`);
      
      toast.loading('Uploading to IPFS...', { id: toastId });
      const cid = await uploadToIPFS(file);
      
      const conceptCount = BigInt(Object.keys(state.concepts).length);
      const stage = state.evolutionStage;
      const trigger = `V5_MANUAL_SAVE_${state.totalInteractions}`;

      // 2. Blockchain Write
      toast.loading('Waiting for signature...', { id: toastId });
      const hash = await writeContractAsync({
        address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
        abi: CRIKZLING_MEMORY_ABI,
        functionName: 'crystallizeMemory',
        args: [cid, conceptCount, stage, trigger],
        account: address,
        chain: bscTestnet
      });

      // 3. Wait for Receipt Explicitly
      toast.loading('Confirming on Blockchain...', { id: toastId });
      await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

      // 4. Success State Update
      brain.clearUnsavedCount();
      // Update local storage immediately to match chain state
      if (sessionId) localStorage.setItem(`crikz_brain_v3_${sessionId}`, brain.exportState());
      
      toast.success('Crystallization Complete!', { id: toastId });
      typeStreamResponse('Memory block confirmed. State crystallized on-chain.');

    } catch (e: any) {
      console.error(e);
      // Handle user rejection vs actual error
      const msg = e.message?.toLowerCase().includes('reject') 
        ? 'Transaction rejected' 
        : 'Crystallization failed';
      toast.error(msg, { id: toastId });
    } finally {
      // CRITICAL: ALWAYS RESET STATE HERE
      setIsSyncing(false); 
    }
  };

  const sendMessage = async (text: string) => {
    if (!brain || isThinking || isTyping) return;
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);

    try {
      const { response, actionPlan } = await brain.process(text, isOwner, dappContextRef.current);
      if (sessionId) localStorage.setItem(`crikz_brain_v3_${sessionId}`, brain.exportState());
      
      setIsThinking(false);
      setCurrentThought(null);
      await typeStreamResponse(response);

      // Handle actions AFTER response is done type-streaming
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
    
    // Create fresh instance
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

  // --- NEW CONTROLS ---
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
          toast.success(result);
          setForceUpdate(prev => prev + 1);
      }
  };

  const toggleNeuralLink = (active: boolean) => {
      if (brain) {
          brain.toggleNeuralLink(active);
          setForceUpdate(prev => prev + 1);
          if(active) toast.success("Neural Link Established");
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
      // FIX: Added lastWebSync: 0 to prevent type error
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