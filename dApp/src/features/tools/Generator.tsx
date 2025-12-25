import React, { useState } from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';

export default function Generator() {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [copied, setCopied] = useState(false);

    const generate = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let retVal = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        setPassword(retVal);
        setCopied(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-xl mx-auto glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
            <h3 className="text-xl font-bold text-white mb-6">Secure Key Generator</h3>
            
            <div className="flex gap-4 mb-6">
                <input 
                    type="range" min="8" max="64" 
                    value={length} onChange={(e) => setLength(parseInt(e.target.value))}
                    className="flex-1"
                />
                <span className="font-mono text-white bg-white/10 px-3 py-1 rounded">{length} chars</span>
            </div>

            <div className="relative mb-6">
                <div className="w-full bg-black/40 border border-white/10 p-6 rounded-xl text-primary-500 font-mono break-all text-center min-h-[80px] flex items-center justify-center">
                    {password || "Click Generate"}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={generate} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                    <RefreshCw size={18} /> Generate
                </button>
                <button onClick={copyToClipboard} disabled={!password} className="bg-primary-500 hover:bg-primary-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                    {copied ? <Check size={18}/> : <Copy size={18} />} {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
        </div>
    );
}