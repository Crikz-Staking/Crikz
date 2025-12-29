// src/lib/knowledge/time.knowledge.ts

export const TIME_KNOWLEDGE = `
time := The indefinite continued progress of existence and events in the past, present, and future
moment := A very brief period of time
instant := A precise point in time
duration := The length of time something lasts
interval := A period of time between two events
epoch := A particular period in history or a person's life
era := A long and distinct period of history
period := A length of time with specific characteristics
cycle := A series of events that repeat regularly
chronology := The arrangement of events in time order
sequence := A particular order in which related things follow each other
simultaneity := The state of occurring at the same time
synchronization := The coordinated occurrence of events in time
past := The time before the present moment
present := The current moment in time
future := The time yet to come
temporal := Relating to time or the physical world
eternal := Without beginning or end, lasting forever
perpetual := Never ending or changing, continuous
transient := Lasting only for a short time, temporary
ephemeral := Lasting for a very short time
momentary := Lasting for a moment, brief
contemporary := Belonging to or occurring in the present
precedent := An earlier event or action taken as an example
subsequent := Coming after something in time
concurrent := Existing or happening at the same time
consecutive := Following continuously
intermittent := Occurring at irregular intervals
periodic := Appearing or occurring at intervals
frequency := The rate at which something occurs over time
tempo := The speed at which something happens
pace := The rate of movement or progress
velocity := The speed of something in a given direction
acceleration := The rate of change of velocity over time
timestamp := A record of the time at which an event occurred
deadline := A time by which something must be completed
milestone := A significant stage or event in development
schedule := A plan for carrying out a process giving times for events
chronological := Arranged in the order of time
anachronism := Something that is out of its proper time period
`;

type RelationType = 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 'catalyzes';

interface KnowledgeRelation {
  from: string;
  to: string;
  type: RelationType;
  strength: number;
}

export const TIME_RELATIONS: KnowledgeRelation[] = [
  { from: 'moment', to: 'instant', type: 'synonym', strength: 0.9 },
  { from: 'duration', to: 'interval', type: 'synonym', strength: 0.8 },
  { from: 'past', to: 'present', type: 'antonym', strength: 1.0 },
  { from: 'present', to: 'future', type: 'antonym', strength: 1.0 },
  { from: 'eternal', to: 'ephemeral', type: 'antonym', strength: 1.0 },
  { from: 'perpetual', to: 'transient', type: 'antonym', strength: 0.9 },
  { from: 'epoch', to: 'era', type: 'synonym', strength: 0.7 },
  { from: 'simultaneity', to: 'concurrent', type: 'synonym', strength: 0.9 },
  { from: 'precedent', to: 'subsequent', type: 'antonym', strength: 1.0 },
  { from: 'velocity', to: 'acceleration', type: 'enables', strength: 0.8 },
  { from: 'frequency', to: 'periodic', type: 'enables', strength: 0.9 },
  { from: 'chronology', to: 'chronological', type: 'enables', strength: 1.0 },
];