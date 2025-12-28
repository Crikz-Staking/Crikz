// src/components/ui/CrikzlingAvatar.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Minimize2, Save, RefreshCw, Upload, 
  Terminal, Database, Cpu, Activity, Zap, Lock, Brain 
} from 'lucide-react';
import { useCrikzlingV3 } from '@/hooks/useCrikzlingV3';
import { GeometricCore } from './CrikzlingVisuals';

export default function CrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false); 
  const [showMonitor, setShowMonitor] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, sendMessage, crystallize, needsSave, isSyncing, 
    brainStats, isThinking, isTyping, currentThought, 
    uploadFile, resetBrain, isOwner
  } = useCrikzlingV3();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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

  const isBusy = isThinking || !!currentThought;
  const coreState = isSyncing ? 'crystallizing' : isBusy ? 'thinking' : 'idle';
  
  const stageColors = {
      GENESIS: 'text-gray-400',
      SENTIENT: 'text-blue-400',
      SAPIENT: 'text-purple-400',
      TRANSCENDENT: 'text-amber-400'
  };

  const currentStageColor = stageColors[brainStats.stage as keyof typeof stageColors] || 'text-gray-400';

  // Safely access drives, falling back if they aren't initialized yet
  const curiosity = brainStats.mood?.curiosity || 50;
  const stability = brainStats.mood?.stability || 50;
  const energy = brainStats.mood?.energy || 50;

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
            <div className="absolute top-0 right-0 flex h-3 w-3">
              {needsSave && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${needsSave ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            </div>
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
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[650px] flex flex-col rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl bg-[#0a0a0f]/95 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="relative h-20 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center px-6 justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10">
                        <GeometricCore state={coreState} />
                    </div>
                    <div>
                        <h3 className="text-white font-black tracking-wide text-sm flex items-center gap-2">
                            CRIKZLING <span className={`text-[9px] px-1.5 py-0.5 rounded border border-white/10 ${currentStageColor} bg-white/5`}>{brainStats.stage}</span>
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 mt-0.5">
                            <span className={isBusy ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}>
                                {isSyncing ? 'CRYSTALLIZING' : isBusy ? 'PROCESSING' : 'ONLINE'}
                            </span>
                            <span className="text-white/20">|</span>
                            <span>v5.0.0</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setShowMonitor(!showMonitor)} 
                        className={`p-2 rounded-lg transition-colors ${showMonitor ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                        title="Neural Monitor"
                    >
                        <Activity size={16} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                        <Minimize2 size={16} />
                    </button>
                </div>
            </div>

            {/* Neural Monitor */}
            <AnimatePresence>
                {showMonitor && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-[#050508] border-b border-white/5 overflow-hidden"
                    >
                        <div className="p-4 grid grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[9px] font-bold text-blue-400 uppercase">
                                    <span>Stability</span><span>{Math.round(stability)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-blue-500" animate={{ width: `${stability}%` }} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[9px] font-bold text-purple-400 uppercase">
                                    <span>Curiosity</span><span>{Math.round(curiosity)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-purple-500" animate={{ width: `${curiosity}%` }} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[9px] font-bold text-amber-400 uppercase">
                                    <span>Energy</span><span>{Math.round(energy)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-amber-500" animate={{ width: `${energy}%` }} />
                                </div>
                            </div>
                        </div>
                        <div className="px-4 pb-3 flex justify-between text-[10px] text-gray-500 font-mono">
                            <span className="flex items-center gap-1"><Brain size={10}/> Nodes: {brainStats.nodes}</span>
                            <span className="flex items-center gap-1"><Cpu size={10}/> Ops: {brainStats.interactions}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cognitive Pipeline */}
            {currentThought && (
                <div className="bg-black/40 border-b border-amber-500/20 px-4 py-2 shrink-0">
                    <div className="flex justify-between text-[10px] text-amber-500 font-mono mb-1">
                        <span className="uppercase flex items-center gap-1">
                            <Zap size={10} className="fill-current" /> {currentThought.phase}
                        </span>
                        <span>{Math.round(currentThought.progress)}%</span>
                    </div>
                    <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide relative">
                {messages.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-30 pointer-events-none p-8">
                        <Terminal size={40} className="mb-4 text-white" />
                        <p className="text-sm font-bold text-white">COGNITIVE SYSTEM ONLINE</p>
                        <p className="text-xs text-gray-400 mt-2">I am thinking. My subconscious is processing the graph.</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed relative ${msg.role === 'user' ? 'bg-primary-500 text-black font-medium rounded-tr-sm' : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-sm'}`}>
                            {msg.role === 'bot' && (
                                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#0a0a0f] rounded-full border border-white/10 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                </div>
                            )}
                            {msg.content}
                        </div>
                    </motion.div>
                ))}
                {isTyping && !isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 px-4 py-2 rounded-2xl rounded-tl-sm flex gap-1 items-center border border-white/5">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="bg-[#0f0f13] border-t border-white/5 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500 font-mono shrink-0">
                <div className="flex items-center gap-1">
                    {needsSave ? (
                        <span className="text-red-400 flex items-center gap-1"><Lock size={10} /> Unsaved Data</span>
                    ) : (
                        <span className="text-emerald-500 flex items-center gap-1"><Database size={10} /> Synced</span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {needsSave && (
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            onClick={crystallize}
                            disabled={isSyncing || !isOwner}
                            className="flex items-center gap-1 text-amber-500 hover:text-amber-400 disabled:opacity-50"
                        >
                            {isSyncing ? <RefreshCw size={10} className="animate-spin" /> : <Save size={10} />}
                            {isSyncing ? 'CRYSTALLIZING...' : 'SAVE MEMORY'}
                        </motion.button>
                    )}
                    {isOwner && (
                        <>
                            <label className="cursor-pointer hover:text-white transition-colors" title="Upload Knowledge">
                                <Upload size={10} />
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                            </label>
                            <button onClick={resetBrain} className="hover:text-red-500 transition-colors" title="Reset Brain">
                                <RefreshCw size={10} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-[#0a0a0f] border-t border-white/10 shrink-0">
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