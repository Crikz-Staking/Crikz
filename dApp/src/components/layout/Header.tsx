// src/components/layout/Header.tsx
import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';

export default function Header({ dynamicColor }: { dynamicColor: string }) {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isConnected } = useAccount();

  // This return MUST be inside the function
  if (isConnected && chainId !== bscTestnet.id) {
    return (
      <div className="fixed top-20 left-0 w-full z-[100] px-4">
        <button 
          onClick={() => switchChain({ chainId: bscTestnet.id })}
          className="w-full py-2 bg-red-500 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 transition-all"
        >
          ⚠️ Wrong Network: Switch to BSC Testnet
        </button>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
       {/* ... rest of your header code ... */}
    </header>
  );
}