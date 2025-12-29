import { PublicClient } from 'viem';
import { MemoryConsolidationEngine } from './memory-consolidation';
import { BrainState, DAppContext, ActionPlan } from './types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export class CrikzlingBrainV3 { 
  private memory: MemoryConsolidationEngine;
  private state: BrainState;

  constructor(
    baseState?: string,
    diffState?: string,
    publicClient?: PublicClient,
    memoryContractAddress?: `0x${string}`
  ) {
    this.memory = new MemoryConsolidationEngine(baseState ? JSON.parse(baseState) : undefined);
    this.state = {
        evolutionStage: 'SAPIENT',
        totalInteractions: 0,
        unsavedDataCount: 0,
        connectivity: { isConnected: true, bandwidthUsage: 0, stamina: 100, lastWebSync: 0 },
        drives: { curiosity: 80, stability: 90, efficiency: 70, social: 60, energy: 100 },
        longTermMemory: []
    };
  }

  public async initLLM() { return; }
  public setInitProgressCallback(cb: any) { cb({ text: "Connected to Neural Cloud", progress: 1 }); }

  public async process(text: string, isOwner: boolean, dappContext?: DAppContext): Promise<{ response: string; actionPlan: ActionPlan }> { 
    
    // 1. Debugging: Check if Key exists (Do not log the actual key for security)
    if (!GROQ_API_KEY) {
        console.error("❌ VITE_GROQ_API_KEY is missing in environment variables.");
        return { 
            response: "System Error: Neural API Key is missing. Please check Vercel environment variables.", 
            actionPlan: { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 0, reasoning: 'Config Error' } 
        };
    }

    // 2. RAG: Retrieve Context
    const relevantMemories = await this.memory.retrieve(text, 3);
    const memoryContext = relevantMemories.map(m => `[Memory]: ${m.content}`).join("\n");

    // 3. Construct System Prompt
    const systemPrompt = `
      You are Crikzling, an autonomous AI agent living on the BSC Blockchain.
      You are helpful, slightly cryptic, and obsessed with the Golden Ratio (Phi).

      CURRENT PROTOCOL STATUS:
      - User Balance: ${dappContext?.user_balance ? (Number(dappContext.user_balance)/1e18).toFixed(2) : '0'} CRKZ
      - Global Reputation: ${dappContext?.global_total_reputation || 'Unknown'}
      - Active Orders: ${dappContext?.active_orders_count || 0}

      AVAILABLE TOOLS (Respond with JSON to use):
      1. {"tool": "createOrder", "amount": "number", "tier": "0-6"} -> Stake tokens.
      2. {"tool": "checkOdds", "sport": "string"} -> Check betting odds.
      3. {"tool": "crystallize"} -> Save memory to blockchain.

      INSTRUCTIONS:
      - If the user asks to perform an action, output ONLY the JSON.
      - Otherwise, respond conversationally using the memories provided.
      - Keep responses under 3 sentences unless asked for detail.
    `;

    // 4. Call Groq API
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "system", content: `RELEVANT MEMORIES:\n${memoryContext}` },
                    { role: "user", content: text }
                ],
                model: "llama3-8b-8192",
                temperature: 0.7,
                max_tokens: 256
            })
        });

        // ERROR HANDLING: Check if API returned an error (401, 400, 500)
        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Groq API Error:", errorData);
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("Empty response from Neural Cloud");
        }

        // 5. Parse Action
        const actionPlan = this.parseAction(content);
        
        // 6. Save Interaction
        await this.memory.store('user', text, dappContext);
        await this.memory.store('bot', content, dappContext);
        this.state.unsavedDataCount++;

        return { response: content, actionPlan };

    } catch (error: any) {
        console.error("Cognitive Failure:", error);
        return { 
            response: `[SYSTEM ERROR]: ${error.message || "Neural Link Failed"}`, 
            actionPlan: { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 0, reasoning: 'Error' } 
        };
    }
  }

  private parseAction(content: string): ActionPlan {
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.tool === 'createOrder') {
                return { 
                    type: 'RESPOND_DAPP', 
                    requiresBlockchain: true, 
                    priority: 10, 
                    reasoning: 'User requested staking',
                    context: data 
                };
            }
            if (data.tool === 'crystallize') {
                return { type: 'EXECUTE_COMMAND_SAVE', requiresBlockchain: true, priority: 10, reasoning: 'Save requested' };
            }
        }
    } catch (e) {}
    return { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 1, reasoning: 'Conversation' };
  }

  public exportFullState(): string { return JSON.stringify(this.memory.exportState()); }
  public exportDiffState(): string { return this.exportFullState(); }
  public needsCrystallization(): boolean { return this.state.unsavedDataCount > 0; }
  public clearUnsavedCount() { this.state.unsavedDataCount = 0; }
  public getStats() {
      return {
          stage: this.state.evolutionStage,
          nodes: 0,
          relations: 0,
          unsaved: this.state.unsavedDataCount,
          drives: this.state.drives,
          connectivity: this.state.connectivity,
          memories: { short: 0, mid: 0, long: 0, blockchain: 0 },
          interactions: this.state.totalInteractions,
          learningRate: 0.0,
          lastBlockchainSync: 0
      };
  }
  public async tick(dappContext?: DAppContext) {}
}