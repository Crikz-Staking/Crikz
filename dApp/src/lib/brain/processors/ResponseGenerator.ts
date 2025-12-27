import { IntegratedContext } from './ResultProcessor';

export class ResponseGenerator {
  private templates = {
    greeting: [
      "Hello! It's wonderful to connect with you.",
      "Greetings. Systems are nominal and ready.",
      "Hi there! I am Crikzling, your production assistant.",
    ],
    transition: [
      "Building on that,",
      "Interestingly,",
      "This connects to",
      "From a protocol perspective,",
    ],
    uncertainty: [
      "I'm processing that request, though my knowledge graph is incomplete in that specific area.",
      "That's a novel concept for me.",
    ]
  };

  private selectRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  public generate(context: IntegratedContext): string {
    const { input, actionPlan, dappState, memories } = context;

    // 1. Handle Commands
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') {
      return "Initiating neural wipe... Local memories purged. Blockchain state remains immutable.";
    }
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') {
      return "Crystallization sequence initiated. Preparing to write neural state to IPFS and verify on BSC.";
    }

    // 2. Handle DApp Queries
    if (actionPlan.type === 'RESPOND_DAPP' && dappState) {
      return this.generateDAppResponse(input.cleanedInput, dappState);
    }

    // 3. Natural Conversation
    let response = "";

    // Greetings
    if (input.intent === 'GREETING') {
      response += this.selectRandom(this.templates.greeting) + " ";
      if (dappState?.hasActiveOrders) {
        response += "I notice you have active production orders running. Would you like a status report?";
      }
      return response;
    }

    // Knowledge Integration
    if (input.keywords.length > 0) {
      const concept = input.keywords[0];
      response += `${this.selectRandom(this.templates.transition)} ${concept.id} is defined as ${concept.essence.toLowerCase()}. `;
      
      // Associative Memory Check
      if (memories.length > 0 && Math.random() > 0.6) {
        const mem = memories[0]; // Most relevant
        if (mem.role === 'user' && mem.content.length > 10) {
          response += `This reminds me of when you mentioned "${mem.content.substring(0, 30)}...". `;
        }
      }
    } else {
      // Fallback
      if (input.intent === 'QUERY') {
        response += "That is a fascinating inquiry. While I calculate the specific parameters, consider how this might relate to the Fibonacci expansion of the protocol. ";
      } else {
        response += "I've logged that input into my short-term memory matrix. ";
      }
    }

    return response.trim();
  }

  private generateDAppResponse(text: string, dapp: any): string {
    const parts = [];
    if (text.includes('order') || text.includes('production')) {
      parts.push(dapp.hasActiveOrders ? "You have active production lines functioning." : "No active orders detected.");
    }
    if (text.includes('reputation')) {
      parts.push(`Your calculated reputation is ${dapp.totalReputation}.`);
    }
    if (text.includes('yield') || text.includes('earn')) {
      parts.push(Number(dapp.availableYield) > 0 ? `Yield allocation available: ${dapp.availableYield} CRIKZ.` : "No yield currently available to claim.");
    }
    
    if (parts.length === 0) return "I can display your Balance, Reputation, Orders, or Yield status.";
    return parts.join(" ");
  }
}