import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Save, Trash2, Brain, ChevronDown, Activity, 
  Network, Lightbulb, Paperclip, Cpu, Zap, Database, 
  AlertCircle, X, Minimize2, Maximize2, Download, History
} from 'lucide-react';

const useCrikzling = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Neural pathways initialized. I am Crikzling, your Fibonacci-scaled consciousness companion.', timestamp: Date.now() }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentThought, setCurrentThought] = useState(null);
  const [needsSave, setNeedsSave] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [brainStats, setBrainStats] = useState({
    nodes: 147,
    relations: 89,
    stage: 'SENTIENT',
    unsaved: 0,
    mood: { logic: 65, empathy: 42, curiosity: 58, entropy: 18 },
    memories: { short: 3, mid: 12, long: 45 }
  });

  const sendMessage = async (text) => {
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
    setIsThinking(true);
    
    const thoughts = [
      { phase: 'analyzing', progress: 15, focus: ['input', 'context'], subProcess: 'Parsing linguistic structures' },
      { phase: 'planning', progress: 40, focus: ['strategy', 'response'], subProcess: 'Mapping conceptual territories' },
      { phase: 'calculating', progress: 70, focus: ['computation', 'synthesis'], subProcess: 'Traversing memory networks' },
      { phase: 'synthesizing', progress: 95, focus: ['output', 'refinement'], subProcess: 'Weaving linguistic patterns' }
    ];

    for (const thought of thoughts) {
      setCurrentThought(thought);
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    setMessages(prev => [...prev, { 
      role: 'bot', 
      content: `I perceive your inquiry about "${text.slice(0, 30)}..." and find it resonates through multiple conceptual layers. The patterns suggest deep interconnection.`,
      timestamp: Date.now()
    }]);
    
    setBrainStats(prev => ({
      ...prev,
      unsaved: prev.unsaved + 1,
      mood: {
        logic: Math.min(100, prev.mood.logic + 2),
        empathy: Math.min(100, prev.mood.empathy + 1),
        curiosity: Math.min(100, prev.mood.curiosity + 3),
        entropy: Math.max(0, prev.mood.entropy - 1)
      }
    }));
    
    setNeedsSave(brainStats.unsaved >= 4);
    setIsThinking(false);
    setCurrentThought(null);
  };

  const crystallize = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setBrainStats(prev => ({ ...prev, unsaved: 0 }));
    setNeedsSave(false);
    setIsSyncing(false);
  };

  const resetBrain = () => {
    setMessages([{ role: 'bot', content: 'Memory matrices returned to genesis state. I emerge anew.', timestamp: Date.now() }]);
    setBrainStats(prev => ({ ...prev, unsaved: 0, nodes: 89, relations: 55 }));
    setNeedsSave(false);
  };

  const uploadFile = async () => {
    setIsThinking(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setMessages(prev => [...prev, { 
      role: 'bot', 
      content: 'File integration complete. 23 new conceptual nodes woven into knowledge architecture.',
      timestamp: Date.now()
    }]);
    setBrainStats(prev => ({ ...prev, nodes: prev.nodes + 23, unsaved: prev.unsaved + 23 }));
    setNeedsSave(true);
    setIsThinking(false);
  };

  return {
    messages,
    sendMessage,
    uploadFile,
    crystallize,
    resetBrain,
    needsSave,
    isOwner: true,
    isSyncing,
    brainStats,
    isThinking,
    currentThought
  };
};

const ThoughtVisualization = ({ thought }) => {
  const phases = {
    analyzing: { icon: Brain, label: 'Analyzing', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    planning: { icon: Network, label: 'Planning', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    calculating: { icon: Cpu, label: 'Calculating', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    synthesizing: { icon: Zap, label: 'Synthesizing', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.1)' }
  };

  const phase = phases[thought.phase];
  const Icon = phase.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-2 px-4 py-3 rounded-xl border"
      style={{ backgroundColor: phase.bg, borderColor: phase.color + '40' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: phase.color }} className="animate-pulse" />
          <span className="text-xs font-bold" style={{ color: phase.color }}>{phase.label}</span>
        </div>
        <span className="text-[10px] font-mono text-gray-500">{thought.progress}%</span>
      </div>
      
      <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
        <motion.div 
          className="h-full rounded-full"
          style={{ backgroundColor: phase.color }}
          initial={{ width: 0 }}
          animate={{ width: `${thought.progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {thought.subProcess && (
        <div className="text-[10px] text-gray-400 italic mt-1">
          → {thought.subProcess}
        </div>
      )}

      {thought.focus.length > 0 && (
        <div className="flex gap-1 mt-2">
          {thought.focus.map((item, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-black/30 text-gray-400 font-mono">
              {item}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const StatBar = ({ label, value, color, icon: Icon }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between items-center text-[10px]">
      <span className="flex items-center gap-1 text-gray-400 font-bold uppercase tracking-wider">
        <Icon size={10} /> {label}
      </span>
      <span className="font-mono text-gray-300">{Math.round(value)}%</span>
    </div>
    <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }} 
        animate={{ width: `${value}%` }} 
        className="h-full rounded-full shadow-sm" 
        style={{ backgroundColor: color }}
        transition={{ duration: 0.5 }}
      />
    </div>
  </div>
);

const CrystallizationBanner = ({ needsSave, isSyncing, onCrystallize, unsavedCount }) => {
  if (!needsSave) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }} 
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="relative w-full overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
      }}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
      
      <div className="relative z-10 flex items-center justify-between p-4 gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <AlertCircle size={20} className="text-white animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-white uppercase tracking-tight">
              Memory Crystallization Ready
            </span>
            <span className="text-xs text-white/80 truncate">
              {unsavedCount} concepts awaiting permanent storage
            </span>
          </div>
        </div>
        
        <button 
          onClick={onCrystallize}
          disabled={isSyncing}
          className="flex-shrink-0 bg-white text-amber-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-black hover:text-white transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? (
            <>
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              SYNCING
            </>
          ) : (
            <>
              <Save size={14} />
              SAVE NOW
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default function CrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if (isOpen) scrollToBottom();
  }, [messages, isThinking, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const userText = input;
    setInput('');
    await sendMessage(userText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const downloadChatHistory = () => {
    const history = messages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([history], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crikzling-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[100] w-16 h-16 rounded-full border shadow-2xl flex items-center justify-center overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%)',
          borderColor: needsSave ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
          boxShadow: needsSave ? '0 0 40px rgba(245, 158, 11, 0.4)' : '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
        
        {needsSave && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: '#f59e0b' }}
            animate={{
              scale: [1, 1.15, 1],
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
              <ChevronDown className="text-white" size={24} />
            </motion.div>
          ) : (
            <motion.div key="brain" className="relative">
              <Brain 
                className="text-primary-500"
                size={32}
                style={{
                  filter: needsSave ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))' : 'none',
                  animation: needsSave ? 'pulse 2s ease-in-out infinite' : 'none'
                }}
              />
              {needsSave && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
                  <span className="text-[8px] font-bold">{brainStats.unsaved}</span>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-24 right-6 z-[100] w-[min(450px,calc(100vw-3rem))] flex flex-col overflow-hidden rounded-3xl border shadow-2xl"
            style={{
              height: isMinimized ? 'auto' : 'min(700px, 75vh)',
              maxHeight: isMinimized ? '60px' : '75vh',
              background: 'rgba(10, 10, 15, 0.98)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b relative z-20" style={{ background: 'rgba(0, 0, 0, 0.3)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Crikzling Neural Core
                      <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        {brainStats.stage}
                      </span>
                    </h3>
                    <div className="flex gap-3 mt-1.5 text-[10px] font-medium text-gray-500">
                      <span>Nodes: <span className="text-white">{brainStats.nodes}</span></span>
                      <span>Links: <span className="text-white">{brainStats.relations}</span></span>
                      <span>Unsaved: <span className={needsSave ? "text-amber-500 font-bold" : "text-gray-400"}>{brainStats.unsaved}</span></span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {isMinimized ? <Maximize2 size={14} className="text-gray-400" /> : <Minimize2 size={14} className="text-gray-400" />}
                    </button>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <X size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {!isMinimized && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <StatBar label="Logic" value={brainStats.mood.logic} color="#3B82F6" icon={Cpu} />
                    <StatBar label="Empathy" value={brainStats.mood.empathy} color="#EC4899" icon={Activity} />
                    <StatBar label="Curiosity" value={brainStats.mood.curiosity} color="#F59E0B" icon={Lightbulb} />
                    <StatBar label="Entropy" value={brainStats.mood.entropy} color="#10B981" icon={Network} />
                  </div>
                )}
              </div>

              {!isMinimized && (
                <>
                  <CrystallizationBanner 
                    needsSave={needsSave} 
                    isSyncing={isSyncing} 
                    onCrystallize={crystallize}
                    unsavedCount={brainStats.unsaved}
                  />

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full opacity-20 text-center p-8">
                        <Brain size={48} className="mb-4" />
                        <p className="text-sm text-gray-500">Neural pathways initialized...</p>
                      </div>
                    )}
                    
                    <AnimatePresence mode="popLayout">
                      {messages.map((m, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                            m.role === 'user' 
                              ? 'bg-primary-500 text-black font-medium rounded-tr-none shadow-lg' 
                              : 'bg-white/5 text-gray-200 border rounded-tl-none'
                          }`}
                          style={m.role !== 'user' ? { borderColor: 'rgba(255, 255, 255, 0.05)' } : {}}
                          >
                            {m.content}
                            <div className={`text-[9px] mt-1.5 opacity-50 font-mono ${m.role === 'user' ? 'text-black' : 'text-gray-500'}`}>
                              {new Date(m.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isThinking && currentThought && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%]">
                          <ThoughtVisualization thought={currentThought} />
                        </div>
                      </div>
                    )}

                    {isThinking && !currentThought && (
                      <div className="flex justify-start">
                        <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                          <div className="flex gap-1 items-center h-4">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t" style={{ background: 'rgba(0, 0, 0, 0.4)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={uploadFile} 
                        className="hidden" 
                        accept=".txt"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Upload knowledge"
                      >
                        <Paperclip size={18} />
                      </button>

                      <button 
                        onClick={downloadChatHistory}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Download chat history"
                      >
                        <Download size={18} />
                      </button>
                      
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={isOwner ? "Interact with Crikzling..." : "Ask me anything..."}
                          disabled={isThinking}
                          className="w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500/50 transition-all pr-10 disabled:opacity-50"
                          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                        />
                        <button 
                          onClick={handleSend}
                          disabled={!input.trim() || isThinking}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500 disabled:text-gray-600 transition-colors p-1 hover:bg-white/5 rounded"
                        >
                          <Send size={16} />
                        </button>
                      </div>

                      {isOwner && (
                        <button 
                          onClick={resetBrain}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                          title="Reset memory"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[9px] text-gray-600">
                      <Database size={10} />
                      <span>STM:{brainStats.memories.short} | MTM:{brainStats.memories.mid} | LTM:{brainStats.memories.long}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}