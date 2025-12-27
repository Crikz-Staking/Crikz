import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Brain, Sparkles, Database, Cpu, Activity, Save, RefreshCw, Upload, Zap, AlertTriangle 
} from 'lucide-react';
import { useCrikzling } from '@/hooks/useCrikzling';

// Simplified for the artifact - use actual ThoughtProcess type in your project
interface ThoughtProcess {
  phase: string;
  progress: number;
  subProcess?: string;
  focus?: string[];
}

// --- SUB-COMPONENT: THOUGHT VISUALIZER ---
const ThoughtVisualizer = ({ thought }: { thought: ThoughtProcess | null }) => {
  if (!thought) return null;

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
    <div className="mx-4 my-2 p-3 rounded-lg bg-black/40 border border-yellow-500/20">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-yellow-200 uppercase">{thought.phase}</span>
            <span className="text-xs text-yellow-400/60 font-mono">{Math.round(thought.progress)}%</span>
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
        <div className="text-xs text-yellow-300/80 font-mono italic pl-9">{thought.subProcess}...</div>
      )}
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
    resetBrain,
    isOwner
  } = useCrikzling();

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
    <div className="w-full max-w-4xl mx-auto h-[600px] flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl relative">
      
      {/* HEADER WITH PROMINENT SAVE BUTTON */}
      <div className="h-16 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => setShowStats(!showStats)}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-purple-500/20 border border-yellow-500/30 ${isThinking ? 'animate-pulse' : ''}`}>
              <Brain size={20} className="text-yellow-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">CRIKZLING</h3>
            <span className="text-[10px] text-gray-500">{isThinking ? 'THINKING...' : 'ONLINE'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* ⭐ CRYSTALLIZATION BUTTON - ALWAYS VISIBLE WHEN NEEDED */}
          {needsSave && (
            <button 
              onClick={crystallize}
              disabled={isSyncing || !isOwner}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-black transition-all disabled:opacity-50 shadow-lg shadow-amber-500/30 animate-pulse"
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  SAVING...
                </>
              ) : (
                <>
                  <Save size={16} />
                  SAVE MEMORY
                  <span className="bg-black/30 px-2 py-0.5 rounded text-xs">{brainStats.unsaved}</span>
                </>
              )}
            </button>
          )}
          
          {/* Show warning if not owner */}
          {!isOwner && needsSave && (
            <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs text-red-400 font-bold">OWNER ONLY</span>
            </div>
          )}
          
          <label className="p-2 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors cursor-pointer">
            <Upload size={18} />
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.json,.md" />
          </label>
          
          <button 
            onClick={resetBrain}
            disabled={!isOwner}
            className="p-2 text-gray-400 hover:text-red-400 rounded-lg transition-colors disabled:opacity-30" 
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* STATS PANEL */}
      {showStats && (
        <div className="absolute top-16 left-4 z-30 w-64 bg-black/95 border border-white/10 rounded-xl p-4 shadow-2xl">
          <div className="text-xs font-bold text-gray-400 uppercase mb-3">Neural Metrics</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Stage:</span>
              <span className="text-yellow-400 font-mono">{brainStats.stage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Concepts:</span>
              <span className="text-white font-mono">{brainStats.nodes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Unsaved:</span>
              <span className="text-amber-400 font-mono">{brainStats.unsaved}</span>
            </div>
          </div>
        </div>
      )}

      {/* CHAT AREA */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <Brain size={48} className="text-yellow-500 mb-4 animate-pulse" />
            <p className="text-sm text-gray-300 font-mono">NEURAL INTERFACE READY</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'bot' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'bot' 
                ? 'bg-black/40 border border-white/5 text-gray-100' 
                : 'bg-yellow-600/20 border border-yellow-500/20 text-white'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isThinking && currentThought && <ThoughtVisualizer thought={currentThought} />}
        {isTyping && !isThinking && (
          <div className="text-xs text-yellow-500/50 font-mono animate-pulse">TRANSMITTING...</div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-black/80 border-t border-white/5">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Transmit data to Crikzling..."
            disabled={isThinking || isTyping || isSyncing}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500/50 text-white placeholder-gray-600 disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isThinking || isTyping || isSyncing}
            className="p-3 rounded-lg bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={18} />
          </button>
        </div>
        
        <div className="flex justify-between mt-2 px-1 text-[10px]">
          <span className="text-gray-600 font-mono">
            MEM: {brainStats.memories.short} STM / {brainStats.memories.long} LTM
          </span>
          {brainStats.unsaved > 0 && (
            <span className="text-amber-500 font-mono animate-pulse flex items-center gap-1">
              <AlertTriangle size={10} />
              ! {brainStats.unsaved} Unsaved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}