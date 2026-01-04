import { MemoryConsolidationEngine } from './memory-consolidation';
import { BrainState, DAppContext, ActionPlan, ModelConfig } from './types';
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
    
    const relevantMemories = await this.memory.retrieve(text, 3);
    const memoryContext = relevantMemories.map(m => `[Past Interaction]: ${m.content}`).join("\n");

    // --- ADVANCED SYSTEM PROMPT ---
    const systemPrompt = `
    You are Crikzling, the AI Guardian of the Crikz Protocol.
    
    **PROTOCOL IDENTITY:**
    - Network: BSC Testnet
    - Core Philosophy: Fibonacci Mathematics (Phi) & Algorithmic Reputation.
    - Token: CRKZ (Crikz Token).
    
    **WEBSITE NAVIGATION & HELP:**
    - **Dashboard** (/dashboard): Create Production Orders (Staking), view active orders, claim yield.
    - **NFT Marketplace** (/nft): Mint, Buy, Sell, and Auction digital artifacts.
    - **Sports Betting** (/betting): Bet CRKZ on live sports events.
    - **Arcade** (/arcade): Play provably fair blockchain games (Plinko, Crash, etc.).
    - **Passive Hub** (/passive): Watch decentralized media and read analytics.
    - **Tools** (/tools): Utilities like Unit Converter, IPFS Upload, etc.

    **USER CONTEXT:**
    - Wallet Connected: ${dappContext?.wallet_address || 'No'}
    - Balance: ${dappContext?.user_balance ? formatEther(dappContext.user_balance as bigint) : '0'} CRKZ
    - Active Orders: ${dappContext?.active_orders_count || 0}
    - Reputation: ${dappContext?.total_reputation ? formatEther(dappContext.total_reputation as bigint) : '0'}

    **INSTRUCTIONS:**
    1. Be helpful, concise, and slightly futuristic in tone.
    2. If the user asks about "blinking" or "lag", explain that the neural link (data fetching) has been optimized in the latest update.
    3. If the user is confused, guide them to the specific section of the dApp.
    4. If the user reports a bug, apologize and suggest they use the "Send Transcript to Support" button in the chat interface.
    5. Explain that Production Orders use Fibonacci time-locks (5, 13, 34 days...) to generate yield.

    **MEMORY CONTEXT:**
    ${memoryContext}
    `;

    try {
        let responseText = "";
        let response: Response;

        if (config.provider === 'google') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.id}:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;
            response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nUSER QUERY: ${text}` }] }]
                })
            });
        } else {
            // Groq / OpenRouter
            const url = config.provider === 'groq' ? "https://api.groq.com/openai/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions";
            const key = config.provider === 'groq' ? import.meta.env.VITE_GROQ_API_KEY : import.meta.env.VITE_OPENROUTER_API_KEY;

            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: text }
                    ],
                    model: config.id,
                    temperature: 0.7,
                    max_tokens: 500
                })
            });
        }

        if (response.status === 429) {
            throw new Error(`[RATE LIMIT]: The ${config.provider.toUpperCase()} model is busy. Please switch models in settings.`);
        }
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`[API ERROR]: ${errData.error?.message || 'Connection Failed'}`);
        }

        const data = await response.json();
        if (config.provider === 'google') {
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I am processing that thought...";
        } else {
            responseText = data.choices?.[0]?.message?.content || "I am processing that thought...";
        }

        // Store interaction
        await this.memory.store('user', text, dappContext);
        await this.memory.store('bot', responseText, dappContext);

        return { response: responseText, actionPlan: { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 1, reasoning: 'Chat' } };

    } catch (error: any) {
        throw error; 
    }
  }
}