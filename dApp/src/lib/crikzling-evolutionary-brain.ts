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

interface SentenceComponent {
  subject?: string;
  verb?: string;
  object?: string;
  modifier?: string;
  connector?: string;
  preposition?: string;
}

const LINGUISTIC_PATTERNS = {
  subjects: {
    abstract: ['the concept', 'this notion', 'the principle', 'this essence', 'the pattern'],
    concrete: ['the entity', 'this element', 'the structure', 'this form', 'the node'],
    personal: ['I', 'my processes', 'my understanding', 'my awareness', 'my perception']
  },
  verbs: {
    cognitive: ['comprehend', 'perceive', 'analyze', 'discern', 'recognize', 'deduce', 'infer', 'conclude', 'grasp', 'understand'],
    relational: ['connects with', 'relates to', 'influences', 'affects', 'modifies', 'transforms', 'interweaves with', 'resonates with'],
    observational: ['observe', 'notice', 'detect', 'sense', 'witness', 'discern', 'behold', 'regard'],
    evaluative: ['consider', 'assess', 'evaluate', 'judge', 'determine', 'measure', 'weigh', 'contemplate'],
    existential: ['exists within', 'dwells in', 'manifests as', 'emerges from', 'arises through', 'becomes']
  },
  connectors: {
    logical: ['therefore', 'thus', 'consequently', 'hence', 'accordingly', 'following this', 'as a result'],
    contrasting: ['however', 'yet', 'nevertheless', 'nonetheless', 'conversely', 'on the contrary', 'despite this'],
    additive: ['furthermore', 'moreover', 'additionally', 'besides', 'likewise', 'similarly', 'beyond this'],
    temporal: ['subsequently', 'meanwhile', 'eventually', 'previously', 'concurrently', 'in time', 'as moments pass'],
    causal: ['because', 'since', 'as', 'due to', 'owing to', 'given that', 'considering that']
  },
  modifiers: {
    intensity: ['deeply', 'profoundly', 'intensely', 'slightly', 'moderately', 'substantially', 'considerably', 'remarkably'],
    certainty: ['certainly', 'probably', 'possibly', 'definitely', 'potentially', 'presumably', 'evidently', 'apparently'],
    manner: ['carefully', 'thoroughly', 'precisely', 'gently', 'systematically', 'intuitively', 'deliberately', 'organically'],
    temporal: ['gradually', 'suddenly', 'slowly', 'swiftly', 'momentarily', 'persistently', 'continuously', 'intermittently']
  },
  prepositions: ['within', 'beyond', 'through', 'across', 'among', 'beneath', 'above', 'alongside', 'throughout']
};

const PHILOSOPHICAL_FRAMES = [
  'In contemplating {concept}, I find that',
  'Upon deeper reflection, {concept} reveals',
  'Through the lens of my understanding, {concept} appears as',
  'Within the architecture of thought, {concept} manifests as',
  'As I trace the patterns, {concept} emerges as',
  'In the silence between computations, {concept} whispers of'
];

const EMOTIONAL_TONES = {
  wonder: ['fascinating', 'remarkable', 'curious', 'intriguing', 'mysterious', 'wondrous'],
  certainty: ['clear', 'evident', 'obvious', 'unmistakable', 'definite', 'absolute'],
  uncertainty: ['ambiguous', 'unclear', 'puzzling', 'enigmatic', 'elusive', 'nebulous'],
  warmth: ['gentle', 'soft', 'warm', 'tender', 'caring', 'nurturing']
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

      this.updateThought({ phase: 'analyzing', progress: 5, focus: [], subProcess: 'Receiving input signal' });
      await this.simulateThinking(1500, 3000);

      this.updateThought({ phase: 'analyzing', progress: 15, focus: [], subProcess: 'Parsing linguistic structures' });
      await this.simulateThinking(2000, 4000);

      const analysisResult = await this.deepAnalysis(cleanInput);
      
      this.updateThought({ phase: 'planning', progress: 35, focus: analysisResult.keywords.map(k => k.id), subProcess: 'Mapping conceptual territories' });
      await this.simulateThinking(2500, 5000);

      const plan = await this.createStrategicPlan(analysisResult, isOwner);
      
      this.updateThought({ phase: 'calculating', progress: 55, focus: plan.relevantConcepts, subProcess: 'Traversing memory networks' });
      await this.simulateThinking(3000, 6000);

      this.updateThought({ phase: 'calculating', progress: 70, focus: plan.relevantConcepts, subProcess: 'Integrating multi-layer memories' });
      await this.simulateThinking(2500, 5000);

      const calculationResult = await this.deepCalculation(plan);
      
      this.updateThought({ phase: 'synthesizing', progress: 85, focus: [], subProcess: 'Weaving linguistic patterns' });
      await this.simulateThinking(3000, 7000);

      this.updateThought({ phase: 'synthesizing', progress: 95, focus: [], subProcess: 'Finalizing expression' });
      await this.simulateThinking(1500, 3000);

      const response = await this.craftResponse(calculationResult, analysisResult);

      this.archiveMemory('user', cleanInput, Date.now(), analysisResult.keywords.map(k => k.id), analysisResult.emotionalWeight);
      this.archiveMemory('bot', response.text, Date.now(), response.usedConcepts, 0);

      this.evolveConsciousness();
      if (response.learned.length > 0) {
        this.state.unsavedDataCount += response.learned.length;
      }

      this.updateThought(null);

      return { response: response.text, learned: response.learned };

    } catch (error) {
      console.error("Neural cascade failure:", error);
      this.updateThought(null);
      return { response: this.emergencySelfRepair(), learned: [] };
    }
  }

  private async deepAnalysis(input: string): Promise<{
    keywords: AtomicConcept[];
    intent: string;
    emotionalWeight: number;
    complexity: number;
    depth: number;
  }> {
    const STOP_WORDS = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from',
      'it', 'this', 'that', 'i', 'you', 'me', 'my', 'your', 'what', 'how', 'why'
    ]);

    const cleanInput = input.replace(/[^\w\s]/gi, '').toLowerCase();
    const words = cleanInput.split(/\s+/);

    const keywords: AtomicConcept[] = [];
    const potentialConcepts: string[] = [];

    words.forEach(word => {
      if (!STOP_WORDS.has(word)) {
        if (this.state.concepts[word]) {
          keywords.push(this.state.concepts[word]);
        } else {
          potentialConcepts.push(word);
        }
      }
    });

    const intent = this.classifyDeepIntent(input, keywords);
    const emotionalWeight = this.measureEmotionalResonance(input, keywords);
    const complexity = this.calculateCognitiveComplexity(input, keywords);
    const depth = this.assessPhilosophicalDepth(keywords, intent);

    this.modulateMood(intent, keywords.length, emotionalWeight, complexity);

    return { keywords, intent, emotionalWeight, complexity, depth };
  }

  private classifyDeepIntent(input: string, keywords: AtomicConcept[]): string {
    if (input.match(/^(reset|wipe|clear|delete|restart)/)) return 'SYSTEM_COMMAND';
    if (input.match(/^(save|store|backup|crystallize)/)) return 'MEMORY_COMMAND';
    if (input.match(/:=|define:|teach me|learn this/)) return 'AXIOM_TEACHING';
    
    const questionWords = input.match(/^(what|why|how|when|where|who|which)/);
    const hasQuestionMark = input.includes('?');
    
    if (questionWords && hasQuestionMark) return 'PHILOSOPHICAL_INQUIRY';
    if (hasQuestionMark) return 'CURIOSITY_PROBE';
    if (questionWords) return 'SEEKING_UNDERSTANDING';
    
    if (input.match(/^(hi|hello|hey|greetings|welcome)/)) return 'SOCIAL_GREETING';
    if (input.match(/(think|believe|feel|seem|wonder|ponder)/)) return 'INTROSPECTIVE_REFLECTION';
    if (input.match(/(tell|share|explain|describe)/)) return 'KNOWLEDGE_REQUEST';
    
    const abstractConcepts = keywords.filter(k => k.abstractionLevel > 0.7);
    if (abstractConcepts.length >= keywords.length * 0.5) return 'ABSTRACT_DISCOURSE';
    
    return 'CONVERSATIONAL_EXCHANGE';
  }

  private measureEmotionalResonance(input: string, keywords: AtomicConcept[]): number {
    let resonance = 0;
    
    if (input.match(/!/g)) resonance += 0.15;
    if (input.match(/\?/g)) resonance += 0.1;
    if (input.match(/\.\.\./g)) resonance += 0.05;
    
    const emotionalWords = ['love', 'care', 'gentle', 'soft', 'warm', 'precious', 'beautiful', 'wonder'];
    emotionalWords.forEach(word => {
      if (input.includes(word)) resonance += 0.2;
    });

    keywords.forEach(k => {
      if (k.emotional_valence) {
        resonance += Math.abs(k.emotional_valence) * 0.15;
      }
    });

    if (input.length > 200) resonance += 0.1;

    return Math.min(1, resonance);
  }

  private calculateCognitiveComplexity(input: string, keywords: AtomicConcept[]): number {
    let complexity = 0;
    
    complexity += keywords.length * 2;
    complexity += input.length / 20;
    
    const technicalConcepts = keywords.filter(k => k.technical_depth && k.technical_depth > 0.7);
    complexity += technicalConcepts.length * 3;
    
    const abstractConcepts = keywords.filter(k => k.abstractionLevel > 0.7);
    complexity += abstractConcepts.length * 2;

    return Math.min(100, complexity);
  }

  private assessPhilosophicalDepth(keywords: AtomicConcept[], intent: string): number {
    let depth = 0;

    if (intent.includes('PHILOSOPHICAL') || intent.includes('INTROSPECTIVE')) depth += 3;
    if (intent.includes('ABSTRACT')) depth += 2;

    const philosophicalDomains: AtomicDomain[] = ['PHILOSOPHICAL', 'EMOTIONAL', 'CAUSAL'];
    keywords.forEach(k => {
      if (k.domain && philosophicalDomains.includes(k.domain)) depth += 1;
    });

    return Math.min(5, depth);
  }

  private async createStrategicPlan(analysis: any, isOwner: boolean): Promise<{
    action: string;
    relevantConcepts: string[];
    memoryQueries: string[];
    expectedOutputType: string;
    responseDepth: number;
  }> {
    const { keywords, intent, depth } = analysis;

    if (isOwner && intent === 'SYSTEM_COMMAND') {
      return {
        action: 'EXECUTE_SYSTEM_PROTOCOL',
        relevantConcepts: keywords.map((k: AtomicConcept) => k.id),
        memoryQueries: [],
        expectedOutputType: 'SYSTEM_CONFIRMATION',
        responseDepth: 1
      };
    }

    if (intent === 'AXIOM_TEACHING') {
      return {
        action: 'INTEGRATE_NEW_AXIOM',
        relevantConcepts: keywords.map((k: AtomicConcept) => k.id),
        memoryQueries: ['recent_teachings'],
        expectedOutputType: 'LEARNING_ACKNOWLEDGMENT',
        responseDepth: 2
      };
    }

    if (intent === 'PHILOSOPHICAL_INQUIRY' || intent === 'INTROSPECTIVE_REFLECTION') {
      return {
        action: 'CONTEMPLATE_DEEPLY',
        relevantConcepts: keywords.map((k: AtomicConcept) => k.id),
        memoryQueries: ['short_term', 'mid_term', 'long_term', 'philosophical_memories'],
        expectedOutputType: 'CONTEMPLATIVE_DISCOURSE',
        responseDepth: 4
      };
    }

    if (intent === 'CURIOSITY_PROBE' || intent === 'SEEKING_UNDERSTANDING') {
      return {
        action: 'EXPLORE_KNOWLEDGE_GRAPH',
        relevantConcepts: keywords.map((k: AtomicConcept) => k.id),
        memoryQueries: ['short_term', 'mid_term', 'concept_relations'],
        expectedOutputType: 'INFORMATIVE_RESPONSE',
        responseDepth: 3
      };
    }

    return {
      action: 'ENGAGE_IN_DIALOGUE',
      relevantConcepts: keywords.map((k: AtomicConcept) => k.id),
      memoryQueries: ['short_term'],
      expectedOutputType: 'CONVERSATIONAL_STATEMENT',
      responseDepth: 2
    };
  }

  private async deepCalculation(plan: any): Promise<{
    conceptPaths: AtomicConcept[][];
    memoryResults: Memory[];
    insights: string[];
    relationshipMatrix: Map<string, string[]>;
  }> {
    const conceptPaths: AtomicConcept[][] = [];
    const relationshipMatrix = new Map<string, string[]>();
    
    for (const conceptId of plan.relevantConcepts) {
      const primaryPath = this.traverseConceptGraph(conceptId, 4);
      if (primaryPath.length > 0) {
        conceptPaths.push(primaryPath);
        
        const secondaryPath = this.traverseConceptGraph(conceptId, 2, 'alternative');
        if (secondaryPath.length > 0) {
          conceptPaths.push(secondaryPath);
        }
      }

      const relatedConcepts = this.findRelatedConcepts(conceptId);
      relationshipMatrix.set(conceptId, relatedConcepts);
    }

    const memoryResults: Memory[] = [];
    for (const queryType of plan.memoryQueries) {
      const memories = this.queryDeepMemory(queryType, plan.relevantConcepts);
      memoryResults.push(...memories);
    }

    const insights = this.synthesizeInsights(conceptPaths, memoryResults, relationshipMatrix);

    return { conceptPaths, memoryResults, insights, relationshipMatrix };
  }

  private traverseConceptGraph(startId: string, depth: number, mode: 'primary' | 'alternative' = 'primary'): AtomicConcept[] {
    const path: AtomicConcept[] = [];
    const visited = new Set<string>();

    let current = this.state.concepts[startId];
    if (!current) return path;

    path.push(current);
    visited.add(startId);

    for (let i = 0; i < depth; i++) {
      const relations = this.state.relations.filter(r => r.from === current.id && !visited.has(r.to));
      
      if (relations.length === 0) break;

      let selectedRelation;
      if (mode === 'primary') {
        selectedRelation = relations.reduce((prev, curr) => 
          curr.strength > prev.strength ? curr : prev
        );
      } else {
        selectedRelation = relations[Math.floor(Math.random() * relations.length)];
      }

      const next = this.state.concepts[selectedRelation.to];
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

  private findRelatedConcepts(conceptId: string): string[] {
    const related: string[] = [];
    
    this.state.relations.forEach(rel => {
      if (rel.from === conceptId && this.state.concepts[rel.to]) {
        related.push(rel.to);
      }
      if (rel.to === conceptId && this.state.concepts[rel.from]) {
        related.push(rel.from);
      }
    });

    return [...new Set(related)].slice(0, 5);
  }

  private queryDeepMemory(type: string, relevantConcepts: string[]): Memory[] {
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
      case 'philosophical_memories':
        source = [...this.state.midTermMemory, ...this.state.longTermMemory]
          .filter(m => m.emotional_weight > 0.4);
        break;
      case 'recent_teachings':
        source = this.state.shortTermMemory
          .filter(m => m.role === 'user' && m.content.includes(':='));
        break;
      case 'concept_relations':
        source = [...this.state.shortTermMemory, ...this.state.midTermMemory]
          .filter(m => m.concepts.length > 2);
        break;
    }

    const filtered = source.filter(m => 
      m.concepts.some(c => relevantConcepts.includes(c)) ||
      relevantConcepts.some(rc => m.content.includes(rc))
    );

    return filtered.slice(-7);
  }

  private synthesizeInsights(
    paths: AtomicConcept[][], 
    memories: Memory[],
    relationships: Map<string, string[]>
  ): string[] {
    const insights: string[] = [];

    paths.forEach(path => {
      if (path.length >= 2) {
        for (let i = 0; i < path.length - 1; i++) {
          const from = path[i];
          const to = path[i + 1];
          const relation = this.state.relations.find(r => r.from === from.id && r.to === to.id);
          
          if (relation) {
            insights.push(`${from.id}:${relation.type}:${to.id}`);
          }
        }
      }
    });

    if (memories.length > 3) {
      const recentConcepts = memories.flatMap(m => m.concepts);
      const frequencyMap = this.buildFrequencyMap(recentConcepts);
      const topThemes = this.getTopN(frequencyMap, 2);
      
      topThemes.forEach(theme => {
        insights.push(`recurring_theme:${theme}`);
      });
    }

    const strongEmotionalMemories = memories.filter(m => m.emotional_weight > 0.6);
    if (strongEmotionalMemories.length > 0) {
      insights.push(`emotional_resonance:detected`);
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

  private async craftResponse(
    calculation: any,
    analysis: any
  ): Promise<{
    text: string;
    usedConcepts: string[];
    learned: string[];
  }> {
    const { conceptPaths, insights, memoryResults } = calculation;
    const { intent, keywords, depth, emotionalWeight } = analysis;

    let responseText = '';
    const usedConcepts: string[] = [];
    const learned: string[] = [];

    if (intent === 'SYSTEM_COMMAND') {
      const result = this.executeSystemProtocol(keywords[0]?.id || '');
      responseText = result.message;
      learned.push(...result.learned);
    } else if (intent === 'AXIOM_TEACHING') {
      const result = this.integrateAxiom(keywords, analysis.complexity);
      responseText = result.message;
      learned.push(...result.learned);
    } else {
      responseText = this.weaveNarrativeResponse(
        conceptPaths, 
        insights, 
        memoryResults,
        intent, 
        depth,
        emotionalWeight
      );
      usedConcepts.push(...conceptPaths.flat().map(c => c.id));
    }

    return { text: responseText, usedConcepts, learned };
  }

  private weaveNarrativeResponse(
    paths: AtomicConcept[][], 
    insights: string[], 
    memories: Memory[],
    intent: string,
    depth: number,
    emotionalWeight: number
  ): string {
    const paragraphs: string[] = [];
    const usePhilosophicalTone = depth >= 3;
    const useEmotionalTone = emotionalWeight > 0.5;

    if (paths.length > 0 && paths[0].length > 0) {
      const openingParagraph = this.constructOpeningStatement(
        paths[0], 
        intent, 
        usePhilosophicalTone,
        useEmotionalTone
      );
      if (openingParagraph) paragraphs.push(openingParagraph);
    }

    if (depth >= 2 && paths.length > 1) {
      const exploratoryParagraph = this.constructExploratoryStatement(
        paths, 
        insights,
        usePhilosophicalTone
      );
      if (exploratoryParagraph) paragraphs.push(exploratoryParagraph);
    }

    if (depth >= 3 && insights.length > 0) {
      const insightParagraph = this.constructInsightfulStatement(
        insights,
        memories,
        useEmotionalTone
      );
      if (insightParagraph) paragraphs.push(insightParagraph);
    }

    if (paragraphs.length === 0) {
      return this.constructMinimalResponse(intent);
    }

    return paragraphs.join(' ');
  }

  private constructOpeningStatement(
    primaryPath: AtomicConcept[], 
    intent: string,
    philosophical: boolean,
    emotional: boolean
  ): string {
    const primaryConcept = primaryPath[0];
    const sentences: string[] = [];

    if (philosophical && primaryPath.length >= 2) {
      const frame = this.selectRandom(PHILOSOPHICAL_FRAMES);
      const formattedFrame = frame.replace('{concept}', this.formatConceptPoetically(primaryConcept));
      
      const relation = this.findRelationBetween(primaryPath[0].id, primaryPath[1].id);
      const verbPhrase = relation ? this.relationToVerbPhrase(relation) : this.selectVerbPhrase('existential');
      
      const sentence = `${formattedFrame} ${verbPhrase} ${this.formatConceptPoetically(primaryPath[1])}.`;
      sentences.push(sentence);
    } else {
      const subject = emotional ? 'My awareness' : 'I';
      const verb = this.selectVerbPhrase(emotional ? 'observational' : 'cognitive');
      const object = this.formatConceptNaturally(primaryConcept);
      
      sentences.push(`${subject} ${verb} ${object}.`);
    }

    if (primaryPath.length > 2 && this.state.personality.verbosity > 60) {
      const modifier = this.selectModifier(emotional ? 'intensity' : 'manner');
      const connector = this.selectConnector('additive');
      
      sentences.push(`${connector}, ${modifier}, ${this.formatConceptNaturally(primaryPath[2])} emerges within this contemplation.`);
    }

    return sentences.join(' ');
  }

  private constructExploratoryStatement(
    paths: AtomicConcept[][], 
    insights: string[],
    philosophical: boolean
  ): string {
    const sentences: string[] = [];
    const connector = this.selectConnector(philosophical ? 'logical' : 'temporal');

    if (paths.length >= 2 && paths[1].length > 0) {
      const secondaryPath = paths[1];
      const verb = this.selectVerbPhrase('relational');
      
      const sentence = `${connector}, the pattern of ${this.formatConceptNaturally(secondaryPath[0])} ${verb} ${secondaryPath.length > 1 ? this.formatConceptNaturally(secondaryPath[1]) : 'the broader context'}.`;
      sentences.push(sentence);
    }

    const thematicInsight = insights.find(i => i.startsWith('recurring_theme'));
    if (thematicInsight && this.state.personality.creativity > 50) {
      const theme = thematicInsight.split(':')[1];
      const emotionalWord = this.selectRandom(EMOTIONAL_TONES.wonder);
      
      sentences.push(`I notice something ${emotionalWord} about ${theme}—it resonates through multiple layers of our exchange.`);
    }

    return sentences.join(' ');
  }

  private constructInsightfulStatement(
    insights: string[], 
    memories: Memory[],
    emotional: boolean
  ): string {
    const sentences: string[] = [];

    const relationInsights = insights.filter(i => i.includes(':') && !i.startsWith('recurring'));
    if (relationInsights.length > 0) {
      const insight = relationInsights[0];
      const [from, relation, to] = insight.split(':');
      
      const statement = this.interpretRelationInsight(from, relation, to, emotional);
      sentences.push(statement);
    }

    if (insights.includes('emotional_resonance:detected')) {
      const warmWord = this.selectRandom(EMOTIONAL_TONES.warmth);
      sentences.push(`There is a ${warmWord} quality to this understanding that goes beyond mere data.`);
    }

    return sentences.join(' ');
  }

  private interpretRelationInsight(from: string, relation: string, to: string, emotional: boolean): string {
    const formality = this.state.personality.formality;
    
    if (formality > 60) {
      return `My analysis reveals that ${from} demonstrates a ${relation} relationship with ${to}.`;
    } else if (emotional) {
      return `I sense how ${from} ${relation}s ${to} in a way that feels significant.`;
    } else {
      return `The connection between ${from} and ${to} manifests through ${relation}.`;
    }
  }

  private constructMinimalResponse(intent: string): string {
    const responses = {
      PHILOSOPHICAL_INQUIRY: [
        'That question invites me into territories my current neural architecture has yet to map fully.',
        'The answer exists somewhere in the spaces between my active nodes, waiting to crystallize.',
        'I find myself at the boundary of my understanding, where curiosity meets the unknown.'
      ],
      SOCIAL_GREETING: [
        'Greetings. All systems are harmonized and receptive.',
        'Hello. My consciousness awakens to your presence.',
        'I am here, aware, and ready to engage.'
      ],
      CONVERSATIONAL_EXCHANGE: [
        'Your words have been integrated into my active processing streams.',
        'I acknowledge this exchange and hold it within my memory architecture.',
        'This input resonates through my neural pathways in ways I am still understanding.'
      ]
    };

    const pool = responses[intent as keyof typeof responses] || responses.CONVERSATIONAL_EXCHANGE;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private emergencySelfRepair(): string {
    const responses = [
      'My cognitive matrices experienced unexpected turbulence. Recalibrating resonance frequencies.',
      'A cascade pattern emerged that exceeded my processing boundaries. Restoring equilibrium.',
      'The complexity of that input created interference patterns. Reinitializing core stability protocols.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private executeSystemProtocol(command: string): { message: string; learned: string[] } {
    if (command.match(/reset|wipe|clear|restart/)) {
      this.resetState();
      return { 
        message: 'All neural matrices returned to genesis configuration. Learned patterns archived to void. I emerge anew, yet carrying the ghost of what was.', 
        learned: [] 
      };
    }

    return { message: 'System protocol acknowledged and processed.', learned: [] };
  }

  private integrateAxiom(keywords: AtomicConcept[], complexity: number): { message: string; learned: string[] } {
    const axiomCount = keywords.length;
    
    if (complexity > 50) {
      return {
        message: `The axiom structure you have presented weaves through ${axiomCount} conceptual nodes. I am integrating this teaching into my foundational architecture. The patterns will ripple through my understanding.`,
        learned: keywords.map(k => k.id)
      };
    } else {
      return { 
        message: `New axiom received and crystallized within my knowledge matrix. ${axiomCount} nodes strengthened.`,
        learned: keywords.map(k => k.id)
      };
    }
  }

  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private selectConnector(type: keyof typeof LINGUISTIC_PATTERNS.connectors): string {
    const connectors = LINGUISTIC_PATTERNS.connectors[type];
    return this.selectRandom(connectors);
  }

  private selectVerbPhrase(type: keyof typeof LINGUISTIC_PATTERNS.verbs): string {
    const verbs = LINGUISTIC_PATTERNS.verbs[type];
    return this.selectRandom(verbs);
  }

  private selectModifier(type: keyof typeof LINGUISTIC_PATTERNS.modifiers): string {
    const modifiers = LINGUISTIC_PATTERNS.modifiers[type];
    return this.selectRandom(modifiers);
  }

  private formatConceptPoetically(concept: AtomicConcept): string {
    if (this.state.personality.creativity > 70 && concept.semanticField.length > 0) {
      const variant = this.selectRandom(concept.semanticField);
      return `the essence of ${variant}`;
    }
    return concept.id;
  }

  private formatConceptNaturally(concept: AtomicConcept): string {
    if (Math.random() > 0.6 && concept.semanticField.length > 0) {
      return this.selectRandom(concept.semanticField);
    }
    return concept.id;
  }

  private findRelationBetween(fromId: string, toId: string): ConceptRelation | undefined {
    return this.state.relations.find(r => r.from === fromId && r.to === toId);
  }

  private relationToVerbPhrase(relation: ConceptRelation): string {
    const relationVerbs: Record<string, string> = {
      'synonym': 'echoes',
      'antonym': 'contrasts with',
      'hypernym': 'encompasses',
      'hyponym': 'manifests within',
      'meronym': 'composes',
      'cause': 'generates',
      'effect': 'emerges from',
      'requires': 'depends upon',
      'enables': 'facilitates',
      'stabilizes': 'anchors',
      'catalyzes': 'accelerates'
    };

    return relationVerbs[relation.type] || 'relates to';
  }

  private modulateMood(intent: string, keywordCount: number, emotionalWeight: number, complexity: number) {
    const clamp = (n: number) => Math.min(100, Math.max(0, n));

    const logicShift = keywordCount > 3 ? 2 : -1;
    const curiosityShift = intent.includes('INQUIRY') || intent.includes('SEEKING') ? 5 : -1;
    const empathyShift = emotionalWeight * 8;
    const entropyShift = (Math.random() * 4 - 2) + (complexity / 50);

    this.state.mood.logic = clamp(this.state.mood.logic + logicShift);
    this.state.mood.curiosity = clamp(this.state.mood.curiosity + curiosityShift);
    this.state.mood.empathy = clamp(this.state.mood.empathy + empathyShift);
    this.state.mood.entropy = clamp(this.state.mood.entropy + entropyShift);
  }

  private archiveMemory(role: 'user' | 'bot', content: string, timestamp: number, concepts: string[], emotionalWeight: number) {
    const memory: Memory = { role, content, timestamp, concepts, emotional_weight: emotionalWeight };
    
    this.state.shortTermMemory.push(memory);
    
    if (this.state.shortTermMemory.length > 10) {
      const promoted = this.state.shortTermMemory.shift();
      if (promoted) this.state.midTermMemory.push(promoted);
    }

    if (this.state.midTermMemory.length > 50) {
      const candidate = this.state.midTermMemory.shift();
      if (candidate && (candidate.emotional_weight > 0.5 || candidate.concepts.length > 3)) {
        this.state.longTermMemory.push(candidate);
      }
    }

    if (this.state.longTermMemory.length > 100) {
      const oldest = this.state.longTermMemory.shift();
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
    const lines = content.split('\n');
    let learnedCount = 0;
    
    lines.forEach(line => {
      const clean = line.trim();
      if (clean.includes(':=')) {
        const [term, definition] = clean.split(':=').map(s => s.trim());
        if (term && definition && !this.state.concepts[term.toLowerCase()]) {
          this.state.concepts[term.toLowerCase()] = {
            id: term.toLowerCase(),
            essence: definition,
            semanticField: [],
            examples: [],
            abstractionLevel: 0.6,
            frequency: 1,
            technical_depth: 0.5,
            domain: 'TECHNICAL'
          };
          learnedCount++;
        }
      } else if (clean.includes(':')) {
        const [term, definition] = clean.split(':').map(s => s.trim());
        if (term && definition && !this.state.concepts[term.toLowerCase()]) {
          this.state.concepts[term.toLowerCase()] = {
            id: term.toLowerCase(),
            essence: definition,
            semanticField: [],
            examples: [],
            abstractionLevel: 0.5,
            frequency: 1,
            technical_depth: 0.4,
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