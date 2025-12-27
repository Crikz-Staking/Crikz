import React, { useState } from 'react';
import { Terminal, Code, FileJson, Hash, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { keccak256, toBytes } from 'viem';

// --- ABI ENCODER ---
const AbiEncoder = () => {
    const [sig, setSig] = useState('transfer(address,uint256)');
    const [hash, setHash] = useState('');

    const calculate = () => {
        try {
            const h = keccak256(toBytes(sig));
            setHash(h.slice(0, 10)); // Function selector (4 bytes)
        } catch(e) { setHash('Error'); }
    };

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated md:col-span-2">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Code size={18} className="text-accent-cyan"/> Function Selector</h3>
            <div className="flex gap-2 mb-3">
                <input 
                    className="input-field font-mono text-sm py-2" 
                    value={sig} 
                    onChange={e=>setSig(e.target.value)}
                    placeholder="func(type,type)"
                />
                <button onClick={calculate} className="bg-white/10 hover:bg-white/20 px-4 rounded-xl font-bold">Calc</button>
            </div>
            <div className="bg-black/40 p-4 rounded-xl font-mono text-accent-cyan border border-accent-cyan/20 flex justify-between items-center">
                <span>{hash || '0x...'}</span>
                <span className="text-xs text-gray-500">Method ID</span>
            </div>
        </div>
    );
};

// --- IPFS PREVIEW ---
const IpfsPreview = () => {
    const [cid, setCid] = useState('');
    return (
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Hash size={18} className="text-gray-400"/> CID to Gateway</h3>
            <input 
                className="input-field mb-3 text-xs" 
                placeholder="bafy..." 
                value={cid} 
                onChange={e=>setCid(e.target.value)}
            />
            <div className="text-xs text-gray-500 break-all bg-black/20 p-2 rounded">
                {cid ? `https://ipfs.io/ipfs/${cid}` : 'Enter CID to generate URL'}
            </div>
        </div>
    );
};

// --- JSON FORMATTER ---
const JsonFormatter = () => {
    const [json, setJson] = useState('');
    const [valid, setValid] = useState(true);

    const format = (input: string) => {
        setJson(input);
        try {
            const parsed = JSON.parse(input);
            setValid(true);
        } catch(e) { setValid(false); }
    };

    const prettify = () => {
        try {
            setJson(JSON.stringify(JSON.parse(json), null, 2));
            toast.success("Formatted");
        } catch(e) { toast.error("Invalid JSON"); }
    };

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white flex items-center gap-2"><FileJson size={18} className="text-yellow-500"/> JSON Linter</h3>
                <button onClick={prettify} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">Prettify</button>
            </div>
            <textarea 
                className={`input-field h-32 font-mono text-[10px] ${valid ? 'border-white/10' : 'border-red-500/50'}`}
                value={json}
                onChange={e => format(e.target.value)}
                placeholder="{ 'key': 'value' }"
            />
        </div>
    );
};

export default function DevSuite() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AbiEncoder />
            <IpfsPreview />
            <JsonFormatter />
        </div>
    );
}