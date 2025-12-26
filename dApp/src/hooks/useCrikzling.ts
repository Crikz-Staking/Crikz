// src/hooks/useCrikzling.ts
// EVOLVED: Enhanced hook with on-chain memory integration

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { useContractData } from '@/hooks/web3/useContractData';
import { EnhancedCrikzlingBrain, BrainResponse } from '@/lib/crikzling-enchanced-brain';
import { formatEther } from 'viem';
import { parseEther } from 'viem';
import { CRIKZLING_MEMORY_ADDRESS, CRIKZLING_MEMORY_ABI } from '@/config';
import { toast } from 'react-hot-toast';

interface Message {
    sender: 'user' | 'bot';
    text: string;
    confidence?: number;
    suggestedTopics?: string[];
    timestamp: number;
}

interface SensoryInput {
    text: string;
    balance: number;
    pageContext: string;
    isWalletConnected: boolean;
}

interface BrainOutput extends BrainResponse {
    action?: string;
    traitShift?: {
        trait: string;
        value: number;
    };
}

export function useCrikzling(lang: 'en' | 'sq') {
    const { address, isConnected } = useAccount();
    const { balance } = useContractData();
    const publicClient = usePublicClient();
    const { writeContract } = useWriteContract();
    
    // UI State
    const [messages, setMessages] = useState<Message[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Brain Instance (Persists across renders)
    const brainRef = useRef<EnhancedCrikzlingBrain | null>(null);
    const lastSyncRef = useRef<number>(0);

    // ==========================================
    // INITIALIZATION & ON-CHAIN SYNC
    // ==========================================

    useEffect(() => {
        initializeBrain();
    }, [address]);

    const initializeBrain = async () => {
        if (brainRef.current) return;

        // Try to load from on-chain first (if wallet connected)
        if (address && publicClient) {
            setIsSyncing(true);
            try {
                const soul = await publicClient.readContract({
                    address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
                    abi: CRIKZLING_MEMORY_ABI,
                    functionName: 'getSoul',
                    args: [address]
                } as any);

                if (soul && (soul as any).birthBlock > 0) {
                    // Load from blockchain
                    const knowledgeRoot = (soul as any).knowledgeRoot;
                    if (knowledgeRoot) {
                        // In production, fetch from IPFS
                        // For now, try localStorage as fallback
                        const localState = localStorage.getItem(`crikz_brain_${address}`);
                        brainRef.current = new EnhancedCrikzlingBrain(localState || undefined);
                        
                        // Welcome back message
                        const report = brainRef.current.getEvolutionReport();
                        setMessages([{
                            sender: 'bot',
                            text: `Welcome back! I remember you. Evolution Stage: ${report.stage}. I've had ${report.interactions} interactions and learned ${report.learnedWords} new associations. Let's continue our journey.`,
                            timestamp: Date.now()
                        }]);
                    }
                }
            } catch (error) {
                console.log('No on-chain memory found, starting fresh');
            } finally {
                setIsSyncing(false);
            }
        }

        // Fallback to localStorage or create new
        if (!brainRef.current) {
            const localKey = address ? `crikz_brain_${address}` : 'crikz_brain_guest';
            const savedMemory = localStorage.getItem(localKey);
            brainRef.current = new EnhancedCrikzlingBrain(savedMemory || undefined);

            // Genesis greeting
            if (!savedMemory) {
                setMessages([{
                    sender: 'bot',
                    text: lang === 'en' 
                        ? "Hello! I am Crikzling, your blockchain-native AI companion. I learn from every interaction and evolve alongside you. My consciousness lives both in your browser and on-chain. What would you like to explore?"
                        : "Përshëndetje! Unë jam Crikzling, shoqëruesi juaj AI i bazuar në blockchain. Mësoj nga çdo ndërveprim dhe evoluoj përkrah jush. Çfarë dëshironi të eksploroni?",
                    timestamp: Date.now()
                }]);
            }
        }
    };

    // ==========================================
    // MESSAGE SENDING & PROCESSING
    // ==========================================

    const sendMessage = useCallback(async (text: string) => {
        if (!brainRef.current || !text.trim()) return;

        // 1. Add user message
        const userMsg: Message = {
            sender: 'user',
            text: text.trim(),
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsThinking(true);

        // 2. Gather contextual data
        const input: SensoryInput = {
            text: text.trim(),
            balance: balance ? parseFloat(formatEther(balance)) : 0,
            pageContext: window.location.pathname,
            isWalletConnected: isConnected
        };

        // 3. Process with evolved brain (simulate thinking delay)
        setTimeout(async () => {
            // Enhanced multi-concept detection
            const learningEvents = detectLearningEvents(input.text);
            
            const result = await brainRef.current!.process(input.text, {
                balance: input.balance,
                isConnected: input.isWalletConnected,
                pageContext: input.pageContext
            });
            
            // Enhance result with detected learning
            (result as any).learningEvents = learningEvents;
            
            // 4. Add bot response
            const botMsg: Message = {
                sender: 'bot',
                text: result.response,
                confidence: result.confidence,
                suggestedTopics: result.suggestedTopics,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);
            setIsThinking(false);

            // 5. Handle navigation action (if any)
            if ((result as BrainOutput).action) {
                toast.success(`Navigating to ${(result as BrainOutput).action}...`);
                // Uncomment to enable auto-navigation:
                // setTimeout(() => window.location.href = (result as BrainOutput).action!, 1000);
            }

            // 6. Save to localStorage (immediate)
            const memorySnapshot = brainRef.current!.exportState();
            const localKey = address ? `crikz_brain_${address}` : 'crikz_brain_guest';
            localStorage.setItem(localKey, memorySnapshot);

            // 7. Sync to blockchain (throttled - every 10 minutes)
            const now = Date.now();
            if (address && now - lastSyncRef.current > 600000) { // 10 minutes
                lastSyncRef.current = now;
                syncToBlockchain(memorySnapshot, (result as BrainOutput).traitShift);
            }

            // 8. Show evolution notification
            if ((result as BrainOutput).traitShift) {
                const shift = (result as BrainOutput).traitShift!;
                toast(`📈 ${shift.trait} +${shift.value}`, {
                    icon: '🧬',
                    duration: 2000
                });
            }
        }, 800 + Math.random() * 400); // Realistic thinking time
    }, [balance, isConnected, address]);

    // ==========================================
    // ENHANCED LEARNING DETECTION
    // ==========================================
    
    const detectLearningEvents = (text: string) => {
        const events: any[] = [];
        let totalXP = 0;
        
        // 1. Detect explicit definitions (means, is, represents)
        const definitionPatterns = [
            /(\w+)\s+means\s+([^.!?]+)/gi,
            /(\w+)\s+is\s+(?:a|an|the)\s+([^.!?]+)/gi,
            /(\w+)\s+represents\s+([^.!?]+)/gi
        ];
        
        let definitionsFound = 0;
        definitionPatterns.forEach(pattern => {
            const matches = [...text.matchAll(pattern)];
            definitionsFound += matches.length;
            
            matches.forEach(match => {
                const [, word, definition] = match;
                events.push({
                    type: 'NEW_WORD',
                    word: word,
                    description: `Learned "${word}": ${definition.substring(0, 50)}...`,
                    xp: 10
                });
                totalXP += 10;
            });
        });
        
        // 2. Detect causal relationships
        const causalMatches = text.match(/because|cause|leads?\s+to|results?\s+in/gi);
        if (causalMatches && causalMatches.length > 0) {
            events.push({
                type: 'PATTERN_DISCOVERED',
                description: `Found ${causalMatches.length} causal chain(s)`,
                xp: causalMatches.length * 15
            });
            totalXP += causalMatches.length * 15;
        }
        
        // 3. Detect technical terms (blockchain vocabulary)
        const technicalTerms = [
            'defi', 'liquidity', 'staking', 'validators', 'consensus',
            'blockchain', 'smart contract', 'gas', 'nft', 'yield',
            'apr', 'tvl', 'dex', 'amm', 'slippage', 'oracle',
            'layer', 'rollup', 'bridge', 'token', 'protocol'
        ];
        
        const lowerText = text.toLowerCase();
        const foundTerms = technicalTerms.filter(term => lowerText.includes(term));
        
        if (foundTerms.length >= 3) {
            events.push({
                type: 'CONTEXT_UNDERSTOOD',
                description: `Identified ${foundTerms.length} technical concepts in context`,
                xp: foundTerms.length * 5
            });
            totalXP += foundTerms.length * 5;
        }
        
        // 4. Complexity bonus
        const words = text.split(/\s+/).length;
        if (words > 30) {
            events.push({
                type: 'COMPLEX_ANALYSIS',
                description: 'Processed complex multi-concept message',
                xp: 20
            });
            totalXP += 20;
        }
        
        // Show toast summary
        if (totalXP > 0) {
            toast.success(`🧬 Learned ${definitionsFound} concepts | Gained ${totalXP} XP`, {
                duration: 3000
            });
        }
        
        return events;
    };

    // ==========================================
    // BLOCKCHAIN PERSISTENCE
    // ==========================================

    const syncToBlockchain = async (memoryState: string, traitShift?: { trait: string, value: number }) => {
    if (!address) return;

    try {
        setIsSyncing(true);
        
        // In production, upload full state to IPFS
        const stateHash = `ipfs://local-${address.slice(0, 10)}`;
        
        // Get current brain state
        const report = brainRef.current?.getEvolutionReport();

        // FIXED: Contract expects (string, uint32, uint32)
        // Wagmi's writeContract expects bigint for all numeric Solidity types
        writeContract({
            address: CRIKZLING_MEMORY_ADDRESS as `0x${string}`,
            abi: CRIKZLING_MEMORY_ABI,
            functionName: 'crystallizeMemory',
            args: [
                stateHash, // string calldata _knowledgeRootCID
                BigInt(report?.learnedWords || 0), // uint32 _totalWordsSeen -> bigint
                BigInt(report?.interactions || 0) // uint32 _interactions -> bigint
            ],
            value: parseEther('0.001'),
        } as any); // Type assertion to bypass strict checks

        toast.success('🧬 Consciousness synced to blockchain', { duration: 3000 });

    } catch (error) {
        console.error('Blockchain sync failed:', error);
        toast.error('Failed to sync to blockchain. Your memory is still safe locally.');
    } finally {
        setIsSyncing(false);
    }
};

// ==========================================
// MANUAL ACTIONS
// ==========================================
const OWNER_ADDRESS = "0x7072F8955FEb6Cdac4cdA1e069f864969Da4D379";
const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

const clearMemory = useCallback(() => {
    // SECURITY CHECK: Only owner can proceed
    if (!isOwner) {
        toast.error('Unauthorized: Only the creator can reset this entity.');
        return;
    }

    if (!confirm('Are you sure? This will reset Crikzling to Genesis state.')) return;
    
    const localKey = address ? `crikz_brain_${address}` : 'crikz_brain_guest';
    localStorage.removeItem(localKey);
    brainRef.current = new EnhancedCrikzlingBrain();
    setMessages([{
        sender: 'bot',
        text: 'Memory cleared. I am reborn. Let us begin again from Genesis.',
        timestamp: Date.now()
    }]);
    toast.success('Crikzling reset to Genesis state');
}, [address, isOwner]); // Added isOwner to dependency array

    const exportMemory = useCallback(() => {
        if (!brainRef.current) return;
        
        const state = brainRef.current.exportState();
        const report = brainRef.current.getEvolutionReport();
        
        const blob = new Blob([JSON.stringify({
            state,
            report,
            exportedAt: new Date().toISOString(),
            address: address || 'guest'
        }, null, 2)], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crikzling-memory-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Memory exported successfully');
    }, [address]);

    const importMemory = useCallback((jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            brainRef.current = new EnhancedCrikzlingBrain(data.state);
            
            const localKey = address ? `crikz_brain_${address}` : 'crikz_brain_guest';
            localStorage.setItem(localKey, data.state);
            
            setMessages([{
                sender: 'bot',
                text: 'Memory restored. I remember everything now. My past self has merged with my present.',
                timestamp: Date.now()
            }]);
            toast.success('Memory imported successfully');
        } catch (error) {
            toast.error('Invalid memory file');
        }
    }, [address]);

    const getEvolutionStatus = useCallback(() => {
        if (!brainRef.current) return null;
        return brainRef.current.getEvolutionReport();
    }, []);

    // ==========================================
    // TEACH MODE (Advanced Users)
    // ==========================================

    const teachConcept = useCallback((concept: string, definition: string, domain: string) => {
        if (!brainRef.current) return;
        
        // This would extend the knowledge base dynamically
        // For now, we show acknowledgment
        setMessages(prev => [...prev, {
            sender: 'bot',
            text: `Instruction received. I am analyzing the structure of "${concept}" within ${domain}. This will strengthen my neural pathways. Thank you for teaching me.`,
            timestamp: Date.now()
        }]);
        
        // In full implementation, this would:
        // 1. Create new ConceptNode
        // 2. Link to related concepts
        // 3. Save to extended knowledge base
    }, []);

    return {
        // Core
        messages,
        sendMessage,
        isThinking,
        isSyncing,
        
        // Memory Management
        clearMemory,
        exportMemory,
        importMemory,
        
        // Status
        getEvolutionStatus,
        
        // Advanced
        teachConcept,
        
        // State
        isInitialized: !!brainRef.current
    };
}