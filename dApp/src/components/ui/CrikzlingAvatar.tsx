// src/components/ui/CrikzlingAvatar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Upload, Save, Trash2, Database, ShieldAlert, FileText, Brain } from 'lucide-react';
import { useCrikzling } from '@/hooks/useCrikzling';

export default function CrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
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
      {/* 1. Floating Notifications (Background Layer) */}
      <div className="fixed bottom-24 right-6 z-[50] pointer-events-none space-y-2 flex flex-col items-end">
          <AnimatePresence>
              {notifications.map((note, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-black/60 backdrop-blur-md border border-primary-500/30 text-primary-500 text-[10px] px-3 py-1.5 rounded-l-full font-mono shadow-glow-sm"
                  >
                      {note}
                  </motion.div>
              ))}
          </AnimatePresence>
      </div>

      {/* 2. Avatar Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] w-16 h-16 rounded-full bg-black border border-primary-500 shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center overflow-hidden"
        whileHover={{ scale: 1.1 }}
      >
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20"></div>
          <Brain className={`text-primary-500 ${needsSave ? 'animate-pulse' : ''}`} size={32} />
          {needsSave && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-black"></span>
          )}
      </motion.button>

      {/* 3. Main Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-[#0A0A0F] border border-white/10 rounded-2xl shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div>
                    <h3 className="font-black text-white text-sm">CRIKZLING CORE</h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                        <span className="text-[10px] text-gray-400">Online • {isOwner ? 'ADMIN MODE' : 'User Mode'}</span>
                    </div>
                </div>
                {isOwner && (
                    <button onClick={() => setShowAdmin(!showAdmin)} className="p-2 hover:bg-white/10 rounded-lg">
                        <Database size={16} className="text-primary-500"/>
                    </button>
                )}
            </div>

            {/* Admin Panel (Owner Only) */}
            <AnimatePresence>
                {showAdmin && isOwner && (
                    <motion.div 
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="bg-black/80 border-b border-primary-500/20 overflow-hidden"
                    >
                        <div className="p-3 grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 p-2 rounded text-[10px] border border-white/10"
                            >
                                <Upload size={12}/> Train (Upload File)
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".txt,.md,.json"/>
                            
                            <button 
                                onClick={resetBrain}
                                className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded text-[10px] border border-red-500/20"
                            >
                                <Trash2 size={12}/> Format Memory
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
                {messages.length === 0 && (
                    <div className="text-center text-gray-600 mt-20">
                        <Brain size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>Awaiting input...</p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl ${m.sender === 'user' ? 'bg-white/10 text-white' : 'bg-primary-500/10 text-primary-500 border border-primary-500/20'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                
                {/* Crystallization Prompt */}
                {needsSave && (
                    <div className="flex justify-center my-4">
                        <button 
                            onClick={crystallize}
                            disabled={isSyncing}
                            className="bg-primary-500 text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-primary-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-bounce"
                        >
                            <Save size={14} /> 
                            {isSyncing ? 'Crystallizing...' : 'Crystallize Memory (Pay Gas)'}
                        </button>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-black/40 flex gap-2">
                <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder={isOwner ? "Teach me purpose..." : "Communicate..."}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary-500/50"
                />
                <button onClick={handleSend} className="p-2 bg-primary-500 rounded-lg text-black hover:bg-primary-400">
                    <Send size={18}/>
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}