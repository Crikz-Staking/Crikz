import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';

const WALLET_CONNECT_PROJECT_ID = '3a8170812b534d0ff9d794f19a901d64';

export const web3Config = getDefaultConfig({
  appName: 'Crikz Protocol',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
  ssr: false,
});