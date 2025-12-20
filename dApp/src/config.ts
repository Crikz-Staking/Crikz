// src/config.ts

import { createConfig, http } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// --- CONSTANTS ---
const WALLETCONNECT_PROJECT_ID = 'cdf8dadd25a1999d03bcb554e82147f8';
export const APP_NAME = 'Crikz Phi DApp';

// --- CHAINS ---
// We only configure BSC Testnet as requested
export const supportedChains = [bscTestnet] as const;


// --- WAGMI CONFIGURATION ---
export const wagmiConfig = getDefaultConfig({
    appName: APP_NAME,
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: supportedChains,
    transports: {
        // Use default HTTP transport for BSC Testnet
        [bscTestnet.id]: http(),
    },
});

// Optional: Export the query client setup if needed elsewhere, 
// though we will define it in main.tsx for simplicity.