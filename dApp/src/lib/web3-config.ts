import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';

const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLET_CONNECT_ID || '4a1d7fd886457182e9cb392404f1f1f9';

export const web3Config = getDefaultConfig({
  appName: 'Crikz Protocol',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
  ssr: false,
});