import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, X, Sparkles, Brain, Zap, TrendingUp, AlertCircle,
  Download, Upload, Trash2, BarChart3, Lightbulb, Database,
  Check, Link, Loader, Minimize2, Maximize2, Settings
} from 'lucide-react';

export default function EnhancedCrikzlingAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [learningNotifications, setLearningNotifications] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [brainStats, setBrainStats] = useState({
    wordsUnderstood: 45,
    relationsDiscovered: 32,
    interactionCount: 0,
    evolutionStage: 'GENESIS',
    experiencePoints: 0,
    traits: {
      linguistic: 50,
      analytical: 50,
      empathetic: 30,
      technical: 20,
      creative: 40
    }
  });
  
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addLearningNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotif = { ...notification, id, visible: true };
    
    setLearningNotifications(prev => [...prev, newNotif]);
    
    if (!notification.requiresBlockchain) {
      setTimeout(() => {
        setLearningNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, visible: false } : n)
        );
        setTimeout(() => {
          setLearningNotifications(prev => prev.filter(n => n.id !== id));
        }, 500);
      }, 5000);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage = { sender: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const words = input.toLowerCase().split(/\s+/);
    let experienceGained = 0;
    
    const knownWords = ['hello', 'token', 'blockchain', 'price', 'buy', 'sell', 'nft', 'order', 'gas', 'wallet', 'stake', 'yield'];
    const unknownWords = words.filter(w => w.length > 3 && !knownWords.includes(w));
    
    if (unknownWords.length > 0) {
      experienceGained += 10;
      addLearningNotification({
        type: 'NEW_WORD',
        word: unknownWords[0],
        description: `Analyzing "${unknownWords[0]}" from context`,
        confidence: 0.7,
        xp: 10
      });
      
      setBrainStats(prev => ({
        ...prev,
        wordsUnderstood: prev.wordsUnderstood + 1,
        experiencePoints: prev.experiencePoints + 10,
        traits: { ...prev.traits, linguistic: Math.min(1000, prev.traits.linguistic + 2) }
      }));
    }

    if (input.match(/cause|because|leads to|results in/i)) {
      experienceGained += 15;
      addLearningNotification({
        type: 'PATTERN_DISCOVERED',
        description: 'Detected causal relationship pattern',
        confidence: 0.85,
        xp: 15
      });
      
      setBrainStats(prev => ({
        ...prev,
        relationsDiscovered: prev.relationsDiscovered + 1,
        experiencePoints: prev.experiencePoints + 15,
        traits: { ...prev.traits, analytical: Math.min(1000, prev.traits.analytical + 3) }
      }));
    }

    setBrainStats(prev => ({ 
      ...prev, 
      interactionCount: prev.interactionCount + 1 
    }));
    
    if ((brainStats.interactionCount + 1) % 10 === 0) {
      addLearningNotification({
        type: 'CONTEXT_UNDERSTOOD',
        description: 'Ready to crystallize memory on-chain',
        confidence: 1.0,
        requiresBlockchain: true,
        gasEstimate: '~0.001 BNB',
        xp: 50
      });
    }

    const botMessage = {
      sender: 'bot',
      text: generateSmartResponse(input, experienceGained),
      timestamp: Date.now(),
      confidence: 0.7 + (brainStats.traits.linguistic / 2000),
      xpGained: experienceGained
    };

    setMessages(prev => [...prev, botMessage]);
    setIsThinking(false);
  };

  const generateSmartResponse = (input, xp) => {
    const lower = input.toLowerCase();
    
    let response = '';
    if (xp > 0) {
      response = `I gained ${xp} XP from this interaction. `;
    }
    
    if (lower.includes('token')) {
      response += 'Tokens represent value units in blockchain systems. They can be transferred, locked, or used for governance.';
    } else if (lower.includes('nft')) {
      response += 'NFTs are unique digital assets. Each has distinct properties and cannot be exchanged 1:1 like regular tokens.';
    } else if (lower.includes('gas')) {
      response += 'Gas is the computational cost of blockchain operations. It prevents network spam and compensates validators.';
    } else {
      response += 'I\'m building my understanding of this concept through context analysis and pattern recognition.';
    }
    
    return response;
  };

  const handleBlockchainSync = async (notifId) => {
    setLearningNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, syncing: true } : n)
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBrainStats(prev => ({
      ...prev,
      experiencePoints: prev.experiencePoints + 50
    }));
    
    setLearningNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, syncing: false, synced: true } : n)
    );
    
    setTimeout(() => {
      setLearningNotifications(prev => prev.filter(n => n.id !== notifId));
    }, 3000);
  };

  const dismissNotification = (notifId) => {
    setLearningNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, visible: false } : n)
    );
    setTimeout(() => {
      setLearningNotifications(prev => prev.filter(n => n.id !== notifId));
    }, 300);
  };

  const getStageColor = () => {
    const colors = {
      GENESIS: '#f59e0b',
      SENTIENT: '#3b82f6',
      SAPIENT: '#8b5cf6',
      TRANSCENDENT: '#ec4899'
    };
    return colors[brainStats.evolutionStage] || '#f59e0b';
  };

  const getProgressToNextStage = () => {
    const current = brainStats.wordsUnderstood;
    
    if (brainStats.evolutionStage === 'GENESIS') return (current / 50) * 100;
    if (brainStats.evolutionStage === 'SENTIENT') return ((current - 50) / 150) * 100;
    if (brainStats.evolutionStage === 'SAPIENT') return ((current - 200) / 800) * 100;
    return 100;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Floating Avatar Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-[60]"
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-16 h-16 rounded-full shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${getStageColor()}, ${getStageColor()}dd)`
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: getStageColor() }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <div className="absolute inset-0 rounded-full border-2 border-white/20 backdrop-blur-xl flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>

          {learningNotifications.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-black"
              style={{ background: getStageColor() }}
            >
              {learningNotifications.length}
            </motion.div>
          )}
        </button>
      </motion.div>

      {/* Main Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50, y: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50, y: 50 }}
            className={`fixed z-[60] ${
              isMinimized 
                ? 'bottom-6 right-6 w-80' 
                : 'bottom-6 right-6 w-[500px] h-[650px]'
            }`}
          >
            <div className="h-full bg-[#0A0A0F] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div 
                className="p-4 border-b border-white/10 flex justify-between items-center"
                style={{ 
                  background: `linear-gradient(135deg, ${getStageColor()}10, transparent)` 
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${getStageColor()}, ${getStageColor()}dd)` 
                    }}
                  >
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-black text-white tracking-wide">Crikzling</div>
                    <div 
                      className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: getStageColor() }}
                    >
                      {brainStats.evolutionStage} • {brainStats.experiencePoints} XP
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowStats(!showStats)} 
                    className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  >
                    <BarChart3 size={16} />
                  </button>
                  <button 
                    onClick={() => setIsMinimized(!isMinimized)} 
                    className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  >
                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Stats Panel */}
                  <AnimatePresence>
                    {showStats && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/40 border-b border-white/10 overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          {/* XP Progress Bar */}
                          <div>
                            <div className="flex justify-between text-[9px] text-gray-400 uppercase mb-1">
                              <span>Progress to Next Stage</span>
                              <span>{Math.round(getProgressToNextStage())}%</span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: getStageColor() }}
                                initial={{ width: 0 }}
                                animate={{ width: `${getProgressToNextStage()}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/5 p-2 rounded-lg">
                              <div className="text-gray-500 uppercase text-[9px] mb-1">Words Known</div>
                              <div className="font-bold text-white">{brainStats.wordsUnderstood}</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg">
                              <div className="text-gray-500 uppercase text-[9px] mb-1">Relations</div>
                              <div className="font-bold text-white">{brainStats.relationsDiscovered}</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg">
                              <div className="text-gray-500 uppercase text-[9px] mb-1">Interactions</div>
                              <div className="font-bold text-white">{brainStats.interactionCount}</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg">
                              <div className="text-gray-500 uppercase text-[9px] mb-1">Total XP</div>
                              <div className="font-bold" style={{ color: getStageColor() }}>{brainStats.experiencePoints}</div>
                            </div>
                          </div>

                          {/* Trait Bars */}
                          <div className="space-y-2">
                            {Object.entries(brainStats.traits).map(([trait, value]) => (
                              <div key={trait}>
                                <div className="flex justify-between text-[9px] text-gray-400 uppercase mb-1">
                                  <span>{trait}</span>
                                  <span>{value}/1000</span>
                                </div>
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: getStageColor() }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(value / 1000) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {messages.length === 0 && (
                      <div className="text-center text-xs text-gray-500 mt-10 space-y-2">
                        <Brain size={32} className="mx-auto opacity-20" />
                        <p>Atomic understanding system online</p>
                        <p className="text-[10px]">I learn genuinely from every interaction</p>
                      </div>
                    )}
                    
                    {messages.map((msg, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[85%]">
                          <div 
                            className={`p-3 text-sm rounded-2xl ${
                              msg.sender === 'user' 
                              ? 'text-black font-bold rounded-br-sm' 
                              : 'bg-white/10 text-gray-200 border border-white/5 rounded-bl-sm'
                            }`}
                            style={{
                              background: msg.sender === 'user' ? `linear-gradient(135deg, ${getStageColor()}, ${getStageColor()}dd)` : undefined
                            }}
                          >
                            {msg.text}
                          </div>
                          
                          {msg.sender === 'bot' && (
                            <div className="mt-1 flex items-center gap-2 text-[9px] text-gray-600">
                              {msg.confidence !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Zap size={10} />
                                  {(msg.confidence * 100).toFixed(0)}%
                                </span>
                              )}
                              {msg.xpGained > 0 && (
                                <span className="flex items-center gap-1" style={{ color: getStageColor() }}>
                                  <Sparkles size={10} />
                                  +{msg.xpGained} XP
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {isThinking && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white/5 px-4 py-2 rounded-full flex gap-1 items-center">
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}/>
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}/>
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}/>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-white/10 bg-black/20">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Teach me something..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-white/20 outline-none transition-all placeholder:text-gray-600"
                        disabled={isThinking}
                      />
                      <button 
                        onClick={handleSubmit}
                        disabled={isThinking || !input.trim()}
                        className="text-white p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: `linear-gradient(135deg, ${getStageColor()}, ${getStageColor()}dd)`
                        }}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {isMinimized && (
                <div className="p-4 text-center">
                  <div className="text-sm text-gray-400">Crikzling is minimized</div>
                  <div className="text-xs text-gray-600 mt-1">{brainStats.experiencePoints} XP • {brainStats.evolutionStage}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Learning Notifications - Position dynamically */}
      <div 
        className="fixed z-[70] space-y-2 pointer-events-none max-w-xs"
        style={{
          bottom: '24px',
          right: isOpen ? '520px' : '96px',
          transition: 'right 0.3s ease'
        }}
      >
        <AnimatePresence>
          {learningNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: notif.visible ? 1 : 0, x: notif.visible ? 0 : 100, scale: notif.visible ? 1 : 0.8 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className="pointer-events-auto"
            >
              <div 
                className="backdrop-blur-xl border rounded-2xl p-4 shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${getStageColor()}20, ${getStageColor()}10)`,
                  borderColor: `${getStageColor()}40`
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${getStageColor()}30`,
                      borderColor: `${getStageColor()}50`,
                      border: '1px solid'
                    }}
                  >
                    {notif.type === 'NEW_WORD' && <Brain size={16} className="text-white" />}
                    {notif.type === 'PATTERN_DISCOVERED' && <Lightbulb size={16} className="text-white" />}
                    {notif.type === 'CONTEXT_UNDERSTOOD' && <Database size={16} className="text-white" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: getStageColor() }}>
                        {notif.type.replace(/_/g, ' ')}
                      </span>
                      {notif.xp && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${getStageColor()}30`, color: getStageColor() }}>
                          +{notif.xp} XP
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-white/90 leading-relaxed mb-2">
                      {notif.word && <span className="font-bold" style={{ color: getStageColor() }}>"{notif.word}"</span>} {notif.description}
                    </p>
                    
                    {notif.requiresBlockchain && !notif.syncing && !notif.synced && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleBlockchainSync(notif.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-black rounded-lg text-xs font-bold transition-all"
                          style={{ background: getStageColor() }}
                        >
                          <Link size={12} />
                          Sync ({notif.gasEstimate})
                        </button>
                        <button
                          onClick={() => dismissNotification(notif.id)}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <X size={14} className="text-white/60" />
                        </button>
                      </div>
                    )}
                    
                    {notif.syncing && (
                      <div className="flex items-center justify-center gap-2 text-xs text-white/60 mt-3">
                        <Loader size={12} className="animate-spin" />
                        Syncing to blockchain...
                      </div>
                    )}
                    
                    {notif.synced && (
                      <div className="flex items-center justify-center gap-2 text-xs font-bold mt-3" style={{ color: getStageColor() }}>
                        <Check size={12} />
                        Memory Crystallized
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}