// src/lib/knowledge/computer-science.knowledge.ts

export const COMPUTER_SCIENCE_KNOWLEDGE = `
computer := An electronic device that processes data according to instructions
algorithm := A step-by-step procedure for solving a problem or accomplishing a task
data_structure := A specialized format for organizing, processing, and storing data
variable := A named storage location in memory that holds a value
function := A reusable block of code that performs a specific task
loop := A control structure that repeats a block of code
conditional := A statement that executes code based on whether a condition is true
recursion := A process where a function calls itself
iteration := The repetition of a process or sequence
array := An ordered collection of elements of the same type
object := A collection of properties and methods grouped together
class := A blueprint for creating objects with shared properties and methods
inheritance := The ability of a class to inherit properties from another class
polymorphism := The ability of different objects to respond to the same method call
encapsulation := The bundling of data and methods that operate on that data
abstraction := Hiding complex implementation details and showing only essential features
interface := A contract that defines methods a class must implement
api := Application Programming Interface, a set of rules for building software
library := A collection of precompiled routines that a program can use
framework := A platform providing structure for developing applications
compiler := A program that translates high-level code into machine code
interpreter := A program that executes code line by line without compilation
syntax := The set of rules that defines valid code structure
runtime := The period when a program is executing
memory := The hardware component that stores data and instructions
cpu := Central Processing Unit, the brain of the computer that executes instructions
gpu := Graphics Processing Unit, specialized for parallel processing
cache := A small, fast memory that stores frequently accessed data
stack := A data structure that follows Last-In-First-Out principle
queue := A data structure that follows First-In-First-Out principle
heap := A region of memory used for dynamic allocation
pointer := A variable that stores the memory address of another variable
reference := An alias for an existing variable or object
null := A special value indicating the absence of a value
exception := An error or unusual event that disrupts normal program flow
debugging := The process of finding and fixing errors in code
testing := The process of evaluating software to find defects
optimization := The process of making code more efficient
scalability := The ability of a system to handle growing amounts of work
concurrency := The ability to execute multiple tasks simultaneously
parallelism := The simultaneous execution of multiple computations
thread := A sequence of execution within a process
process := An instance of a program being executed
`;

type RelationType = 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 'catalyzes';

interface KnowledgeRelation {
  from: string;
  to: string;
  type: RelationType;
  strength: number;
}

export const COMPUTER_SCIENCE_RELATIONS: KnowledgeRelation[] = [
  { from: 'algorithm', to: 'data_structure', type: 'requires', strength: 0.9 },
  { from: 'function', to: 'algorithm', type: 'requires', strength: 0.8 },
  { from: 'recursion', to: 'iteration', type: 'antonym', strength: 0.7 },
  { from: 'compiler', to: 'interpreter', type: 'antonym', strength: 0.8 },
  { from: 'stack', to: 'queue', type: 'antonym', strength: 0.7 },
  { from: 'class', to: 'object', type: 'enables', strength: 1.0 },
  { from: 'inheritance', to: 'polymorphism', type: 'enables', strength: 0.8 },
  { from: 'api', to: 'interface', type: 'requires', strength: 0.9 },
  { from: 'library', to: 'framework', type: 'hyponym', strength: 0.7 },
  { from: 'cpu', to: 'computer', type: 'meronym', strength: 1.0 },
  { from: 'memory', to: 'computer', type: 'meronym', strength: 1.0 },
  { from: 'cache', to: 'memory', type: 'hyponym', strength: 0.9 },
  { from: 'concurrency', to: 'parallelism', type: 'enables', strength: 0.8 },
  { from: 'thread', to: 'process', type: 'requires', strength: 0.9 },
];