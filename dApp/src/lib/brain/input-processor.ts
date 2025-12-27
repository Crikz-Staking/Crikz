// src/lib/brain/input-processor.ts

import { AtomicConcept } from '../crikzling-atomic-knowledge';
import { KnowledgeModule } from './knowledge-module';

export interface ProcessedInput {
  rawText: string;
  cleanedText: string;
  tokens: string[];
  sentences: string[];
  keywords: ExtractedKeyword[];
  entities: DetectedEntity[];
  intent: IntentAnalysis;
  complexity: ComplexityMetrics;
  emotionalContext: EmotionalContext;
  temporalReferences: TemporalReference[];
  questionType?: QuestionType;
}

export interface ExtractedKeyword {
  concept: AtomicConcept;
  relevance: number;
  position: number;
  context: string;
}

export interface DetectedEntity {
  text: string;
  type: 'person' | 'place' | 'organization' | 'concept' | 'number' | 'date' | 'technical';
  confidence: number;
  span: [number, number];
}

export interface IntentAnalysis {
  primary: IntentType;
  secondary: IntentType[];
  confidence: number;
  subIntent?: string;
  actionRequired?: string;
}

export type IntentType = 
  | 'COMMAND' 
  | 'QUERY' 
  | 'PHILOSOPHY' 
  | 'CASUAL' 
  | 'TEACHING' 
  | 'CLARIFICATION'
  | 'EVALUATION'
  | 'COMPARISON'
  | 'EXPLANATION'
  | 'UNKNOWN';

export interface ComplexityMetrics {
  sentenceCount: number;
  avgWordLength: number;
  uniqueWordRatio: number;
  technicalDensity: number;
  abstractionLevel: number;
  overallScore: number;
}

export interface EmotionalContext {
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
  dominance: number; // 0 to 1
  primaryEmotion?: string;
  intensity: number;
}

export interface TemporalReference {
  text: string;
  type: 'past' | 'present' | 'future' | 'duration' | 'frequency';
  timeframe?: string;
}

export type QuestionType = 
  | 'what' 
  | 'why' 
  | 'how' 
  | 'when' 
  | 'where' 
  | 'who' 
  | 'which' 
  | 'boolean'
  | 'hypothetical';

export class InputProcessor {
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which'
  ]);

  private emotionalLexicon = {
    positive: new Set(['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'joy', 'perfect']),
    negative: new Set(['bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'sad', 'disappointed', 'frustrated', 'annoyed']),
    intense: new Set(['very', 'extremely', 'absolutely', 'completely', 'totally', 'definitely', 'certainly', 'incredibly']),
    question: new Set(['?', 'wondering', 'curious', 'confused', 'unsure', 'unclear'])
  };

  constructor(private knowledge: KnowledgeModule) {}

  /**
   * Main processing pipeline
   */
  public process(input: string): ProcessedInput {
    const rawText = input;
    const cleanedText = this.cleanText(input);
    
    // Tokenization
    const tokens = this.tokenize(cleanedText);
    const sentences = this.segmentSentences(cleanedText);
    
    // Deep analysis
    const keywords = this.extractKeywords(tokens, cleanedText);
    const entities = this.detectEntities(tokens, cleanedText);
    const intent = this.analyzeIntent(cleanedText, keywords, sentences);
    const complexity = this.calculateComplexity(tokens, keywords);
    const emotionalContext = this.analyzeEmotion(cleanedText, tokens);
    const temporalReferences = this.extractTemporalReferences(cleanedText);
    const questionType = this.detectQuestionType(cleanedText);

    return {
      rawText,
      cleanedText,
      tokens,
      sentences,
      keywords,
      entities,
      intent,
      complexity,
      emotionalContext,
      temporalReferences,
      questionType
    };
  }

  /**
   * Text cleaning and normalization
   */
  private cleanText(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-'?.!,]/g, '')
      .toLowerCase();
  }

  /**
   * Advanced tokenization with context preservation
   */
  private tokenize(text: string): string[] {
    const words = text.split(/\s+/);
    const tokens: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[?.!,]/g, '');
      if (word.length > 0) {
        tokens.push(word);
        
        // Create bigrams for better context
        if (i < words.length - 1) {
          const nextWord = words[i + 1].replace(/[?.!,]/g, '');
          if (nextWord.length > 0) {
            const bigram = `${word}_${nextWord}`;
            // Check if bigram exists as a concept
            if (this.knowledge.getConcept(bigram)) {
              tokens.push(bigram);
            }
          }
        }
      }
    }
    
    return tokens;
  }

  /**
   * Sentence segmentation with context awareness
   */
  private segmentSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Enhanced keyword extraction with relevance scoring
   */
  private extractKeywords(tokens: string[], fullText: string): ExtractedKeyword[] {
    const keywords: ExtractedKeyword[] = [];
    const textLower = fullText.toLowerCase();
    
    tokens.forEach((token, index) => {
      if (this.stopWords.has(token)) return;
      
      const concept = this.knowledge.getConcept(token);
      if (concept) {
        // Calculate relevance based on multiple factors
        const frequency = tokens.filter(t => t === token).length;
        const positionWeight = 1 - (index / tokens.length) * 0.3; // Earlier words weighted slightly higher
        const technicalWeight = concept.technical_depth || 0.5;
        const domainRelevance = this.calculateDomainRelevance(concept);
        
        const relevance = (
          (frequency * 0.2) + 
          (positionWeight * 0.2) + 
          (technicalWeight * 0.3) + 
          (domainRelevance * 0.3)
        );
        
        // Extract context window
        const contextStart = Math.max(0, index - 3);
        const contextEnd = Math.min(tokens.length, index + 4);
        const context = tokens.slice(contextStart, contextEnd).join(' ');
        
        keywords.push({
          concept,
          relevance,
          position: index,
          context
        });
      }
    });
    
    // Sort by relevance and return top concepts
    return keywords
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  /**
   * Named entity recognition
   */
  private detectEntities(tokens: string[], fullText: string): DetectedEntity[] {
    const entities: DetectedEntity[] = [];
    
    tokens.forEach((token, index) => {
      // Number detection
      if (/^\d+(\.\d+)?$/.test(token)) {
        entities.push({
          text: token,
          type: 'number',
          confidence: 1.0,
          span: [index, index + 1]
        });
      }
      
      // Capitalized words (potential proper nouns)
      const originalToken = fullText.split(/\s+/)[index];
      if (originalToken && /^[A-Z]/.test(originalToken)) {
        entities.push({
          text: originalToken,
          type: 'person', // Could be refined
          confidence: 0.6,
          span: [index, index + 1]
        });
      }
      
      // Technical terms
      const concept = this.knowledge.getConcept(token);
      if (concept && concept.technical_depth > 0.7) {
        entities.push({
          text: token,
          type: 'technical',
          confidence: concept.technical_depth,
          span: [index, index + 1]
        });
      }
    });
    
    return entities;
  }

  /**
   * Multi-dimensional intent analysis
   */
  private analyzeIntent(text: string, keywords: ExtractedKeyword[], sentences: string[]): IntentAnalysis {
    const scores: Record<IntentType, number> = {
      'COMMAND': 0,
      'QUERY': 0,
      'PHILOSOPHY': 0,
      'CASUAL': 0,
      'TEACHING': 0,
      'CLARIFICATION': 0,
      'EVALUATION': 0,
      'COMPARISON': 0,
      'EXPLANATION': 0,
      'UNKNOWN': 0
    };

    // Command patterns
    if (/^(reset|wipe|clear|delete|save|crystallize|status|stop|start|execute)/i.test(text)) {
      scores.COMMAND += 25;
    }

    // Query patterns
    if (/\?$/.test(text)) scores.QUERY += 10;
    if (/^(what|why|how|when|where|who|which|can you|could you|would you)/i.test(text)) {
      scores.QUERY += 15;
    }
    if (/(explain|describe|tell me|show me)/i.test(text)) {
      scores.QUERY += 10;
      scores.EXPLANATION += 8;
    }

    // Comparison patterns
    if (/(compare|difference|versus|vs|better|worse|similar|unlike)/i.test(text)) {
      scores.COMPARISON += 15;
    }

    // Evaluation patterns
    if (/(evaluate|assess|analyze|judge|critique|review)/i.test(text)) {
      scores.EVALUATION += 15;
    }

    // Clarification patterns
    if (/(what do you mean|clarify|confused|unclear|explain more|elaborate)/i.test(text)) {
      scores.CLARIFICATION += 20;
    }

    // Teaching patterns
    if (/^(learn|read|assimilate|remember|this is|x is|here's|let me tell you)/i.test(text)) {
      scores.TEACHING += 15;
    }

    // Philosophy patterns
    if (text.length > 80) scores.PHILOSOPHY += 5;
    if (sentences.length > 3) scores.PHILOSOPHY += 5;
    if (/(consciousness|existence|reality|truth|meaning|purpose|universe|life|death)/i.test(text)) {
      scores.PHILOSOPHY += 15;
    }
    
    // Abstract concepts boost philosophy
    const abstractCount = keywords.filter(k => k.concept.abstractionLevel > 0.7).length;
    scores.PHILOSOPHY += Math.min(abstractCount * 3, 15);

    // Casual patterns
    if (/^(hey|hi|hello|good morning|good evening|thanks|thank you)/i.test(text)) {
      scores.CASUAL += 10;
    }
    if (text.length < 30 && keywords.length < 3) {
      scores.CASUAL += 5;
    }

    // Determine primary and secondary intents
    const sortedIntents = Object.entries(scores)
      .sort(([, a], [, b]) => b - a) as [IntentType, number][];
    
    const primary = sortedIntents[0][0];
    const primaryScore = sortedIntents[0][1];
    const secondary = sortedIntents
      .slice(1, 3)
      .filter(([, score]) => score > primaryScore * 0.5)
      .map(([intent]) => intent);

    const confidence = Math.min(primaryScore / 30, 1.0);

    return {
      primary: primaryScore > 5 ? primary : 'UNKNOWN',
      secondary,
      confidence,
      subIntent: this.detectSubIntent(text, primary),
      actionRequired: primary === 'COMMAND' ? this.extractAction(text) : undefined
    };
  }

  /**
   * Detect sub-intents for refined processing
   */
  private detectSubIntent(text: string, primary: IntentType): string | undefined {
    if (primary === 'QUERY') {
      if (/(how does|how do|mechanism|process|work)/i.test(text)) return 'mechanism';
      if (/(why|reason|cause|purpose)/i.test(text)) return 'causation';
      if (/(what is|define|definition|meaning)/i.test(text)) return 'definition';
    }
    
    if (primary === 'TEACHING') {
      if (/(file|document|text|data)/i.test(text)) return 'file_upload';
      if (/(this is|x is|defined as)/i.test(text)) return 'concept_definition';
    }
    
    return undefined;
  }

  /**
   * Extract action from command
   */
  private extractAction(text: string): string {
    const match = text.match(/^(\w+)/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  /**
   * Calculate text complexity metrics
   */
  private calculateComplexity(tokens: string[], keywords: ExtractedKeyword[]): ComplexityMetrics {
    const sentenceCount = tokens.filter(t => /[.!?]/.test(t)).length || 1;
    const avgWordLength = tokens.reduce((sum, t) => sum + t.length, 0) / tokens.length;
    const uniqueWords = new Set(tokens.filter(t => !this.stopWords.has(t)));
    const uniqueWordRatio = uniqueWords.size / tokens.length;
    
    const technicalTerms = keywords.filter(k => k.concept.technical_depth > 0.6);
    const technicalDensity = technicalTerms.length / Math.max(tokens.length, 1);
    
    const abstractTerms = keywords.filter(k => k.concept.abstractionLevel > 0.7);
    const abstractionLevel = abstractTerms.length / Math.max(keywords.length, 1);
    
    const overallScore = (
      (sentenceCount * 0.1) +
      (avgWordLength * 0.15) +
      (uniqueWordRatio * 0.25) +
      (technicalDensity * 0.3) +
      (abstractionLevel * 0.2)
    );

    return {
      sentenceCount,
      avgWordLength,
      uniqueWordRatio,
      technicalDensity,
      abstractionLevel,
      overallScore: Math.min(overallScore, 1.0)
    };
  }

  /**
   * Emotional context analysis
   */
  private analyzeEmotion(text: string, tokens: string[]): EmotionalContext {
    let valence = 0; // -1 (negative) to 1 (positive)
    let arousal = 0; // 0 (calm) to 1 (excited)
    let dominance = 0.5; // 0 (submissive) to 1 (dominant)
    
    // Valence calculation
    const positiveCount = tokens.filter(t => this.emotionalLexicon.positive.has(t)).length;
    const negativeCount = tokens.filter(t => this.emotionalLexicon.negative.has(t)).length;
    valence = (positiveCount - negativeCount) / Math.max(tokens.length, 1);
    valence = Math.max(-1, Math.min(1, valence * 5)); // Amplify and clamp
    
    // Arousal calculation
    const intenseCount = tokens.filter(t => this.emotionalLexicon.intense.has(t)).length;
    const exclamations = (text.match(/!/g) || []).length;
    const capitalWords = text.split(/\s+/).filter(w => w === w.toUpperCase() && w.length > 1).length;
    arousal = (intenseCount + exclamations * 0.3 + capitalWords * 0.2) / Math.max(tokens.length, 1);
    arousal = Math.min(1, arousal * 3);
    
    // Dominance calculation (questions lower dominance)
    const questionMarkers = tokens.filter(t => this.emotionalLexicon.question.has(t)).length;
    if (/\?/.test(text)) dominance -= 0.2;
    dominance -= questionMarkers * 0.1;
    dominance = Math.max(0, Math.min(1, dominance));
    
    // Determine primary emotion
    let primaryEmotion: string | undefined;
    if (valence > 0.3 && arousal > 0.5) primaryEmotion = 'excited';
    else if (valence > 0.3 && arousal < 0.3) primaryEmotion = 'content';
    else if (valence < -0.3 && arousal > 0.5) primaryEmotion = 'angry';
    else if (valence < -0.3 && arousal < 0.3) primaryEmotion = 'sad';
    else if (dominance < 0.3) primaryEmotion = 'curious';
    
    const intensity = Math.sqrt(valence * valence + arousal * arousal);

    return {
      valence: Math.round(valence * 100) / 100,
      arousal: Math.round(arousal * 100) / 100,
      dominance: Math.round(dominance * 100) / 100,
      primaryEmotion,
      intensity: Math.round(intensity * 100) / 100
    };
  }

  /**
   * Extract temporal references
   */
  private extractTemporalReferences(text: string): TemporalReference[] {
    const references: TemporalReference[] = [];
    
    const patterns = [
      { regex: /(yesterday|last week|last month|last year|ago)/i, type: 'past' as const },
      { regex: /(today|now|current|present)/i, type: 'present' as const },
      { regex: /(tomorrow|next week|next month|next year|will|going to)/i, type: 'future' as const },
      { regex: /(\d+\s*(second|minute|hour|day|week|month|year)s?)/i, type: 'duration' as const },
      { regex: /(always|never|often|sometimes|rarely|frequently)/i, type: 'frequency' as const }
    ];
    
    patterns.forEach(({ regex, type }) => {
      const matches = text.match(regex);
      if (matches) {
        references.push({
          text: matches[0],
          type,
          timeframe: matches[0]
        });
      }
    });
    
    return references;
  }

  /**
   * Detect question type
   */
  private detectQuestionType(text: string): QuestionType | undefined {
    if (!/\?/.test(text)) return undefined;
    
    if (/^what/i.test(text)) return 'what';
    if (/^why/i.test(text)) return 'why';
    if (/^how/i.test(text)) return 'how';
    if (/^when/i.test(text)) return 'when';
    if (/^where/i.test(text)) return 'where';
    if (/^who/i.test(text)) return 'who';
    if (/^which/i.test(text)) return 'which';
    if (/^(is|are|do|does|did|can|could|would|will)/i.test(text)) return 'boolean';
    if (/(if|suppose|imagine|what if)/i.test(text)) return 'hypothetical';
    
    return 'what'; // Default
  }

  /**
   * Calculate domain relevance for a concept
   */
  private calculateDomainRelevance(concept: AtomicConcept): number {
    // Concepts with specific domains are more relevant
    if (!concept.domain) return 0.5;
    
    // Technical and specialized domains get higher scores
    const domainWeights: Record<string, number> = {
      'TECHNICAL': 0.9,
      'FINANCIAL': 0.85,
      'NUMERICAL': 0.8,
      'PHILOSOPHICAL': 0.75,
      'LINGUISTIC': 0.7,
      'TEMPORAL': 0.7,
      'SPATIAL': 0.65,
      'CAUSAL': 0.8,
      'EMOTIONAL': 0.6,
      'SOCIAL': 0.6,
      'BIOLOGICAL': 0.75,
      'PHYSICAL': 0.8,
      'META': 0.85
    };
    
    return domainWeights[concept.domain] || 0.5;
  }
}