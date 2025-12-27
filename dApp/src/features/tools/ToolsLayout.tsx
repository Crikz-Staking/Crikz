import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Hash, ShieldCheck, Terminal, Type, 
    QrCode, Calculator, Database, Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import standalone robust tools
import FileConverter from './FileConverter';
import UnitConverter from './UnitConverter';
import Generator from './Generator';
import ImpermanentLossCalculator from './ImpermanentLossCalculator';

// -- Micro Tools (Keep simple ones inline for speed) --

const IpfsGen = () => {
    const [input, setInput] = useState('');
    const [cid, setCid] = useState('');
    const gen = () => {
        // Deterministic mock for demo
        let h = 0xdeadbeef;
        for(let i=0;i<input.length;i++) h = Math.imul(h ^ input.charCodeAt(i), 2654435761);
        const hash = ((h ^ h >>> 16) >>> 0).toString(16);
        setCid(`bafybeig${hash}x2...`);
    }
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-white">IPFS CID Preview</h3>
            <div className="flex gap-2">
                <input className="input-field py-2 text-sm" placeholder="Content string..." value={input} onChange={e=>setInput(e.target.value)}/>
                <button onClick={gen} className="px-4 bg-white/10 rounded-xl font-bold hover:bg-white/20">Calc</button>
            </div>
            {cid && <div className="bg-black/40 p-3 rounded-lg font-mono text-[10px] text-accent-cyan break-all border border-accent-cyan/20">{cid}</div>}
        </div>
    )
}

const WordCount = () => {
    const [txt, setTxt] = useState('');
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-white">Text Analyzer</h3>
            <textarea className="input-field h-20 text-xs font-mono" placeholder="Paste text..." value={txt} onChange={e=>setTxt(e.target.value)}/>
            <div className="flex justify-between text-xs font-bold text-gray-500 bg-black/20 p-2 rounded-lg">
                <span>Chars: {txt.length}</span>
                <span>Words: {txt.trim() ? txt.trim().split(/\s+/).length : 0}</span>
                <span>Lines: {txt.trim() ? txt.split(/\n/).length : 0}</span>
            </div>
        </div>
    )
}

const Base64Tool = () => {
    const [inp, setInp] = useState('');
    return (
        <div className="space-y-4">
             <h3 className="font-bold text-white">Base64 Encoder</h3>
             <input className="input-field py-2 text-sm" placeholder="Text..." value={inp} onChange={e=>setInp(e.target.value)}/>
             <div className="bg-black/40 p-3 rounded-lg font-mono text-[10px] text-gray-400 break-all h-16 overflow-y-auto">
                 {inp ? btoa(inp) : '...'}
             </div>
        </div>
    )
}

export default function ToolsLayout({ dynamicColor }: { dynamicColor: string }) {
  const [activeCategory, setActiveCategory] = useState('crypto');

  const categories = [
    { id: 'crypto', label: 'DeFi Utils', icon: Hash, tools: [<UnitConverter/>, <ImpermanentLossCalculator/>, <IpfsGen/>] },
    { id: 'dev', label: 'Developer', icon: Terminal, tools: [<FileConverter dynamicColor={dynamicColor}/>, <Base64Tool/>] },
    { id: 'security', label: 'Security', icon: ShieldCheck, tools: [<Generator/>] },
    { id: 'text', label: 'Text', icon: Type, tools: [<WordCount/>] },
  ];

  return (
    <div className="space-y-8">
      {/* Category Nav */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border ${
                isActive ? 'bg-white/10 border-white/20 shadow-glow-sm' : 'bg-background-elevated border-white/5 hover:bg-white/5'
              }`}
              style={{ color: isActive ? dynamicColor : '#6b7280', borderColor: isActive ? dynamicColor : '' }}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Tools Grid - Masonry-ish via standard grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {categories.find(c => c.id === activeCategory)?.tools.map((tool, idx) => (
              <motion.div
                key={`${activeCategory}-${idx}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={tool.type === FileConverter || tool.type === UnitConverter || tool.type === Generator ? "md:col-span-2 lg:col-span-2" : ""}
              >
                  {tool.type === FileConverter || tool.type === UnitConverter || tool.type === Generator || tool.type === ImpermanentLossCalculator ? (
                      // Complex tools manage their own containers
                      tool
                  ) : (
                      // Wrapper for simple inline tools
                      <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all bg-background-elevated">
                          {tool}
                      </div>
                  )}
              </motion.div>
          ))}
      </div>
    </div>
  );
}