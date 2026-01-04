import React from 'react';
import { useBlockNumber, useGasPrice } from 'wagmi';
import { Activity, Fuel } from 'lucide-react';
import { formatUnits } from 'viem';

export default function NetworkStatus() {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { data: gasPrice } = useGasPrice({ watch: true });

  // Convert gas to Gwei (10^9)
  const gasGwei = gasPrice ? parseFloat(formatUnits(gasPrice, 9)).toFixed(2) : '-';

  return (
    <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-gray-500 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
      <div className="flex items-center gap-1.5">
        <Activity size={12} className="text-emerald-500" />
        <span className="hidden sm:inline">BLOCK:</span>
        <span className="text-emerald-400">#{blockNumber?.toString() || '...'}</span>
      </div>
      <div className="w-px h-3 bg-white/10" />
      <div className="flex items-center gap-1.5">
        <Fuel size={12} className="text-amber-500" />
        <span className="hidden sm:inline">GAS:</span>
        <span className="text-amber-400">{gasGwei} Gwei</span>
      </div>
    </div>
  );
}