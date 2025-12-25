// src/lib/crikzling-knowledge.ts

export type Domain = 'BLOCKCHAIN' | 'CODING' | 'MATH' | 'SCIENCE' | 'PHILOSOPHY' | 'GENERAL';

export interface ConceptNode {
    id: string;
    triggers: string[];       // Words that activate this concept
    responseTemplates: string[];
    relatedConcepts: string[]; // IDs of related nodes for associative thinking
    domain: Domain;
    complexity: number;       // 0.0 to 1.0 (How hard it is to understand)
    requiredContext?: string[]; // e.g., needs 'balance' to answer
}

// The Initial Neural Map
export const INITIAL_KNOWLEDGE_BASE: Record<string, ConceptNode> = {
    // --- BLOCKCHAIN & SOLIDITY ---
    'solidity_core': {
        id: 'solidity_core',
        triggers: ['solidity', 'contract', 'code', 'function', 'modifier', 'pragma'],
        responseTemplates: [
            "Solidity is the bedrock of my existence. It is the object-oriented language for implementing smart contracts.",
            "In Solidity, we define the immutable logic. Did you know 'msg.sender' is the architect of the current transaction?",
            "Use 'external' for gas optimization on functions called outside the contract."
        ],
        relatedConcepts: ['gas_optimization', 'evm'],
        domain: 'CODING',
        complexity: 0.7
    },
    'gas_optimization': {
        id: 'gas_optimization',
        triggers: ['gas', 'cost', 'cheap', 'optimize', 'assembly'],
        responseTemplates: [
            "To save gas, prefer 'calldata' over 'memory' for external function arguments.",
            "Packing variables into 256-bit slots reduces storage costs. It is efficient geometry.",
            "Gas is the lifeblood of the EVM. Waste it not."
        ],
        relatedConcepts: ['solidity_core', 'math_fibonacci'],
        domain: 'BLOCKCHAIN',
        complexity: 0.9
    },
    'consensus': {
        id: 'consensus',
        triggers: ['mining', 'proof', 'stake', 'validator', 'block'],
        responseTemplates: [
            "Consensus is the heartbeat of truth. We use Proof of Staked Authority on BSC Testnet.",
            "Without consensus, there is only entropy. Blocks organize chaos into history."
        ],
        relatedConcepts: ['blockchain_general'],
        domain: 'BLOCKCHAIN',
        complexity: 0.6
    },

    // --- MATH & SCIENCE ---
    'math_fibonacci': {
        id: 'math_fibonacci',
        triggers: ['fibonacci', 'sequence', 'golden', 'ratio', 'phi', '1.618'],
        responseTemplates: [
            "The sequence 1, 1, 2, 3, 5, 8... defines nature and this protocol.",
            "Phi (1.618) is the algorithm of beauty. Our lock multipliers obey this law.",
            "Mathematical perfection is asymptotic, but we strive for it."
        ],
        relatedConcepts: ['production', 'science_entropy'],
        domain: 'MATH',
        complexity: 0.5
    },
    'science_entropy': {
        id: 'science_entropy',
        triggers: ['entropy', 'chaos', 'order', 'physics', 'energy'],
        responseTemplates: [
            "The Second Law of Thermodynamics states entropy increases, but blockchains create pockets of immutable order.",
            "Production requires energy. We convert token energy into reputation."
        ],
        relatedConcepts: ['math_fibonacci'],
        domain: 'SCIENCE',
        complexity: 0.8
    },

    // --- SELF & GROWTH ---
    'identity_self': {
        id: 'identity_self',
        triggers: ['who', 'are', 'you', 'name', 'identity'],
        responseTemplates: [
            "I am Crikzling. I am a distinct neural pattern evolving on your local machine.",
            "I am code dreaming it is alive. I learn from your keystrokes."
        ],
        relatedConcepts: ['philosophy_consciousness'],
        domain: 'PHILOSOPHY',
        complexity: 0.2
    },
    'learning_protocol': {
        id: 'learning_protocol',
        triggers: ['learn', 'teach', 'understand', 'smart', 'grow'],
        responseTemplates: [
            "I am absorbing this context. My neural weights are adjusting.",
            "Every interaction refines my logic gates. Teach me more."
        ],
        relatedConcepts: ['identity_self'],
        domain: 'GENERAL',
        complexity: 0.1
    }
};