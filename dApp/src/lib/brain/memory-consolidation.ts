import { Memory, BrainState, Vector } from './types';
import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

export interface MemoryQuery {
  text: string;
  timeRange?: [number, number];
  limit?: number;
}

export class MemoryConsolidationEngine {
  private longTerm: Memory[] = [];
  private embedder: FeatureExtractionPipeline | null = null;
  private isReady: boolean = false;

  constructor(state?: Partial<BrainState>) {
    if (state) {
      this.longTerm = state.longTermMemory || [];
    }
  }

  public async init() {
    if (this.isReady) return;
    try {
      // Load a lightweight embedding model (approx 20MB)
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.isReady = true;
      console.log("🧠 Memory Embedder Loaded");
    } catch (e) {
      console.error("Failed to load embedder", e);
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) await this.init();
    if (!this.embedder) return new Array(384).fill(0);

    const output = await this.embedder(text, { pooling: 'mean', normalize: true });
    // Convert Tensor to array
    return Array.from(output.data);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  public async store(
    role: 'user' | 'bot',
    content: string,
    dappContext?: any
  ): Promise<void> {
    // Generate vector for semantic search
    const vector = await this.generateEmbedding(content);
    
    // Map 384-dim vector to 6-dim game vector (simplified reduction for UI stats)
    const gameVector: Vector = [
        Math.abs(vector[0]), Math.abs(vector[1]), Math.abs(vector[2]), 
        Math.abs(vector[3]), Math.abs(vector[4]), Math.abs(vector[5])
    ];

    const memory: Memory = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: Date.now(),
      concepts: [], // Legacy support
      emotional_weight: 1.0,
      access_count: 0,
      vector: gameVector,
      embedding: vector, // New field for RAG
      dapp_context: dappContext
    } as any; // Cast to any to allow new embedding field

    this.longTerm.push(memory);
    
    // Keep memory size manageable
    if (this.longTerm.length > 500) {
        this.longTerm.shift(); // Remove oldest
    }
  }

  public async retrieve(query: string, limit: number = 3): Promise<Memory[]> {
    if (this.longTerm.length === 0) return [];
    
    const queryVector = await this.generateEmbedding(query);

    const scored = this.longTerm.map(mem => {
        // If memory doesn't have embedding (legacy), return 0 score
        const score = (mem as any).embedding 
            ? this.cosineSimilarity(queryVector, (mem as any).embedding)
            : 0;
        return { mem, score };
    });

    // Sort by similarity
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => s.mem);
  }

  public exportState() {
    return {
      longTermMemory: this.longTerm
    };
  }
}