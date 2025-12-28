// src/hooks/useCrikzlingV3.ts

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { toast } from 'react-hot-toast';

import { CrikzlingBrainV3 } from '@/lib/brain/crikzling-brain-v3';
import { ThoughtProcess, DAppContext } from '@/lib/brain/types';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config/index';
import { useContractData } from '@/hooks/web3/useContractData';

const ARCHITECT_ADDRESS = "0x7072F8955FEb6Cdac4cdA1e069f864969Da4D379";

export function useCrikzlingV3() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  // -- STATE --
  const [brain, setBrain] = useState<CrikzlingBrainV3 | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string, timestamp: number}[]>([]);
  
  // Visual States
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentThought, setCurrentThought] = useState<ThoughtProcess | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); 

  // -- BLOCKCHAIN DATA --
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
      current_block: BigInt(Date.now()),
    };
  }, [balance, activeOrders, totalReputation, pendingYield, globalFund]);

  // -- INIT --
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

  const { writeContractAsync, data: hash } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ 
    hash,
    confirmations: 1 
  });

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
        ? 'Neural lattice restored. Subconscious systems active. I am monitoring the protocol state.'
        : 'Genesis complete. Crikzling V5 online. Subconscious processing initialized.';
      return [{ role: 'bot', content: welcomeMsg, timestamp: Date.now() }];
    });
  }, [sessionId, publicClient]);

  // -- THE SUBCONSCIOUS LOOP --
  useEffect(() => {
    if (!brain) return;

    const heartbeat = setInterval(() => {
      if (!isThinking && !isTyping) {
        brain.tick(dappContextRef.current).then(() => {
            setForceUpdate(prev => prev + 1);
        });
      }
    }, 4000); 

    return () => clearInterval(heartbeat);
  }, [brain, isThinking, isTyping]);

  useEffect(() => {
    if (txSuccess && brain && address && isSyncing) {
      toast.success('Memory crystallized on-chain!', { id: 'crystallize' });
      
      brain.clearUnsavedCount();
      localStorage.setItem(`crikz_brain_v3_${address}`, brain.exportState());
      
      setIsSyncing(false);
      typeStreamResponse('Crystallization confirmed. My cognitive state is now permanently recorded on the Binance Smart Chain.');
    }
  }, [txSuccess, brain, address]);

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
    });
  };

  const crystallize = async () => {
    if (!brain || !address) {
      toast.error("You must connect a wallet to crystallize memory.");
      return;
    }
    if (isSyncing || isConfirming) return;

    setIsSyncing(true);
    const toastId = 'crystallize';
    toast.loading('Encoding neural state...', { id: toastId });

    try {
      const state = brain.getState();
      const exportStr = brain.exportState();
      const blob = new Blob([exportStr], { type: 'application/json' });
      const file = new File([blob], `crikz_v5_mem_${Date.now()}.json`);
      
      toast.loading('Uploading to decentralized storage...', { id: toastId });
      const cid = await uploadToIPFS(file);
      
      const conceptCount = BigInt(Object.keys(state.concepts).length);
      const stage = state.evolutionStage;
      const trigger = `V5_MANUAL_SAVE_INTERACTIONS_${state.totalInteractions}`;

      toast.loading('Waiting for wallet approval...', { id: toastId });
      
      await writeContractAsync({
        address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
        abi: CRIKZLING_MEMORY_ABI,
        functionName: 'crystallizeMemory',
        args: [cid, conceptCount, stage, trigger],
        account: address,
        chain: bscTestnet
      });

      toast.loading('Confirming on Blockchain...', { id: toastId });

    } catch (e: any) {
      console.error(e);
      const msg = e.message?.includes('User rejected') 
        ? 'Transaction rejected by user' 
        : 'Crystallization failed';
      
      toast.error(msg, { id: toastId });
      setIsSyncing(false); 
    }
  };

  const sendMessage = async (text: string) => {
    if (!brain || isThinking || isTyping) return;
    
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);

    try {
      const { response, actionPlan } = await brain.process(text, isOwner, dappContextRef.current);
      
      if (sessionId) {
        localStorage.setItem(`crikz_brain_v3_${sessionId}`, brain.exportState());
      }
      
      if (actionPlan && actionPlan.type === 'EXECUTE_COMMAND_SAVE') {
          setTimeout(() => crystallize(), 1000); 
      }
      
      if (actionPlan && actionPlan.type === 'EXECUTE_COMMAND_RESET') {
          resetBrain(); 
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
      content: 'Neural matrices purged. Genesis state restored. All local memories cleared.', 
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
      `Knowledge assimilation complete. I've integrated ${count} new concepts into my neural architecture.`
    );
  };

  const stats = brain ? brain.getStats() : undefined;

  return {
    messages,
    sendMessage,
    uploadFile,
    crystallize,
    resetBrain,
    needsSave: brain?.needsCrystallization() || false,
    isSyncing: isSyncing || isConfirming,
    brainStats: {
      stage: stats?.stage || 'GENESIS',
      nodes: stats?.nodes || 0,
      relations: stats?.relations || 0,
      unsaved: stats?.unsaved || 0,
      mood: stats?.mood || { curiosity: 0, stability: 0, efficiency: 0, social: 0, energy: 0 },
      memories: stats?.memories || { short: 0, mid: 0, long: 0, blockchain: 0 },
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