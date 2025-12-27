import React, { useState } from 'react';
import { ArrowLeftRight, Binary, FileText } from 'lucide-react';
import { toHex, fromHex, toBytes, bytesToString } from 'viem';
import { toast } from 'react-hot-toast';

export default function DataTransformer() {
  const [utf8, setUtf8] = useState('');
  const [hex, setHex] = useState('');

  const handleUtf8Change = (val: string) => {
    setUtf8(val);
    try {
      if (!val) { setHex(''); return; }
      setHex(toHex(toBytes(val)));
    } catch (e) {
      // Ignore conversion errors while typing
    }
  };

  const handleHexChange = (val: string) => {
    setHex(val);
    try {
      if (!val) { setUtf8(''); return; }
      // Ensure hex prefix
      const safeHex = val.startsWith('0x') ? val : `0x${val}`;
      setUtf8(fromHex(safeHex as `0x${string}`, 'string'));
    } catch (e) {
      // Ignore errors
    }
  };

  return (
    <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <ArrowLeftRight size={20} className="text-accent-emerald" /> Data Transformer
      </h3>

      <div className="grid gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
            <FileText size={14} /> UTF-8 String
          </label>
          <textarea 
            value={utf8}
            onChange={(e) => handleUtf8Change(e.target.value)}
            className="input-field h-24 font-mono text-sm"
            placeholder="Hello World"
          />
        </div>

        <div className="flex justify-center text-gray-600">
          <ArrowLeftRight size={20} />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
            <Binary size={14} /> Hex Data (Bytes)
          </label>
          <textarea 
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            className="input-field h-24 font-mono text-sm text-accent-emerald"
            placeholder="0x48656c6c6f20576f726c64"
          />
        </div>
      </div>
      
      <div className="mt-4 flex justify-between text-[10px] text-gray-500">
        <span>*Auto-converts as you type</span>
        <span>Length: {utf8.length} chars / {(hex.length - 2) / 2} bytes</span>
      </div>
    </div>
  );
}