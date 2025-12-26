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
  // UI Stats State
  const [brainStats, setBrainStats] = useState({ nodes: 0, relations: 0, stage: 'GENESIS', mood: { logic: 0, empathy: 0, curiosity: 0 }, unsaved: 0 });

  const { writeContract, isPending } = useWriteContract();
  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  useEffect(() => {
    if (!brainRef.current) {
        const saved = localStorage.getItem('crikz_evo_brain');
        brainRef.current = new EvolutionaryBrain(saved || undefined);
        
        // Populate initial stats
        setBrainStats(brainRef.current.getStats());

        if (messages.length === 0) {
           const intro = brainRef.current.process("hello", isOwner);
           setMessages([{ sender: 'bot', text: intro.response }]);
        }
    }
  }, [address]);

  // Polling for notifications, save state, and stats
  useEffect(() => {
    const interval = setInterval(() => {
        if(brainRef.current) {
            const newLogs = brainRef.current.getLearningBuffer();
            if(newLogs.length > 0) {
                 setNotifications(prev => [...prev, ...newLogs].slice(-5));
            }
            setNeedsSave(brainRef.current.needsCrystallization());
            setBrainStats(brainRef.current.getStats());
        }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (text: string) => {
    if (!brainRef.current) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);
    
    // Simulate processing delay based on complexity
    setTimeout(() => {
        const result = brainRef.current!.process(text, isOwner);
        setMessages(prev => [...prev, { sender: 'bot', text: result.response }]);
        localStorage.setItem('crikz_evo_brain', brainRef.current!.exportState());
        setBrainStats(brainRef.current!.getStats());
    }, 800);
  };

  const uploadFile = async (content: string) => {
      if(!brainRef.current) return;
      const count = brainRef.current.assimilateFile(content);
      toast.success(`Absorbed ${count} concepts.`);
      setBrainStats(brainRef.current.getStats());
  };

  const crystallize = async () => {
      if(!brainRef.current || !address) {
          toast.error("Please connect your wallet first");
          return;
      }
      setIsSyncing(true);
      try {
          const stateJson = brainRef.current.exportState();
          const parsed = JSON.parse(stateJson);
          const conceptCount = Object.keys(parsed.concepts).length;

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
          setBrainStats(brainRef.current.getStats());
      } catch(e) {
          console.error(e);
          toast.error("Crystallization Failed", { id: 'cryst' });
      } finally {
          setIsSyncing(false);
      }
  };

  const resetBrain = () => {
      brainRef.current?.wipe();
      setMessages([{sender: 'bot', text: 'SYSTEM REBOOT. MEMORY ERASED.'}]);
      localStorage.removeItem('crikz_evo_brain');
      if(brainRef.current) setBrainStats(brainRef.current.getStats());
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
      isSyncing: isSyncing || isPending,
      brainStats
  };
}