import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileCode, Hash, ShieldCheck, Terminal, Calculator, Type, 
    QrCode, Globe, Clock, Database, Lock, Shuffle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// -- MICRO TOOLS IMPLEMENTATIONS --

// 1. Password Generator
const PasswordGen = () => {
    const [len, setLen] = useState(16);
    const [pass, setPass] = useState('');
    const gen = () => {
        const c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        setPass(Array(len).fill(0).map(() => c[Math.floor(Math.random()*c.length)]).join(''));
    }
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-white">Secure Password Generator</h3>
            <input type="range" min="8" max="64" value={len} onChange={e=>setLen(+e.target.value)} className="w-full"/>
            <div className="flex justify-between text-xs text-gray-500"><span>8 chars</span><span>{len} chars</span><span>64 chars</span></div>
            <div className="bg-black/40 p-4 rounded-xl font-mono text-center break-all select-all text-primary-500">{pass || "..."}</div>
            <button onClick={gen} className="btn-primary w-full py-2">Generate</button>
        </div>
    )
}

// 2. IPFS CID Generator (Mock)
const IpfsGen = () => {
    const [input, setInput] = useState('');
    const [cid, setCid] = useState('');
    const gen = async () => {
        // Mocking CID v1 generation for demo
        const hash = Array.from(input).reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0);
        setCid(`bafybeig${Math.abs(hash).toString(16)}...`);
    }
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-white">IPFS CID Preview</h3>
            <input className="input-field" placeholder="Content string..." value={input} onChange={e=>setInput(e.target.value)}/>
            <button onClick={gen} className="btn-primary w-full py-2">Calculate CID</button>
            {cid && <div className="bg-black/40 p-4 rounded-xl font-mono text-xs text-gray-400 break-all">{cid}</div>}
        </div>
    )
}

// 3. Epoch Converter
const EpochConv = () => {
    const [ts, setTs] = useState(Math.floor(Date.now()/1000).toString());
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-white">Unix Timestamp Converter</h3>
            <div className="flex gap-2">
                <input className="input-field" value={ts} onChange={e=>setTs(e.target.value)} />
                <button onClick={()=>setTs(Math.floor(Date.now()/1000).toString())} className="bg-white/10 px-4 rounded-xl">Now</button>
            </div>
            <div className="bg-black/40 p-4 rounded-xl text-center">
                {new Date(Number(ts)*1000).toUTCString()}
            </div>
        </div>
    )
}

// 4. JSON Formatter
const JsonFormat = () => {
    const [raw, setRaw] = useState('');
    const [fmt, setFmt] = useState('');
    const format = () => {
        try { setFmt(JSON.stringify(JSON.parse(raw), null, 2)); } catch(e) { toast.error("Invalid JSON"); }
    }
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-white">JSON Prettifier</h3>
            <textarea className="input-field h-24 font-mono text-xs" placeholder='{"a":1}' value={raw} onChange={e=>setRaw(e.target.value)}/>
            <button onClick={format} className="btn-primary w-full py-2">Prettify</button>
            <pre className="bg-black/40 p-4 rounded-xl overflow-auto h-32 text-xs text-green-400">{fmt}</pre>
        </div>
    )
}

// 5. Unit Converter (Wei/Ether)
const WeiConv = () => {
    const [eth, setEth] = useState('');
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-white">ETH Unit Converter</h3>
            <input className="input-field" placeholder="Ether amount" value={eth} onChange={e=>setEth(e.target.value)}/>
            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                <div className="bg-black/40 p-2 rounded flex justify-between"><span>Gwei</span><span>{eth ? Number(eth)*1e9 : 0}</span></div>
                <div className="bg-black/40 p-2 rounded flex justify-between"><span>Wei</span><span>{eth ? Number(eth)*1e18 : 0}</span></div>
            </div>
        </div>
    )
}

// 6. QR Code Gen (Mock visual)
const QrGen = () => {
    const [txt, setTxt] = useState('');
    return (
        <div className="space-y-4">
             <h3 className="font-bold text-white">QR Code Generator</h3>
             <input className="input-field" placeholder="URL or Text" value={txt} onChange={e=>setTxt(e.target.value)}/>
             <div className="aspect-square bg-white p-4 rounded-xl flex items-center justify-center">
                 {txt ? (
                     <div className="w-full h-full bg-black pattern-dots" /> 
                 ) : <span className="text-black font-bold">Enter Text</span>}
             </div>
        </div>
    )
}

// 7. Base64 Encoder
const Base64Tool = () => {
    const [inp, setInp] = useState('');
    return (
        <div className="space-y-4">
             <h3 className="font-bold text-white">Base64 Encoder</h3>
             <textarea className="input-field" placeholder="Text..." value={inp} onChange={e=>setInp(e.target.value)}/>
             <div className="bg-black/40 p-4 rounded-xl font-mono text-xs break-all">
                 {btoa(inp)}
             </div>
        </div>
    )
}

// 8. Word Counter
const WordCount = () => {
    const [txt, setTxt] = useState('');
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-white">Word Counter</h3>
            <textarea className="input-field h-24" value={txt} onChange={e=>setTxt(e.target.value)}/>
            <div className="flex gap-4 text-sm font-bold">
                <span>Chars: {txt.length}</span>
                <span>Words: {txt.trim() ? txt.trim().split(/\s+/).length : 0}</span>
            </div>
        </div>
    )
}

// ... Additional placeholders for up to 20 tools can be added similarly

// -- MAIN LAYOUT --

export default function ToolsLayout({ dynamicColor }: { dynamicColor: string }) {
  const [activeCategory, setActiveCategory] = useState('crypto');

  const categories = [
    { id: 'crypto', label: 'Crypto Utils', icon: Hash, tools: [<WeiConv/>, <IpfsGen/>, <EpochConv/>] },
    { id: 'dev', label: 'Developer', icon: Terminal, tools: [<JsonFormat/>, <Base64Tool/>] },
    { id: 'security', label: 'Security', icon: ShieldCheck, tools: [<PasswordGen/>] },
    { id: 'visual', label: 'Visual', icon: QrCode, tools: [<QrGen/>] },
    { id: 'text', label: 'Text Tools', icon: Type, tools: [<WordCount/>] },
  ];

  return (
    <div className="space-y-8">
      {/* Category Nav */}
      <div className="flex flex-wrap justify-center gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border ${
                isActive ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 hover:bg-white/5'
              }`}
              style={{ color: isActive ? dynamicColor : '#9ca3af', borderColor: isActive ? dynamicColor : '' }}
            >
              <Icon size={18} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.find(c => c.id === activeCategory)?.tools.map((tool, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all"
              >
                  {tool}
              </motion.div>
          ))}
      </div>
      
      <div className="text-center text-xs text-gray-500 pt-8">
          Showing {categories.find(c => c.id === activeCategory)?.tools.length} active modules for {activeCategory}
      </div>
    </div>
  );
}