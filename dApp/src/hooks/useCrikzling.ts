import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { EvolutionaryBrain } from '@/lib/crikzling-evolutionary-brain';
import { uploadToIPFS } from '@/lib/ipfs-service';

const CRIKZLING_CONTRACT_ADDRESS = '0x...'; // PASTE YOUR DEPLOYED ADDRESS HERE

const CONTRACT_ABI = [
  { "inputs": [{ "internalType": "string", "name": "_cid", "type": "string" }], "name": "crystallize", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "getMemory", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }
] as const;

export function useCrikzling() {
  const { address, isConnected } = useAccount();
  const [brain, setBrain] = useState<EvolutionaryBrain | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: contractCid } = useReadContract({
    address: CRIKZLING_CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getMemory',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  });

  const { writeContract, data: hash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

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
      
      writeContract({
        address: CRIKZLING_CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'crystallize',
        args: [cid],
      });
      
      brain.clearUnsavedCount();
      localStorage.setItem(`crikz_brain_${address}`, brain.exportState());
    } catch (e) {
      console.error("Crystallization failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    messages,
    sendMessage,
    uploadFile,
    crystallize,
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