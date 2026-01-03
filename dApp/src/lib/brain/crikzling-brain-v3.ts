import { MemoryConsolidationEngine } from './memory-consolidation';
import { BrainState, DAppContext, ActionPlan, ModelConfig } from './types';

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
    const memoryContext = relevantMemories.map(m => `[Memory]: ${m.content}`).join("\n");

    const systemPrompt = `You are Crikzling, an AI on the BSC Blockchain. Obsessed with Phi. Context: Balance ${dappContext?.user_balance || 0}.`;

    try {
        let responseText = "";
        let response: Response;

        if (config.provider === 'google') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.id}:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;
            response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nMEMORIES:\n${memoryContext}\n\nUSER: ${text}` }] }]
                })
            });
        } else {
            const url = config.provider === 'groq' ? "https://api.groq.com/openai/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions";
            const key = config.provider === 'groq' ? import.meta.env.VITE_GROQ_API_KEY : import.meta.env.VITE_OPENROUTER_API_KEY;

            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://crikz.protocol",
                    "X-Title": "Crikz Neural Station"
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "system", content: `RELEVANT MEMORIES:\n${memoryContext}` },
                        { role: "user", content: text }
                    ],
                    model: config.id,
                    temperature: 0.7
                })
            });
        }

        // --- LIMIT & ERROR HANDLING ---
        if (response.status === 429) {
            throw new Error(`[STATION LIMIT]: The ${config.provider.toUpperCase()} source has reached its rate limit. Please switch to a different AI source or wait a minute.`);
        }
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`[SOURCE ERROR]: ${errData.error?.message || 'API Connection Failed'}`);
        }

        const data = await response.json();
        if (config.provider === 'google') {
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
        } else {
            responseText = data.choices?.[0]?.message?.content || "No response.";
        }

        await this.memory.store('user', text, dappContext);
        await this.memory.store('bot', responseText, dappContext);

        return { response: responseText, actionPlan: { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 1, reasoning: 'Chat' } };

    } catch (error: any) {
        throw error; // Caught by the hook to show in chat
    }
  }
}