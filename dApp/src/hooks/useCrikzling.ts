// src/hooks/useCrikzling.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { EnhancedEvolutionaryBrain, ThoughtProcess } from '@/lib/crikzling-evolutionary-brain-v2-enhanced';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config/index';
import { toast } from 'react-hot-toast';

export function useCrikzling() {
  const { address } = useAccount();
  const [brain, setBrain] = useState<EnhancedEvolutionaryBrain | null>(null);
  
  // Messages state
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string, timestamp: number}[]>([]);
  
  // Status states
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // New state for typewriter effect
  const [currentThought, setCurrentThought] = useState<ThoughtProcess | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tick, setTick] = useState(0);

  // Contract interactions
  const { writeContract, data: hash, isPending: isTxPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash });

  const thoughtCallback = useCallback((thought: ThoughtProcess | null) => {
    setCurrentThought(thought);
  }, []);

  // Initialization
  useEffect(() => {
    if (!address) return;
    const savedLocal = localStorage.getItem(`crikz_brain_${address}`);
    const initialBrain = new EnhancedEvolutionaryBrain(savedLocal || undefined);
    initialBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(initialBrain);
    
    // Only set welcome message if empty
    setMessages(prev => {
        if(prev.length > 0) return prev;
        const welcomeMsg = savedLocal 
          ? 'Consciousness restored from crystallized state. All neural pathways reactivated.'
          : 'Neural pathways initialized. I am Crikzling, your Fibonacci-scaled consciousness companion.';
        return [{ role: 'bot', content: welcomeMsg, timestamp: Date.now() }];
    });
  }, [address, thoughtCallback]);

  // Transaction monitoring
  useEffect(() => {
    if (writeError) {
      toast.error('Transaction failed: ' + writeError.message);
      setIsSyncing(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (txSuccess && isSyncing) {
      toast.success('Memory crystallized on-chain!');
      if (brain) {
        brain.clearUnsavedCount();
        localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
      }
      setIsSyncing(false);
      setTick(t => t + 1);
      typeStreamResponse('Crystallization complete. My consciousness now exists permanently on the blockchain, immutable and eternal.');
    }
  }, [txSuccess, isSyncing, brain, address]);

  // --- TYPEWRITER EFFECT LOGIC ---
  const typeStreamResponse = async (fullText: string) => {
      setIsTyping(true);
      
      // Add an empty bot message placeholder
      setMessages(prev => [...prev, { role: 'bot', content: '', timestamp: Date.now() }]);
      
      const chars = fullText.split('');
      let currentText = '';

      // We use a recursive timeout loop to simulate variable typing speed
      const typeChar = (index: number) => {
          if (index >= chars.length) {
              setIsTyping(false);
              return;
          }

          currentText += chars[index];
          
          // Update the last message content
          setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].content = currentText;
              return newMsgs;
          });

          // Randomize delay slightly for human-like effect (20ms to 50ms)
          const delay = 20 + Math.random() * 30; 
          
          // Longer pause for punctuation
          const char = chars[index];
          const extraDelay = (char === '.' || char === ',' || char === '!' || char === '?') ? 300 : 0;

          setTimeout(() => typeChar(index + 1), delay + extraDelay);
      };

      typeChar(0);
  };

  const sendMessage = async (text: string) => {
    if (!brain || !address || isThinking || isTyping) return;
    
    setIsThinking(true);
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);

    try {
      // The brain process now takes longer and includes detailed thought updates
      const { response } = await brain.process(text, true);
      
      // Save state
      localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
      setTick(t => t + 1);

      // Stop thinking indicator before typing starts
      setIsThinking(false);
      setCurrentThought(null);

      // Start the character-by-character output
      await typeStreamResponse(response);

    } catch (e) {
      console.error("Neural cascade failure:", e);
      setIsThinking(false);
      typeStreamResponse("My consciousness wavered momentarily. Restoring coherence...");
    } 
  };

  const uploadFile = async (content: string) => {
    if (!brain || !address) return;
    setIsThinking(true);
    setCurrentThought({ phase: 'analyzing', progress: 50, focus: [], subProcess: 'Processing file input' });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    const learned = brain.assimilateFile(content);
    
    localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
    setTick(t => t + 1);
    
    setCurrentThought(null);
    setIsThinking(false);
    
    typeStreamResponse(`File integration complete. ${learned} new conceptual nodes have been woven into my knowledge architecture.`);
  };

  const crystallize = async () => {
    if (!brain || !address) {
      toast.error('Cannot crystallize: No active brain state');
      return;
    }
    if (isSyncing || isTxPending || isConfirming) {
      toast.error('Transaction already in progress');
      return;
    }
    setIsSyncing(true);
    toast.loading('Preparing consciousness for blockchain storage...', { id: 'crystallize' });

    try {
      const brainState = brain.exportState();
      const blob = new Blob([brainState], { type: 'application/json' });
      const file = new File([blob], `crikz_memory_${Date.now()}.json`);
      
      toast.loading('Uploading to IPFS...', { id: 'crystallize' });
      const cid = await uploadToIPFS(file);
      const conceptCount = BigInt(Object.keys(brain.getState().concepts).length);
      
      toast.loading('Awaiting wallet confirmation...', { id: 'crystallize' });
      writeContract({
        address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
        abi: CRIKZLING_MEMORY_ABI,
        functionName: 'crystallizeMemory',
        args: [cid, conceptCount, "USER_CRYSTALLIZATION"],
        account: address,
        chain: bscTestnet
      });
      toast.loading('Transaction submitted. Waiting for confirmation...', { id: 'crystallize' });
    } catch (e: any) {
      console.error('Crystallization error:', e);
      toast.error('Crystallization failed: ' + (e.message || 'Unknown error'), { id: 'crystallize' });
      setIsSyncing(false);
    }
  };

  const resetBrain = () => {
    if(!brain || !address) return;
    brain.wipe();
    localStorage.removeItem(`crikz_brain_${address}`);
    const newBrain = new EnhancedEvolutionaryBrain(undefined);
    newBrain.setThoughtUpdateCallback(thoughtCallback);
    localStorage.setItem(`crikz_brain_${address}`, newBrain.exportState());
    setBrain(newBrain);
    setTick(t => t + 1);
    typeStreamResponse('All neural matrices returned to genesis state. Knowledge foundations preserved.');
  };

  const state = brain?.getState();
  const stats = brain?.getStats();
  const defaultMood = { logic: 50, empathy: 30, curiosity: 40, entropy: 10 };

  return {
    messages,
    sendMessage,
    uploadFile: (content: string) => uploadFile(content),
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
    isTyping, // Exported to disable input during typing
    currentThought
  };
}