import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { CrikzlingBrainV3 } from '@/lib/brain/crikzling-brain-v3';
import { useContractData } from '@/hooks/web3/useContractData';
import { ModelConfig } from '@/lib/brain/types';

// ONLY FUNCTIONAL MODELS
export const AVAILABLE_MODELS: ModelConfig[] = [
    { 
        id: 'llama-3.3-70b-versatile', 
        name: 'Crikz Core (Llama 3.3)', 
        provider: 'groq', 
        description: 'High-speed protocol architect. Best for general queries.',
        limitInfo: 'Fast & Reliable'
    },
    { 
        id: 'gemini-1.5-flash', 
        name: 'Gemini 1.5 Flash', 
        provider: 'google', 
        description: 'Google\'s efficient multimodal model.',
        limitInfo: 'Standard Rate Limits'
    }
];

export function useCrikzlingV3() {
  const { address } = useAccount();
  const [brain, setBrain] = useState<CrikzlingBrainV3 | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'bot' | 'system', content: string, timestamp: number}[]>([]);
  
  // AI State: 'idle' | 'thinking' | 'responding'
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'responding'>('idle');
  
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
    if (!brain || aiState === 'thinking') return;
    
    setAiState('thinking');
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);

    try {
      const { response } = await brain.process(text, dappContextRef.current, selectedModel);
      
      setAiState('responding');
      setMessages(prev => [...prev, { role: 'bot', content: response, timestamp: Date.now() }]);
      
      // Go back to idle after a short delay to let animations finish
      setTimeout(() => setAiState('idle'), 2000);

    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'system', content: `Error: ${e.message}`, timestamp: Date.now() }]);
      setAiState('idle');
    }
  };

  const clearHistory = () => setMessages([]);

  return {
    messages, 
    sendMessage, 
    aiState, // Exported for Background.tsx
    selectedModel,
    setSelectedModel,
    clearHistory,
    isOwner: !!address
  };
}