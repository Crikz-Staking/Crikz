import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { EvolutionaryBrain } from '@/lib/crikzling-evolutionary-brain';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config/index';

export function useCrikzling() {
  const { address } = useAccount();
  const [brain, setBrain] = useState<EvolutionaryBrain | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([]);
  
  // Critical Fix: State to prevent double submissions but allow recovery
  const [isThinking, setIsThinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Use a tick to force re-renders when the brain class instance mutates internal state
  const [tick, setTick] = useState(0);

  // Contract Logic (unchanged)
  useReadContract({
    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
    abi: CRIKZLING_MEMORY_ABI,
    functionName: 'getLatestMemory',
    query: { enabled: !!address }
  });

  const { writeContract, data: hash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Load brain from local storage on mount
  useEffect(() => {
    if (!address) return;
    const savedLocal = localStorage.getItem(`crikz_brain_${address}`);
    const initialBrain = new EvolutionaryBrain(savedLocal || undefined);
    setBrain(initialBrain);
  }, [address]);

  // --- FIXED SEND MESSAGE FUNCTION ---
  const sendMessage = async (text: string) => {
    if (!brain || !address || isThinking) return;
    
    setIsThinking(true);
    
    try {
        // Await the brain process (now safer)
        const { response } = await brain.process(text, true);
        
        setMessages(prev => [
            ...prev, 
            { role: 'user', content: text }, 
            { role: 'bot', content: response }
        ]);

        // Persist
        localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
        setTick(t => t + 1);

    } catch (error) {
        // Fallback if brain totally fails
        console.error("Brain execution error", error);
        setMessages(prev => [
            ...prev,
            { role: 'user', content: text },
            { role: 'bot', content: "Error: Neural pathway disconnected." }
        ]);
    } finally {
        // CRITICAL: Always turn off thinking mode
        setIsThinking(false);
    }
  };

  const uploadFile = async (content: string) => {
    if (!brain || !address) return;
    try {
        brain.assimilateFile(content);
        localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
        setTick(t => t + 1);
        setMessages(prev => [...prev, { role: 'bot', content: "Batch assimilation complete. Neural pathways updated." }]);
    } catch (e) {
        console.error(e);
    }
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
      console.error("Crystallization failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const resetBrain = () => {
    if(!brain || !address) return;
    brain.wipe();
    setMessages([]);
    localStorage.removeItem(`crikz_brain_${address}`);
    
    // Create fresh instance
    const newBrain = new EvolutionaryBrain(undefined);
    localStorage.setItem(`crikz_brain_${address}`, newBrain.exportState());
    setBrain(newBrain);
    setTick(t => t + 1);
  };

  // Safe accessor for brain state
  const state = brain?.getState();
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
      mood: state?.mood || defaultMood
    },
    isThinking
  };
}