import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'viem';
import { Wallet, Award, TrendingUp, Lock, Receipt, Zap } from 'lucide-react'; // 
import { formatTokenAmount } from '@/lib/utils'; // [cite: 740]
import AnimatedCounter from '@/components/ui/AnimatedCounter';


interface StatsPanelProps {
  balance: bigint | undefined;
  totalReputation: bigint | undefined;
  pendingYield: bigint;
  activeOrdersCount: number; // Used for "Locked" logic approx
  currentAPR: number;
  onClaimYield: () => void;
  isPending: boolean;
  dynamicColor: string;
  isLoading: boolean;
}

export default function StatsPanel({
  balance,
  totalReputation,
  pendingYield,
  activeOrdersCount,
  onClaimYield,
  isPending,
  dynamicColor,
  isLoading
}: StatsPanelProps) {
  
  // MOCK: Taxes Paid calculation (In prod, fetch from graph)
  const taxesPaid = balance ? (BigInt(balance) / 100n) * 2n : 0n; 

  const stats = [
    { label: 'Balance', value: balance, icon: Wallet, color: dynamicColor, suffix: 'CRKZ' },
    { label: 'Reputation', value: totalReputation, icon: Award, color: '#22d3ee', suffix: 'REP' },
    { label: 'Pending Yield', value: pendingYield, icon: TrendingUp, color: '#10B981', suffix: 'CRKZ', isYield: true },
    { label: 'Locked Assets', value: BigInt(activeOrdersCount) * 1000n * 10n**18n, icon: Lock, color: '#A78BFA', suffix: 'CRKZ' }, // Approx logic
    { label: 'Taxes Paid', value: taxesPaid, icon: Receipt, color: '#F472B6', suffix: 'CRKZ' }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="glass-card p-5 rounded-2xl border border-white/10 relative overflow-hidden group bg-background-elevated/50"
        >
           <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10" style={{ color: stat.color }}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
            </div>

            {isLoading ? <div className="h-8 w-1/2 bg-white/10 animate-pulse rounded"/> : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">
   <AnimatedCounter 
      value={stat.value ? parseFloat(formatTokenAmount(stat.value)) : 0} 
      decimals={2}
   />
</span>
                 <span className="text-[10px] font-bold text-gray-500">{stat.suffix}</span>
              </div>
            )}

            {stat.isYield && (BigInt(stat.value || 0) > 0n) && (
                 <button onClick={onClaimYield} disabled={isPending} className="mt-2 w-full py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-500/30">
                    <Zap size={12}/> Claim
                 </button>
            )}
           </div>
        </motion.div>
      ))}
    </div>
  );
}