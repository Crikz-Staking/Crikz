import { KnowledgeModule } from './knowledge-module';
import { CognitiveAnalysis, ActionPlan, IntentType } from './types';

export class CognitiveModule {
  
  public analyze(input: string, knowledge: KnowledgeModule): CognitiveAnalysis {
    const cleanInput = input.trim().toLowerCase();
    
    // 1. Concept Extraction
    // Remove punctuation but keep structural integrity
    const words = cleanInput.replace(/[^\w\s]/gi, '').split(/\s+/);
    
    const foundKeywords = words
      .map(w => knowledge.getConcept(w))
      .filter(c => c !== undefined);

    // 2. Intent Scoring
    const scores: Record<IntentType, number> = {
      'COMMAND': 0, 'QUERY': 0, 'PHILOSOPHY': 0, 'CASUAL': 0, 'TEACHING': 0, 'UNKNOWN': 0
    };

    // Explicit Triggers
    if (/^(reset|wipe|clear|delete|crystallize|save|status)/.test(cleanInput)) scores.COMMAND += 20;
    
    // Query Triggers
    if (/\?$/.test(cleanInput)) scores.QUERY += 5;
    if (/^(what|why|how|when|explain|define|describe)/.test(cleanInput)) scores.QUERY += 8;

    // Teaching Triggers
    if (/^(learn|read|assimilate|this is|x is)/.test(cleanInput)) scores.TEACHING += 10;
    if (foundKeywords.some(k => k.technical_depth > 0.8)) scores.TEACHING += 3;

    // Philosophy Triggers
    if (cleanInput.length > 80) scores.PHILOSOPHY += 3;
    if (foundKeywords.some(k => k.domain === 'PHILOSOPHICAL' || k.domain === 'META')) scores.PHILOSOPHY += 10;
    if (/^(life|consciousness|universe|fibonacci|entropy)/.test(cleanInput)) scores.PHILOSOPHY += 5;

    // Casual Triggers
    if (/^(hello|hi|hey|good|thanks)/.test(cleanInput)) scores.CASUAL += 5;

    // Determine Winner
    let intent: IntentType = 'UNKNOWN';
    let maxScore = 0;
    for (const [key, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        intent = key as IntentType;
      }
    }
    if (maxScore === 0) intent = 'CASUAL';

    // 3. Emotional Weight
    let emotionalWeight = 0;
    if (input.includes('!')) emotionalWeight += 0.2;
    if (input.includes('?')) emotionalWeight += 0.1;
    // Simple sentiment keywords check (could be expanded)
    if (/(good|great|awesome|thanks)/.test(cleanInput)) emotionalWeight += 0.3;
    if (/(bad|error|wrong|stupid)/.test(cleanInput)) emotionalWeight -= 0.3;

    return {
      keywords: foundKeywords,
      intent,
      emotionalWeight: Math.max(0, Math.min(1, emotionalWeight)), // Clamp 0-1
      complexity: foundKeywords.length * 10 + input.length,
      detectedDomain: foundKeywords[0]?.domain || 'GENERAL'
    };
  }

  public plan(analysis: CognitiveAnalysis, evolutionStage: string): ActionPlan {
    if (analysis.intent === 'COMMAND') {
        return { action: 'EXECUTE_COMMAND', targetConcepts: [], depth: 0, tone: 'ANALYTICAL' };
    }

    let depth = 2;
    if (analysis.intent === 'QUERY' || analysis.intent === 'PHILOSOPHY') depth = 4;
    if (evolutionStage === 'SAPIENT') depth += 1;
    if (evolutionStage === 'TRANSCENDENT') depth += 2;

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