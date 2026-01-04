import { MemoryConsolidationEngine } from './memory-consolidation';
import { DAppContext, ActionPlan, ModelConfig, Memory } from './types';
import { formatEther } from 'viem';

export class CrikzlingBrainV3 { 
  private memory: MemoryConsolidationEngine;

  constructor(baseState?: string) {
    this.memory = new MemoryConsolidationEngine(baseState ? JSON.parse(baseState) : undefined);
  }

  public async process(
    text: string, 
    dappContext: DAppContext | undefined, 
    config: ModelConfig
  ): Promise<{ response: string; actionPlan: ActionPlan }> { 
    
    // 1. Retrieve Context
    const relevantMemories = await this.memory.retrieve(text, 5);
    
    // FIX: Explicitly typed 'm' as Memory to solve TS7006
    const memoryContext = relevantMemories
        .map((m: Memory) => `[${m.role.toUpperCase()}]: ${m.content}`)
        .join("\n");

    // 2. Professional System Prompt
    const systemPrompt = `
    You are the **Crikz Protocol Architect**, an advanced AI assistant embedded in a decentralized application (dApp) on the BSC Testnet.
    
    **YOUR OBJECTIVE:**
    Provide accurate, professional, and helpful assistance regarding the Crikz ecosystem.

    **PROJECT KNOWLEDGE BASE:**
    - **Core**: A DeFi protocol combining Fibonacci mathematics with algorithmic reputation.
    - **Token**: $CRKZ (Crikz Token). Used for staking, betting, and governance.
    - **NFT Marketplace**: Users can mint files (IPFS), buy/sell, and auction digital assets.
    - **Sports Betting**: A decentralized sportsbook for live events.
    - **Arcade**: Provably fair blockchain games.
    - **Current Status**: Running on BSC Testnet (Chain ID 97).

    **USER CONTEXT:**
    - Wallet: ${dappContext?.wallet_address ? dappContext.wallet_address : 'Not Connected'}
    - Balance: ${dappContext?.user_balance ? formatEther(dappContext.user_balance as bigint) : '0'} CRKZ
    - Active Orders: ${dappContext?.active_orders_count || 0}

    **CONVERSATION HISTORY:**
    ${memoryContext}
    
    **USER QUERY:**
    ${text}
    `;

    try {
        let responseText = "";
        let response: Response;

        // --- GOOGLE GEMINI ---
        if (config.provider === 'google') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.id}:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;
            
            response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ 
                        role: "user",
                        parts: [{ text: systemPrompt }] 
                    }]
                })
            });
        } 
        // --- GROQ (Llama 3) ---
        else {
            const url = "https://api.groq.com/openai/v1/chat/completions";
            const key = import.meta.env.VITE_GROQ_API_KEY;

            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [
                        { role: "user", content: systemPrompt }
                    ],
                    model: config.id,
                    temperature: 0.5,
                    max_tokens: 1024
                })
            });
        }

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`AI Provider Error: ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        // Parse Response
        if (config.provider === 'google') {
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "System malfunction. No response data.";
        } else {
            responseText = data.choices?.[0]?.message?.content || "System malfunction. No response data.";
        }

        // Save to Memory
        await this.memory.store('user', text, dappContext);
        await this.memory.store('bot', responseText, dappContext);

        return { 
            response: responseText, 
            actionPlan: { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 1, reasoning: 'Standard Reply' } 
        };

    } catch (error: any) {
        console.error("Brain Process Error:", error);
        throw error; 
    }
  }
}