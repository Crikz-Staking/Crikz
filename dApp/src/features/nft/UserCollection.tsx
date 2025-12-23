import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Tag } from 'lucide-react';

interface ImportedNFT {
  address: string;
  tokenId: string;
  name?: string;
}

export default function UserCollection({ dynamicColor }: { dynamicColor: string }) {
  const [imported, setImported] = useState<ImportedNFT[]>([]);
  const [form, setForm] = useState({ address: '', tokenId: '' });

  const handleImport = () => {
    if(!form.address || !form.tokenId) return;
    setImported([...imported, { ...form }]);
    setForm({ address: '', tokenId: '' });
  };

  return (
    <div className="space-y-6">
      {/* Import Bar */}
      <div className="glass-card p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 uppercase">Contract Address</label>
            <input 
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white"
                value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                placeholder="0x..."
            />
        </div>
        <div className="w-full md:w-32">
            <label className="text-xs font-bold text-gray-500 uppercase">Token ID</label>
            <input 
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white"
                value={form.tokenId} onChange={e => setForm({...form, tokenId: e.target.value})}
                placeholder="1"
            />
        </div>
        <button onClick={handleImport} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold text-sm flex items-center gap-2">
            <Download size={16} /> Import
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {imported.map((nft, i) => (
            <div key={i} className="glass-card p-4 rounded-xl border border-white/10">
                <div className="aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center text-4xl">🎨</div>
                <div className="font-bold text-white truncate">#{nft.tokenId}</div>
                <div className="text-xs text-gray-500 truncate mb-4">{nft.address}</div>
                <button className="w-full py-2 bg-primary-500 text-black font-bold rounded-lg text-xs flex items-center justify-center gap-2">
                    <Tag size={14} /> List for Sale
                </button>
            </div>
        ))}
      </div>
    </div>
  );
}