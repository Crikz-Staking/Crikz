import React, { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

export default function ImpermanentLossCalculator() {
  const [priceA, setPriceA] = useState(100);
  const [priceB, setPriceB] = useState(100);
  const [futurePriceA, setFuturePriceA] = useState(110);
  const [futurePriceB, setFuturePriceB] = useState(90);
  const [il, setIl] = useState(0);

  useEffect(() => {
    // Formula: 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
    // Simplified model assuming 50/50 pool
    
    if (priceA <= 0 || priceB <= 0 || futurePriceA < 0 || futurePriceB < 0) {
        setIl(0);
        return;
    }

    const priceRatioStart = priceA / priceB;
    const priceRatioEnd = futurePriceA / futurePriceB;
    
    // Relative price change ratio
    const priceChangeRatio = priceRatioEnd / priceRatioStart;

    const divergence = 2 * Math.sqrt(priceChangeRatio) / (1 + priceChangeRatio) - 1;
    setIl(Math.abs(divergence * 100));

  }, [priceA, priceB, futurePriceA, futurePriceB]);

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-500">
            <Calculator size={24} />
        </div>
        <div>
            <h3 className="text-lg font-bold text-white">Impermanent Loss</h3>
            <p className="text-xs text-gray-500">Estimate LP risks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Initial Prices</label>
            <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold w-8">A $</span>
                <input type="number" value={priceA} onChange={e => setPriceA(Number(e.target.value))} className="bg-transparent w-full outline-none text-white font-mono text-sm" />
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold w-8">B $</span>
                <input type="number" value={priceB} onChange={e => setPriceB(Number(e.target.value))} className="bg-transparent w-full outline-none text-white font-mono text-sm" />
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Future Prices</label>
            <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold w-8">A $</span>
                <input type="number" value={futurePriceA} onChange={e => setFuturePriceA(Number(e.target.value))} className="bg-transparent w-full outline-none text-white font-mono text-sm" />
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold w-8">B $</span>
                <input type="number" value={futurePriceB} onChange={e => setFuturePriceB(Number(e.target.value))} className="bg-transparent w-full outline-none text-white font-mono text-sm" />
            </div>
        </div>
      </div>

      <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-400">Estimated Loss</span>
            <span className={`text-xl font-black ${il > 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                {il.toFixed(2)}%
            </span>
        </div>
        {il > 10 && (
            <div className="flex items-center gap-2 mt-2 text-[10px] text-red-400 font-bold">
                <AlertTriangle size={12} /> High Divergence Risk
            </div>
        )}
      </div>
    </div>
  );
}