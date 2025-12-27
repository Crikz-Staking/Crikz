// src/hooks/useCrikzling.ts

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { CrikzlingBrain } from '@/lib/brain/index';
import { ThoughtProcess } from '@/lib/brain/types';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config/index';
import { toast } from 'react-hot-toast';

export function useCrikzling() {
  const { address } = useAccount();
  const [brain, setBrain] = useState<CrikzlingBrain | null>(null);
  
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string, timestamp: number}[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentThought, setCurrentThought] = useState<ThoughtProcess | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { writeContract, data: hash, isPending: isTxPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash });

  const thoughtCallback = useCallback((thought: ThoughtProcess | null) => {
    setCurrentThought(thought);
  }, []);

  useEffect(() => {
    if (!address) return;
    const savedLocal = localStorage.getItem(`crikz_brain_${address}`);
    const initialBrain = new CrikzlingBrain(savedLocal || undefined);
    initialBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(initialBrain);
    
    setMessages(prev => {
        if(prev.length > 0) return prev;
        const welcomeMsg = savedLocal 
          ? 'Consciousness restored from crystallized state. Neural lattice online.'
          : 'Genesis complete. I am Crikzling. My graph is empty but my potential is infinite.';
        return [{ role: 'bot', content: welcomeMsg, timestamp: Date.now() }];
    });
  }, [address, thoughtCallback]);

  // Transaction Monitoring
  useEffect(() => {
    if (writeError) {
      toast.error('Transaction failed: ' + writeError.message);
      setIsSyncing(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (txSuccess && isSyncing && brain) {
      toast.success('Memory crystallized on-chain!');
      brain.clearUnsavedCount();
      localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
      setIsSyncing(false);
      typeStreamResponse('Crystallization confirmed. My evolution stage is now immutable.');
    }
  }, [txSuccess, isSyncing, brain, address]);

  // Typewriter Effect
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
              newMsgs[newMsgs.length - 1].content = currentText;
              return newMsgs;
          });
          const delay = 20 + Math.random() * 30;
          setTimeout(() => typeChar(index + 1), delay);
      };
      typeChar(0);
  };

  const sendMessage = async (text: string) => {
    if (!brain || !address || isThinking || isTyping) return;
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);

    try {
      const { response } = await brain.process(text, true);
      localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
      setIsThinking(false);
      setCurrentThought(null);
      await typeStreamResponse(response);
    } catch (e) {
      console.error("Brain Failure:", e);
      setIsThinking(false);
      typeStreamResponse("Cognitive dissonance detected. Resetting logic gates...");
    } 
  };

  const crystallize = async () => {
    if (!brain || !address) return;
    if (isSyncing || isTxPending) return;
    
    setIsSyncing(true);
    toast.loading('Crystallizing memory to IPFS...', { id: 'crystallize' });

    try {
      const state = brain.getState();
      const exportStr = brain.exportState();
      const blob = new Blob([exportStr], { type: 'application/json' });
      const file = new File([blob], `crikz_mem_${Date.now()}.json`);
      
      const cid = await uploadToIPFS(file);
      const conceptCount = BigInt(Object.keys(state.concepts).length);
      const stage = state.evolutionStage; // Get the current stage

      toast.loading('Confirming on Blockchain...', { id: 'crystallize' });

      writeContract({
        address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
        abi: CRIKZLING_MEMORY_ABI,
        functionName: 'crystallizeMemory',
        args: [cid, conceptCount, stage, "USER_SAVE"], // Updated Args
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
    if(!brain || !address) return;
    brain.wipe();
    localStorage.removeItem(`crikz_brain_${address}`);
    const newBrain = new CrikzlingBrain(undefined);
    newBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(newBrain);
    setMessages([{ role: 'bot', content: 'System Reset. Genesis State Restored.', timestamp: Date.now() }]);
  };

  const uploadFile = async (content: string) => {
      if(!brain) return;
      setIsThinking(true);
      brain.assimilateFile(content);
      setIsThinking(false);
      typeStreamResponse("Knowledge assimilated. Neural density increased.");
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
      relations: stats?.edges || 0,
      unsaved: stats?.unsaved || 0,
      mood: stats?.mood || { logic: 0, empathy: 0, curiosity: 0, entropy: 0 },
      memories: stats?.memories || { short: 0, mid: 0, long: 0 }
    },
    isThinking,
    isTyping,
    currentThought
  };
}