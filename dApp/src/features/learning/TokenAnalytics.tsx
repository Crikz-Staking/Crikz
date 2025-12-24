import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, AlertCircle, DollarSign, Package, FileText, Filter } from 'lucide-react';
import { Language } from '@/types';

interface TokenAnalyticsProps {
  dynamicColor: string;
  lang: Language;
}

type AnalyticView = 'Price' | 'Production Orders' | 'Taxes';
type TimeFilter = '1H' | '24H' | '7D' | '30D';
type OrderFilter = 'All' | 'Completed' | 'Pending';
type TaxFilter = 'Buy' | 'Sell' | 'Transfer';

export default function TokenAnalytics({ dynamicColor, lang }: TokenAnalyticsProps) {
  const [view, setView] = useState<AnalyticView>('Price');
  
  // Sub-filters states
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24H');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('All');
  const [taxFilter, setTaxFilter] = useState<TaxFilter>('Buy');

  // Logic: Check if token data exists. Currently hardcoded to false as token is not minted.
  const hasData = false; 

  const renderFilters = () => {
    switch (view) {
      case 'Price':
        return (['1H', '24H', '7D', '30D'] as TimeFilter[]).map(f => (
          <FilterButton key={f} label={f} active={timeFilter === f} onClick={() => setTimeFilter(f)} />
        ));
      case 'Production Orders':
        return (['All', 'Completed', 'Pending'] as OrderFilter[]).map(f => (
          <FilterButton key={f} label={f} active={orderFilter === f} onClick={() => setOrderFilter(f)} />
        ));
      case 'Taxes':
        return (['Buy', 'Sell', 'Transfer'] as TaxFilter[]).map(f => (
          <FilterButton key={f} label={f} active={taxFilter === f} onClick={() => setTaxFilter(f)} />
        ));
    }
  };

  return (
    <div className="space-y-6">
      {/* View Selector Tabs */}
      <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
        <TabButton 
          icon={<DollarSign size={14} />} 
          label="Price" 
          active={view === 'Price'} 
          onClick={() => setView('Price')} 
        />
        <TabButton 
          icon={<Package size={14} />} 
          label="Production Orders" 
          active={view === 'Production Orders'} 
          onClick={() => setView('Production Orders')} 
        />
        <TabButton 
          icon={<FileText size={14} />} 
          label="Taxes" 
          active={view === 'Taxes'} 
          onClick={() => setView('Taxes')} 
        />
      </div>

      {/* Sub-Filters Bar */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Filter size={12} />
        <span className="uppercase font-bold mr-2">Filters:</span>
        {renderFilters()}
      </div>

      {/* Main Content Area */}
      <div className="glass-card min-h-[300px] flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-white/10 bg-black/40 relative overflow-hidden">
        
        {!hasData ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 max-w-sm"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
              <BarChart2 size={32} className="text-gray-600" />
            </div>
            
            <h3 className="text-xl font-black text-white mb-2">
              No Analytics Available
            </h3>
            <div className="flex items-center justify-center gap-2 text-amber-500 text-xs font-bold bg-amber-500/10 py-1 px-3 rounded-full mb-4 mx-auto w-fit">
              <AlertCircle size={12} />
              <span>Token Not Minted</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Real-time {view.toLowerCase()} data will appear here once the Crikz Token is deployed and liquidity is provided on the BSC Testnet.
            </p>
          </motion.div>
        ) : (
          <div>
            {/* Real Chart Logic would go here */}
          </div>
        )}

        {/* Background Decorative Mesh */}
        <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] opacity-[0.02] pointer-events-none">
          {Array.from({ length: 400 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/20" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Components for Cleaner Code
function TabButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
        active ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function FilterButton({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md transition-colors ${
        active ? 'bg-primary-500 text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-gray-400'
      }`}
    >
      {label}
    </button>
  );
}