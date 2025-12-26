// src/hooks/useCrikzling.ts
import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { EvolutionaryBrain } from '@/lib/crikzling-evolutionary-brain';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { toast } from 'react-hot-toast';
import { CRIKZLING_MEMORY_ADDRESS } from '@/config/index';

// ADDED 'as const' HERE TO FIX TS2345 ERROR
const MEMORY_ABI = [
  { 
    name: 'crystallizeMemory', 
    type: 'function', 
    stateMutability: 'nonpayable', 
    inputs: [{type:'string'},{type:'uint256'},{type:'string'}], 
    outputs: [] 
  }
] as const;

// Ensure this matches your wallet address exactly to see the "Admin Mode" buttons
const OWNER_ADDRESS = "0x7072F8955FEb6Cdac4cdA1e069f864969Da4D379"; 

export function useCrikzling() {
  const { address } = useAccount();
  const brainRef = useRef<EvolutionaryBrain | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsSave, setNeedsSave] = useState(false);
  
  const { writeContract } = useWriteContract();

  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  // Initialize Brain
  useEffect(() => {
    if (!brainRef.current) {
        const saved = localStorage.getItem('crikz_evo_brain');
        brainRef.current = new EvolutionaryBrain(saved || undefined);
    }
    
    // Check notifications loop
    const interval = setInterval(() => {
        if(brainRef.current) {
            const newLogs = brainRef.current.getLearningBuffer();
            if(newLogs.length > 0) {
                setNotifications(prev => [...prev, ...newLogs].slice(-5)); // Keep last 5
            }
            setNeedsSave(brainRef.current.needsCrystallization());
        }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (text: string) => {
    if (!brainRef.current) return;

    // User Message
    setMessages(prev => [...prev, { sender: 'user', text }]);

    // Brain Process
    const result = brainRef.current.process(text, isOwner);

    // Bot Response (Simulated delay for realism)
    setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: result.response }]);
        // Auto-save local
        localStorage.setItem('crikz_evo_brain', brainRef.current!.exportState());
    }, 600);
  };

  const uploadFile = async (content: string) => {
      if(!brainRef.current) return;
      const count = brainRef.current.assimilateFile(content);
      toast.success(`Absorbed ${count} concepts from file.`);
  };

  const crystallize = async () => {
      if(!brainRef.current) return;
      setIsSyncing(true);
      try {
          // 1. Export State
          const stateJson = brainRef.current.exportState();
          const conceptCount = JSON.parse(stateJson).lastCrystallizedCount; 
          
          // 2. Upload to IPFS
          const cid = await uploadToIPFS(new File([stateJson], "brain.json"));
          
          // 3. Write to Chain
          // FIX: Use correctly imported address and cast types
          writeContract({
              address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
              abi: MEMORY_ABI,
              functionName: 'crystallizeMemory',
              args: [cid, BigInt(conceptCount), isOwner ? "OWNER_TRAIN" : "USER_INTERACTION"],
          });

          brainRef.current.markCrystallized();
          setNeedsSave(false);
          toast.success("Memory Crystallized on Blockchain");
      } catch(e) {
          console.error(e);
          toast.error("Crystallization Failed");
      } finally {
          setIsSyncing(false);
      }
  };

  const resetBrain = () => {
      if(!isOwner) return;
      brainRef.current?.wipe();
      setMessages([{sender: 'bot', text: 'Memory formatting complete. I am void.'}]);
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
      isSyncing
  };
}