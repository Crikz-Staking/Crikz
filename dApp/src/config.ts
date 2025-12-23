// src/config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { hardhat, bscTestnet, mainnet } from 'wagmi/chains';
import { bscTestnet } from 'wagmi/chains';

// ========================================================================
// 1. WALLET CONNECTION CONFIGURATION
// ========================================================================
export const WALLET_CONNECT_PROJECT_ID = '3a8170812b534d0ff9d794f19a901d64';

export const config = getDefaultConfig({
  appName: 'Crikz Protocol',
  projectId: WALLET_CONNECT_PROJECT_ID,
  // 1. Make bscTestnet the FIRST chain in the array (Default)
  chains: [bscTestnet], 
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
  ssr: false,
});

// ========================================================================
// 2. PROTOCOL CONSTANTS
// ========================================================================

export const TARGET_CHAIN_ID = 97;
export const WAD = 1_000_000_000_000_000_000n;
export const CRIKZ_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; 
export const CRIKZ_NFT_ADDRESS = import.meta.env.VITE_NFT_ADDRESS;
export const NFT_MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKET_ADDRESS;

export const CRIKZ_NFT_ABI = [
  "function mint(string _tokenURI) external payable",
  "function totalSupply() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event NFTMinted(address indexed minter, uint256 indexed tokenId, string tokenURI)"
] as const;

export const NFT_MARKETPLACE_ABI = [
  "function listModel(address nftContract, uint256 tokenId, uint256 price) external",
  "function buyItem(address nftContract, uint256 tokenId) external",
  "function cancelListing(address nftContract, uint256 tokenId) external",
  "function listings(address, uint256) view returns (address seller, address nftContract, uint256 tokenId, uint256 price, bool isActive)"
] as const;

export const BASE_APR = 6.182; // 6.182%

export const ORDER_TYPES = [
  { index: 0, name: 'Prototype', days: 5, multiplier: 0.618 },
  { index: 1, name: 'Small Batch', days: 13, multiplier: 0.787 },
  { index: 2, name: 'Standard Run', days: 34, multiplier: 1.001 },
  { index: 3, name: 'Mass Production', days: 89, multiplier: 1.273 },
  { index: 4, name: 'Industrial', days: 233, multiplier: 1.619 },
  { index: 5, name: 'Global Scale', days: 610, multiplier: 2.059 },
  { index: 6, name: 'Monopoly', days: 1597, multiplier: 2.618 },
] as const;

// ========================================================================
// 3. SMART CONTRACT INTERFACE (ABI)
// ========================================================================
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