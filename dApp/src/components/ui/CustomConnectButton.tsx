import React, { useState, useRef, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Copy, LogOut, ChevronDown, Check, AlertTriangle, Layers } from 'lucide-react';

export default function CustomConnectButton() {
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openConnectModal,
        openChainModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) return null;

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-primary-500 text-black hover:bg-primary-400 hover:scale-105 transition-all shadow-glow-sm"
            >
              <Wallet size={18} strokeWidth={2.5} />
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all animate-pulse"
            >
              <AlertTriangle size={16} />
              Wrong Network
            </button>
          );
        }

        return (
          <div className="relative" ref={dropdownRef}>
            {/* Connected Trigger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary-500/30 transition-all group"
            >
              <div className="flex items-center gap-2">
                {chain.hasIcon ? (
                  <img src={chain.iconUrl} alt={chain.name} className="w-5 h-5 rounded-full" />
                ) : (
                  <Layers size={16} className="text-gray-400" />
                )}
                <div className="h-4 w-px bg-white/10 mx-1" />
                <span className="text-sm font-bold font-mono text-white">
                  {account.displayName}
                </span>
              </div>
              <ChevronDown 
                size={14} 
                className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 p-4 rounded-2xl glass-card z-50 bg-[#12121A] border border-white/10 shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Network</span>
                    <button 
                      onClick={openChainModal}
                      className="text-xs font-bold text-primary-500 hover:text-white transition-colors"
                    >
                      Switch Chain
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6 bg-white/5 p-3 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                    <span className="font-bold text-sm text-white">{chain.name}</span>
                  </div>

                  <div className="mb-6">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">Address</span>
                    <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                      <span className="font-mono text-sm text-gray-300 truncate">
                        {account.address}
                      </span>
                      <button 
                        onClick={() => copyAddress(account.address)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => { disconnect(); setIsOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500/20 hover:border-red-500/30 transition-all font-bold text-sm"
                  >
                    <LogOut size={16} />
                    Disconnect Wallet
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}