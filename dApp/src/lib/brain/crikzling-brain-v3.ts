import { PublicClient } from 'viem';
import { CreateMLCEngine, MLCEngine, InitProgressCallback } from "@mlc-ai/web-llm";
import { MemoryConsolidationEngine } from './memory-consolidation';
import { BrainState, DAppContext, ActionPlan } from './types';

// Define the model to use. Llama-3-8B-Quantized is good balance of smarts/speed.
// Ensure user has WebGPU enabled browser.
const SELECTED_MODEL = "Llama-3-8B-Instruct-q4f32_1-MLC";

export class CrikzlingBrainV3 { 
  private memory: MemoryConsolidationEngine;
  private llmEngine: MLCEngine | null = null;
  private isModelLoaded = false;
  
  // State tracking
  private state: BrainState;
  private initCallback?: InitProgressCallback;

  constructor(
    baseState?: string,
    diffState?: string,
    publicClient?: PublicClient,
    memoryContractAddress?: `0x${string}`
  ) {
    // Initialize Memory Engine
    this.memory = new MemoryConsolidationEngine(baseState ? JSON.parse(baseState) : undefined);
    
    // Initialize Basic State
    this.state = {
        evolutionStage: 'SAPIENT', // Upgraded default
        totalInteractions: 0,
        unsavedDataCount: 0,
        connectivity: { isConnected: true, bandwidthUsage: 0, stamina: 100, lastWebSync: 0 },
        // ... other defaults
    } as any;
  }

  public setInitProgressCallback(cb: InitProgressCallback) {
    this.initCallback = cb;
  }

  public async initLLM() {
    if (this.isModelLoaded) return;
    
    try {
        console.log("🚀 Starting Neural Engine...");
        this.llmEngine = await CreateMLCEngine(
            SELECTED_MODEL,
            { initProgressCallback: this.initCallback }
        );
        await this.memory.init(); // Init embedding model
        this.isModelLoaded = true;
        console.log("✅ Neural Engine Online");
    } catch (e) {
        console.error("LLM Init Failed:", e);
        throw new Error("WebGPU not supported or Model load failed.");
    }
  }

  public async process(text: string, isOwner: boolean, dappContext?: DAppContext): Promise<{ response: string; actionPlan: ActionPlan }> { 
    if (!this.isModelLoaded) await this.initLLM();

    // 1. RAG: Retrieve Context
    const relevantMemories = await this.memory.retrieve(text, 3);
    const memoryContext = relevantMemories.map(m => `[Memory]: ${m.content}`).join("\n");

    // 2. Construct System Prompt
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

    // 3. Inference
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "system", content: `RELEVANT MEMORIES:\n${memoryContext}` },
        { role: "user", content: text }
    ];

    const reply = await this.llmEngine!.chat.completions.create({
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 256,
    });

    const content = reply.choices[0].message.content || "";

    // 4. Parse Action
    const actionPlan = this.parseAction(content);
    
    // 5. Save Interaction
    await this.memory.store('user', text, dappContext);
    await this.memory.store('bot', content, dappContext);
    this.state.unsavedDataCount++;

    return { response: content, actionPlan };
  }

  private parseAction(content: string): ActionPlan {
    try {
        // Attempt to find JSON in the response
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
    } catch (e) {
        // Not JSON
    }
    return { type: 'RESPOND_NATURAL', requiresBlockchain: false, priority: 1, reasoning: 'Conversation' };
  }

  // --- Utility Methods ---
  public exportFullState(): string {
      return JSON.stringify(this.memory.exportState());
  }
  
  public exportDiffState(): string {
      // For now, export full state as diff for simplicity in this upgrade
      return this.exportFullState();
  }

  public needsCrystallization(): boolean {
      return this.state.unsavedDataCount > 0;
  }

  public clearUnsavedCount() {
      this.state.unsavedDataCount = 0;
  }

  public getStats() {
      return {
          stage: this.state.evolutionStage,
          nodes: 0, // Deprecated graph stat
          relations: 0,
          unsaved: this.state.unsavedDataCount,
          drives: { curiosity: 80, stability: 90, efficiency: 70, social: 60, energy: 100 },
          connectivity: this.state.connectivity,
          memories: { short: 0, mid: 0, long: 0, blockchain: 0 },
          interactions: this.state.totalInteractions,
          learningRate: 0.0,
          lastBlockchainSync: 0
      };
  }

  public async tick(dappContext?: DAppContext) {
      // Background thought process (optional for LLM, good for "aliveness")
  }
}