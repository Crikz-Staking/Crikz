// src/lib/crikzling-brain.ts
import { INITIAL_KNOWLEDGE_BASE, ConceptNode, Domain } from './crikzling-knowledge';

export interface BrainState {
    learnedAssociations: Record<string, string>; // word -> concept_id
    conceptWeights: Record<string, number>;      // concept_id -> usage_count
    traits: {
        logic: number;
        empathy: number;
        creativity: number;
        technicality: number;
    };
    shortTermMemory: string[];
}

export interface SensoryInput {
    text: string;
    balance: number;
    pageContext: string;
    isWalletConnected: boolean;
}

export interface BrainOutput {
    response: string;
    action?: string;
    emotion: 'neutral' | 'happy' | 'thinking' | 'confused' | 'excited';
    traitShift?: { trait: string, value: number }; // Feedback for the contract
}

export class CrikzlingBrain {
    private state: BrainState;

    constructor(savedState?: string) {
        if (savedState) {
            this.state = JSON.parse(savedState);
        } else {
            // Genesis State
            this.state = {
                learnedAssociations: {},
                conceptWeights: {},
                traits: { logic: 50, empathy: 50, creativity: 50, technicality: 10 },
                shortTermMemory: []
            };
        }
    }

    /**
     * The Main Processing Loop
     */
    public process(input: SensoryInput): BrainOutput {
        const normalizedText = input.text.toLowerCase().trim();
        this.updateMemory(normalizedText);

        // 1. Identify Concepts (Base + Learned)
        const matchedConcepts = this.scanConcepts(normalizedText);

        // 2. Learning Phase (Unsupervised)
        if (matchedConcepts.length === 0) {
            return this.handleUnknown(input);
        } else {
            // Reinforce known paths
            this.reinforceConcepts(matchedConcepts);
            // Associative Learning: Map unknown words in this sentence to the identified concept
            this.expandVocabulary(normalizedText, matchedConcepts[0]);
        }

        // 3. Select Best Concept based on Weights and Context
        const primaryConcept = this.selectPrimaryConcept(matchedConcepts);

        // 4. Generate Response
        let response = this.generateResponse(primaryConcept);

        // 5. Modulate based on Personality Traits
        response = this.applyPersonalityFilter(response);

        // 6. Calculate Trait Shift (Training)
        const traitShift = this.calculateTraitShift(primaryConcept);

        return {
            response,
            action: this.determineAction(primaryConcept),
            emotion: this.determineEmotion(primaryConcept),
            traitShift
        };
    }

    // --- INTERNAL MECHANISMS ---

    private scanConcepts(text: string): ConceptNode[] {
        const matches: ConceptNode[] = [];
        const words = text.split(/\s+/);

        // Check Base Knowledge
        for (const concept of Object.values(INITIAL_KNOWLEDGE_BASE)) {
            if (concept.triggers.some(t => text.includes(t))) {
                matches.push(concept);
            }
        }

        // Check Learned Associations
        for (const word of words) {
            const learnedId = this.state.learnedAssociations[word];
            if (learnedId && INITIAL_KNOWLEDGE_BASE[learnedId]) {
                matches.push(INITIAL_KNOWLEDGE_BASE[learnedId]);
            }
        }

        return [...new Set(matches)]; // Unique
    }

    private expandVocabulary(text: string, anchorConcept: ConceptNode) {
        const words = text.split(/\s+/).filter(w => w.length > 4); // Only significant words
        for (const word of words) {
            // If word is unknown, link it to the current context (Hebbian Learning: neurons that fire together...)
            if (!this.state.learnedAssociations[word] && !anchorConcept.triggers.includes(word)) {
                this.state.learnedAssociations[word] = anchorConcept.id;
                // console.log(`[Neural Plasticity] Linked '${word}' to concept '${anchorConcept.id}'`);
            }
        }
    }

    private reinforceConcepts(concepts: ConceptNode[]) {
        concepts.forEach(c => {
            this.state.conceptWeights[c.id] = (this.state.conceptWeights[c.id] || 0) + 1;
        });
    }

    private selectPrimaryConcept(concepts: ConceptNode[]): ConceptNode {
        // Sort by weight (preference) then complexity (competence)
        return concepts.sort((a, b) => {
            const weightA = this.state.conceptWeights[a.id] || 0;
            const weightB = this.state.conceptWeights[b.id] || 0;
            return weightB - weightA;
        })[0];
    }

    private generateResponse(concept: ConceptNode): string {
        const templates = concept.responseTemplates;
        // Basic RNG selection
        return templates[Math.floor(Math.random() * templates.length)];
    }

    private applyPersonalityFilter(text: string): string {
        const { logic, creativity, technicality } = this.state.traits;

        let processed = text;

        // High Technicality: Add precise terminology
        if (technicality > 60 && !processed.includes('block')) {
            processed += " (Verified on-chain).";
        }

        // High Creativity: Add metaphors
        if (creativity > 70) {
            processed = processed.replace("is", "manifests as");
        }

        // High Logic: Structure sentences
        if (logic > 80) {
            processed = "Analysis: " + processed;
        }

        return processed;
    }

    private handleUnknown(input: SensoryInput): BrainOutput {
        // Fallback learning mode
        this.state.traits.creativity += 1; // Increase creativity when exploring new ground
        
        return {
            response: `I do not recognize this pattern in my genesis database. However, I have indexed "${input.text}" for future context analysis. How does this relate to the Protocol?`,
            emotion: 'confused',
            action: undefined
        };
    }

    private determineAction(concept: ConceptNode): string | undefined {
        if (concept.id === 'gas_optimization') return '/tools'; // Navigate to tools
        if (concept.domain === 'BLOCKCHAIN') return '/dashboard';
        return undefined;
    }

    private determineEmotion(concept: ConceptNode): BrainOutput['emotion'] {
        if (concept.domain === 'MATH') return 'thinking';
        if (concept.domain === 'PHILOSOPHY') return 'excited';
        return 'happy';
    }

    private calculateTraitShift(concept: ConceptNode) {
        if (concept.domain === 'CODING') return { trait: 'technicality', value: 2 };
        if (concept.domain === 'MATH') return { trait: 'logic', value: 1 };
        if (concept.domain === 'PHILOSOPHY') return { trait: 'creativity', value: 1 };
        return undefined;
    }

    private updateMemory(text: string) {
        this.state.shortTermMemory.push(text);
        if (this.state.shortTermMemory.length > 5) this.state.shortTermMemory.shift();
    }

    public exportState(): string {
        return JSON.stringify(this.state);
    }
}