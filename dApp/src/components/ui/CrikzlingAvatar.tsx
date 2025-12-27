import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Maximize2, Minimize2, Save, RefreshCw, Upload, 
  Terminal, X, ChevronDown, Database, Cpu, Sparkles 
} from 'lucide-react';
import { useCrikzlingV3 } from '@/hooks/useCrikzlingV3';
import { GeometricCore } from './CrikzlingVisuals';

export default function CrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false); // Collapsed by default
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    sendMessage, 
    crystallize, 
    needsSave, 
    isSyncing, 
    brainStats,
    isThinking,
    isTyping,
    currentThought,
    uploadFile,
    resetBrain,
    isOwner
  } = useCrikzlingV3();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping, currentThought]);

  const handleSend = async () => {
    if (!input.trim() || isThinking || isTyping) return;
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => uploadFile(e.target?.result as string);
      reader.readAsText(file);
    }
  };

  // Determine Visual State
  const coreState = isSyncing ? 'crystallizing' : isThinking ? 'thinking' : 'idle';

  return (
    <>
      {/* 1. COLLAPSED ORB MODE */}
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
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. EXPANDED INTERFACE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] flex flex-col rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl bg-[#0a0a0f]/90 backdrop-blur-xl"
          >
            
            {/* Header: Visual Core & Controls */}
            <div className="relative h-24 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12">
                        <GeometricCore state={coreState} />
                    </div>
                    <div>
                        <h3 className="text-white font-black tracking-wide text-lg">CRIKZLING</h3>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                            <div className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                            {isSyncing ? 'CRYSTALLIZING...' : isThinking ? 'PROCESSING...' : 'ONLINE'}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                        <Minimize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Cognitive Pipeline (Thinking Bar) */}
            {isThinking && currentThought && (
                <div className="bg-black/40 border-b border-amber-500/20 px-4 py-2">
                    <div className="flex justify-between text-[10px] text-amber-500 font-mono mb-1">
                        <span className="uppercase">{currentThought.phase}</span>
                        <span>{Math.round(currentThought.progress)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-amber-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${currentThought.progress}%` }}
                        />
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono mt-1 truncate">
                        {currentThought.subProcess}
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide relative"
            >
                {messages.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-30 pointer-events-none">
                        <Terminal size={40} className="mb-4 text-white" />
                        <p className="text-sm font-bold text-white">NEURAL LINK ESTABLISHED</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">I am ready to analyze production orders, simulate yield, or evolve my knowledge base.</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-primary-500 text-black font-medium rounded-tr-sm' 
                            : 'bg-white/10 text-gray-200 border border-white/5 rounded-tl-sm backdrop-blur-md'
                        }`}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}

                {isTyping && !isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 px-4 py-2 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions Panel (Memory Management) */}
            <div className="bg-[#0f0f13] border-t border-white/5 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" title="Concepts Learned">
                        <Database size={10} /> {brainStats.nodes}
                    </span>
                    <span className="flex items-center gap-1" title="Neural Connections">
                        <Cpu size={10} /> {brainStats.relations}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    {needsSave && (
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            onClick={crystallize}
                            disabled={isSyncing || !isOwner}
                            className="flex items-center gap-1 text-amber-500 hover:text-amber-400 disabled:opacity-50"
                        >
                            {isSyncing ? <RefreshCw size={10} className="animate-spin" /> : <Save size={10} />}
                            {isSyncing ? 'SAVING...' : 'CRYSTALLIZE'}
                        </motion.button>
                    )}
                    
                    {isOwner && (
                        <>
                            <label className="cursor-pointer hover:text-white transition-colors">
                                <Upload size={10} />
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                            </label>
                            <button onClick={resetBrain} className="hover:text-red-500 transition-colors">
                                <RefreshCw size={10} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0a0a0f] border-t border-white/10">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 px-2 py-1 focus-within:border-primary-500/50 transition-colors">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a command or query..."
                        disabled={isThinking || isSyncing}
                        className="flex-1 bg-transparent border-none text-white text-sm px-2 py-3 focus:outline-none placeholder-gray-600"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking}
                        className="p-2 bg-primary-500 text-black rounded-lg hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}