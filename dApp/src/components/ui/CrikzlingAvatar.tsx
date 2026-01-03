import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Minimize2, Cpu, Settings, Info, Zap, ShieldCheck, Globe } from 'lucide-react';
import { useCrikzlingV3, AVAILABLE_MODELS } from '@/hooks/useCrikzlingV3';
import { GeometricCore } from './CrikzlingVisuals';

export default function CrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false); 
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage, isThinking, selectedModel, setSelectedModel } = useCrikzlingV3();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full glass-card border border-primary-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-110 transition-transform"
          >
            <div className="w-10 h-10"><GeometricCore state={isThinking ? 'thinking' : 'connected'} /></div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] h-[650px] flex flex-col rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl bg-[#0a0a0f]/98 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="h-20 bg-white/5 border-b border-white/10 flex items-center px-6 justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10"><GeometricCore state={isThinking ? 'thinking' : 'connected'} /></div>
                    <div>
                        <h3 className="text-white font-black text-sm tracking-tighter">NEURAL STATION</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-gray-400 font-mono uppercase">{selectedModel.provider} // {selectedModel.name}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-primary-500 text-black' : 'text-gray-500 hover:bg-white/5'}`}>
                        <Settings size={18} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500">
                        <Minimize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Station Settings (Model Selector) */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-20 inset-x-0 z-30 bg-[#0f0f16] border-b border-white/10 p-5 shadow-2xl">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-primary-500 uppercase mb-2 block tracking-widest">Switch AI Source</label>
                                <select 
                                    value={selectedModel.id}
                                    onChange={(e) => {
                                        const m = AVAILABLE_MODELS.find(x => x.id === e.target.value);
                                        if(m) setSelectedModel(m);
                                        setShowSettings(false);
                                    }}
                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-primary-500"
                                >
                                    <optgroup label="GROQ (Ultra Fast)">
                                        {AVAILABLE_MODELS.filter(m => m.provider === 'groq').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </optgroup>
                                    <optgroup label="OPENROUTER (Aggregator)">
                                        {AVAILABLE_MODELS.filter(m => m.provider === 'openrouter').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </optgroup>
                                    <optgroup label="GOOGLE (Native)">
                                        {AVAILABLE_MODELS.filter(m => m.provider === 'google').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <div className="flex items-center gap-2 text-white font-bold text-[11px] mb-1">
                                    <Info size={12} className="text-primary-500"/> Model Intelligence
                                </div>
                                <p className="text-[10px] text-gray-400 leading-relaxed">{selectedModel.description}</p>
                                <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-amber-500 font-mono">
                                    LIMITS: {selectedModel.limitInfo}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_0%,transparent_100%)]">
                {messages.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                            <Zap size={32} className="text-primary-500 opacity-50"/>
                        </div>
                        <h4 className="text-white font-black text-xs tracking-widest uppercase">Station Ready</h4>
                        <p className="text-[10px] text-gray-500 mt-2 px-10">Select a model from settings to begin a neural session.</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' ? 'bg-primary-500 text-black font-bold rounded-tr-none' : 
                            msg.role === 'system' ? 'bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono' :
                            'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 px-4 py-3 rounded-2xl flex gap-1.5 border border-white/5">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-6 bg-[#0a0a0f] border-t border-white/10">
                <div className="flex items-center gap-2 bg-white/5 rounded-2xl border border-white/10 px-3 py-1 focus-within:border-primary-500/50 transition-all">
                    <input 
                        type="text" value={input} onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={`Message ${selectedModel.name}...`}
                        disabled={isThinking}
                        className="flex-1 bg-transparent border-none text-white text-sm px-2 py-4 focus:outline-none disabled:cursor-not-allowed placeholder-gray-600"
                    />
                    <button onClick={handleSend} disabled={!input.trim() || isThinking} className="p-3 bg-primary-500 text-black rounded-xl hover:bg-primary-400 disabled:opacity-30 transition-all shadow-lg">
                        <Send size={18} />
                    </button>
                </div>
                <div className="flex justify-center gap-4 mt-4 opacity-20 grayscale">
                    <div className="flex items-center gap-1 text-[8px] font-bold text-white"><Globe size={8}/> WEB_SYNC</div>
                    <div className={`flex items-center gap-1 text-[8px] font-bold text-white`}><ShieldCheck size={8}/> {selectedModel.provider.toUpperCase()}_SECURE</div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}