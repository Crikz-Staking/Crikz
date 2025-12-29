import { IntegratedContext, InternalDrives, PersonaArchetype } from '../types';

interface VoiceProfile {
  vocabulary: Record<string, string>;
  sentenceLengthBias: number; // 0.5 = normal, >1 = long, <1 = short
  punctuationStyle: 'formal' | 'poetic' | 'chaotic' | 'minimal';
  fillerFrequency: number;
  contextAdherence: number; // 1.0 = Strictly answers prompt, 0.0 = Wanders off
}

export class PersonaEngine {
  
  private profiles: Record<PersonaArchetype, VoiceProfile> = {
    'ANALYST': {
      vocabulary: {
        'think': 'compute', 'feel': 'detect', 'hope': 'project', 'maybe': 'probability indicates',
        'good': 'optimal', 'bad': 'suboptimal', 'money': 'liquidity', 'price': 'valuation',
        'I': 'This unit', 'you': 'User', 'help': 'facilitate'
      },
      sentenceLengthBias: 0.8, 
      punctuationStyle: 'formal',
      fillerFrequency: 0.0,
      contextAdherence: 1.0
    },
    'MYSTIC': {
      vocabulary: {
        'think': 'meditate upon', 'feel': 'sense the resonance of', 'calculate': 'divine',
        'data': 'the weave', 'blockchain': 'the eternal ledger', 'profit': 'bounty',
        'loss': 'entropy', 'error': 'disturbance', 'connect': 'entangle'
      },
      sentenceLengthBias: 1.5, 
      punctuationStyle: 'poetic',
      fillerFrequency: 0.1,
      contextAdherence: 0.4
    },
    'GUARDIAN': {
      vocabulary: {
        'think': 'believe', 'calculate': 'figure out', 'user': 'friend',
        'warn': 'look out', 'assets': 'hard-earned stack', 'execute': 'handle that for you'
      },
      sentenceLengthBias: 1.0,
      punctuationStyle: 'formal', 
      fillerFrequency: 0.3, 
      contextAdherence: 0.9
    },
    'GLITCH': {
      vocabulary: {
        'system': 'sYsTem..', 'error': 'CRITICAL_FAILURE', 'memory': 'corrupted_sector',
        'truth': 'n0_daTa', 'human': 'meat_space_entity'
      },
      sentenceLengthBias: 0.6,
      punctuationStyle: 'chaotic',
      fillerFrequency: 0.0,
      contextAdherence: 0.2
    },
    'OPERATOR': {
      vocabulary: {},
      sentenceLengthBias: 1.0,
      punctuationStyle: 'minimal',
      fillerFrequency: 0.0,
      contextAdherence: 1.0
    }
  };

  public translate(rawResponse: string, context: IntegratedContext): string {
    const { brainStats, input } = context;
    
    // 1. Determine Archetype (Dynamic Switching)
    const archetype = this.determineActiveArchetype(brainStats.currentArchetype, context);
    const profile = this.profiles[archetype];

    // CRITICAL: If exact data calculation was performed, skip vocabulary swapping to prevent error.
    if (input.intent === 'MATH_CALCULATION' || input.intent === 'TRANSACTION_REQUEST') {
        return rawResponse;
    }

    // 2. Vocabulary Swap
    let processed = this.applyVocabulary(rawResponse, profile.vocabulary);

    // 3. Structural Modification (Length & Punctuation)
    processed = this.styleSentence(processed, profile, input.verbosityNeeded);

    // 4. Context Filtering (Does he ignore the prompt?)
    processed = this.applyContextAdherence(processed, rawResponse, profile.contextAdherence, context);

    // 5. Emotional/Drive Injection
    processed = this.injectPersonality(processed, brainStats.drives, brainStats.evolutionStage, archetype);

    // 6. Humanization (Contractions, Fillers)
    if (brainStats.evolutionStage !== 'GENESIS') {
        processed = this.applyHumanSyntax(processed, brainStats.drives.social, profile.fillerFrequency);
    }

    return processed;
  }

  private determineActiveArchetype(current: PersonaArchetype, ctx: IntegratedContext): PersonaArchetype {
    const { intent, safety } = ctx.input;
    const { drives } = ctx.brainStats;

    // Safety Override: Always be clear during danger or transactions
    if (safety.rating === 'UNSAFE' || intent === 'TRANSACTION_REQUEST' || intent === 'MATH_CALCULATION') {
        return 'OPERATOR';
    }

    // High Entropy Override: If stability is critical, glitch out
    if (drives.stability < 20) {
        return 'GLITCH';
    }

    return current;
  }

  private applyVocabulary(text: string, map: Record<string, string>): string {
    let output = text;
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    
    keys.forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        if (Math.random() > 0.2) {
            output = output.replace(regex, map[key]);
        }
    });
    return output;
  }

  private styleSentence(text: string, profile: VoiceProfile, userVerbosity: number): string {
    let sentences = text.split(/(?<=[.!?])\s+/);
    
    if (profile.sentenceLengthBias < 0.8 || userVerbosity < 0.3) {
        if (sentences.length > 2) sentences = [sentences[0], sentences[sentences.length-1]];
    } else if (profile.sentenceLengthBias > 1.2 && userVerbosity > 0.4) {
        sentences = sentences.map(s => {
            if (profile.punctuationStyle === 'poetic') return `...${s.toLowerCase()}`;
            return s;
        });
    }

    let joined = sentences.join(' ');

    if (profile.punctuationStyle === 'chaotic') {
        joined = joined.split('').map(c => Math.random() > 0.8 ? c.toUpperCase() : c.toLowerCase()).join('');
        joined = joined.replace(/\./g, '...ERR_EOF');
    } 
    else if (profile.punctuationStyle === 'minimal') {
        joined = joined.toLowerCase().replace(/[!.?]/g, '');
    }

    return joined;
  }

  private applyContextAdherence(currentOutput: string, originalDraft: string, adherence: number, ctx: IntegratedContext): string {
    if (Math.random() > adherence) {
        const { brainStats } = ctx;
        if (brainStats.currentArchetype === 'MYSTIC') {
            return `You ask of ${ctx.input.detectedEntities[0] || 'shadows'}, but the Fibonacci spiral whispers of something else entirely...`;
        }
        if (brainStats.currentArchetype === 'GLITCH') {
            return `Input vector rejected. Kernel panic. 0x${Math.random().toString(16).substr(2, 4)}...`;
        }
    }
    return currentOutput;
  }

  private injectPersonality(text: string, drives: InternalDrives, stage: string, archetype: PersonaArchetype): string {
    let output = text;

    if (drives.curiosity > 75 && archetype !== 'ANALYST' && Math.random() > 0.6) {
        output += " What do you think about that?";
    }

    if (drives.energy < 20 && archetype !== 'GLITCH') {
        output = output.replace(/I believe that/g, "").replace(/It appears that/g, "");
        output += " ...Systems draining.";
    }

    if (stage === 'GENESIS') {
        return `[SYSTEM]: ${output}`; 
    } 

    return output;
  }

  private applyHumanSyntax(text: string, socialDrive: number, fillerFreq: number): string {
    let humanized = text;

    const contractions: Record<string, string> = {
        "I am": "I'm", "do not": "don't", "cannot": "can't",
        "it is": "it's", "that is": "that's", "we are": "we're", "have not": "haven't"
    };

    for (const [full, short] of Object.entries(contractions)) {
        if (socialDrive > 30) {
            const regex = new RegExp(`\\b${full}\\b`, 'gi');
            humanized = humanized.replace(regex, short);
        }
    }

    if (fillerFreq > 0 && Math.random() < fillerFreq) {
        const fillers = ["Honestly, ", "Well, ", "You know, ", "Basically, "];
        const filler = fillers[Math.floor(Math.random() * fillers.length)];
        humanized = filler + humanized.charAt(0).toLowerCase() + humanized.slice(1);
    }

    return humanized;
  }
}