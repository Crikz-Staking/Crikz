// src/hooks/useCrikzling.ts
import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { EvolutionaryBrain } from '@/lib/crikzling-evolutionary-brain';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { toast } from 'react-hot-toast';
import { CRIKZLING_MEMORY_ADDRESS } from '@/config/index';
import { bscTestnet } from 'wagmi/chains';

const MEMORY_ABI = [
  { 
    name: 'crystallizeMemory', 
    type: 'function', 
    stateMutability: 'nonpayable', 
    inputs: [
        { name: '_ipfsCid', type: 'string' },
        { name: '_conceptsCount', type: 'uint256' },
        { name: '_trigger', type: 'string' }
    ], 
    outputs: [] 
  }
] as const;

const OWNER_ADDRESS = "0x7072F8955FEb6Cdac4cdA1e069f864969Da4D379"; 

export function useCrikzling() {
  const { address } = useAccount();
  const brainRef = useRef<EvolutionaryBrain | null>(null);
  const [messages, setMessages] = useState<{sender: 'user' | 'bot', text: string}[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsSave, setNeedsSave] = useState(false);
  
  // Use generic write contract for better error handling in UI
  const { writeContract, isPending } = useWriteContract();

  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  // Initialize Brain
  useEffect(() => {
    if (!brainRef.current) {
        const saved = localStorage.getItem('crikz_evo_brain');
        // Initialize with saved state or fresh
        brainRef.current = new EvolutionaryBrain(saved || undefined);
        
        // Initial Greeting if empty chat
        if (messages.length === 0) {
           const intro = brainRef.current.process("hello", isOwner);
           setMessages([{ sender: 'bot', text: intro.response }]);
        }
    }
  }, [address]); // Re-run if account changes (to update isOwner logic inside brain next process)

  // Polling for notifications and save state
  useEffect(() => {
    const interval = setInterval(() => {
        if(brainRef.current) {
            const newLogs = brainRef.current.getLearningBuffer();
            if(newLogs.length > 0) {
                 setNotifications(prev => [...prev, ...newLogs].slice(-5));
            }
            setNeedsSave(brainRef.current.needsCrystallization());
        }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (text: string) => {
    if (!brainRef.current) return;
    
    // 1. Add User Message
    setMessages(prev => [...prev, { sender: 'user', text }]);

    // 2. Process in Brain (Simulate thinking delay)
    const result = brainRef.current.process(text, isOwner);
    
    // 3. Bot Response
    setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: result.response }]);
        // Persist to local storage
        localStorage.setItem('crikz_evo_brain', brainRef.current!.exportState());
    }, 800);
  };

  const uploadFile = async (content: string) => {
      if(!brainRef.current) return;
      const count = brainRef.current.assimilateFile(content);
      toast.success(`Absorbed ${count} concepts.`);
  };

  const crystallize = async () => {
      if(!brainRef.current || !address) {
          toast.error("Please connect your wallet first");
          return;
      }
      setIsSyncing(true);
      try {
          const stateJson = brainRef.current.exportState();
          // Safe parse to get count
          const parsed = JSON.parse(stateJson);
          const conceptCount = parsed.totalInteractions || 0; 

          toast.loading("Uploading memory to IPFS...", { id: 'cryst' });
          const cid = await uploadToIPFS(new File([stateJson], "brain.json"));
          
          toast.loading("Confirming on Blockchain...", { id: 'cryst' });
          
          writeContract({
              address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
              abi: MEMORY_ABI,
              functionName: 'crystallizeMemory',
              args: [cid, BigInt(conceptCount), isOwner ? "OWNER_TRAIN" : "USER_INTERACTION"],
              chain: bscTestnet,
              account: address,
          });

          brainRef.current.markCrystallized();
          setNeedsSave(false);
          toast.success("Memory Crystallized!", { id: 'cryst' });
      } catch(e) {
          console.error(e);
          toast.error("Crystallization Failed", { id: 'cryst' });
      } finally {
          setIsSyncing(false);
      }
  };

  const resetBrain = () => {
      // Allow user to reset their local instance even if not owner
      brainRef.current?.wipe();
      setMessages([{sender: 'bot', text: 'SYSTEM REBOOT. MEMORY ERASED.'}]);
      localStorage.removeItem('crikz_evo_brain');
  }

  return {
      messages,
      notifications,
      sendMessage,
      uploadFile,
      crystallize,
      resetBrain,
      needsSave,
      isOwner,
      isSyncing: isSyncing || isPending
  };
}