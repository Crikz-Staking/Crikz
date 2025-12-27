import { parseEther } from 'viem';

export const BASE_APR = 6.182;
export const WAD = parseEther('1');

export const ORDER_TYPES = [
  { index: 0, days: 5, multiplier: 0.618, name: "Prototype" },
  { index: 1, days: 13, multiplier: 0.787, name: "Small Batch" },
  { index: 2, days: 34, multiplier: 1.001, name: "Standard Run" },
  { index: 3, days: 89, multiplier: 1.273, name: "Mass Production" },
  { index: 4, days: 233, multiplier: 1.619, name: "Industrial" },
  { index: 5, days: 610, multiplier: 2.059, name: "Global Scale" },
  { index: 6, days: 1597, multiplier: 2.618, name: "Monopoly" }
];

// REPLACE THESE ADDRESSES AFTER RUNNING: npx hardhat run scripts/deploy-full.cjs
export const CRIKZ_TOKEN_ADDRESS = "0xaDe2E0A0cFC3415f4ec1E1F827c31861b6fdfaE9"; 
export const CRIKZLING_MEMORY_ADDRESS = "0x7862Cdd1549cbb631576385258F469b58aA9fa1F";
export const CRIKZ_NFT_ADDRESS = "0x5B6da09c4E38A321e13aB81c2Cc6F578DFCc3FB1";
export const NFT_MARKETPLACE_ADDRESS = "0xB9Bec3827931177336c0dbB611680d63BD5f154F";

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

// Add this placeholder (You must deploy the contract to get the real address)
export const CRIKZ_MEDIA_ADDRESS = "0xc9BCd9bC3abF27739B67CAa50C7dD7258dc409de"; 

export const CRIKZ_MEDIA_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_cid", "type": "string" },
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "uint8", "name": "_type", "type": "uint8" }
    ],
    "name": "publishMedia",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllMedia",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "author", "type": "address" },
          { "internalType": "string", "name": "cid", "type": "string" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "uint8", "name": "mediaType", "type": "uint8" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "tipsReceived", "type": "uint256" }
        ],
        "internalType": "struct CrikzMedia.MediaItem[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "tipAuthor",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;