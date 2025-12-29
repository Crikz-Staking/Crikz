// src/lib/knowledge/english-language.knowledge.ts

export const ENGLISH_LANGUAGE_KNOWLEDGE = `
noun := A word that identifies a person, place, thing, or idea
verb := A word that expresses action or a state of being
adjective := A word that describes or modifies a noun
adverb := A word that modifies a verb, adjective, or another adverb
pronoun := A word that substitutes for a noun
preposition := A word that shows the relationship between a noun and other words
conjunction := A word that connects words, phrases, or clauses
interjection := A word that expresses sudden emotion or feeling
subject := The person or thing performing the action in a sentence
predicate := The part of a sentence that tells what the subject does or is
object := The person or thing that receives the action of the verb
clause := A group of words containing a subject and predicate
phrase := A group of words that functions as a single unit without a subject-verb combination
sentence := A grammatically complete unit of thought
paragraph := A series of sentences developing a single topic
active_voice := Construction where the subject performs the action
passive_voice := Construction where the subject receives the action
present_tense := Verb form indicating action happening now
past_tense := Verb form indicating action that already happened
future_tense := Verb form indicating action that will happen
present_perfect := Verb form connecting past action to present
past_perfect := Verb form indicating action completed before another past action
gerund := A verb form ending in -ing that functions as a noun
infinitive := The base form of a verb, usually preceded by 'to'
participle := A verb form that functions as an adjective
modifier := A word or phrase that describes or limits another word
antecedent := The word a pronoun refers to
auxiliary_verb := A helping verb that works with the main verb
modal_verb := A verb that expresses necessity, possibility, or permission
transitive_verb := A verb that requires a direct object
intransitive_verb := A verb that does not require a direct object
`;

type RelationType = 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 'catalyzes';

interface KnowledgeRelation {
  from: string;
  to: string;
  type: RelationType;
  strength: number;
}

export const ENGLISH_LANGUAGE_RELATIONS: KnowledgeRelation[] = [
  { from: 'sentence', to: 'subject', type: 'requires', strength: 1.0 },
  { from: 'sentence', to: 'predicate', type: 'requires', strength: 1.0 },
  { from: 'clause', to: 'sentence', type: 'hyponym', strength: 0.9 },
  { from: 'paragraph', to: 'sentence', type: 'requires', strength: 1.0 },
  { from: 'active_voice', to: 'passive_voice', type: 'antonym', strength: 1.0 },
  { from: 'transitive_verb', to: 'intransitive_verb', type: 'antonym', strength: 1.0 },
  { from: 'verb', to: 'auxiliary_verb', type: 'hypernym', strength: 0.8 },
  { from: 'pronoun', to: 'antecedent', type: 'requires', strength: 0.9 },
  { from: 'adjective', to: 'modifier', type: 'hyponym', strength: 0.8 },
  { from: 'adverb', to: 'modifier', type: 'hyponym', strength: 0.8 },
];