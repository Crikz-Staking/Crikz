import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { CrikzlingBrainV3 } from '@/lib/brain/crikzling-brain-v3';
import { useContractData } from '@/hooks/web3/useContractData';
import { ModelConfig } from '@/lib/brain/types';

// FILTERED LIST: Only high-availability models
export const AVAILABLE_MODELS: ModelConfig[] = [
    { 
        id: 'llama-3.3-70b-versatile', 
        name: 'Crikz Core (Llama 3)', 
        provider: 'groq', 
        description: 'The standard protocol intelligence. Fast and reliable.',
        limitInfo: 'High speed, optimized for Crikz queries.'
    },
    { 
        id: 'gemini-1.5-flash', 
        name: 'Gemini Flash', 
        provider: 'google', 
        description: 'Google\'s lightweight model. Good for general knowledge.',
        limitInfo: '15 Requests/min.'
    },
    { 
        id: 'mixtral-8x7b-32768', 
        name: 'Mixtral 8x7b', 
        provider: 'groq', 
        description: 'Complex reasoning for deeper protocol analysis.',
        limitInfo: 'Generous token allowance.'
    }
];

export function useCrikzlingV3() {
  const { address } = useAccount();
  const [brain, setBrain] = useState<CrikzlingBrainV3 | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot' | 'system', content: string, timestamp: number}[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(AVAILABLE_MODELS[0]);

  const { balance, activeOrders, totalReputation, globalFund } = useContractData();
  const dappContextRef = useRef<any>(undefined);

  useEffect(() => {
    dappContextRef.current = {
      user_balance: balance,
      active_orders_count: activeOrders?.length || 0,
      total_reputation: totalReputation,
      global_total_reputation: globalFund?.totalReputation,
      wallet_address: address
    };
  }, [balance, activeOrders, totalReputation, address]);

  useEffect(() => {
    if (!brain) setBrain(new CrikzlingBrainV3());
  }, []);

  const sendMessage = async (text: string) => {
    if (!brain || isThinking) return;
    
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);

    try {
      const { response } = await brain.process(text, dappContextRef.current, selectedModel);
      setMessages(prev => [...prev, { role: 'bot', content: response, timestamp: Date.now() }]);
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'system', content: "Neural Link Unstable: " + (e.message || "Connection Error."), timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearHistory = () => {
      setMessages([]);
  };

  return {
    messages, 
    sendMessage, 
    isThinking, 
    selectedModel,
    setSelectedModel,
    clearHistory,
    isOwner: !!address
  };
}