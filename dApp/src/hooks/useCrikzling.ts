import { useState, useRef, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContractData } from '@/hooks/web3/useContractData';
import { CrikzlingBrain, SensoryInput } from '@/lib/crikzling-brain';
import { formatEther } from 'viem';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config';

export function useCrikzling(lang: 'en' | 'sq') {
    const { isConnected } = useAccount();
    const { balance } = useContractData();
    
    // UI State
    const [messages, setMessages] = useState<{sender: 'user'|'bot', text: string}[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    
    // The Brain Instance (Persists across renders)
    const brainRef = useRef<CrikzlingBrain | null>(null);

    // Initialize Brain on Mount
    useEffect(() => {
        if (!brainRef.current) {
            const savedMemory = localStorage.getItem('crikz_brain_state');
            brainRef.current = new CrikzlingBrain(savedMemory || undefined);
        }
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if (!brainRef.current) return;

        // 1. Update UI
        setMessages(prev => [...prev, { sender: 'user', text }]);
        setIsThinking(true);

        // 2. Gather Sensory Data
        const input: SensoryInput = {
            text,
            balance: balance ? parseFloat(formatEther(balance)) : 0,
            pageContext: window.location.pathname,
            isWalletConnected: isConnected
        };

        // 3. Process (Simulate "Thinking" Time)
        setTimeout(() => {
            const result = brainRef.current!.process(input);
            
            // 4. Update Bot Response
            setMessages(prev => [...prev, { sender: 'bot', text: result.response }]);
            setIsThinking(false);

            // 5. Handle Actions (Navigation)
            if (result.action) {
                console.log(`[Crikzling Action] Requesting nav to: ${result.action}`);
                // window.location.href = result.action; // Uncomment to enable auto-nav
            }

            // 6. Save State (Learning Loop)
            const memorySnapshot = brainRef.current!.exportState();
            localStorage.setItem('crikz_brain_state', memorySnapshot);

            // 7. Log Trait Shift (Training Feedback)
            if (result.traitShift) {
                console.log(`[Training] ${result.traitShift.trait} increased by ${result.traitShift.value}`);
                // In a real scenario, you would batch these and call `crystallizeMemory` on the smart contract
            }

        }, 1200);
    }, [balance, isConnected]);

    // Exposed "Training" function for direct teaching
    const trainDirectly = (concept: string, definition: string) => {
        // This could be hooked into a UI "Teach Mode"
        setMessages(prev => [...prev, { 
            sender: 'bot', 
            text: `Instruction received. I am analyzing the structure of "${concept}".` 
        }]);
    };

    return {
        messages,
        sendMessage,
        trainDirectly,
        isThinking
    };
}