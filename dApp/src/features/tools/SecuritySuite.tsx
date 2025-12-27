import React, { useState } from 'react';
import { ShieldCheck, Key, Lock, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- KEY GENERATOR ---
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

// --- APPROVAL REVOKER (SIMULATION) ---
const ApprovalRevoker = () => {
    // Mock Data
    const [allowances, setAllowances] = useState([
        { id: 1, token: 'USDT', spender: '0xUnverified...Contract', risk: 'High', amount: 'Unlimited' },
        { id: 2, token: 'CRIKZ', spender: '0xMarketplace', risk: 'Low', amount: '500.00' },
    ]);

    const revoke = (id: number) => {
        toast.success("Transaction Submitted: Revoke");
        setAllowances(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-blue-500"/> Token Approvals</h3>
            
            {allowances.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                    <Check size={30} className="mx-auto mb-2 text-emerald-500"/>
                    No risky approvals found.
                </div>
            ) : (
                <div className="space-y-2">
                    {allowances.map(a => (
                        <div key={a.id} className="bg-black/20 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-white text-sm">{a.token} <span className="text-gray-500 font-normal">for</span> {a.amount}</div>
                                <div className="text-[10px] text-gray-500 font-mono">{a.spender}</div>
                            </div>
                            <button 
                                onClick={() => revoke(a.id)}
                                className={`p-2 rounded-lg ${a.risk === 'High' ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                title="Revoke"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-4 text-[10px] text-gray-600 text-center">
                *Simulated Data for Demo
            </div>
        </div>
    );
};

export default function SecuritySuite() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KeyGenerator />
            <ApprovalRevoker />
        </div>
    );
}