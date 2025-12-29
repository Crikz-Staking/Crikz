// src/lib/knowledge/blockchain.knowledge.ts

export const BLOCKCHAIN_KNOWLEDGE = `
blockchain := A distributed, immutable ledger that records transactions across a network of computers
smart_contract := Self-executing code on a blockchain that automatically enforces agreement terms
erc20 := Ethereum token standard for fungible tokens
erc721 := Ethereum token standard for non-fungible tokens (NFTs)
gas := Computational effort required to execute operations on Ethereum
wei := The smallest denomination of ether, where 1 ether = 10^18 wei
gwei := 10^9 wei, commonly used to denote gas prices
consensus := The process by which blockchain nodes agree on the state of the ledger
proof_of_stake := Consensus mechanism where validators are chosen based on their stake
defi := Decentralized Finance, financial services built on blockchain without intermediaries
liquidity_pool := A collection of funds locked in a smart contract to facilitate trading
amm := Automated Market Maker, algorithm that prices assets in liquidity pools
slippage := The difference between expected and actual trade execution price
impermanent_loss := Temporary loss from providing liquidity when token prices diverge
yield_farming := Strategy of staking or lending crypto assets to generate returns
staking := Locking cryptocurrency to support network operations and earn rewards
wallet := Software or hardware that stores private keys to access blockchain assets
private_key := Secret number that proves ownership of blockchain assets
seed_phrase := Mnemonic sequence of words used to recover a wallet
metamask := Popular browser extension wallet for Ethereum
pancakeswap := Decentralized exchange on Binance Smart Chain
binance_smart_chain := EVM-compatible blockchain with lower fees than Ethereum
bsc_testnet := Testing network for Binance Smart Chain
`;

export const BLOCKCHAIN_RELATIONS = [
  { from: 'smart_contract', to: 'blockchain', type: 'runs_on', strength: 1.0 },
  { from: 'erc20', to: 'smart_contract', type: 'is_implemented_by', strength: 0.9 },
  { from: 'wei', to: 'gwei', type: 'scales_to', strength: 0.8 },
  { from: 'defi', to: 'smart_contract', type: 'requires', strength: 1.0 },
  { from: 'yield_farming', to: 'liquidity_pool', type: 'utilizes', strength: 0.9 },
  { from: 'metamask', to: 'wallet', type: 'is_type_of', strength: 1.0 },
];