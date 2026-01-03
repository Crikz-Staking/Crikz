import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { CrikzlingBrainV3 } from '@/lib/brain/crikzling-brain-v3';
import { useContractData } from '@/hooks/web3/useContractData';
import { ModelConfig } from '@/lib/brain/types';

export const AVAILABLE_MODELS: ModelConfig[] = [
    // GROQ SOURCE
    { 
        id: 'llama-3.3-70b-versatile', 
        name: 'Llama 3.3 70B', 
        provider: 'groq', 
        description: 'Ultra-fast, versatile reasoning.',
        limitInfo: 'High speed, moderate rate limits.'
    },
    { 
        id: 'mixtral-8x7b-32768', 
        name: 'Mixtral 8x7b', 
        provider: 'groq', 
        description: 'Great for complex instructions.',
        limitInfo: 'Fast, generous token allowance.'
    },
    // OPENROUTER SOURCE
    { 
        id: 'google/gemini-2.0-flash-exp:free', 
        name: 'Gemini 2.0 Flash', 
        provider: 'openrouter', 
        description: 'Next-gen speed and massive context.',
        limitInfo: 'Free tier (OpenRouter limits apply).'
    },
    { 
        id: 'anthropic/claude-3.5-sonnet', 
        name: 'Claude 3.5 Sonnet', 
        provider: 'openrouter', 
        description: 'Most intelligent & human-like coding/writing.',
        limitInfo: 'Paid/Credits required on OpenRouter.'
    },
    { 
        id: 'deepseek/deepseek-chat', 
        name: 'DeepSeek V3', 
        provider: 'openrouter', 
        description: 'Powerful open-source alternative to GPT-4.',
        limitInfo: 'Very low cost per million tokens.'
    },
    // GOOGLE NATIVE SOURCE
    { 
        id: 'gemini-1.5-pro', 
        name: 'Gemini 1.5 Pro', 
        provider: 'google', 
        description: 'Google\'s flagship high-intelligence model.',
        limitInfo: '15 Requests per minute (Free Tier).'
    },
    { 
        id: 'gemini-1.5-flash', 
        name: 'Gemini 1.5 Flash', 
        provider: 'google', 
        description: 'Lightweight and extremely fast.',
        limitInfo: '15 Requests per minute (Free Tier).'
    },
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
    };
  }, [balance, activeOrders, totalReputation]);

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
      setMessages(prev => [...prev, { role: 'system', content: e.message || "Connection Error.", timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
    }
  };

  return {
    messages, 
    sendMessage, 
    isThinking, 
    selectedModel,
    setSelectedModel,
    isOwner: !!address
  };
}