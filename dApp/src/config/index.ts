export const TARGET_CHAIN_ID = 97;
export const WAD = 1_000_000_000_000_000_000n;
export const BASE_APR = 6.182; // 6.182%

// Addresses - Ensure these match your deployment!
export const CRIKZ_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; 
export const CRIKZ_NFT_ADDRESS = import.meta.env.VITE_NFT_ADDRESS as `0x${string}`;
export const NFT_MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKET_ADDRESS as `0x${string}`;

export const ORDER_TYPES = [
  { index: 0, name: 'Prototype', days: 5, multiplier: 0.618 },
  { index: 1, name: 'Small Batch', days: 13, multiplier: 0.787 },
  { index: 2, name: 'Standard Run', days: 34, multiplier: 1.001 },
  { index: 3, name: 'Mass Production', days: 89, multiplier: 1.273 },
  { index: 4, name: 'Industrial', days: 233, multiplier: 1.619 },
  { index: 5, name: 'Global Scale', days: 610, multiplier: 2.059 },
  { index: 6, name: 'Monopoly', days: 1597, multiplier: 2.618 },
] as const;

// --- ABIs ---

export const CRIKZ_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'productionFund',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'balance', type: 'uint256' },
      { name: 'totalReputation', type: 'uint256' },
      { name: 'accumulatedYieldPerReputation', type: 'uint256' },
      { name: 'lastUpdateTime', type: 'uint256' }
    ],
  },
  {
    name: 'totalCreatorReputation',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'creatorYieldDebt',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getActiveOrders',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [
      {
        components: [
          { name: 'amount', type: 'uint256' },
          { name: 'reputation', type: 'uint256' },
          { name: 'orderType', type: 'uint8' },
          { name: 'startTime', type: 'uint256' },
          { name: 'duration', type: 'uint256' },
        ],
        name: '',
        type: 'tuple[]',
      },
    ],
  },
  {
    name: 'createOrder',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }, { name: 'orderType', type: 'uint8' }],
    outputs: [],
  },
  {
    name: 'completeOrder',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimYield',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

export const CRIKZ_NFT_ABI = [
  {
    "inputs": [{ "name": "_tokenURI", "type": "string" }],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  // ... add the rest of the functions similarly
] as const;

export const NFT_MARKETPLACE_ABI = [
  "function listModel(address nftContract, uint256 tokenId, uint256 price) external",
  "function buyItem(address nftContract, uint256 tokenId) external",
  "function cancelListing(address nftContract, uint256 tokenId) external",
  "function listings(address, uint256) view returns (address seller, address nftContract, uint256 tokenId, uint256 price, bool isActive)"
] as const;