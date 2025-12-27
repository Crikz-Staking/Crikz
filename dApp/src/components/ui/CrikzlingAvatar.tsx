'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Brain as BrainIcon, 
  Sparkles, 
  Database, 
  Cpu, 
  Activity, 
  Save, 
  RefreshCw,
  Upload,
  Zap
} from 'lucide-react';
import { useCrikzling } from '@/hooks/useCrikzling';
import { ThoughtProcess } from '@/lib/crikzling-evolutionary-brain-v2-enhanced';

// --- SUB-COMPONENT: THOUGHT VISUALIZER ---
const ThoughtVisualizer = ({ thought }: { thought: ThoughtProcess | null }) => {
  if (!thought) return null;

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'analyzing': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'planning': return <BrainIcon className="w-4 h-4 text-purple-400" />;
      case 'calculating': return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'synthesizing': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'reviewing': return <Zap className="w-4 h-4 text-cyan-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getProgressColor = (phase: string) => {
    switch (phase) {
      case 'analyzing': return 'bg-blue-500';
      case 'planning': return 'bg-purple-500';
      case 'calculating': return 'bg-emerald-500';
      case 'synthesizing': return 'bg-amber-500';
      default: return 'bg-cyan-500';
    }
  };

  return (
    <div className="mx-4 my-2 p-3 rounded-lg bg-black/40 border border-primary-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-1.5 rounded-full bg-white/5 animate-pulse`}>
          {getPhaseIcon(thought.phase)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-primary-200 uppercase tracking-wider">
              {thought.phase}
            </span>
            <span className="text-[10px] text-primary-400/60 font-mono">
              {Math.round(thought.progress)}%
            </span>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressColor(thought.phase)}`}
              style={{ width: `${thought.progress}%` }}
            />
          </div>
        </div>
      </div>
      
      {thought.subProcess && (
        <div className="flex items-center gap-2 pl-9">
          <div className="w-1 h-1 rounded-full bg-primary-500/50" />
          <span className="text-xs text-primary-300/80 font-mono italic">
            {thought.subProcess}...
          </span>
        </div>
      )}

      {thought.focus && thought.focus.length > 0 && (
        <div className="mt-2 pl-9 flex flex-wrap gap-1">
          {thought.focus.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/10">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: MESSAGE BUBBLE ---
const MessageBubble = ({ msg, isLatest }: { msg: any, isLatest: boolean }) => {
  const isBot = msg.role === 'bot';
  
  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} mb-4 animate-in fade-in slide-in-from-bottom-1`}>
      <div className={`
        max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isBot 
          ? 'bg-black/40 border border-white/5 text-gray-100 rounded-tl-sm shadow-[0_0_15px_rgba(0,0,0,0.2)]' 
          : 'bg-primary-600/20 border border-primary-500/20 text-white rounded-tr-sm'
        }
      `}>
        {isBot && (
          <div className="flex items-center gap-2 mb-1 opacity-50 border-b border-white/5 pb-1">
            <BrainIcon size={10} className="text-primary-400" />
            <span className="text-[9px] font-mono tracking-widest text-primary-300">CRIKZLING CORE</span>
          </div>
        )}
        
        <div className="whitespace-pre-wrap font-sans">
            {msg.content}
            {isBot && isLatest && msg.content.length === 0 && (
                 <span className="inline-block w-1.5 h-3 bg-primary-400 ml-1 animate-pulse"/>
            )}
        </div>

        <div className={`text-[9px] mt-2 opacity-40 flex items-center gap-1 ${isBot ? 'justify-start' : 'justify-end'}`}>
          <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          {isBot && <span className="font-mono">:: SENTIENT_V2</span>}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function CrikzlingAvatar() {
  const [input, setInput] = useState('');
  const [showStats, setShowStats] = useState(false);
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
    resetBrain
  } = useCrikzling();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentThought, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isThinking || isTyping) return;
    const userText = input;
    setInput('');
    await sendMessage(userText);
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
      reader.onload = (e) => {
        const text = e.target?.result as string;
        uploadFile(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[600px] flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl relative">
      
      {/* HEADER HUD */}
      <div className="h-14 bg-black/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => setShowStats(!showStats)}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/30 transition-all ${isThinking ? 'animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]' : ''}`}>
              <BrainIcon size={16} className={`text-primary-400 ${isThinking ? 'animate-spin-slow' : ''}`} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-100 tracking-wide font-mono">CRIKZLING <span className="text-[9px] text-primary-500 bg-primary-500/10 px-1 py-0.5 rounded border border-primary-500/20">V2.1-ENHANCED</span></h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-amber-500 animate-ping' : isTyping ? 'bg-blue-400' : 'bg-gray-600'}`}></span>
                {isThinking ? 'PROCESSING NEURAL MATRIX...' : isTyping ? 'TRANSMITTING DATA...' : 'SYSTEMS STABLE'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {needsSave && (
            <button 
              onClick={crystallize}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              <span>{isSyncing ? 'CRYSTALLIZING...' : 'SAVE MEMORY'}</span>
              <div className="absolute top-12 right-4 w-48 p-2 bg-black/90 border border-amber-500/20 text-amber-200 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                New neural pathways detected. Save to blockchain to make them permanent.
              </div>
            </button>
          )}
          
          <div className="h-6 w-px bg-white/10 mx-1"></div>
          
          <label className="cursor-pointer p-2 text-gray-400 hover:text-primary-400 hover:bg-white/5 rounded-lg transition-colors" title="Assimilate Knowledge File">
            <Upload size={16} />
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.json,.md" />
          </label>
          
          <button 
            onClick={resetBrain}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" 
            title="Reset Cognitive State"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* STATS OVERLAY PANEL */}
      {showStats && (
        <div className="absolute top-14 left-4 z-30 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
            <Activity size={12} /> Neural Metrics
          </h4>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Evolution Stage</span>
                <span className="text-primary-400 font-mono">{brainStats.stage}</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[60%]"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded p-2 text-center border border-white/5">
                <div className="text-xs font-mono text-white">{brainStats.nodes}</div>
                <div className="text-[9px] text-gray-500 uppercase">Concepts</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center border border-white/5">
                <div className="text-xs font-mono text-white">{brainStats.relations}</div>
                <div className="text-[9px] text-gray-500 uppercase">Synapses</div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
               <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                 <span>Logic</span>
                 <span>{Math.round(brainStats.mood.logic)}%</span>
               </div>
               <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                 <span>Empathy</span>
                 <span>{Math.round(brainStats.mood.empathy)}%</span>
               </div>
               <div className="flex justify-between text-[10px] text-gray-500">
                 <span>Entropy</span>
                 <span>{Math.round(brainStats.mood.entropy)}%</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAT AREA */}
      <div className="flex-1 overflow-hidden relative bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none"></div>

        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto p-4 space-y-2 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
              <BrainIcon size={48} className="text-primary-500 mb-4 animate-pulse" />
              <p className="text-sm text-gray-300 font-mono">NEURAL INTERFACE INITIALIZED</p>
              <p className="text-xs text-gray-500 mt-2">Waiting for sensory input...</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble 
                key={idx} 
                msg={msg} 
                isLatest={idx === messages.length - 1} 
            />
          ))}

          {/* Render the thought process visualization if thinking */}
          {isThinking && currentThought && (
            <ThoughtVisualizer thought={currentThought} />
          )}

          {/* Typing indicator (only shown if simple typing without thought data) */}
          {isTyping && !isThinking && (
             <div className="ml-4 text-[10px] text-primary-500/50 font-mono animate-pulse flex items-center gap-2">
                <span className="w-1 h-1 bg-primary-500 rounded-full"></span>
                INCOMING TRANSMISSION...
             </div>
          )}
          
          <div className="h-4"></div> {/* Spacer */}
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-black/80 backdrop-blur border-t border-white/5 z-20">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                isThinking ? "Processing neural patterns..." :
                isTyping ? "Receiving data stream..." :
                "Transmit data to Crikzling..."
              }
              disabled={isThinking || isTyping || isSyncing}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 transition-all pr-12 text-gray-200 placeholder-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
            />
            
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isThinking || isTyping || isSyncing}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all
                ${!input.trim() || isThinking || isTyping 
                  ? 'text-gray-600 cursor-not-allowed' 
                  : 'text-primary-400 hover:bg-primary-500/10 hover:text-primary-300 active:scale-95'
                }`}
            >
              {isThinking ? (
                <Cpu size={18} className="animate-spin-slow" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex justify-between mt-2 px-1">
             <div className="text-[10px] text-gray-600 font-mono">
                MEM: {brainStats.memories.short} STM / {brainStats.memories.long} LTM
             </div>
             {brainStats.unsaved > 0 && (
                <div className="text-[10px] text-amber-500/70 font-mono animate-pulse">
                    ! {brainStats.unsaved} Unsaved Concepts
                </div>
             )}
        </div>
      </div>
    </div>
  );
}