import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { toast } from 'react-hot-toast';

import { CrikzlingBrainV3, ThoughtProcess, DAppContext } from '@/lib/brain/crikzling-brain-v3';
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
  const [currentThought, setCurrentThought] = useState<ThoughtProcess | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    balance,
    activeOrders,
    totalReputation,
    pendingYield,
    globalFund,
  } = useContractData();

  const sessionId = useMemo(() => {
    if (address) return address;
    let stored = localStorage.getItem('crikz_guest_id');
    if (!stored) {
      stored = `guest_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('crikz_guest_id', stored);
    }
    return stored;
  }, [address]);

  const isOwner = address?.toLowerCase() === ARCHITECT_ADDRESS.toLowerCase();

  const { writeContract, data: hash, isPending: isTxPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash });

  const thoughtCallback = useCallback((thought: ThoughtProcess | null) => {
    setCurrentThought(thought);
  }, []);

  // Initialize Brain Logic
  useEffect(() => {
    if (!sessionId) return;
    
    // Check if brain is already initialized for this session to prevent reset
    if (brain) return;

    const savedLocal = localStorage.getItem(`crikz_brain_v3_${sessionId}`);
    
    // Ensure publicClient is ready before initializing if possible, but don't block
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
        ? 'Neural lattice restored. All systems online. I have access to my complete memory - both local and on-chain.'
        : 'Genesis complete. I am Crikzling v3. I can now access the dApp state, my conversation history, and my immutable blockchain memories. How may I assist you?';
      return [{ role: 'bot', content: welcomeMsg, timestamp: Date.now() }];
    });
  }, [sessionId, publicClient]); // Removed 'brain' from deps to avoid infinite loop

  useEffect(() => {
    if (writeError) {
      toast.error('Transaction failed: ' + writeError.message);
      setIsSyncing(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (txSuccess && isSyncing && brain && address) {
      toast.success('Memory crystallized on-chain!');
      brain.clearUnsavedCount();
      localStorage.setItem(`crikz_brain_v3_${address}`, brain.exportState());
      setIsSyncing(false);
      typeStreamResponse('Crystallization confirmed. My cognitive state is now permanently recorded on the Binance Smart Chain, accessible to all future iterations of myself.');
    }
  }, [txSuccess, isSyncing, brain, address]);

  const buildDAppContext = useCallback((): DAppContext | undefined => {
    if (!address) return undefined;

    return {
      user_balance: balance,
      active_orders_count: activeOrders?.length || 0,
      total_reputation: totalReputation,
      pending_yield: pendingYield,
      global_fund_balance: globalFund?.balance,
      current_block: BigInt(Date.now()),
    };
  }, [address, balance, activeOrders, totalReputation, pendingYield, globalFund]);

  const typeStreamResponse = async (fullText: string) => {
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'bot', content: '', timestamp: Date.now() }]);
    
    const chars = fullText.split('');
    let currentText = '';
    
    const typeChar = (index: number) => {
      if (index >= chars.length) {
        setIsTyping(false);
        return;
      }
      
      currentText += chars[index];
      setMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs.length > 0) {
            newMsgs[newMsgs.length - 1].content = currentText;
        }
        return newMsgs;
      });
      
      let delay = 15 + Math.random() * 25;
      if (chars[index] === ' ') delay *= 0.3;
      if (['.', '!', '?', ','].includes(chars[index])) delay *= 2;
      
      setTimeout(() => typeChar(index + 1), delay);
    };
    
    typeChar(0);
  };

  const sendMessage = async (text: string) => {
    if (!brain || isThinking || isTyping) return;
    
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);

    try {
      const dappContext = buildDAppContext();
      
      const { response } = await brain.process(text, isOwner, dappContext);
      
      if (sessionId) {
        localStorage.setItem(`crikz_brain_v3_${sessionId}`, brain.exportState());
      }
      
      setIsThinking(false);
      setCurrentThought(null);
      await typeStreamResponse(response);
    } catch (e) {
      console.error("Brain Processing Error:", e);
      setIsThinking(false);
      setCurrentThought(null);
      typeStreamResponse("I experienced a cognitive anomaly while processing that. Could you rephrase?");
    }
  };

  const crystallize = async () => {
    if (!brain || !address) {
      toast.error("You must connect a wallet to crystallize memory.");
      return;
    }
    if (isSyncing || isTxPending) return;

    setIsSyncing(true);
    toast.loading('Crystallizing enhanced memory to IPFS...', { id: 'crystallize' });

    try {
      const state = brain.getState();
      const exportStr = brain.exportState();
      
      const blob = new Blob([exportStr], { type: 'application/json' });
      const file = new File([blob], `crikz_v3_mem_${Date.now()}.json`);
      
      const cid = await uploadToIPFS(file);
      
      const conceptCount = BigInt(Object.keys(state.concepts).length);
      const stage = state.evolutionStage;
      
      const trigger = `V3_MANUAL_SAVE_INTERACTIONS_${state.totalInteractions}_BLOCKCHAIN_SYNCS_${state.blockchainMemories.length}`;

      toast.loading('Confirming on Blockchain...', { id: 'crystallize' });
      
      writeContract({
        address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
        abi: CRIKZLING_MEMORY_ABI,
        functionName: 'crystallizeMemory',
        args: [cid, conceptCount, stage, trigger],
        account: address,
        chain: bscTestnet
      });
    } catch (e: any) {
      console.error(e);
      toast.error('Crystallization failed');
      setIsSyncing(false);
    }
  };

  const resetBrain = () => {
    if (!brain || !sessionId) return;
    brain.wipe();
    localStorage.removeItem(`crikz_brain_v3_${sessionId}`);
    
    const newBrain = new CrikzlingBrainV3(
      undefined,
      publicClient,
      CRIKZLING_MEMORY_ADDRESS as `0x${string}`
    );
    
    newBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(newBrain);
    
    setMessages([{ 
      role: 'bot', 
      content: 'Neural matrices purged. Genesis state restored. All local memories cleared, but blockchain memories remain accessible.', 
      timestamp: Date.now() 
    }]);
  };

  const uploadFile = async (content: string) => {
    if (!brain) return;
    setIsThinking(true);
    
    const count = brain.assimilateFile(content);
    if (sessionId) {
      localStorage.setItem(`crikz_brain_v3_${sessionId}`, brain.exportState());
    }
    
    setIsThinking(false);
    typeStreamResponse(
      `Knowledge assimilation complete. I've integrated ${count} new concepts into my neural architecture. ` +
      `This expands my understanding significantly. ${count > 50 ? 'This represents major cognitive growth.' : 'Processing and consolidating...'}`
    );
  };

  const stats = brain?.getStats();

  return {
    messages,
    sendMessage,
    uploadFile,
    crystallize,
    resetBrain,
    needsSave: brain?.needsCrystallization() || false,
    isSyncing: isSyncing || isTxPending || isConfirming,
    brainStats: {
      stage: stats?.stage || 'GENESIS',
      nodes: stats?.nodes || 0,
      relations: stats?.relations || 0,
      unsaved: stats?.unsaved || 0,
      mood: stats?.mood || { logic: 0, empathy: 0, curiosity: 0, entropy: 0 },
      memories: {
        short: stats?.memories?.short || 0,
        mid: stats?.memories?.mid || 0,
        long: stats?.memories?.long || 0,
        blockchain: stats?.memories?.blockchain || 0,
      },
      interactions: stats?.interactions || 0,
      lastBlockchainSync: stats?.lastBlockchainSync || 0,
    },
    isThinking,
    isTyping,
    currentThought,
    isOwner,
    dappConnected: !!address,
  };
}