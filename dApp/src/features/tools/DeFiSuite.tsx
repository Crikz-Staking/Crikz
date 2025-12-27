import React, { useState, useEffect } from 'react';
import { Calculator, ArrowDown, Fuel, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';
import { motion } from 'framer-motion';

// --- SUB-COMPONENT: GAS STATION ---
const GasStation = () => {
  const [gas, setGas] = useState({ standard: 3, fast: 5, instant: 7 });
  
  // Simulate live gas updates
  useEffect(() => {
    const interval = setInterval(() => {
      const base = 3 + Math.random() * 2;
      setGas({
        standard: Math.floor(base),
        fast: Math.floor(base * 1.2),
        instant: Math.floor(base * 1.5)
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500"><Fuel size={20} /></div>
        <h3 className="font-bold text-white">Network Gas</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
            { label: 'Std', val: gas.standard, color: 'text-emerald-400' },
            { label: 'Fast', val: gas.fast, color: 'text-blue-400' },
            { label: 'Instant', val: gas.instant, color: 'text-purple-400' }
        ].map(g => (
            <div key={g.label} className="bg-black/30 p-2 rounded-xl text-center border border-white/5">
                <div className="text-[10px] text-gray-500 uppercase font-bold">{g.label}</div>
                <div className={`text-xl font-black ${g.color}`}>{g.val}</div>
                <div className="text-[9px] text-gray-600">GWEI</div>
            </div>
        ))}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: UNIT CONVERTER ---
const UnitConverter = () => {
    const [eth, setEth] = useState('');
    const [gwei, setGwei] = useState('');
    const [wei, setWei] = useState('');

    const handleChange = (val: string, type: 'eth' | 'gwei' | 'wei') => {
        try {
            if(!val) { setEth(''); setGwei(''); setWei(''); return; }
            let valWei = 0n;
            if(type === 'eth') { setEth(val); valWei = parseUnits(val, 18); }
            if(type === 'gwei') { setGwei(val); valWei = parseUnits(val, 9); }
            if(type === 'wei') { setWei(val); valWei = BigInt(val); }

            if(type !== 'eth') setEth(formatUnits(valWei, 18));
            if(type !== 'gwei') setGwei(formatUnits(valWei, 9));
            if(type !== 'wei') setWei(valWei.toString());
        } catch(e) {}
    };

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <RefreshCw size={18} className="text-primary-500"/> Unit Converter
            </h3>
            <div className="space-y-3">
                {['Ether', 'Gwei', 'Wei'].map((unit) => (
                    <div key={unit} className="relative">
                        <label className="absolute -top-2 left-2 text-[10px] bg-[#1A1A24] px-1 text-gray-500 font-bold uppercase">{unit}</label>
                        <input 
                            type={unit === 'Wei' ? 'text' : 'number'}
                            value={unit === 'Ether' ? eth : unit === 'Gwei' ? gwei : wei}
                            onChange={(e) => handleChange(e.target.value, unit.toLowerCase() as any)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm font-mono focus:border-primary-500 outline-none transition-colors"
                            placeholder="0.0"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: IL CALCULATOR ---
const ILCalculator = () => {
    const [pA, setPA] = useState(100);
    const [pB, setPB] = useState(100); // Future price
    const [il, setIl] = useState(0);

    useEffect(() => {
        if(pA <=0 || pB <= 0) return;
        const ratio = pB / pA;
        const divergence = 2 * Math.sqrt(ratio) / (1 + ratio) - 1;
        setIl(Math.abs(divergence * 100));
    }, [pA, pB]);

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated md:col-span-2">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-white flex items-center gap-2"><Calculator size={18} className="text-pink-500"/> Impermanent Loss</h3>
                <div className={`px-3 py-1 rounded-lg font-bold text-sm ${il > 5 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    -{il.toFixed(2)}% Loss
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500 font-bold block mb-1">Entry Price ($)</label>
                    <input type="number" value={pA} onChange={e=>setPA(+e.target.value)} className="input-field py-2"/>
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold block mb-1">Exit Price ($)</label>
                    <input type="number" value={pB} onChange={e=>setPB(+e.target.value)} className="input-field py-2"/>
                </div>
            </div>
            <div className="mt-4">
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-red-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(il * 5, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Safe Zone</span>
                    <span>Rekt Zone</span>
                </div>
            </div>
        </div>
    );
};

export default function DeFiSuite() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GasStation />
            <UnitConverter />
            <ILCalculator />
        </div>
    );
}