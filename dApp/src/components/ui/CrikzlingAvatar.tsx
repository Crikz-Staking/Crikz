// src/components/ui/CrikzlingAvatar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Upload, Save, Trash2, Database, ShieldAlert, FileText, Brain, X, Zap } from 'lucide-react';
import { useCrikzling } from '@/hooks/useCrikzling';

export default function CrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
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
  }, [messages]);

  const handleSend = () => {
      if(!input.trim()) return;
      sendMessage(input);
      setInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      const text = await file.text();
      uploadFile(text);
  };

  return (
    <>
      {/* 1. Notifications Bubble */}
      <div className="fixed bottom-24 right-6 z-[50] pointer-events-none space-y-2 flex flex-col items-end">
          <AnimatePresence>
              {notifications.map((note, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-black/80 backdrop-blur-md border border-primary-500/30 text-primary-500 text-[10px] px-3 py-1.5 rounded-l-full font-mono shadow-glow-sm flex items-center gap-2"
                  >
                      <Zap size={10} /> {note}
                  </motion.div>
              ))}
          </AnimatePresence>
      </div>

      {/* 2. Avatar Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 md:w-16 md:h-16 rounded-full bg-black border border-primary-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center overflow-hidden group hover:scale-105 transition-transform"
      >
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20"></div>
          {isOpen ? <X className="text-primary-500" /> : <Brain className={`text-primary-500 ${needsSave ? 'animate-pulse' : ''}`} size={32} />}
          
          {needsSave && !isOpen && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-black animate-ping"></span>
          )}
      </motion.button>

      {/* 3. Main Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-96 h-[500px] md:h-[600px] bg-[#0A0A0F]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[60] flex flex-col overflow-hidden ring-1 ring-primary-500/20"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
                <div>
                    <h3 className="font-black text-white text-sm tracking-wider">CRIKZLING CORE</h3>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                        <span className="text-[10px] text-gray-400 font-mono">
                            {isOwner ? 'ADMIN OVERRIDE' : 'NEURAL NET ACTIVE'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {needsSave && (
                        <button 
                            onClick={crystallize} 
                            disabled={isSyncing}
                            className="p-1.5 bg-primary-500/20 text-primary-500 rounded hover:bg-primary-500/30 transition-colors" 
                            title="Save Memory to Blockchain"
                        >
                            <Save size={16} className={isSyncing ? "animate-spin" : ""} />
                        </button>
                    )}
                    <button onClick={resetBrain} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs sm:text-sm">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
                        <Brain size={48} />
                        <p>Initializing Neural Pathways...</p>
                    </div>
                )}
                
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                            className={`max-w-[85%] p-3 rounded-2xl ${
                                m.sender === 'user' 
                                ? 'bg-white/10 text-white rounded-tr-sm' 
                                : 'bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded-tl-sm shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                            }`}
                        >
                            {m.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-black/40 flex gap-2 shrink-0">
                <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder={isOwner ? "Command the Crikzling..." : "Communicate with Protocol..."}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all placeholder:text-gray-600"
                />
                <button 
                    onClick={handleSend} 
                    disabled={!input.trim()}
                    className="p-2.5 bg-primary-500 rounded-xl text-black hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={18} strokeWidth={2.5}/>
                </button>
            </div>
            
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-primary-500/5 blur-[100px] rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}