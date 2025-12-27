import { parseEther } from 'viem';

// ==========================================
// PROTOCOL CONSTANTS
// ==========================================
export const BASE_APR = 6.182; // Golden Ratio based APR
export const WAD = parseEther('1'); // 10^18

export const ORDER_TYPES = [
  { index: 0, days: 5, multiplier: 0.618, name: "Prototype" },
  { index: 1, days: 13, multiplier: 0.787, name: "Small Batch" },
  { index: 2, days: 34, multiplier: 1.001, name: "Standard Run" },
  { index: 3, days: 89, multiplier: 1.273, name: "Mass Production" },
  { index: 4, days: 233, multiplier: 1.619, name: "Industrial" },
  { index: 5, days: 610, multiplier: 2.059, name: "Global Scale" },
  { index: 6, days: 1597, multiplier: 2.618, name: "Monopoly" }
];

// ==========================================
// CONTRACT ADDRESSES (BSC TESTNET)
// ==========================================
export const CRIKZ_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
export const CRIKZLING_MEMORY_ADDRESS = "0xcFE0Fbdaf71a1c1828Bc4b3aC3A6AE8f888f2571";
export const CRIKZ_NFT_ADDRESS = "0x034CCa2037746AA300ef290eA621deB8c1C3c299";
export const NFT_MARKETPLACE_ADDRESS = "0xeDCC0e9Ce4FFeA40501E58D04C0FbA0bB5dFC725";

// ==========================================
// ABIs
// ==========================================

export const CRIKZ_TOKEN_ABI = [
  { "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}], "name": "allowance", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"name": "amount", "type": "uint256"}, {"name": "orderType", "type": "uint8"}], "name": "createOrder", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"name": "index", "type": "uint256"}], "name": "completeOrder", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "claimYield", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"name": "", "type": "address"}], "name": "totalCreatorReputation", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"name": "", "type": "address"}], "name": "creatorYieldDebt", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"name": "creator", "type": "address"}], "name": "getActiveOrders", "outputs": [{"components": [{"name": "amount", "type": "uint256"}, {"name": "reputation", "type": "uint256"}, {"name": "orderType", "type": "uint8"}, {"name": "startTime", "type": "uint256"}, {"name": "duration", "type": "uint256"}], "type": "tuple[]"}], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "productionFund", "outputs": [{"name": "balance", "type": "uint256"}, {"name": "totalReputation", "type": "uint256"}, {"name": "accumulatedYieldPerReputation", "type": "uint256"}, {"name": "lastUpdateTime", "type": "uint256"}], "stateMutability": "view", "type": "function" }
] as const;

export const CRIKZLING_MEMORY_ABI = [
  { "inputs": [{"internalType": "string", "name": "_ipfsCid", "type": "string"}, {"internalType": "uint256", "name": "_conceptsCount", "type": "uint256"}, {"internalType": "string", "name": "_evolutionStage", "type": "string"}, {"internalType": "string", "name": "_trigger", "type": "string"}], "name": "crystallizeMemory", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
] as const;

export const CRIKZ_NFT_ABI = [
  { "inputs": [{"name": "owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"name": "owner", "type": "address"}, {"name": "index", "type": "uint256"}], "name": "tokenOfOwnerByIndex", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"name": "tokenId", "type": "uint256"}], "name": "tokenURI", "outputs": [{"name": "", "type": "string"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"name": "_tokenURI", "type": "string"}], "name": "mint", "outputs": [], "stateMutability": "payable", "type": "function" }
] as const;

export const NFT_MARKETPLACE_ABI = [
  { "anonymous": false, "inputs": [{"indexed": true, "name": "seller", "type": "address"}, {"indexed": true, "name": "nftContract", "type": "address"}, {"indexed": true, "name": "tokenId", "type": "uint256"}, {"indexed": false, "name": "price", "type": "uint256"}], "name": "ItemListed", "type": "event" },
  { "anonymous": false, "inputs": [{"indexed": true, "name": "buyer", "type": "address"}, {"indexed": true, "name": "nftContract", "type": "address"}, {"indexed": true, "name": "tokenId", "type": "uint256"}, {"indexed": false, "name": "price", "type": "uint256"}], "name": "ItemSold", "type": "event" },
  { "anonymous": false, "inputs": [{"indexed": true, "name": "seller", "type": "address"}, {"indexed": true, "name": "nftContract", "type": "address"}, {"indexed": true, "name": "tokenId", "type": "uint256"}], "name": "ItemCanceled", "type": "event" },
  { "inputs": [{"name": "nftContract", "type": "address"}, {"name": "tokenId", "type": "uint256"}, {"name": "price", "type": "uint256"}], "name": "listModel", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"name": "nftContract", "type": "address"}, {"name": "tokenId", "type": "uint256"}], "name": "buyItem", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
] as const;