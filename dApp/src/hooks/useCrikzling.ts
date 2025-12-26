// src/hooks/useCrikzling.ts
import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useConfig } from 'wagmi'; // Added useConfig
import { EvolutionaryBrain } from '@/lib/crikzling-evolutionary-brain';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { toast } from 'react-hot-toast';
import { CRIKZLING_MEMORY_ADDRESS } from '@/config/index';
import { bscTestnet } from 'wagmi/chains'; // Import the chain

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
  const { address, chainId } = useAccount(); // Get current chainId
  const brainRef = useRef<EvolutionaryBrain | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsSave, setNeedsSave] = useState(false);
  
  const { writeContract } = useWriteContract();

  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  useEffect(() => {
    if (!brainRef.current) {
        const saved = localStorage.getItem('crikz_evo_brain');
        brainRef.current = new EvolutionaryBrain(saved || undefined);
    }
    
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
    setMessages(prev => [...prev, { sender: 'user', text }]);
    const result = brainRef.current.process(text, isOwner);
    setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: result.response }]);
        localStorage.setItem('crikz_evo_brain', brainRef.current!.exportState());
    }, 600);
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
          const conceptCount = JSON.parse(stateJson).lastCrystallizedCount || 0; 
          const cid = await uploadToIPFS(new File([stateJson], "brain.json"));
          
          // FIX: Explicitly passing 'chain' and 'account' to satisfy strict TS requirements
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