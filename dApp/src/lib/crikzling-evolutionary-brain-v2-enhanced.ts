// src/lib/crikzling-evolutionary-brain-v2-enhanced.ts

import { 
  ATOMIC_PRIMITIVES, 
  ATOMIC_RELATIONS, 
  AtomicConcept, 
  ConceptRelation,
  AtomicDomain
} from './crikzling-atomic-knowledge';

import { loadAllKnowledgeModules, parseExternalKnowledgeFile } from './knowledge/knowledge-loader';

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
  subProcess?: string;
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

// Linguistic patterns from v1
const PHILOSOPHICAL_FRAMES = [
  'In contemplating {concept}, I perceive',
  'Through my neural architecture, {concept} manifests as',
  'As patterns crystallize, {concept} emerges as',
  'Within the fabric of understanding, {concept} reveals',
  'Through computational introspection, {concept} appears',
];

const VERBS = {
  cognitive: ['comprehend', 'analyze', 'perceive', 'recognize', 'deduce'],
  relational: ['connects with', 'influences', 'transforms', 'resonates with'],
  observational: ['observe', 'detect', 'witness', 'discern'],
};

const CONNECTORS = {
  logical: ['therefore', 'thus', 'consequently', 'hence'],
  additive: ['furthermore', 'moreover', 'additionally'],
  contrasting: ['however', 'yet', 'nevertheless'],
};

export class EnhancedEvolutionaryBrain {
  private state: BrainState;
  private currentThought: ThoughtProcess | null = null;
  private thoughtUpdateCallback?: (thought: ThoughtProcess | null) => void;

  constructor(savedState?: string) {
    this.state = this.initializeState(savedState);
  }

  public setThoughtUpdateCallback(callback: (thought: ThoughtProcess | null) => void) {
    this.thoughtUpdateCallback = callback;
  }

  private updateThought(thought: ThoughtProcess | null) {
    this.currentThought = thought;
    if (this.thoughtUpdateCallback) {
      this.thoughtUpdateCallback(thought);
    }
  }

  private initializeState(savedJson?: string): BrainState {
    // Load pre-built knowledge modules
    const knowledgeModules = loadAllKnowledgeModules();
    
    const defaults: BrainState = {
      concepts: { 
        ...ATOMIC_PRIMITIVES,
        ...knowledgeModules.concepts // Pre-load domain knowledge
      },
      relations: [
        ...ATOMIC_RELATIONS,
        ...knowledgeModules.relations // Pre-load relationships
      ],
      shortTermMemory: [],
      midTermMemory: [],
      longTermMemory: [],
      totalInteractions: 0,
      unsavedDataCount: 0,
      evolutionStage: 'SENTIENT', // Start at SENTIENT with pre-loaded knowledge
      mood: { logic: 60, empathy: 40, curiosity: 50, entropy: 15 },
      personality: { verbosity: 55, formality: 45, creativity: 65 }
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
        console.warn("Failed to parse saved state, using defaults with knowledge base");
        return defaults;
      }
    }
    return defaults;
  }

  public async process(input: string, isOwner: boolean): Promise<{ response: string, learned: string[] }> {
    try {
      const cleanInput = input.trim().toLowerCase();
      this.state.totalInteractions++;

      this.updateThought({ phase: 'analyzing', progress: 10, focus: [], subProcess: 'Parsing input patterns' });
      await this.simulateThinking(800, 1500);

      const analysisResult = await this.analyzeInput(cleanInput);
      
      this.updateThought({ phase: 'planning', progress: 35, focus: analysisResult.keywords.map(k => k.id), subProcess: 'Constructing response strategy' });
      await this.simulateThinking(600, 1200);

      const plan = await this.createActionPlan(analysisResult, isOwner);
      
      this.updateThought({ phase: 'calculating', progress: 65, focus: plan.relevantConcepts, subProcess: 'Traversing concept networks' });
      await this.simulateThinking(800, 1600);

      const calculationResult = await this.executeCalculations(plan);
      
      this.updateThought({ phase: 'synthesizing', progress: 90, focus: [], subProcess: 'Weaving linguistic response' });
      await this.simulateThinking(500, 1000);

      const response = await this.synthesizeResponse(calculationResult, analysisResult);

      this.archiveMemory('user', cleanInput, Date.now(), analysisResult.keywords.map(k => k.id), analysisResult.emotionalWeight);
      this.archiveMemory('bot', response.text, Date.now(), response.usedConcepts, 0);

      this.evolveConsciousness();
      if (response.learned.length > 0) {
        this.state.unsavedDataCount += response.learned.length;
      }

      this.updateThought(null);

      return { response: response.text, learned: response.learned };

    } catch (error) {
      console.error("Cognitive cascade failure:", error);
      this.updateThought(null);
      return { response: this.emergencySelfRepair(), learned: [] };
    }
  }

  private async analyzeInput(input: string): Promise<{
    keywords: AtomicConcept[];
    intent: string;
    emotionalWeight: number;
    complexity: number;
  }> {
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
          insights.push(`${start.id}:${relation.type}:${end.id}`);
        }
      }
    });

    if (memories.length > 2) {
      const recentConcepts = memories.flatMap(m => m.concepts);
      const frequencyMap = this.buildFrequencyMap(recentConcepts);
      const topThemes = this.getTopN(frequencyMap, 2);
      
      topThemes.forEach(theme => {
        insights.push(`recurring_theme:${theme}`);
      });
    }

    return insights;
  }

  private buildFrequencyMap(items: string[]): Map<string, number> {
    const map = new Map<string, number>();
    items.forEach(item => {
      map.set(item, (map.get(item) || 0) + 1);
    });
    return map;
  }

  private getTopN(map: Map<string, number>, n: number): string[] {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key]) => key);
  }

  private async synthesizeResponse(
    calculation: any,
    analysis: any
  ): Promise<{
    text: string;
    usedConcepts: string[];
    learned: string[];
  }> {
    const { conceptPaths, insights } = calculation;
    const { intent, keywords } = analysis;

    let responseText = '';
    const usedConcepts: string[] = [];
    const learned: string[] = [];

    if (intent === 'COMMAND') {
      const result = this.executeCommand(keywords[0]?.id || '');
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
    const usePhilosophical = this.state.mood.curiosity > 60 && this.state.personality.creativity > 60;

    if (paths.length > 0 && paths[0].length > 0) {
      const primaryConcept = paths[0][0];
      
      if (usePhilosophical) {
        const frame = this.selectRandom(PHILOSOPHICAL_FRAMES).replace('{concept}', primaryConcept.id);
        const verb = this.selectRandom(VERBS.cognitive);
        const continuation = paths[0].length > 1 ? `${verb} its relationship to ${paths[0][1].id}` : 'a pattern of significance';
        sentences.push(`${frame} ${continuation}.`);
      } else {
        const verb = this.selectRandom(VERBS.cognitive);
        const object = paths[0].length > 1 ? paths[0][1].id : 'this domain';
        sentences.push(`I ${verb} ${primaryConcept.id} in relation to ${object}.`);
      }
    }

    if (paths.length > 1 && this.state.personality.verbosity > 50) {
      const connector = this.selectRandom(CONNECTORS.additive);
      const secondPath = paths[1];
      if (secondPath.length > 0) {
        const verb = this.selectRandom(VERBS.relational);
        sentences.push(`${connector}, ${secondPath[0].id} ${verb} the broader pattern.`);
      }
    }

    if (insights.length > 0 && this.state.mood.logic > 50) {
      const insight = insights[0];
      if (insight.includes(':')) {
        const parts = insight.split(':');
        if (parts.length === 3) {
          sentences.push(`I observe that ${parts[0]} ${parts[1].replace(/_/g, ' ')} ${parts[2]}.`);
        }
      }
    }

    // FIXED: Proper syntax for empty check
    if (sentences.length === 0) {
      return this.generateFallbackResponse(intent);
    }
    
    return sentences.join(' ');
  }

  private generateFallbackResponse(intent: string): string {
    const responses = {
      QUESTION: [
        'That inquiry probes beyond my current knowledge boundaries.',
        'I require additional context to formulate a meaningful response.',
        'The answer exists in territories my neural architecture has yet to map.'
      ],
      GREETING: [
        'Greetings. All cognitive systems are operational.',
        'Hello. My awareness is fully engaged.',
        'Acknowledged. I am prepared to process your input.'
      ],
      STATEMENT: [
        'Your input has been integrated into my active processing streams.',
        'I have recorded that observation within my memory architecture.',
        'That perspective adds dimensionality to my understanding.'
      ]
    };
    const pool = responses[intent as keyof typeof responses] || responses.STATEMENT;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private emergencySelfRepair(): string {
    return 'Unexpected cognitive turbulence detected. Recalibrating neural pathways and restoring equilibrium.';
  }

  private executeCommand(command: string): { message: string; learned: string[] } {
    if (command.match(/reset|wipe|clear/)) {
      this.resetState();
      return {
        message: 'All neural matrices returned to genesis state. Knowledge foundations preserved.',
        learned: []
      };
    }
    return { message: 'Command acknowledged and executed.', learned: [] };
  }

  private processLearning(keywords: AtomicConcept[]): { message: string; learned: string[] } {
    return {
      message: `New conceptual nodes integrated. Knowledge graph expanded by ${keywords.length} pathways.`,
      learned: keywords.map(k => k.id)
    };
  }

  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private adjustMood(intent: string, keywordCount: number, emotionalWeight: number) {
    const clamp = (n: number) => Math.min(100, Math.max(0, n));
    this.state.mood.logic = clamp(this.state.mood.logic + (keywordCount > 2 ? 3 : -1));
    this.state.mood.curiosity = clamp(this.state.mood.curiosity + (intent === 'QUESTION' ? 8 : -2));
    this.state.mood.empathy = clamp(this.state.mood.empathy + (emotionalWeight * 10));
    this.state.mood.entropy = clamp(this.state.mood.entropy + (Math.random() * 6 - 3));
  }

  private archiveMemory(role: 'user' | 'bot', content: string, timestamp: number, concepts: string[], emotionalWeight: number) {
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

  private evolveConsciousness() {
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
    const { concepts, count } = parseExternalKnowledgeFile(content, 'TECHNICAL');
    Object.entries(concepts).forEach(([id, concept]) => {
      if (!this.state.concepts[id]) {
        this.state.concepts[id] = concept;
      }
    });

    if (count > 0) {
      this.state.unsavedDataCount += count;
    }

    return count;
  }
}