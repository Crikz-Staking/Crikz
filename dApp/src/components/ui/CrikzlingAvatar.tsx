// src/components/ui/CrikzlingAvatar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Save, Trash2, Brain, X, Zap, Cpu, Paperclip, ChevronDown } from 'lucide-react';
import { useCrikzling } from '@/hooks/useCrikzling';
import LoadingSpinner from './LoadingSpinner';

export default function CrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
      messages, 
      notifications, 
      sendMessage, 
      uploadFile, 
      crystallize, 
      resetBrain, 
      needsSave, 
      isOwner,
      isSyncing
  } = useCrikzling();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

useEffect(() => {
    const interval = setInterval(() => {
        if(brainRef.current) {
            const newLogs = brainRef.current.getLearningBuffer();
            if(newLogs.length > 0) {
                 setNotifications(prev => [...prev, ...newLogs].slice(-5));
            }
            // Force React to re-render the button state
            setNeedsSave(brainRef.current.needsCrystallization());
        }
    }, 1000); // Check every 1 second (faster than 2000)

    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
      if(!input.trim()) return;
      
      const userText = input;
      setInput('');
      setIsTyping(true);
      
      // Send to hook
      await sendMessage(userText);
      
      // Stop typing simulation after response is received (hook handles state, but we simulate delay here visually if needed)
      setTimeout(() => setIsTyping(false), 800); 
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      const text = await file.text();
      uploadFile(text);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {/* 1. Notifications Bubble (Floating above avatar) */}
      <div className="fixed bottom-24 right-6 z-[90] pointer-events-none space-y-2 flex flex-col items-end">
          <AnimatePresence>
              {notifications.map((note, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-black/90 backdrop-blur-xl border border-primary-500/40 text-primary-400 text-[10px] px-4 py-2 rounded-xl font-mono shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center gap-2"
                  >
                      <Zap size={12} className="text-yellow-400 fill-yellow-400" /> 
                      {note}
                  </motion.div>
              ))}
          </AnimatePresence>
      </div>

      {/* 2. Avatar Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#050505] border border-white/10 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center overflow-hidden group"
      >
          {/* Living Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          
          {/* Icon State */}
          <AnimatePresence mode="wait">
            {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <ChevronDown className="text-white" />
                </motion.div>
            ) : (
                <motion.div key="brain" className="relative">
                    <Brain className={`text-primary-500 ${needsSave ? 'animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : ''}`} size={28} />
                    {needsSave && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black animate-ping" />
                    )}
                </motion.div>
            )}
          </AnimatePresence>
      </motion.button>

      {/* 3. Main Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="fixed bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-[400px] h-[600px] max-h-[80vh] bg-[#0A0A0F]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-[100] flex flex-col overflow-hidden ring-1 ring-white/5"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                        <Cpu size={16} className="text-primary-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm tracking-wide">CRIKZLING <span className="text-[9px] text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20 ml-1">BETA</span></h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_#10B981] animate-pulse"/>
                            <span className="text-[10px] text-gray-400 font-mono uppercase">
                                {isOwner ? 'Admin Access' : 'Online'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-1">
                    <button 
                        onClick={resetBrain} 
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                        title="Reset Memory"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Crystallization Banner (Shows when save is needed) */}
            <AnimatePresence>
                {needsSave && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-primary-900/20 border-b border-primary-500/20 overflow-hidden"
                    >
                        <div className="p-3 flex items-center justify-between">
                            <div className="text-xs text-primary-200">
                                <span className="font-bold">Memory Buffer Full.</span>
                                <span className="block opacity-70">Save learnings to blockchain?</span>
                            </div>
                            <button 
                                onClick={crystallize}
                                disabled={isSyncing}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-400 text-black text-xs font-bold rounded-lg transition-colors shadow-lg shadow-primary-500/20"
                            >
                                {isSyncing ? <LoadingSpinner size={12} color="#000" /> : <Save size={12} />}
                                {isSyncing ? 'Saving...' : 'Crystallize'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-40">
                        <Cpu size={64} strokeWidth={1} />
                        <p className="font-mono text-xs">Awaiting Neural Input...</p>
                    </div>
                )}
                
                {messages.map((m, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                                m.sender === 'user' 
                                ? 'bg-white/10 text-white rounded-tr-sm border border-white/5' 
                                : 'bg-gradient-to-br from-primary-500/10 to-transparent text-primary-100 border border-primary-500/20 rounded-tl-sm shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                            }`}
                        >
                            <span className="block font-mono text-[9px] opacity-50 mb-1 uppercase tracking-wider">
                                {m.sender === 'user' ? 'You' : 'Crikzling'}
                            </span>
                            {m.text}
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-black/40 backdrop-blur-xl shrink-0">
                {/* Admin Toolbar (Only Visible if Owner) */}
                {isOwner && (
                    <div className="flex gap-2 mb-2 px-1">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] flex items-center gap-1.5 text-gray-500 hover:text-primary-400 transition-colors uppercase font-bold tracking-wider"
                        >
                            <Paperclip size={12} /> Upload Training Data
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".txt,.md,.json" 
                            onChange={handleFileUpload} 
                        />
                    </div>
                )}

                <div className="flex gap-2 relative">
                    <input 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder={isOwner ? "Command parameters..." : "Ask the Protocol..."}
                        className="flex-1 bg-[#15151A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary-500/50 focus:bg-white/5 transition-all placeholder:text-gray-600 font-mono"
                        disabled={isSyncing}
                    />
                    <button 
                        onClick={handleSend} 
                        disabled={!input.trim() || isSyncing}
                        className="p-3 bg-white text-black rounded-xl hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-primary-500/50"
                    >
                        <Send size={18} strokeWidth={2.5}/>
                    </button>
                </div>
            </div>
            
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden rounded-3xl">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-500/5 blur-[100px] rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}