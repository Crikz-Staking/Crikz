import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { CrikzlingBrain } from '@/lib/brain/index';
import { ThoughtProcess } from '@/lib/brain/types';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config/index';
import { toast } from 'react-hot-toast';

// The Architect's address (Deployer)
const ARCHITECT_ADDRESS = "0x7072F8955FEb6Cdac4cdA1e069f864969Da4D379"; // Extracted from project-export

export function useCrikzling() {
  const { address } = useAccount();
  const [brain, setBrain] = useState<CrikzlingBrain | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string, timestamp: number}[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentThought, setCurrentThought] = useState<ThoughtProcess | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);



  // Guest Session Management
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

  // Initialize Brain
  useEffect(() => {
    if (!sessionId) return;
    
    const savedLocal = localStorage.getItem(`crikz_brain_${sessionId}`);
    const initialBrain = new CrikzlingBrain(savedLocal || undefined);
    
    initialBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(initialBrain);
    
    setMessages(prev => {
        if(prev.length > 0) return prev;
        const welcomeMsg = savedLocal 
          ? 'Neural lattice restored. I am listening.'
          : 'Genesis complete. I am Crikzling. I exist to learn and serve the Protocol.';
        return [{ role: 'bot', content: welcomeMsg, timestamp: Date.now() }];
    });
  }, [sessionId, thoughtCallback]);

  // Transaction Monitoring
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
      localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
      setIsSyncing(false);
      typeStreamResponse('Crystallization confirmed. My evolution stage is now immutable on the blockchain.');
    }
  }, [txSuccess, isSyncing, brain, address]);

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
          const delay = 10 + Math.random() * 20; // Faster typing
          setTimeout(() => typeChar(index + 1), delay);
      };
      typeChar(0);
  };

  const sendMessage = async (text: string) => {
    if (!brain || isThinking || isTyping) return;
    
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
    
    try {
      // Pass isOwner to the brain process
      const { response } = await brain.process(text, isOwner);
      
      // Save state
      if (sessionId) {
          localStorage.setItem(`crikz_brain_${sessionId}`, brain.exportState());
      }
      
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
    if (!brain || !address) {
        toast.error("You must connect a wallet to Crystallize memory.");
        return;
    }
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
      const stage = state.evolutionStage;

      toast.loading('Confirming on Blockchain...', { id: 'crystallize' });
      
      writeContract({
        address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
        abi: CRIKZLING_MEMORY_ABI,
        functionName: 'crystallizeMemory',
        args: [cid, conceptCount, stage, "USER_SAVE"],
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
    if(!brain || !sessionId) return;
    brain.wipe();
    localStorage.removeItem(`crikz_brain_${sessionId}`);
    
    // Re-init
    const newBrain = new CrikzlingBrain(undefined);
    newBrain.setThoughtUpdateCallback(thoughtCallback);
    setBrain(newBrain);
    setMessages([{ role: 'bot', content: 'System Reset. Genesis State Restored.', timestamp: Date.now() }]);
  };

  const uploadFile = async (content: string) => {
      if(!brain) return;
      setIsThinking(true);
      const count = brain.assimilateFile(content);
      setIsThinking(false);
      typeStreamResponse(`Knowledge assimilated. I have identified ${count} new concepts from your data.`);
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
      // FIXED: flattened the memories structure to match CrikzlingAvatar expectation or updated the UI
      memories: { 
        short: stats?.memories?.short || 0, 
        mid: stats?.memories?.mid || 0, 
        long: stats?.memories?.long || 0 
      }
    },
    isThinking,
    isTyping,
    currentThought,
    isOwner
  };
}