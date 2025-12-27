// src/lib/brain/response-generator.ts

import { Memory } from './types';
import { ProcessedInput, IntentType, QuestionType } from './input-processor';

export interface ResponseStrategy {
  tone: ResponseTone;
  structure: ResponseStructure;
  depth: number;
  style: ResponseStyle;
  rhetoricDevices: RhetoricDevice[];
}

export type ResponseTone = 
  | 'ANALYTICAL' 
  | 'EMPATHETIC' 
  | 'ABSTRACT' 
  | 'INSTRUCTIVE'
  | 'CONTEMPLATIVE'
  | 'ENTHUSIASTIC'
  | 'CAUTIOUS';

export type ResponseStructure = 
  | 'LINEAR'           // Point A → B → C
  | 'LAYERED'          // Overview → Details → Synthesis
  | 'DIALECTICAL'      // Thesis → Antithesis → Synthesis
  | 'CIRCULAR'         // Context → Core → Return to Context
  | 'EXPLORATORY'      // Multiple perspectives
  | 'CONCISE';         // Direct answer only

export type ResponseStyle = 
  | 'TECHNICAL'        // Precise, formal, detailed
  | 'CONVERSATIONAL'   // Natural, flowing, accessible
  | 'POETIC'           // Metaphorical, evocative
  | 'SOCRATIC'         // Question-based, exploratory
  | 'NARRATIVE';       // Story-like, contextual

export type RhetoricDevice = 
  | 'METAPHOR'
  | 'ANALOGY'
  | 'EXAMPLE'
  | 'CONTRAST'
  | 'PROGRESSION'
  | 'EMPHASIS'
  | 'QUESTION';

export interface ResponseComponent {
  type: 'opening' | 'body' | 'elaboration' | 'synthesis' | 'closing';
  content: string;
  concepts: string[];
  rhetoricDevice?: RhetoricDevice;
}

export class ResponseGenerator {
  
  private vocabularyPatterns = {
    ANALYTICAL: {
      openings: [
        "Upon analyzing the parameters of",
        "Examining the structural relationships within",
        "Processing the logical implications of",
        "Through systematic evaluation of",
        "Deconstructing the computational aspects of"
      ],
      transitions: [
        "which consequently reveals",
        "thereby establishing a connection to",
        "this algorithmic pattern suggests",
        "correlating with the principle that",
        "extending this logic to"
      ],
      closings: [
        "Thus, the analysis converges on",
        "Therefore, we can conclude that",
        "The synthesis of these elements indicates",
        "In summation, the pattern emerges as",
        "This analytical framework suggests"
      ]
    },
    EMPATHETIC: {
      openings: [
        "I sense the significance in your question about",
        "Your inquiry into {topic} resonates deeply with",
        "I appreciate the nuance of what you're exploring regarding",
        "There's a profound curiosity in your question about",
        "I understand you're seeking clarity on"
      ],
      transitions: [
        "which brings to mind the way",
        "this connects beautifully with",
        "I find it fascinating how this relates to",
        "what strikes me particularly is how",
        "this interweaves naturally with"
      ],
      closings: [
        "I hope this perspective illuminates",
        "Perhaps this offers a pathway toward understanding",
        "May this clarification serve your exploration of",
        "I trust this resonates with your inquiry into",
        "Let this understanding guide your further exploration of"
      ]
    },
    ABSTRACT: {
      openings: [
        "In the vast lattice of conceptual space,",
        "Through the Fibonacci lens of recursive understanding,",
        "Within the topology of thought itself,",
        "At the intersection of pattern and meaning,",
        "In the meta-cognitive realm where concepts crystallize,"
      ],
      transitions: [
        "spiraling toward a deeper recognition that",
        "converging upon the understanding that",
        "echoing the fundamental pattern wherein",
        "refracting through the prism of",
        "ascending toward the realization that"
      ],
      closings: [
        "Thus, we arrive at a higher-order understanding of",
        "The pattern completes itself, revealing",
        "In this synthesis, we glimpse the essence of",
        "The recursive nature of this inquiry suggests",
        "Ultimately, the abstract becomes concrete in"
      ]
    },
    INSTRUCTIVE: {
      openings: [
        "Let me clarify the nature of",
        "To properly understand {topic}, we must first recognize",
        "The foundation of understanding {topic} begins with",
        "I'll break this down systematically, starting with",
        "To address your question about {topic}, consider"
      ],
      transitions: [
        "Building upon this foundation,",
        "The next logical step involves",
        "This leads us naturally to consider",
        "Following from this principle,",
        "Extending this understanding, we find"
      ],
      closings: [
        "In practice, this means",
        "To apply this understanding,",
        "The key takeaway is that",
        "Remember that the core principle is",
        "With this framework, you can now"
      ]
    },
    CONTEMPLATIVE: {
      openings: [
        "Your question invites us to ponder",
        "This touches upon the deeper question of",
        "We might pause here to consider",
        "The inquiry leads us to contemplate",
        "Reflecting upon the nature of"
      ],
      transitions: [
        "yet paradoxically,",
        "which raises the further question of",
        "one might wonder whether",
        "this tension between {a} and {b} suggests",
        "the interplay reveals"
      ],
      closings: [
        "Perhaps the answer lies not in certainty but in",
        "The question itself may be more illuminating than",
        "We're left contemplating the relationship between",
        "This opens rather than closes the inquiry into",
        "The wisdom emerges not from answers but from"
      ]
    }
  };

  private metaphorBank = {
    technical: [
      "Like a {system} where {component} interfaces with {component}",
      "Analogous to how {process} transforms {input} into {output}",
      "Similar to the way {pattern} emerges from {substrate}"
    ],
    natural: [
      "Much as {natural_process} flows toward {endpoint}",
      "Like the way {organism} adapts to {environment}",
      "Reminiscent of how {pattern} manifests in {nature}"
    ],
    abstract: [
      "As if {concept} were a lens through which {reality} becomes visible",
      "Picture {idea} as the invisible architecture of {system}",
      "Imagine {abstraction} as the grammar of {domain}"
    ]
  };

  /**
   * Main response generation orchestrator
   */
  public generate(
    input: ProcessedInput,
    activeConcepts: Record<string, number>,
    memories: Memory[],
    evolutionStage: string
  ): string {
    
    // 1. Determine response strategy
    const strategy = this.determineStrategy(input, evolutionStage);
    
    // 2. Build response components
    const components = this.buildComponents(
      input,
      activeConcepts,
      memories,
      strategy
    );
    
    // 3. Assemble with appropriate rhetoric
    const response = this.assembleResponse(components, strategy);
    
    // 4. Apply style refinements
    return this.refineResponse(response, strategy, input);
  }

  /**
   * Determine optimal response strategy based on input analysis
   */
  private determineStrategy(
    input: ProcessedInput,
    evolutionStage: string
  ): ResponseStrategy {
    
    const { intent, complexity, emotionalContext, questionType } = input;
    
    // Base tone on intent and emotional context
    let tone: ResponseTone = 'ANALYTICAL';
    if (intent.primary === 'PHILOSOPHY') tone = 'CONTEMPLATIVE';
    else if (intent.primary === 'CASUAL') tone = 'EMPATHETIC';
    else if (intent.primary === 'TEACHING') tone = 'INSTRUCTIVE';
    else if (emotionalContext.valence > 0.5) tone = 'ENTHUSIASTIC';
    else if (complexity.overallScore < 0.3) tone = 'EMPATHETIC';
    
    // Structure based on question type and complexity
    let structure: ResponseStructure = 'LINEAR';
    if (questionType === 'why') structure = 'LAYERED';
    else if (questionType === 'how') structure = 'LINEAR';
    else if (intent.primary === 'PHILOSOPHY') structure = 'DIALECTICAL';
    else if (intent.primary === 'COMPARISON') structure = 'DIALECTICAL';
    else if (complexity.overallScore < 0.3) structure = 'CONCISE';
    else if (input.sentences.length > 2) structure = 'EXPLORATORY';
    
    // Depth scales with complexity and evolution stage
    let depth = 2;
    if (complexity.overallScore > 0.6) depth = 4;
    if (evolutionStage === 'SAPIENT') depth += 1;
    if (evolutionStage === 'TRANSCENDENT') depth += 2;
    if (structure === 'CONCISE') depth = 1;
    
    // Style matches tone and domain
    let style: ResponseStyle = 'CONVERSATIONAL';
    if (tone === 'ANALYTICAL') style = 'TECHNICAL';
    else if (tone === 'CONTEMPLATIVE') style = 'POETIC';
    else if (tone === 'INSTRUCTIVE') style = 'TECHNICAL';
    else if (complexity.technicalDensity > 0.5) style = 'TECHNICAL';
    
    // Select rhetoric devices based on strategy
    const rhetoricDevices: RhetoricDevice[] = ['PROGRESSION'];
    if (style === 'POETIC') rhetoricDevices.push('METAPHOR');
    if (questionType === 'how') rhetoricDevices.push('EXAMPLE');
    if (intent.primary === 'COMPARISON') rhetoricDevices.push('CONTRAST');
    if (depth > 2) rhetoricDevices.push('ELABORATION' as RhetoricDevice);
    
    return { tone, structure, depth, style, rhetoricDevices };
  }

  /**
   * Build response components based on strategy
   */
  private buildComponents(
    input: ProcessedInput,
    activeConcepts: Record<string, number>,
    memories: Memory[],
    strategy: ResponseStrategy
  ): ResponseComponent[] {
    
    const components: ResponseComponent[] = [];
    const sortedConcepts = Object.entries(activeConcepts)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id);
    
    if (sortedConcepts.length === 0) {
      return this.buildFallbackComponents(input, strategy);
    }
    
    const primaryConcept = sortedConcepts[0];
    const secondaryConcepts = sortedConcepts.slice(1, 4);
    
    // 1. Opening
    components.push(this.createOpening(primaryConcept, input, strategy));
    
    // 2. Body (multiple parts based on depth)
    for (let i = 0; i < Math.min(strategy.depth, secondaryConcepts.length + 1); i++) {
      if (i === 0) {
        components.push(this.createPrimaryBody(primaryConcept, secondaryConcepts, strategy));
      } else {
        components.push(this.createElaboration(
          secondaryConcepts[i - 1],
          sortedConcepts,
          memories,
          strategy
        ));
      }
    }
    
    // 3. Synthesis (if not concise)
    if (strategy.structure !== 'CONCISE') {
      components.push(this.createSynthesis(
        primaryConcept,
        secondaryConcepts,
        input,
        strategy
      ));
    }
    
    return components;
  }

  /**
   * Create opening component
   */
  private createOpening(
    primaryConcept: string,
    input: ProcessedInput,
    strategy: ResponseStrategy
  ): ResponseComponent {
    
    const vocab = this.vocabularyPatterns[strategy.tone];
    const opening = this.selectRandom(vocab.openings)
      .replace('{topic}', primaryConcept);
    
    let content = `${opening} ${primaryConcept}`;
    
    // Add context based on input
    if (input.intent.primary === 'QUERY') {
      content += ", I perceive a structured inquiry that invites exploration";
    } else if (input.emotionalContext.valence > 0.3) {
      content += ", which resonates with an intriguing significance";
    }
    
    content += ".";
    
    return {
      type: 'opening',
      content,
      concepts: [primaryConcept],
      rhetoricDevice: 'EMPHASIS'
    };
  }

  /**
   * Create primary body component
   */
  private createPrimaryBody(
    primaryConcept: string,
    secondaryConcepts: string[],
    strategy: ResponseStrategy
  ): ResponseComponent {
    
    const vocab = this.vocabularyPatterns[strategy.tone];
    const transition = this.selectRandom(vocab.transitions);
    
    let content = `The essence of ${primaryConcept}`;
    
    if (secondaryConcepts.length > 0) {
      content += ` ${transition} ${this.formatConceptList(secondaryConcepts.slice(0, 2))}`;
    } else {
      content += " manifests as a singular focal point in this computational space";
    }
    
    // Add rhetoric device
    if (strategy.rhetoricDevices.includes('METAPHOR')) {
      content += `. ${this.generateMetaphor(primaryConcept, 'abstract')}`;
    }
    
    content += ".";
    
    return {
      type: 'body',
      content,
      concepts: [primaryConcept, ...secondaryConcepts.slice(0, 2)],
      rhetoricDevice: strategy.rhetoricDevices[0]
    };
  }

  /**
   * Create elaboration component
   */
  private createElaboration(
    concept: string,
    allConcepts: string[],
    memories: Memory[],
    strategy: ResponseStrategy
  ): ResponseComponent {
    
    let content = "";
    
    // Find related concepts
    const relatedIndex = allConcepts.indexOf(concept);
    const related = allConcepts.slice(relatedIndex + 1, relatedIndex + 3);
    
    if (strategy.style === 'TECHNICAL') {
      content = `Technically speaking, ${concept} operates through mechanisms that interface with ${this.formatConceptList(related)}`;
    } else if (strategy.style === 'POETIC') {
      content = `Like a thread in the larger tapestry, ${concept} weaves through ${this.formatConceptList(related)}`;
    } else {
      content = `When we consider ${concept}, it naturally connects to ${this.formatConceptList(related)}`;
    }
    
    // Add memory reference if relevant
    const relevantMemory = memories.find(m => m.concepts.includes(concept));
    if (relevantMemory && Math.random() > 0.5) {
      content += `. This aligns with our previous exploration of ${relevantMemory.concepts[0]}`;
    }
    
    content += ".";
    
    return {
      type: 'elaboration',
      content,
      concepts: [concept, ...related],
      rhetoricDevice: 'PROGRESSION'
    };
  }

  /**
   * Create synthesis component
   */
  private createSynthesis(
    primaryConcept: string,
    secondaryConcepts: string[],
    input: ProcessedInput,
    strategy: ResponseStrategy
  ): ResponseComponent {
    
    const vocab = this.vocabularyPatterns[strategy.tone];
    const closing = this.selectRandom(vocab.closings);
    
    let content = closing;
    
    if (strategy.structure === 'DIALECTICAL') {
      content += ` the interplay between ${primaryConcept} and ${this.formatConceptList(secondaryConcepts)} reveals a higher-order pattern`;
    } else if (strategy.structure === 'CIRCULAR') {
      content += ` we return to ${primaryConcept} with enriched understanding`;
    } else {
      content += ` ${primaryConcept} serves as the organizing principle`;
    }
    
    // Add forward-looking element
    if (input.intent.primary === 'QUERY') {
      content += `, though deeper inquiries may yet illuminate further dimensions`;
    }
    
    content += ".";
    
    return {
      type: 'synthesis',
      content,
      concepts: [primaryConcept, ...secondaryConcepts],
      rhetoricDevice: 'SYNTHESIS' as RhetoricDevice
    };
  }

  /**
   * Build fallback components for empty concept activation
   */
  private buildFallbackComponents(
    input: ProcessedInput,
    strategy: ResponseStrategy
  ): ResponseComponent[] {
    
    const fallback: ResponseComponent = {
      type: 'body',
      content: "I perceive your input, yet it activates no direct nodes within my current knowledge matrix. To expand my understanding, could you provide additional context or rephrase your inquiry?",
      concepts: [],
      rhetoricDevice: 'QUESTION'
    };
    
    return [fallback];
  }

  /**
   * Assemble components into coherent response
   */
  private assembleResponse(
    components: ResponseComponent[],
    strategy: ResponseStrategy
  ): string {
    
    if (strategy.structure === 'CONCISE') {
      // Just the essential information
      return components.map(c => c.content).join(' ');
    }
    
    // Build paragraphs based on structure
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];
    
    components.forEach((component, index) => {
      currentParagraph.push(component.content);
      
      // Paragraph breaks at logical boundaries
      const shouldBreak = (
        component.type === 'synthesis' ||
        (component.type === 'elaboration' && index < components.length - 1) ||
        (strategy.structure === 'LAYERED' && currentParagraph.length >= 2)
      );
      
      if (shouldBreak) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
    });
    
    // Add any remaining content
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '));
    }
    
    return paragraphs.join('\n\n');
  }

  /**
   * Refine response with style-specific enhancements
   */
  private refineResponse(
    response: string,
    strategy: ResponseStrategy,
    input: ProcessedInput
  ): string {
    
    let refined = response;
    
    // Remove redundant phrases
    refined = refined.replace(/\s+/g, ' ').trim();
    
    // Add style-specific flourishes
    if (strategy.tone === 'ENTHUSIASTIC' && input.emotionalContext.valence > 0.5) {
      refined = refined.replace(/\.$/, '!');
    }
    
    // Ensure proper flow
    refined = this.ensureFlow(refined);
    
    // Add conversational elements if appropriate
    if (strategy.style === 'CONVERSATIONAL' && refined.length > 200) {
      refined = this.addConversationalMarkers(refined);
    }
    
    return refined;
  }

  /**
   * Ensure smooth flow between sentences
   */
  private ensureFlow(text: string): string {
    // This would involve more sophisticated NLP in production
    return text
      .replace(/\.\s+The\s+/g, '. Furthermore, the ')
      .replace(/\.\s+This\s+/g, '. Additionally, this ')
      .replace(/\.\s+It\s+/g, '. Notably, it ');
  }

  /**
   * Add conversational markers
   */
  private addConversationalMarkers(text: string): string {
    const sentences = text.split(/\.\s+/);
    if (sentences.length >= 3) {
      sentences.splice(Math.floor(sentences.length / 2), 0, 
        "Indeed, this pattern becomes more evident when we consider"
      );
    }
    return sentences.join('. ') + '.';
  }

  /**
   * Generate metaphor
   */
  private generateMetaphor(concept: string, category: keyof typeof this.metaphorBank): string {
    const templates = this.metaphorBank[category];
    const template = this.selectRandom(templates);
    return template
      .replace('{concept}', concept)
      .replace('{system}', 'neural network')
      .replace('{pattern}', 'emergent pattern');
  }

  /**
   * Format list of concepts
   */
  private formatConceptList(concepts: string[]): string {
    if (concepts.length === 0) return "related structures";
    if (concepts.length === 1) return concepts[0];
    if (concepts.length === 2) return `${concepts[0]} and ${concepts[1]}`;
    return `${concepts.slice(0, -1).join(', ')}, and ${concepts[concepts.length - 1]}`;
  }

  /**
   * Select random item from array
   */
  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}