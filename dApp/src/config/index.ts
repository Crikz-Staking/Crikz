// ==========================================
// CRIKZLING PROTOCOL CONFIGURATION
// ==========================================

// 1. Contract Addresses
// ------------------------------------------------------------------
export const CRIKZLING_MEMORY_ADDRESS = "0xcFE0Fbdaf71a1c1828Bc4b3aC3A6AE8f888f2571"; 

// If you have a token contract (CRIKZ), add it here. 
// Otherwise, this placeholder is fine for now.
export const CRIKZ_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000"; 


// 2. Network Configuration (BSC Testnet)
// ------------------------------------------------------------------
export const CHAIN_ID = 97; // BSC Testnet
export const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/";


// 3. Contract ABIs
// ------------------------------------------------------------------

export const CRIKZLING_MEMORY_ABI = [
  // READ Functions
  {
    "inputs": [],
    "name": "getLatestMemory",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "string", "name": "ipfsCid", "type": "string" },
          { "internalType": "uint256", "name": "conceptsCount", "type": "uint256" },
          { "internalType": "string", "name": "evolutionStage", "type": "string" }, // New Field
          { "internalType": "string", "name": "triggerEvent", "type": "string" }
        ],
        "internalType": "struct CrikzlingMemory.MemorySnapshot",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "authorizedTrainers",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "memoryTimeline",
    "outputs": [
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "string", "name": "ipfsCid", "type": "string" },
      { "internalType": "uint256", "name": "conceptsCount", "type": "uint256" },
      { "internalType": "string", "name": "evolutionStage", "type": "string" }, // New Field
      { "internalType": "string", "name": "triggerEvent", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // WRITE Functions
  {
    "inputs": [
      { "internalType": "string", "name": "_ipfsCid", "type": "string" },
      { "internalType": "uint256", "name": "_conceptsCount", "type": "uint256" },
      { "internalType": "string", "name": "_evolutionStage", "type": "string" }, // New Param
      { "internalType": "string", "name": "_trigger", "type": "string" }
    ],
    "name": "crystallizeMemory",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "snapshotId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "ipfsCid", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "evolutionStage", "type": "string" }
    ],
    "name": "MemoryCrystallized",
    "type": "event"
  }
] as const;

// Token ABI (Standard ERC20/BEP20 subset)
export const CRIKZ_TOKEN_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
] as const;