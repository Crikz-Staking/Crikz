import { KnowledgeModule } from './knowledge-module';
import { CognitiveAnalysis, ActionPlan, IntentType } from './types';

export class CognitiveModule {
  
  public analyze(input: string, knowledge: KnowledgeModule): CognitiveAnalysis {
    const cleanInput = input.trim().toLowerCase();
    
    // 1. Concept Extraction & Mapping
    const words = cleanInput.replace(/[^\w\s]/gi, '').split(/\s+/);
    const foundKeywords = words
      .map(w => knowledge.getConcept(w))
      .filter(c => c !== undefined);

    // 2. Intent Scoring System
    const intentScore: Record<IntentType, number> = {
      'COMMAND': 0, 'QUERY': 0, 'PHILOSOPHY': 0, 'CASUAL': 0, 'TEACHING': 0, 'UNKNOWN': 0
    };

    // Rule-based weights
    if (cleanInput.match(/^(reset|wipe|clear|delete|crystallize|save)/)) intentScore.COMMAND += 10;
    if (cleanInput.match(/\?$/)) intentScore.QUERY += 3;
    if (cleanInput.match(/^(what|why|how|when|explain|define)/)) intentScore.QUERY += 5;
    if (cleanInput.length > 60) intentScore.PHILOSOPHY += 2;
    if (foundKeywords.some(k => k.domain === 'PHILOSOPHICAL' || k.domain === 'META')) intentScore.PHILOSOPHY += 4;
    if (foundKeywords.some(k => k.domain === 'TECHNICAL')) intentScore.TEACHING += 2;
    if (['hello', 'hi', 'hey'].some(s => cleanInput.includes(s))) intentScore.CASUAL += 5;

    // Determine winner
    let intent: IntentType = 'UNKNOWN';
    let maxScore = 0;
    for (const [key, score] of Object.entries(intentScore)) {
      if (score > maxScore) {
        maxScore = score;
        intent = key as IntentType;
      }
    }
    if (maxScore === 0) intent = 'CASUAL'; // Default fallback

    // 3. Emotional & Complexity Analysis
    let emotionalWeight = 0;
    if (input.includes('!')) emotionalWeight += 0.2;
    if (foundKeywords.some(k => k.domain === 'EMOTIONAL')) emotionalWeight += 0.3;
    
    return {
      keywords: foundKeywords,
      intent,
      emotionalWeight: Math.min(1, emotionalWeight),
      complexity: foundKeywords.length * 10 + input.length,
      detectedDomain: foundKeywords[0]?.domain || 'GENERAL'
    };
  }

  public plan(analysis: CognitiveAnalysis, evolutionStage: string): ActionPlan {
    // Commands bypass deep thought
    if (analysis.intent === 'COMMAND') {
        return { action: 'EXECUTE_COMMAND', targetConcepts: [], depth: 0, tone: 'ANALYTICAL' };
    }

    // Determine Depth based on Stage and Intent
    let depth = 2;
    if (analysis.intent === 'QUERY' || analysis.intent === 'PHILOSOPHY') depth = 4;
    if (evolutionStage === 'SAPIENT' || evolutionStage === 'TRANSCENDENT') depth += 1;

    // Determine Tone
    let tone: ActionPlan['tone'] = 'ANALYTICAL';
    if (analysis.emotionalWeight > 0.5) tone = 'EMPATHETIC';
    if (analysis.intent === 'PHILOSOPHY') tone = 'ABSTRACT';
    if (analysis.intent === 'TEACHING') tone = 'INSTRUCTIVE';

    return {
      action: 'SYNTHESIZE',
      targetConcepts: analysis.keywords.map(k => k.id),
      depth,
      tone
    };
  }
}