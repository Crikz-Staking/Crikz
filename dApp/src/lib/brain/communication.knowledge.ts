// src/lib/knowledge/communication.knowledge.ts

export const COMMUNICATION_KNOWLEDGE = `
communication := The exchange of information, ideas, or feelings between entities
language := A structured system of communication using symbols, sounds, or gestures
syntax := The arrangement of words and phrases to create well-formed sentences
semantics := The study of meaning in language
pragmatics := The study of how context influences the interpretation of meaning
discourse := Extended verbal expression in speech or writing
rhetoric := The art of effective or persuasive speaking or writing
dialogue := A conversation between two or more people
monologue := An extended speech by one person
narrative := A spoken or written account of connected events
metaphor := A figure of speech that describes something by comparing it to something else
analogy := A comparison between two things to highlight their similarities
idiom := A phrase whose meaning cannot be understood from the literal words
context := The circumstances that form the setting for an event or statement
tone := The general character or attitude of speech or writing
register := The level of formality in language use
connotation := The emotional or cultural association of a word beyond its literal meaning
denotation := The literal or primary meaning of a word
ambiguity := The quality of being open to more than one interpretation
clarity := The quality of being easily understood
brevity := Concise and exact use of words in writing or speech
eloquence := Fluent or persuasive speaking or writing
persuasion := The act of convincing someone to believe or do something
argumentation := The process of forming reasons and drawing conclusions
logic := Reasoning conducted according to strict principles of validity
fallacy := A mistaken belief based on faulty reasoning
coherence := The quality of being logical and consistent
cohesion := The grammatical and lexical linking within a text
emphasis := Special importance or prominence given to something
nuance := A subtle difference in meaning or expression
inference := A conclusion reached based on evidence and reasoning
implication := A conclusion that can be drawn from something not explicitly stated
`;

type RelationType = 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 'catalyzes';

interface KnowledgeRelation {
  from: string;
  to: string;
  type: RelationType;
  strength: number;
}

export const COMMUNICATION_RELATIONS: KnowledgeRelation[] = [
  { from: 'communication', to: 'language', type: 'requires', strength: 1.0 },
  { from: 'language', to: 'syntax', type: 'requires', strength: 0.9 },
  { from: 'language', to: 'semantics', type: 'requires', strength: 0.9 },
  { from: 'syntax', to: 'grammar', type: 'synonym', strength: 0.8 },
  { from: 'semantics', to: 'meaning', type: 'synonym', strength: 0.9 },
  { from: 'metaphor', to: 'analogy', type: 'synonym', strength: 0.7 },
  { from: 'denotation', to: 'connotation', type: 'antonym', strength: 0.8 },
  { from: 'clarity', to: 'ambiguity', type: 'antonym', strength: 1.0 },
  { from: 'persuasion', to: 'rhetoric', type: 'requires', strength: 0.9 },
  { from: 'argumentation', to: 'logic', type: 'requires', strength: 0.9 },
  { from: 'coherence', to: 'cohesion', type: 'enables', strength: 0.8 },
];