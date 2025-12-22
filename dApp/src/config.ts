// src/config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';

export const WALLET_CONNECT_PROJECT_ID = '3a8170812b534d0ff9d794f19a901d64'; // Public Test ID

// Force BSC Testnet as the primary chain
export const config = getDefaultConfig({
  appName: 'Crikz Protocol',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: [bscTestnet], 
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
  ssr: false,
});

// Addresses - Ensure these match your deployment!
export const CRIKZ_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; 
export const NFT_ADDRESS = '0x0000000000000000000000000000000000000000';

export const BASE_APR = 6.182; 
export const SECONDS_PER_YEAR = 31536000;

export const ORDER_TYPES = [
  { index: 0, days: 5, multiplier: 0.618, name: "Prototype", description: "Quick test production run" },
  { index: 1, days: 13, multiplier: 0.787, name: "Small Batch", description: "Limited production cycle" },
  { index: 2, days: 34, multiplier: 1.001, name: "Standard Run", description: "Regular production order" },
  { index: 3, days: 89, multiplier: 1.273, name: "Mass Production", description: "High volume output" },
  { index: 4, days: 233, multiplier: 1.619, name: "Industrial", description: "Large-scale manufacturing" },
  { index: 5, days: 610, multiplier: 2.059, name: "Global Scale", description: "Worldwide distribution" },
  { index: 6, days: 1597, multiplier: 2.618, name: "Monopoly", description: "Market dominance" },
] as const;

// ABIs
export const CRIKZ_TOKEN_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'totalCreatorReputation', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'creatorYieldDebt', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'productionFund', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'balance', type: 'uint256' }, { name: 'totalReputation', type: 'uint256' }, { name: 'accumulatedYieldPerReputation', type: 'uint256' }, { name: 'lastUpdateTime', type: 'uint256' }] },
  { name: 'getActiveOrders', type: 'function', stateMutability: 'view', inputs: [{ name: 'creator', type: 'address' }], outputs: [{ components: [{ name: 'amount', type: 'uint256' }, { name: 'reputation', type: 'uint256' }, { name: 'orderType', type: 'uint8' }, { name: 'startTime', type: 'uint256' }, { name: 'duration', type: 'uint256' }], name: '', type: 'tuple[]' }] },
  { name: 'createOrder', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }, { name: 'orderType', type: 'uint8' }], outputs: [] },
  { name: 'completeOrder', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'index', type: 'uint256' }], outputs: [] },
  { name: 'claimYield', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'fundProductionPool', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
] as const;

export const CRIKZ_NFT_ABI = [
  { name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'tokenByIndex', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'tokenURI', inputs: [{ type: 'uint256' }], outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { name: 'mintItem', inputs: [{name: 'to', type: 'address'}, {name: 'uri', type: 'string'}, {name: 'royaltyReceiver', type: 'address'}, {name: 'royaltyFeeNumerator', type: 'uint96'}], outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
] as const;

export const WAD = BigInt(1e18);