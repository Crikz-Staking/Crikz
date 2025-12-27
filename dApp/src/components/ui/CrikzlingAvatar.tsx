// src/components/ui/CrikzlingAvatar.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Save, Trash2, Brain, ChevronDown, Activity, 
  Network, Lightbulb, Paperclip, Cpu, Zap, Database, AlertCircle
} from 'lucide-react';
import { useCrikzling } from '@/hooks/useCrikzling';

export default function CrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    messages, 
    sendMessage, 
    uploadFile, 
    crystallize, 
    resetBrain, 
    needsSave, 
    isOwner, 
    isSyncing, 
    brainStats,
    isThinking,
    currentThought
  } = useCrikzling();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isOpen]);

  const handleSend = async () => {
    if(!input.trim() || isThinking) return;
    const userText = input;
    setInput('');
    await sendMessage(userText);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const text = await file.text();
    uploadFile(text);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getThoughtPhaseDisplay = () => {
    if (!currentThought) return null;
    
    const phases = {
      analyzing: { icon: Brain, label: 'Analyzing', color: '#3B82F6' },
      planning: { icon: Network, label: 'Planning', color: '#F59E0B' },
      calculating: { icon: Cpu, label: 'Calculating', color: '#10B981' },
      synthesizing: { icon: Zap, label: 'Synthesizing', color: '#A78BFA' }
    };

    const phase = phases[currentThought.phase];
    const Icon = phase.icon;

    return (
      <div className="flex flex-col gap-2 px-3 py-2 bg-black/40 rounded-lg border border-white/10">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: phase.color }} className="animate-pulse" />
          <span className="text-xs font-bold text-gray-300">{phase.label}</span>
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden ml-2">
            <motion.div 
              className="h-full rounded-full"
              style={{ backgroundColor: phase.color }}
              initial={{ width: 0 }}
              animate={{ width: `${currentThought.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-mono">{currentThought.progress}%</span>
        </div>
        {currentThought.subProcess && (
          <div className="text-[10px] text-gray-400 italic pl-5">
            {currentThought.subProcess}
          </div>
        )}
      </div>
    );
  };

  const StatBar = ({ label, value, color, icon: Icon }: any) => (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold tracking-wider">
        <span className="flex items-center gap-1"><Icon size={10} /> {label}</span>
        <span>{Math.round(value || 0)}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${value || 0}%` }} 
          className="h-full rounded-full" 
          style={{ backgroundColor: color }} 
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Floating Avatar Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#050505] border border-white/10 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
        
        {/* Pulsing Ring for Crystallization Alert */}
        {needsSave && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-amber-500"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <ChevronDown className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="brain" className="relative">
              <Brain 
                className={`text-primary-500 ${needsSave ? 'animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : ''}`} 
                size={28} 
              />
              {needsSave && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black animate-ping" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            className="fixed bottom-24 right-6 z-[100] w-[calc(100vw-3rem)] md:w-[420px] max-h-[70vh] flex flex-col glass-card border-white/10 overflow-hidden shadow-2xl shadow-black/50"
          >
            {/* Header with Stats */}
            <div className="p-4 bg-white/5 border-b border-white/5 relative z-20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Crikzling Neural Core 
                    <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-[10px] uppercase">
                      {brainStats.stage}
                    </span>
                  </h3>
                  <div className="flex gap-4 mt-1">
                    <span className="text-[10px] text-gray-500 font-medium">
                      Concepts: <span className="text-white">{brainStats.nodes}</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      Relations: <span className="text-white">{brainStats.relations}</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      Unsaved: <span className={needsSave ? "text-amber-500 font-bold" : "text-gray-400"}>
                        {brainStats.unsaved}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1">
                    <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                      <Database size={10} /> 
                      STM: {brainStats.memories?.short || 0} | 
                      MTM: {brainStats.memories?.mid || 0} | 
                      LTM: {brainStats.memories?.long || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mood Stats */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <StatBar label="Logic" value={brainStats.mood.logic} color="#3B82F6" icon={Cpu} />
                <StatBar label="Empathy" value={brainStats.mood.empathy} color="#EC4899" icon={Activity} />
                <StatBar label="Curiosity" value={brainStats.mood.curiosity} color="#F59E0B" icon={Lightbulb} />
                <StatBar label="Entropy" value={brainStats.mood.entropy} color="#10B981" icon={Network} />
              </div>
            </div>

            {/* Crystallization Alert Banner - FIXED: Now shows in chat window */}
            <AnimatePresence>
              {needsSave && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="relative z-10 w-full bg-gradient-to-r from-amber-600 to-orange-600 shadow-xl overflow-hidden"
                >
                  <div className="flex justify-between items-center p-3">
                    <div className="flex items-center gap-2 text-white">
                      <AlertCircle size={16} className="animate-pulse flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-tight">
                          Memory Crystallization Ready
                        </span>
                        <span className="text-[10px] opacity-80">
                          {brainStats.unsaved} new concepts need permanent storage
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        crystallize(); 
                      }}
                      disabled={isSyncing}
                      className="bg-white text-orange-600 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-black hover:text-white transition-all shadow-lg flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
                    >
                      {isSyncing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          SYNCING...
                        </>
                      ) : (
                        <>
                          <Save size={12} />
                          SAVE NOW
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide min-h-[300px] relative z-0">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-20 text-center p-8">
                  <Brain size={48} className="mb-4" />
                  <p className="text-sm">Neural pathways initialized. Awaiting input...</p>
                </div>
              )}
              
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary-500 text-black font-medium rounded-tr-none shadow-[0_4px_12px_rgba(245,158,11,0.2)]' 
                      : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex flex-col gap-3 justify-start">
                  {getThoughtPhaseDisplay()}
                  <div className="bg-white/5 px-3 py-2 rounded-2xl rounded-tl-none border border-white/5">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-white/5 relative z-20">
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".txt"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title="Upload training data"
                >
                  <Paperclip size={18} />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isOwner ? "Interact with Crikzling..." : "Ask me anything..."}
                    disabled={isThinking}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary-500/50 transition-all pr-10 disabled:opacity-50"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isThinking}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500 disabled:text-gray-600 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>

                {isOwner && (
                  <button 
                    onClick={resetBrain}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                    title="Wipe Memory"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}