import React, { useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { ArrowDown } from 'lucide-react';

export default function UnitConverter() {
    const [eth, setEth] = useState('');
    const [wei, setWei] = useState('');
    const [gwei, setGwei] = useState('');

    const handleEthChange = (val: string) => {
        setEth(val);
        try {
            if(!val) { setWei(''); setGwei(''); return; }
            setWei(parseUnits(val, 18).toString());
            setGwei(parseUnits(val, 9).toString());
        } catch(e) {}
    };

    return (
        <div className="max-w-xl mx-auto glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
            <h3 className="text-xl font-bold text-white mb-6">Unit Converter</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Ether (10^18)</label>
                    <input 
                        type="number" 
                        value={eth}
                        onChange={(e) => handleEthChange(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 p-4 rounded-xl text-white text-lg focus:border-primary-500 outline-none"
                        placeholder="1.0"
                    />
                </div>
                
                <div className="flex justify-center text-gray-500"><ArrowDown size={20}/></div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Gwei (10^9)</label>
                    <input 
                        type="text" 
                        readOnly
                        value={gwei}
                        className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-gray-300 font-mono"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Wei (10^0)</label>
                    <input 
                        type="text" 
                        readOnly
                        value={wei}
                        className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-gray-300 font-mono break-all"
                    />
                </div>
            </div>
        </div>
    );
}