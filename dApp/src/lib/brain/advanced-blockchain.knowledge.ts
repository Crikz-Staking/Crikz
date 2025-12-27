// src/lib/knowledge/advanced-blockchain.knowledge.ts

export const ADVANCED_BLOCKCHAIN_KNOWLEDGE = `
merkle_tree := A data structure where each leaf node is a hash of data and each non-leaf node is a hash of its children
hash_function := A mathematical function that converts input data into a fixed-size string of characters
cryptographic_hash := A hash function with properties making it suitable for cryptographic applications
nonce := A number used once in cryptographic communication to prevent replay attacks
difficulty := A measure of how hard it is to mine a new block in proof-of-work systems
mining := The process of validating transactions and adding them to the blockchain
validator := A node that participates in consensus to verify transactions
node := A computer that maintains a copy of the blockchain
full_node := A node that stores the complete blockchain history
light_node := A node that stores only essential blockchain data
mempool := The pool of unconfirmed transactions waiting to be included in a block
block := A container of transactions that are permanently recorded on the blockchain
genesis_block := The first block in a blockchain
block_height := The number of blocks between a given block and the genesis block
finality := The guarantee that a transaction cannot be reversed or altered
fork := A divergence in the blockchain where the chain splits into two paths
hard_fork := A protocol change that makes previously invalid blocks valid
soft_fork := A protocol change that makes previously valid blocks invalid
sidechain := A separate blockchain that is attached to a parent blockchain
layer2 := A secondary protocol built on top of a blockchain to improve scalability
rollup := A layer 2 scaling solution that bundles multiple transactions into one
zero_knowledge_proof := A cryptographic method to prove knowledge without revealing the information
zk_snark := A type of zero-knowledge proof that is succinct and non-interactive
zk_stark := A type of zero-knowledge proof that is transparent and scalable
state_channel := An off-chain solution for conducting transactions without blockchain confirmation
plasma := A framework for building scalable blockchain applications
atomic_swap := A peer-to-peer exchange of cryptocurrencies without an intermediary
oracle_problem := The challenge of getting reliable external data onto a blockchain
governance := The process by which decisions are made in a decentralized network
dao := Decentralized Autonomous Organization, an organization run by smart contracts
multisig := A wallet requiring multiple signatures to authorize a transaction
cold_wallet := A cryptocurrency wallet that is not connected to the internet
hot_wallet := A cryptocurrency wallet that is connected to the internet
custody := The safekeeping of digital assets on behalf of users
non_custodial := A system where users maintain control of their private keys
permissioned := A blockchain where participation requires authorization
permissionless := A blockchain where anyone can participate without authorization
immutability := The property of being unchangeable once recorded
transparency := The visibility of all transactions on a public blockchain
pseudonymity := The use of pseudonyms instead of real identities
fungibility := The property where each unit is interchangeable with another
non_fungible := The property where each unit is unique and not interchangeable
tokenomics := The economic model and incentive structure of a token
`;

type RelationType = 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'cause' | 'effect' | 'requires' | 'enables' | 'stabilizes' | 'catalyzes';

interface KnowledgeRelation {
  from: string;
  to: string;
  type: RelationType;
  strength: number;
}

export const ADVANCED_BLOCKCHAIN_RELATIONS: KnowledgeRelation[] = [
  { from: 'merkle_tree', to: 'hash_function', type: 'requires', strength: 1.0 },
  { from: 'cryptographic_hash', to: 'hash_function', type: 'hyponym', strength: 0.9 },
  { from: 'mining', to: 'validator', type: 'synonym', strength: 0.7 },
  { from: 'full_node', to: 'light_node', type: 'antonym', strength: 0.8 },
  { from: 'hard_fork', to: 'soft_fork', type: 'antonym', strength: 0.9 },
  { from: 'cold_wallet', to: 'hot_wallet', type: 'antonym', strength: 1.0 },
  { from: 'permissioned', to: 'permissionless', type: 'antonym', strength: 1.0 },
  { from: 'fungible', to: 'non_fungible', type: 'antonym', strength: 1.0 },
  { from: 'layer2', to: 'rollup', type: 'hypernym', strength: 0.9 },
  { from: 'zk_snark', to: 'zero_knowledge_proof', type: 'hyponym', strength: 0.9 },
  { from: 'zk_stark', to: 'zero_knowledge_proof', type: 'hyponym', strength: 0.9 },
  { from: 'dao', to: 'governance', type: 'requires', strength: 0.9 },
  { from: 'block', to: 'blockchain', type: 'meronym', strength: 1.0 },
  { from: 'genesis_block', to: 'block', type: 'hyponym', strength: 0.9 },
];