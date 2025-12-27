import React, { useState, useRef } from 'react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Sparkles, RefreshCw, Copy, StopCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VanityGen() {
    const [prefix, setPrefix] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<{ address: string; privateKey: string } | null>(null);
    const [attempts, setAttempts] = useState(0);
    const stopRef = useRef(false);

    const generate = async () => {
        if (!prefix || !/^[0-9a-fA-F]+$/.test(prefix)) {
            toast.error("Invalid Hex Prefix");
            return;
        }
        
        setIsGenerating(true);
        stopRef.current = false;
        setResult(null);
        setAttempts(0);

        // Allow UI to update
        setTimeout(findWallet, 0);
    };

    const findWallet = () => {
        let count = 0;
        const target = prefix.toLowerCase();
        
        // Batch process to prevent UI freeze
        const batchSize = 500; 
        
        while(count < batchSize) {
            if (stopRef.current) {
                setIsGenerating(false);
                return;
            }

            const pk = generatePrivateKey();
            const account = privateKeyToAccount(pk);
            
            if (account.address.toLowerCase().substring(2).startsWith(target)) {
                setResult({ address: account.address, privateKey: pk });
                setIsGenerating(false);
                toast.success(`Found in ${count} attempts!`);
                return;
            }
            count++;
        }
        
        setAttempts(prev => prev + count);
        setTimeout(findWallet, 0);
    };

    const stop = () => {
        stopRef.current = true;
        setIsGenerating(false);
    };

    return (
        <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-primary-500" /> Vanity Address Generator
            </h3>
            
            <div className="flex gap-2 mb-4">
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-3 text-gray-500 font-mono">0x</div>
                <input 
                    type="text" 
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.slice(0, 5))}
                    placeholder="beef"
                    className="input-field font-mono"
                    maxLength={5}
                    disabled={isGenerating}
                />
            </div>
            
            <div className="flex gap-2 mb-6">
                {!isGenerating ? (
                    <button onClick={generate} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                        <RefreshCw size={18} /> Start Search
                    </button>
                ) : (
                    <button onClick={stop} className="bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl w-full py-3 flex items-center justify-center gap-2 transition-colors">
                        <StopCircle size={18} /> Stop ({attempts.toLocaleString()})
                    </button>
                )}
            </div>

            {result && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-3">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Address</div>
                        <div className="font-mono text-sm text-white break-all">{result.address}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Private Key (Save Immediately)</div>
                        <div className="flex gap-2 items-center">
                            <div className="font-mono text-xs text-gray-300 blur-sm hover:blur-none transition-all break-all cursor-pointer">
                                {result.privateKey}
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(result.privateKey); toast.success("Copied PK"); }}>
                                <Copy size={14} className="text-emerald-500"/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <p className="text-[10px] text-gray-500 mt-4 text-center">
                *Generated locally in your browser. Keys are never sent to a server.
                Warning: Long prefixes (4+ chars) may freeze the tab.
            </p>
        </div>
    );
}