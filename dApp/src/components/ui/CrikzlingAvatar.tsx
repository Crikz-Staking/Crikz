import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Brain, Database, Cpu, Activity, Save, RefreshCw, Upload, Zap, AlertTriangle,
  TrendingUp, Layers, Clock, Lock
} from 'lucide-react';
import { useCrikzling } from '@/hooks/useCrikzling';

interface ThoughtProcess {
  phase: string;
  progress: number;
  subProcess?: string;
  focus?: string[];
}

const ThoughtVisualizer = ({ thought }: { thought: ThoughtProcess | null }) => {
  if (!thought) return null;

  const getProgressColor = (phase: string) => {
    switch (phase) {
      case 'analyzing': return 'from-blue-500 to-blue-600';
      case 'associating': return 'from-pink-500 to-pink-600';
      case 'planning': return 'from-purple-500 to-purple-600';
      case 'calculating': return 'from-emerald-500 to-emerald-600';
      case 'synthesizing': return 'from-amber-500 to-amber-600';
      default: return 'from-cyan-500 to-cyan-600';
    }
  };

  return (
    <div className="px-4 py-3 bg-black/60 backdrop-blur-sm border-y border-yellow-500/20">
      <div className="flex items-center gap-3">
        <Activity className="w-4 h-4 text-yellow-400 animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-yellow-200 uppercase truncate">
              {thought.phase}
            </span>
            <span className="text-xs text-yellow-400/60 font-mono ml-2 flex-shrink-0">
              {Math.round(thought.progress)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getProgressColor(thought.phase)} transition-all duration-300`}
              style={{ width: `${thought.progress}%` }}
            />
          </div>
          {thought.subProcess && (
            <div className="text-xs text-yellow-300/80 font-mono italic mt-1 truncate">
              {thought.subProcess}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:border-primary-500/30 transition-colors">
    <div className="flex items-center gap-2 mb-1">
      <Icon size={14} className="text-gray-500" />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-lg font-black" style={{ color }}>{value}</div>
  </div>
);

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
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[700px] flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-black/95 to-black/90 backdrop-blur-xl shadow-2xl">
      
      <div className="h-16 bg-gradient-to-r from-yellow-600/20 to-purple-600/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 relative z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="relative group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-purple-500/20 border border-yellow-500/30 transition-all ${isThinking ? 'animate-pulse' : ''}`}>
              <Brain size={20} className="text-yellow-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
          </button>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">CRIKZLING</h3>
            <span className="text-[10px] text-gray-500">{isThinking ? 'PROCESSING' : 'READY'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {needsSave && (
            <button 
              onClick={crystallize}
              disabled={isSyncing || !isOwner}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-black transition-all disabled:opacity-50 shadow-lg"
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  SAVING
                </>
              ) : (
                <>
                  <Save size={14} />
                  SAVE
                  <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px]">{brainStats.unsaved}</span>
                </>
              )}
            </button>
          )}
          
          {!isOwner && needsSave && (
            <div className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-1">
              <Lock size={12} className="text-red-400" />
            </div>
          )}
          
          <label className="p-2 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors cursor-pointer">
            <Upload size={16} />
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.json,.md" />
          </label>
          
          <button 
            onClick={resetBrain}
            disabled={!isOwner}
            className="p-2 text-gray-400 hover:text-red-400 rounded-lg transition-colors disabled:opacity-30" 
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {showStats && (
        <div className="p-4 bg-black/95 border-b border-white/10 z-30">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <StatCard icon={Layers} label="Stage" value={brainStats.stage} color="#f59e0b" />
            <StatCard icon={Database} label="Concepts" value={brainStats.nodes} color="#22d3ee" />
            <StatCard icon={TrendingUp} label="Unsaved" value={brainStats.unsaved} color="#f59e0b" />
            <StatCard icon={Clock} label="Relations" value={brainStats.relations} color="#a78bfa" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-500 mb-1">STM</div>
              <div className="text-sm font-bold text-white">{brainStats.memories.short}</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-500 mb-1">MTM</div>
              <div className="text-sm font-bold text-white">{brainStats.memories.mid}</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-500 mb-1">LTM</div>
              <div className="text-sm font-bold text-white">{brainStats.memories.long}</div>
            </div>
          </div>
        </div>
      )}

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <Brain size={48} className="text-yellow-500 mb-4 animate-pulse" />
            <p className="text-sm text-gray-300 font-mono text-center">NEURAL INTERFACE READY</p>
            <p className="text-xs text-gray-500 font-mono text-center mt-2">Fibonacci-based AI</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'bot' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'bot' 
                ? 'bg-black/60 backdrop-blur-sm border border-white/10 text-gray-100' 
                : 'bg-yellow-600/20 border border-yellow-500/20 text-white backdrop-blur-sm'
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

      <div className="p-4 bg-black/90 border-t border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Communicate with Crikzling..."
            disabled={isThinking || isTyping || isSyncing}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500/50 text-white placeholder-gray-600 disabled:opacity-50 backdrop-blur-sm"
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
            MEM: {brainStats.memories.short} / {brainStats.memories.mid} / {brainStats.memories.long}
          </span>
          {brainStats.unsaved > 0 && (
            <span className="text-amber-500 font-mono animate-pulse flex items-center gap-1">
              <AlertTriangle size={10} />
              {brainStats.unsaved} Unsaved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}