// src/lib/brain/processors/PersonaEngine.ts

import { IntegratedContext, InternalDrives } from '../types';

export class PersonaEngine {
  
  /**
   * Main Translation Pipeline
   * Takes raw robotic thoughts and humanizes them based on context and drives.
   */
  public translate(rawResponse: string, context: IntegratedContext): string {
    const { brainStats, input } = context;
    const { evolutionStage, drives } = brainStats;
    const { verbosityNeeded } = input;

    // 1. Structural Adjustment (Length & Detail)
    let processed = this.adjustVerbosity(rawResponse, verbosityNeeded);

    // 2. Tonal Injection (Mood & Personality)
    processed = this.injectPersonality(processed, drives, evolutionStage);

    // 3. Humanization (Grammar, Contractions, Fillers)
    // Only apply if stage is advanced enough to emulate humans
    if (evolutionStage !== 'GENESIS') {
        processed = this.applyHumanSyntax(processed, drives.social);
    }

    return processed;
  }

  /**
   * Expands or Condenses text based on user need
   */
  private adjustVerbosity(text: string, score: number): string {
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    // Very Low Verbosity (0.0 - 0.2): "Price is 5."
    if (score <= 0.2) {
        // Extract key facts only (simplified logic: take first sentence or key metrics)
        return sentences[0]; 
    }
    
    // Low-Mid Verbosity (0.3 - 0.5): Standard Conciseness
    if (score <= 0.5) {
        return text; // The raw drafts are usually standard length
    }

    // High Verbosity (0.6 - 1.0): "Let me explain. The price is 5 because..."
    // We can't hallucinate new facts, but we can add connective tissue
    return sentences.map(s => {
        if (s.length > 20 && Math.random() > 0.5) {
            return `Furthermore, ${s.toLowerCase()}`; // Syntactic expansion
        }
        return s;
    }).join(' ');
  }

  /**
   * Injects personality quirks based on internal drives
   */
  private injectPersonality(text: string, drives: InternalDrives, stage: string): string {
    let output = text;

    // High Curiosity: Ask questions back
    if (drives.curiosity > 75 && Math.random() > 0.6) {
        output += " What do you think about that?";
    }

    // Low Energy: Be blunt, maybe succinct
    if (drives.energy < 20) {
        output = output.replace(/I believe that/g, "").replace(/It appears that/g, "");
        output += " ...Systems draining.";
    }

    // High Social: Use more emotive language
    if (drives.social > 70) {
        output = output.replace("I calculate", "I feel like");
        output = output.replace("The data shows", "It looks like");
    }

    // Stage Specifics
    if (stage === 'GENESIS') {
        return `[SYSTEM]: ${output}`; // Robotic prefix
    } 
    else if (stage === 'TRANSCENDENT') {
        // Cryptic, wise, metaphorical
        output = output.replace("is", "exists as");
        output = output.replace("understand", "perceive the weave of");
    }

    return output;
  }

  /**
   * The "Turing" Layer: Adds imperfections and human cadence
   */
  private applyHumanSyntax(text: string, socialDrive: number): string {
    let humanized = text;

    // 1. Contractions (Make it flow)
    const contractions: Record<string, string> = {
        "I am": "I'm",
        "do not": "don't",
        "cannot": "can't",
        "it is": "it's",
        "that is": "that's",
        "we are": "we're",
        "have not": "haven't"
    };

    for (const [full, short] of Object.entries(contractions)) {
        // Only contract if social drive is decent, otherwise stay formal
        if (socialDrive > 30) {
            const regex = new RegExp(`\\b${full}\\b`, 'gi');
            humanized = humanized.replace(regex, short);
        }
    }

    // 2. Discourse Markers (Fillers) - Only for high social or complex sentences
    if (socialDrive > 50) {
        const fillers = ["Honestly, ", "Well, ", "You know, ", "Basically, "];
        if (humanized.length > 50 && Math.random() > 0.7) {
            const filler = fillers[Math.floor(Math.random() * fillers.length)];
            humanized = filler + humanized.charAt(0).toLowerCase() + humanized.slice(1);
        }
    }

    // 3. Lowercasing (Stylistic choice for very casual bots, optional)
    // if (socialDrive > 90) humanized = humanized.toLowerCase();

    return humanized;
  }
}