import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Minimize2, Save, Brain, Loader2, Cpu } from 'lucide-react';
import { useCrikzlingV3 } from '@/hooks/useCrikzlingV3';
import { GeometricCore } from './CrikzlingVisuals';

export default function CrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false); 
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, sendMessage, crystallize, needsSave, isSyncing, 
    brainStats, isThinking, loadProgress, isModelReady
  } = useCrikzlingV3();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loadProgress]);

  const handleSend = async () => {
    if (!input.trim() || isThinking || !isModelReady) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const coreState = isSyncing ? 'crystallizing' 
                  : isThinking ? 'thinking' 
                  : isModelReady ? 'connected'
                  : 'idle';

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full glass-card border border-primary-500/30 flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-110 transition-transform"
          >
            <div className="w-10 h-10">
               <GeometricCore state={coreState} />
            </div>
            {needsSave && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] flex flex-col rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl bg-[#0a0a0f]/95 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="h-16 bg-white/5 border-b border-white/5 flex items-center px-6 justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8"><GeometricCore state={coreState} /></div>
                    <div>
                        <h3 className="text-white font-black text-sm">CRIKZLING AI</h3>
                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            {isModelReady ? <span className="text-emerald-400">LLAMA-3 ONLINE</span> : <span className="text-amber-500">INITIALIZING...</span>}
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white">
                    <Minimize2 size={16} />
                </button>
            </div>

            {/* Loading Bar */}
            {!isModelReady && (
                <div className="px-6 py-4 bg-black/40 border-b border-white/5">
                    <div className="flex justify-between text-[10px] text-primary-500 font-bold mb-1 uppercase">
                        <span>Downloading Neural Weights</span>
                        <Loader2 size={10} className="animate-spin"/>
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono mb-2 truncate">{loadProgress}</div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-primary-500" 
                            layoutId="loader"
                            // Simple animation since we don't have exact % from string easily
                            animate={{ x: [-100, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 && isModelReady && (
                    <div className="text-center opacity-30 mt-20">
                        <Cpu size={40} className="mx-auto mb-2"/>
                        <p className="text-xs font-bold">SYSTEM READY</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary-500 text-black font-bold' : 'bg-white/10 text-gray-200'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 px-4 py-2 rounded-2xl flex gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-[#0a0a0f] border-t border-white/10">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 px-2 py-1">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={isModelReady ? "Ask Crikzling..." : "Loading Model..."}
                        disabled={!isModelReady || isThinking}
                        className="flex-1 bg-transparent border-none text-white text-sm px-2 py-3 focus:outline-none placeholder-gray-600 disabled:cursor-not-allowed"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || !isModelReady}
                        className="p-2 bg-primary-500 text-black rounded-lg hover:bg-primary-400 disabled:opacity-50 transition-all"
                    >
                        <Send size={16} />
                    </button>
                </div>
                {needsSave && (
                    <button onClick={crystallize} disabled={isSyncing} className="w-full mt-2 py-2 text-[10px] font-bold text-amber-500 bg-amber-500/10 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2">
                        <Save size={10} /> {isSyncing ? 'SAVING...' : 'CRYSTALLIZE MEMORY'}
                    </button>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}