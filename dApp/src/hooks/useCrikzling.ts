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
  const [isThinking, setIsThinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useReadContract({
    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
    abi: CRIKZLING_MEMORY_ABI,
    functionName: 'getLatestMemory',
    query: { enabled: !!address }
  });

  const { writeContract, data: hash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const savedLocal = localStorage.getItem(`crikz_brain_${address}`);
    const initialBrain = new EvolutionaryBrain(savedLocal || undefined);
    setBrain(initialBrain);
  }, [address]);

  const sendMessage = async (text: string) => {
    if (!brain) return;
    setIsThinking(true);
    const { response } = await brain.process(text, true);
    setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'bot', content: response }]);
    localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
    setIsThinking(false);
  };

  const uploadFile = async (content: string) => {
    if (!brain) return;
    brain.assimilateFile(content);
    localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
    setMessages(prev => [...prev, { role: 'bot', content: "Batch assimilation complete. Neural pathways updated." }]);
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
    } catch (e) {
      console.error("Crystallization failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const resetBrain = () => {
    if(!brain) return;
    brain.wipe();
    setMessages([]);
    localStorage.removeItem(`crikz_brain_${address}`);
    localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
    setBrain(new EvolutionaryBrain(undefined));
  };

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
      stage: brain?.getState().evolutionStage || 'GENESIS',
      nodes: Object.keys(brain?.getState().concepts || {}).length,
      relations: brain?.getState().relations.length || 0,
      unsaved: brain?.getState().unsavedDataCount || 0,
      mood: brain?.getState().mood || { logic: 0, empathy: 0, curiosity: 0, entropy: 0 }
    },
    isThinking
  };
}