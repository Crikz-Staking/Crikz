import React, { useState } from 'react';
import { useReadContracts, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { Search, Database, Coins, PieChart, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ERC20_ABI = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

export default function TokenInspector() {
  const { address } = useAccount();
  const [tokenAddress, setTokenAddress] = useState<`0x${string}` | ''>('');
  const [targetAddress, setTargetAddress] = useState<`0x${string}` | ''>(tokenAddress);

  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: [
      { address: targetAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'name' },
      { address: targetAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' },
      { address: targetAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' },
      { address: targetAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'totalSupply' },
      { address: targetAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [address || '0x0'] },
    ],
    query: {
      enabled: !!targetAddress && targetAddress.length === 42,
    }
  });

  const handleSearch = () => {
    if (!tokenAddress || tokenAddress.length !== 42) {
      toast.error("Invalid Address Length");
      return;
    }
    setTargetAddress(tokenAddress);
    refetch();
  };

  const [name, symbol, decimals, totalSupply, userBalance] = data || [];

  const safeDecimals = decimals?.result ? Number(decimals.result) : 18;
  
  return (
    <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <Search size={20} className="text-primary-500" /> Token Inspector
      </h3>

      <div className="flex gap-2 mb-8">
        <input 
          type="text" 
          placeholder="Enter Token Contract Address (0x...)" 
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value as `0x${string}`)}
          className="input-field font-mono text-sm"
        />
        <button 
          onClick={handleSearch} 
          disabled={isLoading}
          className="btn-primary px-6"
        >
          {isLoading ? '...' : 'Scan'}
        </button>
      </div>

      {targetAddress && (
        <div className="space-y-4">
          {isError ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm font-bold">
              Error fetching data. Is this a valid ERC20 contract?
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Database size={18} /></div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Metadata</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Name</span>
                  <span className="text-white font-bold">{name?.result?.toString() || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Symbol</span>
                  <span className="text-accent-cyan font-bold">{symbol?.result?.toString() || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Decimals</span>
                  <span className="text-white font-mono">{decimals?.result?.toString() || '-'}</span>
                </div>
              </div>

              {/* Supply Info */}
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><PieChart size={18} /></div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Supply</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block mb-1">Total Supply</span>
                  <span className="text-white font-mono font-bold text-lg break-all">
                    {totalSupply?.result 
                      ? Number(formatUnits(totalSupply.result as bigint, safeDecimals)).toLocaleString() 
                      : '-'}
                  </span>
                </div>
              </div>

              {/* User Balance */}
              <div className="md:col-span-2 bg-gradient-to-r from-primary-500/10 to-transparent p-4 rounded-2xl border border-primary-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary-500/20 rounded-lg text-primary-500"><Wallet size={18} /></div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Your Holdings</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-white">
                    {userBalance?.result 
                      ? Number(formatUnits(userBalance.result as bigint, safeDecimals)).toLocaleString() 
                      : '0'}
                  </span>
                  <span className="text-sm font-bold text-primary-500 mb-1">{symbol?.result?.toString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}