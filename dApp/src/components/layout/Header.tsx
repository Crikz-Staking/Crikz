import React from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import CustomConnectButton from '@/components/ui/CustomConnectButton';
import BrandLogo from './BrandLogo';
// PriceTicker import removed
import { Language } from '@/types';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  setViewMode: (mode: any) => void;
  dynamicColor?: string;
}

export default function Header({ lang, setLang, setViewMode }: HeaderProps) {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isWrongNetwork = chainId !== bscTestnet.id;

  return (
    <>
      {/* PriceTicker component removed from here */}
      
      {isWrongNetwork && (
        <div className="bg-red-500/90 backdrop-blur-sm text-white text-center text-xs font-bold py-1 z-[100] relative">
          Network Mismatch. Please switch to BSC Testnet. 
          <button onClick={() => switchChain({ chainId: bscTestnet.id })} className="underline ml-2">Switch Now</button>
        </div>
      )}
      
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => setViewMode('dashboard')} className="hover:opacity-80 transition-opacity">
            <BrandLogo />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'en' ? 'sq' : 'en')} 
              className="text-xs font-bold text-gray-500 hover:text-primary-500 transition-colors border border-white/5 px-2 py-1 rounded-md"
            >
              {lang ? lang.toUpperCase() : 'EN'}
            </button>
            <CustomConnectButton />
          </div>
        </div>
      </header>
    </>
  );
}