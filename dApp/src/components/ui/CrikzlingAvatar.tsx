import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, MessageSquare } from 'lucide-react';
import { useCrikzling } from '@/hooks/useCrikzling';
import { Language } from '@/types';

export default function CrikzlingAvatar({ lang, dynamicColor }: { lang: Language, dynamicColor: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const { messages, sendMessage, isThinking } = useCrikzling(lang);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    return (
        <>
            {/* The Creature (Floating Orb) */}
            <motion.div
                className="fixed bottom-6 right-6 z-[60] cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
                animate={{ 
                    y: [0, -15, 0],
                    scale: [1, 1.05, 1],
                    filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
                }}
                transition={{ 
                    duration: 4, // 3 + 1 roughly based on Fib
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
            >
                {/* Body */}
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full blur-md opacity-50 animate-pulse" 
                         style={{ backgroundColor: dynamicColor }}></div>
                    
                    <div className="absolute inset-0 rounded-full border-2 border-white/20 bg-black/60 backdrop-blur-xl flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        {/* Eyes */}
                        <div className="flex gap-2">
                            <motion.div 
                                className="w-2 h-3 rounded-full bg-white"
                                animate={{ height: isThinking ? [2, 12, 2] : 12 }}
                                transition={{ duration: 0.5, repeat: isThinking ? Infinity : 0 }}
                            />
                            <motion.div 
                                className="w-2 h-3 rounded-full bg-white"
                                animate={{ height: isThinking ? [2, 12, 2] : 12 }}
                                transition={{ duration: 0.5, repeat: isThinking ? Infinity : 0, delay: 0.1 }}
                            />
                        </div>
                    </div>

                    {/* Notification Badge */}
                    {!isOpen && messages.length > 0 && (
                         <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-black">
                            {messages.length}
                         </div>
                    )}
                </div>
            </motion.div>

            {/* Chat Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
                        className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] glass-card rounded-3xl border border-white/10 z-[60] flex flex-col overflow-hidden shadow-2xl bg-[#0f0f12fa]"
                    >
                        {/* Header */}
                        <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-primary-500" />
                                <span className="font-black text-white tracking-wide">Crikzling</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.length === 0 && (
                                <div className="text-center text-xs text-gray-500 mt-10">
                                    <p>Initialize interaction sequence...</p>
                                </div>
                            )}
                            
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div 
                                        className={`max-w-[85%] p-3 text-sm rounded-2xl ${
                                            msg.sender === 'user' 
                                            ? 'bg-primary-500 text-black font-bold rounded-br-sm' 
                                            : 'bg-white/10 text-gray-200 border border-white/5 rounded-bl-sm'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {isThinking && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 px-4 py-2 rounded-full flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}/>
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}/>
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}/>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-white/10 bg-black/20">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); if(input.trim()) { sendMessage(input); setInput(''); } }}
                                className="flex gap-2"
                            >
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={lang === 'en' ? "Talk to Crikzling..." : "Fol me Crikzling..."}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary-500 outline-none transition-all placeholder:text-gray-600"
                                />
                                <button 
                                    type="submit"
                                    disabled={isThinking || !input.trim()}
                                    className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}