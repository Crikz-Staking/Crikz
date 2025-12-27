// src/hooks/useCrikzling.ts

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { EnhancedEvolutionaryBrain, ThoughtProcess } from '@/lib/crikzling-evolutionary-brain-v2';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config/index';

export function useCrikzling() {
  const { address } = useAccount();
  const [brain, setBrain] = useState<EnhancedEvolutionaryBrain | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentThought, setCurrentThought] = useState<ThoughtProcess | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tick, setTick] = useState(0);

  useReadContract({
    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
    abi: CRIKZLING_MEMORY_ABI,
    functionName: 'getLatestMemory',
    query: { enabled: !!address }
  });

  const { writeContract, data: hash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!address) return;
    const savedLocal = localStorage.getItem(`crikz_brain_${address}`);
    const initialBrain = new EnhancedEvolutionaryBrain(savedLocal || undefined);
    setBrain(initialBrain);
  }, [address]);

  useEffect(() => {
    if (!brain || !isThinking) return;

    const interval = setInterval(() => {
      const thought = brain.getCurrentThought();
      setCurrentThought(thought);
    }, 100);

    return () => clearInterval(interval);
  }, [brain, isThinking]);

  const sendMessage = async (text: string) => {
    if (!brain || !address) return;
    
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    try {
      const { response } = await brain.process(text, true);
      
      setMessages(prev => [...prev, { role: 'bot', content: response }]);
      
      localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
      setTick(t => t + 1);
    } catch (e) {
      console.error("Brain Error:", e);
      setMessages(prev => [...prev, { role: 'bot', content: "Processing interrupted. Neural pathways recalibrating..." }]);
    } finally {
      setIsThinking(false);
      setCurrentThought(null);
    }
  };

  const uploadFile = async (content: string) => {
    if (!brain || !address) return;
    const learned = brain.assimilateFile(content);
    localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
    setTick(t => t + 1);
    setMessages(prev => [...prev, { 
      role: 'bot', 
      content: `File processed. ${learned} new concepts integrated into knowledge matrix.` 
    }]);
  };

  const crystallize = async () => {
    if (!brain || !address) return;
    setIsSyncing(true);
    try {
      const brainState = brain.exportState();
      const blob = new Blob([brainState], { type: 'application/json' });
      const file = new File([blob], `crikz_memory_${Date.now()}.json`);
      const cid = await uploadToIPFS(file);
      const conceptCount = BigInt(Object.keys(brain.getState().concepts).length);
      
      writeContract({
        address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
        abi: CRIKZLING_MEMORY_ABI,
        functionName: 'crystallizeMemory',
        args: [cid, conceptCount, "USER_TRIGGER"],
        account: address,
        chain: bscTestnet
      });

      brain.clearUnsavedCount();
      localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
      setTick(t => t + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const resetBrain = () => {
    if(!brain || !address) return;
    brain.wipe();
    setMessages([]);
    localStorage.removeItem(`crikz_brain_${address}`);
    const newBrain = new EnhancedEvolutionaryBrain(undefined);
    localStorage.setItem(`crikz_brain_${address}`, newBrain.exportState());
    setBrain(newBrain);
    setTick(t => t + 1);
  };

  const state = brain?.getState();
  const stats = brain?.getStats();
  const defaultMood = { logic: 50, empathy: 30, curiosity: 40, entropy: 10 };

  return {
    messages,
    sendMessage,
    uploadFile,
    crystallize,
    resetBrain,
    needsSave: brain?.needsCrystallization() || false,
    isOwner: true,
    isSyncing: isSyncing || isTxPending || isConfirming,
    brainStats: {
      stage: state?.evolutionStage || 'GENESIS',
      nodes: Object.keys(state?.concepts || {}).length,
      relations: state?.relations.length || 0,
      unsaved: state?.unsavedDataCount || 0,
      mood: state?.mood || defaultMood,
      memories: stats?.memories || { short: 0, mid: 0, long: 0 }
    },
    isThinking,
    currentThought
  };
}