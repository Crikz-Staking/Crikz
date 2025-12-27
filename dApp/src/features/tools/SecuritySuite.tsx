import React, { useState } from 'react';
import { ShieldCheck, Key, Lock, Search, Copy, Check, AlertTriangle } from 'lucide-react';
import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { toast } from 'react-hot-toast';

// --- KEY GENERATOR (Retained) ---
const KeyGenerator = () => {
    const [key, setKey] = useState('');
    const [copied, setCopied] = useState(false);

    const generate = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        let res = "";
        for(let i=0; i<32; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
        setKey(res);
        setCopied(false);
    };

    const copy = () => {
        navigator.clipboard.writeText(key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Key size={18} className="text-emerald-500"/> Secure Key Gen</h3>
            <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-4 h-16 flex items-center justify-center break-all font-mono text-emerald-400 text-sm">
                {key || "Click Generate"}
            </div>
            <div className="flex gap-2">
                <button onClick={generate} className="flex-1 btn-primary py-2 text-sm">Generate</button>
                <button onClick={copy} disabled={!key} className="px-4 bg-white/10 rounded-xl hover:bg-white/20 disabled:opacity-50">
                    {copied ? <Check size={18}/> : <Copy size={18}/>}
                </button>
            </div>
        </div>
    );
};

// --- REAL ALLOWANCE CHECKER ---
const AllowanceChecker = () => {
    const { address } = useAccount();
    const [token, setToken] = useState<string>('');
    const [spender, setSpender] = useState<string>('');
    const [trigger, setTrigger] = useState(0);

    const { data: allowance, isLoading, isError } = useReadContract({
        address: token as `0x${string}`,
        abi: [{
            name: 'allowance',
            type: 'function',
            stateMutability: 'view',
            inputs: [{name: 'owner', type: 'address'}, {name: 'spender', type: 'address'}],
            outputs: [{name: '', type: 'uint256'}]
        }],
        functionName: 'allowance',
        args: address && spender ? [address, spender as `0x${string}`] : undefined,
        query: {
            enabled: !!(token && spender && address && trigger > 0)
        }
    });

    const check = () => {
        if(!token || !spender) {
            toast.error("Enter addresses");
            return;
        }
        setTrigger(prev => prev + 1);
    };

    const allowanceFormatted = allowance ? formatUnits(allowance as bigint, 18) : '0';
    const isUnlimited = allowance && (allowance as bigint) > 1000000000000000000000000000n;

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-blue-500"/> Allowance Checker</h3>
            
            <div className="space-y-3 mb-4">
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500">Token Address</label>
                    <input value={token} onChange={e=>setToken(e.target.value)} className="input-field text-xs font-mono" placeholder="0x..." />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500">Spender Address</label>
                    <input value={spender} onChange={e=>setSpender(e.target.value)} className="input-field text-xs font-mono" placeholder="0x..." />
                </div>
            </div>

            <button onClick={check} disabled={isLoading} className="btn-primary w-full py-2 text-sm mb-4">
                {isLoading ? 'Checking Chain...' : 'Check Allowance'}
            </button>

            {trigger > 0 && !isLoading && !isError && (
                <div className={`p-4 rounded-xl border ${Number(allowanceFormatted) > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        {Number(allowanceFormatted) > 0 ? <AlertTriangle size={16} className="text-red-500" /> : <ShieldCheck size={16} className="text-emerald-500" />}
                        <span className={`font-bold text-sm ${Number(allowanceFormatted) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {Number(allowanceFormatted) > 0 ? 'Risk Detected' : 'Safe'}
                        </span>
                    </div>
                    <div className="text-xs text-gray-300">
                        Current Allowance: <span className="font-mono font-bold text-white">{isUnlimited ? 'Unlimited' : allowanceFormatted}</span>
                    </div>
                </div>
            )}
            {isError && trigger > 0 && (
                <div className="text-center text-red-500 text-xs font-bold">Error reading contract. Is it an ERC20?</div>
            )}
        </div>
    );
};

export default function SecuritySuite() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KeyGenerator />
            <AllowanceChecker />
        </div>
    );
}