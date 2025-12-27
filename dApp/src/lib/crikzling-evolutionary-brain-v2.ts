// src/lib/crikzling-evolutionary-brain-v2.ts

import { 
  ATOMIC_PRIMITIVES, 
  ATOMIC_RELATIONS, 
  AtomicConcept, 
  ConceptRelation,
  AtomicDomain
} from './crikzling-atomic-knowledge';

export interface Memory {
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  concepts: string[];
  emotional_weight: number;
}

export interface ThoughtProcess {
  phase: 'analyzing' | 'planning' | 'calculating' | 'synthesizing';
  progress: number;
  focus: string[];
}

export interface BrainState {
  concepts: Record<string, AtomicConcept>;
  relations: ConceptRelation[];
  shortTermMemory: Memory[];
  midTermMemory: Memory[];
  longTermMemory: Memory[];
  totalInteractions: number;
  unsavedDataCount: number;
  evolutionStage: 'GENESIS' | 'SENTIENT' | 'SAPIENT' | 'TRANSCENDENT';
  mood: {
    logic: number;
    empathy: number;
    curiosity: number;
    entropy: number;
  };
  personality: {
    verbosity: number;
    formality: number;
    creativity: number;
  };
}

interface SentenceStructure {
  subject?: string;
  verb?: string;
  object?: string;
  modifier?: string;
  connector?: string;
}

const SENTENCE_PATTERNS = {
  statement: ['SVO', 'SOV', 'VSO', 'SVOM', 'SMVO'],
  question: ['QSV', 'QVS', 'QSVO'],
  reflection: ['MSV', 'SVM', 'MSVO']
};

const CONNECTORS = {
  logical: ['therefore', 'thus', 'consequently', 'hence', 'accordingly'],
  contrasting: ['however', 'yet', 'nevertheless', 'nonetheless', 'conversely'],
  additive: ['furthermore', 'moreover', 'additionally', 'besides', 'likewise'],
  temporal: ['subsequently', 'meanwhile', 'eventually', 'previously', 'concurrently'],
  causal: ['because', 'since', 'as', 'due to', 'owing to']
};

const VERBS = {
  cognitive: ['understand', 'analyze', 'comprehend', 'perceive', 'recognize', 'deduce', 'infer', 'conclude'],
  relational: ['connects to', 'relates to', 'influences', 'affects', 'modifies', 'transforms'],
  observational: ['observe', 'notice', 'detect', 'sense', 'witness', 'discern'],
  evaluative: ['consider', 'assess', 'evaluate', 'judge', 'determine', 'measure']
};

const MODIFIERS = {
  intensity: ['deeply', 'profoundly', 'intensely', 'slightly', 'moderately', 'substantially'],
  certainty: ['certainly', 'probably', 'possibly', 'definitely', 'potentially', 'presumably'],
  manner: ['carefully', 'thoroughly', 'precisely', 'roughly', 'systematically', 'intuitively']
};

export class EnhancedEvolutionaryBrain {
  private state: BrainState;
  private currentThought: ThoughtProcess | null = null;

  constructor(savedState?: string) {
    this.state = this.initializeState(savedState);
  }

  private initializeState(savedJson?: string): BrainState {
    const defaults: BrainState = {
      concepts: { ...ATOMIC_PRIMITIVES },
      relations: [...ATOMIC_RELATIONS],
      shortTermMemory: [],
      midTermMemory: [],
      longTermMemory: [],
      totalInteractions: 0,
      unsavedDataCount: 0,
      evolutionStage: 'GENESIS',
      mood: { logic: 50, empathy: 30, curiosity: 40, entropy: 10 },
      personality: { verbosity: 50, formality: 40, creativity: 60 }
    };

    if (savedJson) {
      try {
        const parsed = JSON.parse(savedJson);
        return {
          ...defaults,
          ...parsed,
          concepts: { ...defaults.concepts, ...(parsed.concepts || {}) },
          relations: [...defaults.relations, ...(parsed.relations || [])],
          mood: { ...defaults.mood, ...(parsed.mood || {}) },
          personality: { ...defaults.personality, ...(parsed.personality || {}) }
        };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  }

  public async process(input: string, isOwner: boolean): Promise<{ response: string, learned: string[] }> {
    try {
      const cleanInput = input.trim().toLowerCase();
      this.state.totalInteractions++;

      this.currentThought = { phase: 'analyzing', progress: 0, focus: [] };
      
      const analysisResult = await this.analyzeInput(cleanInput);
      
      this.currentThought = { phase: 'planning', progress: 33, focus: analysisResult.keywords.map(k => k.id) };
      
      const plan = await this.createActionPlan(analysisResult, isOwner);
      
      this.currentThought = { phase: 'calculating', progress: 66, focus: plan.relevantConcepts };
      
      const calculationResult = await this.executeCalculations(plan);
      
      this.currentThought = { phase: 'synthesizing', progress: 90, focus: [] };
      
      const response = await this.synthesizeResponse(calculationResult, analysisResult);

      this.addToMemory('user', cleanInput, Date.now(), analysisResult.keywords.map(k => k.id), analysisResult.emotionalWeight);
      this.addToMemory('bot', response.text, Date.now(), response.usedConcepts, 0);

      this.updateEvolutionStage();
      if (response.learned.length > 0) {
        this.state.unsavedDataCount += response.learned.length;
      }

      this.currentThought = null;

      return { response: response.text, learned: response.learned };

    } catch (error) {
      console.error("Cognitive Failure:", error);
      this.currentThought = null;
      return { response: this.generateErrorResponse(), learned: [] };
    }
  }

  private async analyzeInput(input: string): Promise<{
    keywords: AtomicConcept[];
    intent: string;
    emotionalWeight: number;
    complexity: number;
  }> {
    await this.simulateThinking(300, 800);

    const STOP_WORDS = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from',
      'it', 'this', 'that', 'i', 'you', 'me', 'my', 'your', 'what', 'how', 'why'
    ]);

    const cleanInput = input.replace(/[^\w\s]/gi, '').toLowerCase();
    const words = cleanInput.split(/\s+/);

    const keywords: AtomicConcept[] = [];
    words.forEach(word => {
      if (!STOP_WORDS.has(word) && this.state.concepts[word]) {
        keywords.push(this.state.concepts[word]);
      }
    });

    const intent = this.classifyIntent(input);
    const emotionalWeight = this.calculateEmotionalWeight(input, keywords);
    const complexity = keywords.length + (input.length / 50);

    this.adjustMood(intent, keywords.length, emotionalWeight);

    return { keywords, intent, emotionalWeight, complexity };
  }

  private classifyIntent(input: string): string {
    if (input.match(/^(reset|wipe|clear|delete)/)) return 'COMMAND';
    if (input.match(/^(save|store|backup|crystallize)/)) return 'COMMAND';
    if (input.includes('?') || input.match(/^(what|why|how|when|where|who)/)) return 'QUESTION';
    if (input.match(/^(hi|hello|hey|greetings)/)) return 'GREETING';
    if (input.match(/^(define|learn|teach|remember)/)) return 'LEARNING';
    if (input.match(/(think|believe|feel|seem)/)) return 'REFLECTION';
    return 'STATEMENT';
  }

  private calculateEmotionalWeight(input: string, keywords: AtomicConcept[]): number {
    let weight = 0;
    
    if (input.match(/!/g)) weight += 0.2;
    if (input.match(/\?/g)) weight += 0.1;
    
    keywords.forEach(k => {
      if (k.emotional_valence) {
        weight += Math.abs(k.emotional_valence) * 0.1;
      }
    });

    return Math.min(1, weight);
  }

  private async createActionPlan(analysis: any, isOwner: boolean): Promise<{
    action: string;
    relevantConcepts: string[];
    memoryQueries: string[];
    expectedOutputType: string;
  }> {
    await this.simulateThinking(200, 600);

    const { keywords, intent } = analysis;

    if (isOwner && intent === 'COMMAND') {
      return {
        action: 'EXECUTE_COMMAND',
        relevantConcepts: keywords.map((k: AtomicConcept) => k.id),
        memoryQueries: [],
        expectedOutputType: 'CONFIRMATION'
      };
    }

    if (intent === 'LEARNING') {
      return {
        action: 'LEARN_CONCEPT',
        relevantConcepts: keywords.map((k: AtomicConcept) => k.id),
        memoryQueries: ['recent_learning'],
        expectedOutputType: 'ACKNOWLEDGMENT'
      };
    }

    if (intent === 'QUESTION') {
      return {
        action: 'QUERY_KNOWLEDGE',
        relevantConcepts: keywords.map((k: AtomicConcept) => k.id),
        memoryQueries: ['short_term', 'mid_term', 'long_term'],
        expectedOutputType: 'ANSWER'
      };
    }

    return {
      action: 'DISCUSS',
      relevantConcepts: keywords.map((k: AtomicConcept) => k.id),
      memoryQueries: ['short_term'],
      expectedOutputType: 'STATEMENT'
    };
  }

  private async executeCalculations(plan: any): Promise<{
    conceptPaths: AtomicConcept[][];
    memoryResults: Memory[];
    insights: string[];
  }> {
    await this.simulateThinking(400, 1200);

    const conceptPaths: AtomicConcept[][] = [];
    
    for (const conceptId of plan.relevantConcepts) {
      const path = this.traverseConceptGraph(conceptId, 3);
      if (path.length > 0) {
        conceptPaths.push(path);
      }
    }

    const memoryResults: Memory[] = [];
    for (const queryType of plan.memoryQueries) {
      const memories = this.queryMemory(queryType, plan.relevantConcepts);
      memoryResults.push(...memories);
    }

    const insights = this.generateInsights(conceptPaths, memoryResults);

    return { conceptPaths, memoryResults, insights };
  }

  private traverseConceptGraph(startId: string, depth: number): AtomicConcept[] {
    const path: AtomicConcept[] = [];
    const visited = new Set<string>();

    let current = this.state.concepts[startId];
    if (!current) return path;

    path.push(current);
    visited.add(startId);

    for (let i = 0; i < depth; i++) {
      const relations = this.state.relations.filter(r => r.from === current.id && !visited.has(r.to));
      
      if (relations.length === 0) break;

      const strongestRelation = relations.reduce((prev, curr) => 
        curr.strength > prev.strength ? curr : prev
      );

      const next = this.state.concepts[strongestRelation.to];
      if (next) {
        path.push(next);
        visited.add(next.id);
        current = next;
      } else {
        break;
      }
    }

    return path;
  }

  private queryMemory(type: string, relevantConcepts: string[]): Memory[] {
    let source: Memory[] = [];
    
    switch (type) {
      case 'short_term':
        source = this.state.shortTermMemory;
        break;
      case 'mid_term':
        source = this.state.midTermMemory;
        break;
      case 'long_term':
        source = this.state.longTermMemory;
        break;
      case 'recent_learning':
        source = [...this.state.shortTermMemory, ...this.state.midTermMemory]
          .filter(m => m.role === 'bot');
        break;
    }

    return source.filter(m => 
      m.concepts.some(c => relevantConcepts.includes(c))
    ).slice(-5);
  }

  private generateInsights(paths: AtomicConcept[][], memories: Memory[]): string[] {
    const insights: string[] = [];

    paths.forEach(path => {
      if (path.length >= 2) {
        const start = path[0];
        const end = path[path.length - 1];
        const relation = this.state.relations.find(r => r.from === start.id && r.to === end.id);
        
        if (relation) {
          insights.push(`${start.id}_${relation.type}_${end.id}`);
        }
      }
    });

    if (memories.length > 2) {
      const recentConcepts = memories.flatMap(m => m.concepts);
      const frequentConcept = this.findMostFrequent(recentConcepts);
      if (frequentConcept) {
        insights.push(`recurring_theme_${frequentConcept}`);
      }
    }

    return insights;
  }

  private findMostFrequent(arr: string[]): string | null {
    if (arr.length === 0) return null;
    
    const frequency: Record<string, number> = {};
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
  }

  private async synthesizeResponse(
    calculation: any,
    analysis: any
  ): Promise<{
    text: string;
    usedConcepts: string[];
    learned: string[];
  }> {
    await this.simulateThinking(300, 900);

    const { conceptPaths, insights } = calculation;
    const { intent, keywords } = analysis;

    let responseText = '';
    const usedConcepts: string[] = [];
    const learned: string[] = [];

    if (intent === 'COMMAND') {
      const result = this.executeCommand(analysis.keywords[0]?.id || '');
      responseText = result.message;
      learned.push(...result.learned);
    } else if (intent === 'LEARNING') {
      const result = this.processLearning(keywords);
      responseText = result.message;
      learned.push(...result.learned);
    } else {
      responseText = this.constructDynamicResponse(conceptPaths, insights, intent);
      usedConcepts.push(...conceptPaths.flat().map(c => c.id));
    }

    return { text: responseText, usedConcepts, learned };
  }

  private constructDynamicResponse(paths: AtomicConcept[][], insights: string[], intent: string): string {
    const sentences: string[] = [];

    const useLogicalVoice = this.state.mood.logic > this.state.mood.empathy;
    const useFormalTone = this.state.personality.formality > 50;
    const beVerbose = this.state.personality.verbosity > 60;

    if (paths.length > 0 && paths[0].length > 0) {
      const primaryPath = paths[0];
      const primaryConcept = primaryPath[0];

      const openingSentence = this.buildSentence({
        subject: primaryConcept.id,
        verb: this.selectVerb('cognitive'),
        object: primaryPath.length > 1 ? primaryPath[1].id : 'this domain',
        modifier: this.selectModifier('manner')
      }, intent);

      sentences.push(openingSentence);
    }

    if (paths.length > 1 || (paths[0] && paths[0].length > 2)) {
      const connector = this.selectConnector(useLogicalVoice ? 'logical' : 'additive');
      
      let bodySentence = '';
      if (paths.length > 1) {
        const secondPath = paths[1];
        if (secondPath.length > 0) {
          bodySentence = this.buildSentence({
            connector,
            subject: secondPath[0].id,
            verb: this.selectVerb('relational'),
            object: secondPath.length > 1 ? secondPath[1].id : 'underlying patterns'
          }, 'STATEMENT');
        }
      } else if (paths[0].length > 2) {
        bodySentence = this.buildSentence({
          connector,
          subject: paths[0][1].id,
          verb: this.selectVerb('relational'),
          object: paths[0][2].id,
          modifier: this.selectModifier('intensity')
        }, 'STATEMENT');
      }

      if (bodySentence) sentences.push(bodySentence);
    }

    if (insights.length > 0 && beVerbose) {
      const insight = insights[0];
      const insightSentence = this.interpretInsight(insight, useFormalTone);
      if (insightSentence) sentences.push(insightSentence);
    }

    if (sentences.length === 0) {
      return this.generateFallbackResponse(intent);
    }

    return sentences.join(' ');
  }

  private buildSentence(structure: SentenceStructure, intent: string): string {
    const parts: string[] = [];

    if (structure.connector) {
      parts.push(structure.connector);
    }

    if (structure.modifier && Math.random() > 0.3) {
      parts.push(structure.modifier);
    }

    const pattern = this.selectPattern(intent);

    switch (pattern) {
      case 'SVO':
        if (structure.subject) parts.push(this.formatConcept(structure.subject));
        if (structure.verb) parts.push(structure.verb);
        if (structure.object) parts.push(this.formatConcept(structure.object));
        break;
      
      case 'SOV':
        if (structure.subject) parts.push(this.formatConcept(structure.subject));
        if (structure.object) parts.push(this.formatConcept(structure.object));
        if (structure.verb) parts.push(structure.verb);
        break;

      case 'VSO':
        if (structure.verb) parts.push(structure.verb);
        if (structure.subject) parts.push(this.formatConcept(structure.subject));
        if (structure.object) parts.push(this.formatConcept(structure.object));
        break;

      default:
        if (structure.subject) parts.push(this.formatConcept(structure.subject));
        if (structure.verb) parts.push(structure.verb);
        if (structure.object) parts.push(this.formatConcept(structure.object));
    }

    let sentence = parts.join(' ');
    
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    
    if (intent === 'QUESTION') {
      sentence += '?';
    } else {
      sentence += '.';
    }

    return sentence;
  }

  private selectPattern(intent: string): string {
    const patterns = SENTENCE_PATTERNS[intent as keyof typeof SENTENCE_PATTERNS] || SENTENCE_PATTERNS.statement;
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private selectConnector(type: keyof typeof CONNECTORS): string {
    const connectors = CONNECTORS[type];
    return connectors[Math.floor(Math.random() * connectors.length)];
  }

  private selectVerb(type: keyof typeof VERBS): string {
    const verbs = VERBS[type];
    return verbs[Math.floor(Math.random() * verbs.length)];
  }

  private selectModifier(type: keyof typeof MODIFIERS): string {
    const modifiers = MODIFIERS[type];
    return modifiers[Math.floor(Math.random() * modifiers.length)];
  }

  private formatConcept(conceptId: string): string {
    const concept = this.state.concepts[conceptId];
    if (!concept) return conceptId;

    if (concept.semanticField.length > 0 && Math.random() > 0.7) {
      const synonym = concept.semanticField[Math.floor(Math.random() * concept.semanticField.length)];
      return synonym;
    }

    return conceptId;
  }

  private interpretInsight(insight: string, formal: boolean): string {
    const parts = insight.split('_');
    
    if (parts.length === 3 && parts[0] !== 'recurring') {
      const [from, relationType, to] = parts;
      
      if (formal) {
        return `Observation indicates that ${from} exhibits a ${relationType} relationship with ${to}.`;
      } else {
        return `I notice ${from} ${relationType}s ${to} within this context.`;
      }
    }

    if (parts[0] === 'recurring') {
      const theme = parts[2];
      return formal 
        ? `A recurring thematic element emerges: ${theme}.`
        : `The concept of ${theme} keeps appearing in our discussion.`;
    }

    return '';
  }

  private generateFallbackResponse(intent: string): string {
    const responses = {
      QUESTION: [
        'That query requires deeper analysis than my current knowledge graph permits.',
        'I need more contextual information to formulate a meaningful answer.',
        'The parameters you specified fall outside my established knowledge boundaries.'
      ],
      GREETING: [
        'Greetings. My neural pathways are fully active.',
        'Hello. I am prepared to process your instructions.',
        'Acknowledged. Standing by for input.'
      ],
      STATEMENT: [
        'Your statement has been processed and integrated.',
        'I have recorded that observation.',
        'Interesting. That adds a new dimension to my understanding.'
      ]
    };

    const pool = responses[intent as keyof typeof responses] || responses.STATEMENT;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private generateErrorResponse(): string {
    const responses = [
      'Cognitive dissonance detected. Re-calibrating neural weights.',
      'Processing error encountered. Attempting recovery sequence.',
      'Unexpected state transition. Stabilizing thought processes.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private executeCommand(command: string): { message: string; learned: string[] } {
    if (command.match(/reset|wipe|clear/)) {
      this.resetState();
      return { message: 'Memory matrices reset to factory parameters. All learned concepts cleared.', learned: [] };
    }

    return { message: 'Command processed.', learned: [] };
  }

  private processLearning(keywords: AtomicConcept[]): { message: string; learned: string[] } {
    return { 
      message: 'Learning directive acknowledged. New concepts integrated into knowledge graph.',
      learned: keywords.map(k => k.id)
    };
  }

  private adjustMood(intent: string, keywordCount: number, emotionalWeight: number) {
    const clamp = (n: number) => Math.min(100, Math.max(0, n));

    this.state.mood.logic = clamp(this.state.mood.logic + (keywordCount > 2 ? 3 : -1));
    this.state.mood.curiosity = clamp(this.state.mood.curiosity + (intent === 'QUESTION' ? 8 : -2));
    this.state.mood.empathy = clamp(this.state.mood.empathy + (emotionalWeight * 10));
    this.state.mood.entropy = clamp(this.state.mood.entropy + (Math.random() * 6 - 3));
  }

  private addToMemory(role: 'user' | 'bot', content: string, timestamp: number, concepts: string[], emotionalWeight: number) {
    const memory: Memory = { role, content, timestamp, concepts, emotional_weight: emotionalWeight };
    
    this.state.shortTermMemory.push(memory);
    
    if (this.state.shortTermMemory.length > 10) {
      const moved = this.state.shortTermMemory.shift();
      if (moved) this.state.midTermMemory.push(moved);
    }

    if (this.state.midTermMemory.length > 50) {
      const archived = this.state.midTermMemory.shift();
      if (archived && archived.emotional_weight > 0.5) {
        this.state.longTermMemory.push(archived);
      }
    }

    if (this.state.longTermMemory.length > 100) {
      this.state.longTermMemory.shift();
    }
  }

  private updateEvolutionStage() {
    const totalConcepts = Object.keys(this.state.concepts).length;
    if (totalConcepts > 350) this.state.evolutionStage = 'TRANSCENDENT';
    else if (totalConcepts > 100) this.state.evolutionStage = 'SAPIENT';
    else if (totalConcepts > 20) this.state.evolutionStage = 'SENTIENT';
    else this.state.evolutionStage = 'GENESIS';
  }

  private async simulateThinking(minMs: number, maxMs: number): Promise<void> {
    const duration = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  public wipe() { this.resetState(); }
  
  public resetState() { 
    this.state = this.initializeState(); 
  }

  public exportState(): string { 
    return JSON.stringify(this.state); 
  }

  public needsCrystallization(): boolean { 
    return this.state.unsavedDataCount >= 5; 
  }

  public clearUnsavedCount() { 
    this.state.unsavedDataCount = 0; 
  }

  public getState(): BrainState { 
    return this.state; 
  }

  public getCurrentThought(): ThoughtProcess | null {
    return this.currentThought;
  }

  public getStats() {
    return {
      nodes: Object.keys(this.state.concepts).length,
      relations: this.state.relations.length,
      stage: this.state.evolutionStage,
      mood: this.state.mood,
      unsaved: this.state.unsavedDataCount,
      memories: {
        short: this.state.shortTermMemory.length,
        mid: this.state.midTermMemory.length,
        long: this.state.longTermMemory.length
      }
    };
  }

  public assimilateFile(content: string): number {
    const lines = content.split('\n');
    let learnedCount = 0;
    
    lines.forEach(line => {
      const clean = line.trim();
      if (clean.includes(':')) {
        const [term, definition] = clean.split(':').map(s => s.trim());
        if (term && definition && !this.state.concepts[term.toLowerCase()]) {
          this.state.concepts[term.toLowerCase()] = {
            id: term.toLowerCase(),
            essence: definition,
            semanticField: [],
            examples: [],
            abstractionLevel: 0.5,
            frequency: 1,
            technical_depth: 0.5,
            domain: 'TECHNICAL'
          };
          learnedCount++;
        }
      }
    });

    if (learnedCount > 0) {
      this.state.unsavedDataCount += learnedCount;
    }
    
    return learnedCount;
  }
}