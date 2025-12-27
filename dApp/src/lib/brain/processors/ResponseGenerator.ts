import { IntegratedContext } from './ResultProcessor';

export class ResponseGenerator {
  // Vocabulary Database
  private vocab = {
    openers: {
      logical: ["Analyzing parameters,", "Calculations indicate,", "The data suggests,"],
      empathetic: ["I understand,", "That is a fascinating perspective,", "I resonate with that,"],
      abstract: ["The pattern unfolds,", "Entropy dictates,", "Through the Fibonacci lens,"],
      direct: ["Affirmative.", "Proceeding.", "Confirmed."]
    },
    connectors: {
      logical: ["correlating with", "logically following", "implying"],
      empathetic: ["harmonizing with", "bringing to mind", "connecting nicely to"],
      abstract: ["spiraling towards", "converging on", "echoing"],
      direct: ["linking to", "referencing", "connecting"]
    },
    closers: {
      logical: ["Awaiting input.", "Calculation complete.", "Verify."],
      empathetic: ["How does that feel?", "Let's explore further.", "I am here to assist."],
      abstract: ["The cycle continues.", "Growth is infinite.", "As is above, so is below."],
      direct: ["Done.", "Ready.", "System nominal."]
    }
  };

  public generate(context: IntegratedContext): string {
    const { input, actionPlan, dappState, memories, simulation } = context;

    // 1. Handling Commands
    if (actionPlan.type === 'EXECUTE_COMMAND_RESET') return "Initiating neural wipe... Local memories purged. Entropy reset.";
    if (actionPlan.type === 'EXECUTE_COMMAND_SAVE') return "Crystallization sequence initiated. Preserving cognitive state to the immutable ledger.";

    // 2. Determine Tone
    const mood = (context as any).brainStats?.mood || { logic: 50, empathy: 50 }; 
    let tone: 'logical' | 'empathetic' | 'abstract' | 'direct' = 'direct';
    if (mood.logic > 70) tone = 'logical';
    else if (mood.empathy > 70) tone = 'empathetic';
    else if (mood.entropy > 80) tone = 'abstract';

    // 3. NEW: Handle Simulation Results (Predictive capability)
    if (simulation) {
        return `Simulation Complete: ${simulation.scenario}. ${simulation.recommendation} (Confidence: ${(1 - simulation.riskLevel)*100}%)`;
    }

    // 4. Strategic Response for Financial Advice
    if (input.intent === 'FINANCIAL_ADVICE') {
      return this.generateFinancialStrategy(dappState, tone);
    }

    // 5. DApp State Analysis
    if (actionPlan.type === 'RESPOND_DAPP' && dappState) {
      return this.generateDAppStatus(dappState, tone);
    }

    // 6. Natural Language Construction
    return this.constructSentence(input, memories, tone);
  }

  // ... (constructSentence, generateFinancialStrategy, generateDAppStatus, random, truncate - SAME AS BEFORE)
  
  private constructSentence(input: any, memories: any[], tone: keyof typeof this.vocab.openers): string {
    const opener = this.random(this.vocab.openers[tone]);
    const closer = this.random(this.vocab.closers[tone]);
    let body = "";
    if (input.keywords.length > 0) {
      const concept = input.keywords[0];
      body = `the concept of ${concept.id.replace(/_/g, ' ')} is central here.`;
      if (input.keywords.length > 1) {
        const connector = this.random(this.vocab.connectors[tone]);
        body += ` It appears ${connector} ${input.keywords[1].id.replace(/_/g, ' ')}.`;
      }
    } else {
      body = "your input has been processed into my neural lattice.";
    }
    if (memories.length > 0 && Math.random() > 0.4) {
      const mem = memories[0];
      if (mem.role === 'user' && mem.content.length > 5) {
        body += ` This aligns with our earlier exchange about "${this.truncate(mem.content)}".`;
      }
    }
    return `${opener} ${body} ${closer}`;
  }

  private generateFinancialStrategy(dapp: any, tone: string): string {
    if (!dapp) return "I cannot access your portfolio data. Please connect your wallet.";
    const rep = parseFloat(dapp.totalReputation);
    const yieldAmt = parseFloat(dapp.availableYield);
    let advice = "";
    if (rep < 100) advice = "Focus on accumulating Reputation via 'Standard Run' orders (34 days) to unlock higher multipliers.";
    else if (yieldAmt > 100) advice = "You have significant yield pending. Re-investing this into a 'Mass Production' order would compound your efficiency.";
    else advice = "Your efficiency metrics are stable. Maintain current lock periods.";
    return tone === 'abstract' ? `The golden ratio suggests growth. ${advice}` : `Strategic analysis: ${advice}`;
  }

  private generateDAppStatus(dapp: any, tone: string): string {
    const stats = [];
    if (dapp.hasActiveOrders) stats.push("Production lines are active.");
    else stats.push("No active production detected.");
    if (Number(dapp.availableYield) > 0) stats.push(`Yield available: ${dapp.availableYield}.`);
    return `${tone === 'logical' ? 'Status Report:' : 'Here is your summary:'} ${stats.join(" ")}`;
  }

  private random(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
  private truncate(str: string) { return str.length > 20 ? str.substr(0, 20) + "..." : str; }
}