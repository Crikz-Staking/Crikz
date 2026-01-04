import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Minimize2, Settings, Info, Zap, ShieldCheck, Globe, Mail, Trash2, MessageSquare } from 'lucide-react';
import { useCrikzlingV3, AVAILABLE_MODELS } from '@/hooks/useCrikzlingV3';
import { GeometricCore } from './CrikzlingVisuals';
import { toast } from 'react-hot-toast';

export default function CrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false); 
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage, isThinking, selectedModel, setSelectedModel, clearHistory } = useCrikzlingV3();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleEmailSupport = () => {
      if (messages.length === 0) {
          toast.error("No chat history to send.");
          return;
      }

      const transcript = messages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      const subject = encodeURIComponent("Crikz Protocol - Live Chat Transcript");
      const body = encodeURIComponent(`User ID: Anonymous\n\n--- CHAT TRANSCRIPT ---\n\n${transcript}`);
      
      window.location.href = `mailto:etritcocaj@proton.me?subject=${subject}&body=${body}`;
      toast.success("Opening email client...");
  };

  return (
    <>
      {/* Floating Trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -90 }} 
            animate={{ scale: 1, rotate: 0 }} 
            exit={{ scale: 0, rotate: 90 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full glass-card border border-primary-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-110 transition-transform bg-black/80 backdrop-blur-md"
          >
            <div className="w-10 h-10"><GeometricCore state={isThinking ? 'thinking' : 'connected'} /></div>
            {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border border-black" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] z-[60] bg-[#0a0a0f]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="h-20 bg-black/40 border-b border-white/10 flex items-center px-6 justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10"><GeometricCore state={isThinking ? 'thinking' : 'connected'} /></div>
                    <div>
                        <h3 className="text-white font-black text-sm tracking-widest uppercase">Crikzling AI</h3>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-primary-500 animate-ping' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] text-gray-400 font-mono uppercase">{isThinking ? 'PROCESSING...' : 'ONLINE'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-primary-500 text-black' : 'text-gray-500 hover:bg-white/5'}`}>
                        <Settings size={18} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white">
                        <Minimize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Settings Panel Overlay */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        className="bg-[#12121a] border-b border-white/10 overflow-hidden"
                    >
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-primary-500 uppercase mb-2 block tracking-widest">Neural Model</label>
                                <select 
                                    value={selectedModel.id}
                                    onChange={(e) => {
                                        const m = AVAILABLE_MODELS.find(x => x.id === e.target.value);
                                        if(m) setSelectedModel(m);
                                    }}
                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-primary-500"
                                >
                                    {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            
                            <div className="flex gap-2">
                                <button onClick={handleEmailSupport} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-gray-300 flex items-center justify-center gap-2">
                                    <Mail size={14}/> Email Transcript
                                </button>
                                <button onClick={clearHistory} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-bold text-red-400 flex items-center justify-center gap-2">
                                    <Trash2 size={14}/> Clear Chat
                                </button>
                            </div>

                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <div className="flex items-center gap-2 text-white font-bold text-[11px] mb-1">
                                    <Info size={12} className="text-primary-500"/> Model Info
                                </div>
                                <p className="text-[10px] text-gray-400 leading-relaxed">{selectedModel.description}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <div 
                ref={scrollRef} 
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_0%,transparent_100%)]"
            >
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <MessageSquare size={48} className="text-primary-500 mb-4" />
                        <h4 className="text-white font-bold text-sm">How can I assist you?</h4>
                        <p className="text-[10px] text-gray-400 mt-2 max-w-[200px]">Ask about the protocol, your orders, or blockchain concepts.</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative ${
                            msg.role === 'user' 
                            ? 'bg-primary-500 text-black font-medium rounded-tr-none' 
                            : msg.role === 'system' 
                                ? 'bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono w-full text-center'
                                : 'bg-[#1a1a24] text-gray-200 border border-white/10 rounded-tl-none'
                        }`}>
                            {msg.content}
                            <div className={`text-[9px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-black' : 'text-gray-500'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    </motion.div>
                ))}
                
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-[#1a1a24] px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 border border-white/10 items-center">
                            <span className="text-[10px] text-gray-500 font-bold mr-2">THINKING</span>
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0a0a0f] border-t border-white/10">
                <div className="flex items-center gap-2 bg-[#1a1a24] rounded-2xl border border-white/10 px-2 py-2 focus-within:border-primary-500/50 transition-all shadow-lg">
                    <input 
                        type="text" value={input} onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your query..."
                        disabled={isThinking}
                        className="flex-1 bg-transparent border-none text-white text-sm px-3 py-2 focus:outline-none disabled:cursor-not-allowed placeholder-gray-600"
                    />
                    <button 
                        onClick={handleSend} 
                        disabled={!input.trim() || isThinking} 
                        className="p-3 bg-primary-500 text-black rounded-xl hover:bg-primary-400 disabled:opacity-30 transition-all shadow-lg hover:scale-105 active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="flex justify-between items-center mt-3 px-2">
                    <div className="flex items-center gap-1 text-[8px] font-bold text-gray-600">
                        <Globe size={8}/> LIVE_NET
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-bold text-gray-600">
                        <ShieldCheck size={8}/> ENCRYPTED
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}