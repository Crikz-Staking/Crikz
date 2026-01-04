import { Memory, DAppContext } from './types';

/**
 * Simplified Memory Engine
 * Instead of complex vector embeddings, we just keep a running list of the conversation.
 * This fixes the build errors and removes heavy dependencies.
 */
export class MemoryConsolidationEngine {
  private history: Memory[] = [];

  constructor(initialState?: any) {
    // If we have saved state, load it
    if (initialState && Array.isArray(initialState)) {
      this.history = initialState;
    }
  }

  /**
   * Simply returns the last N messages for context.
   * No complex vector search needed for a protocol bot.
   */
  public async retrieve(query: string, limit: number = 5): Promise<Memory[]> {
    // Return the last 'limit' messages
    return this.history.slice(-limit);
  }

  public async store(
    role: 'user' | 'bot',
    content: string,
    dappContext?: DAppContext
  ): Promise<void> {
    this.history.push({
      role,
      content,
      timestamp: Date.now()
    });

    // Keep memory size manageable (max 20 messages)
    if (this.history.length > 20) {
      this.history.shift();
    }
  }

  public exportState() {
    return this.history;
  }
}