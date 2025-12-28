import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, Activity, Database, GitBranch, Cpu, 
    X, Search, ChevronRight, Terminal, Lock 
} from 'lucide-react';
import { CognitiveLogEntry } from '@/lib/brain/types';

// UPDATED INTERFACE: Accepts data from the parent
interface NeuralDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    logs: CognitiveLogEntry[];
    brainStats: any;
    isOwner: boolean;
}

export default function NeuralDashboard({ isOpen, onClose, logs, brainStats, isOwner }: NeuralDashboardProps) {
    const [selectedLog, setSelectedLog] = useState<CognitiveLogEntry | null>(null);
    const [view, setView] = useState<'trace' | 'memories' | 'graph'>('trace');

    // Auto-select newest log on open or update
    useEffect(() => {
        if (isOpen && logs.length > 0) {
            // Only change selection if we don't have one, or if it's the very first load
            if (!selectedLog) setSelectedLog(logs[0]);
        }
    }, [isOpen, logs]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col md:flex-row overflow-hidden font-sans">
            {/* Sidebar List */}
            <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-[#050508]">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="font-black text-white flex items-center gap-2">
                        <Brain className="text-primary-500" /> CORTEX DEBUG
                    </h2>
                    <button onClick={onClose} className="md:hidden text-gray-500"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 text-xs">
                            Waiting for neural activity...
                            <br/>
                            (Talk to Crikzling to generate logs)
                        </div>
                    ) : (
                        logs.map((log) => (
                            <button
                                key={log.id}
                                onClick={() => setSelectedLog(log)}
                                className={`w-full text-left p-4 border-b border-white/5 transition-colors flex justify-between items-start ${
                                    selectedLog?.id === log.id ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold px-1.5 rounded ${
                                            log.type === 'DREAM' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {log.type}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-300 font-bold truncate">
                                        {isOwner ? log.input : '*** REDACTED ***'}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mt-1">
                                        &rarr; {log.output ? log.output.substring(0, 30) : 'Thinking...'}...
                                    </div>
                                </div>
                                <ChevronRight size={14} className={`mt-2 ${selectedLog?.id === log.id ? 'text-primary-500' : 'text-gray-700'}`} />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0F]">
                {/* Toolbar */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#050508]">
                    <div className="flex items-center gap-4">
                        <TabButton active={view === 'trace'} onClick={() => setView('trace')} icon={Activity} label="Trace" />
                        <TabButton active={view === 'memories'} onClick={() => setView('memories')} icon={Database} label="Memories" />
                        <TabButton active={view === 'graph'} onClick={() => setView('graph')} icon={GitBranch} label="Active Graph" />
                    </div>
                    <button onClick={onClose} className="hidden md:block p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content View */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                    {!isOwner && view !== 'graph' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                            <div className="text-center p-8 border border-red-500/30 bg-red-900/10 rounded-2xl">
                                <Lock size={48} className="text-red-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Restricted Access</h3>
                                <p className="text-gray-400 text-sm">Deep inspection is available only to the Protocol Architect.</p>
                            </div>
                        </div>
                    )}

                    {selectedLog ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedLog.id + view}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full"
                            >
                                {view === 'trace' && <TraceView log={selectedLog} />}
                                {view === 'memories' && <MemoryView log={selectedLog} />}
                                {view === 'graph' && <GraphView log={selectedLog} brainStats={brainStats} />}
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-600">
                            <div className="text-center">
                                <Terminal size={48} className="mx-auto mb-4 opacity-20"/>
                                <p>Select an event to inspect neural pathways.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                active ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
        >
            <Icon size={16} /> {label}
        </button>
    );
}

function TraceView({ log }: { log: CognitiveLogEntry }) {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Intent" value={log.intent} color="text-purple-400" />
                <StatCard label="Compute Time" value={`${log.executionTimeMs}ms`} color="text-emerald-400" />
                <StatCard label="Emotional Delta" value={log.emotionalShift?.toFixed(2) || '0.00'} color="text-blue-400" />
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10 bg-black/20">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Recursive Thought Cycles</h3>
                <div className="space-y-6 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[11px] top-4 bottom-4 w-px bg-white/10" />
                    
                    {log.thoughtCycles.map((cycle, i) => (
                        <div key={i} className="relative flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-[#12121A] border border-primary-500/50 flex items-center justify-center text-[10px] font-bold text-primary-500 z-10">
                                {cycle.cycleIndex}
                            </div>
                            <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="text-xs text-gray-400 font-bold">Focus:</span>
                                    {cycle.focusConcepts.map(c => (
                                        <span key={c} className="text-[10px] bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded border border-primary-500/20">{c}</span>
                                    ))}
                                </div>
                                
                                {cycle.simResult && (
                                    <div className="mb-3 bg-blue-500/10 border-l-2 border-blue-500 p-3 rounded-r text-xs">
                                        <div className="font-bold text-blue-400 mb-1">Simulation: {cycle.simResult.scenario}</div>
                                        <div className="text-gray-300">{cycle.simResult.recommendation}</div>
                                    </div>
                                )}

                                {cycle.newAssociations.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                        &rarr; Associated: {cycle.newAssociations.join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {log.thoughtCycles.length === 0 && (
                        <div className="text-xs text-gray-500 italic pl-8">No deep cycles required for this interaction.</div>
                    )}
                </div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10 bg-black/20">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Final Vector Output</h3>
                <div className="flex h-4 gap-1 rounded-full overflow-hidden">
                    {log.vectors.response.map((val, i) => (
                        <div key={i} className="h-full bg-primary-500/50" style={{ width: `${Math.max(5, val * 100)}%`, opacity: 0.2 + (val * 0.8) }} title={`Dim ${i}: ${val}`} />
                    ))}
                </div>
                <div className="flex justify-between mt-1 text-[9px] text-gray-500 font-mono">
                    <span>FIN</span><span>TEC</span><span>SOC</span><span>TIM</span><span>ABS</span><span>RSK</span>
                </div>
            </div>
        </div>
    );
}

function MemoryView({ log }: { log: CognitiveLogEntry }) {
    // Collect all memories retrieved during thought process
    const memories = log.thoughtCycles.flatMap(c => c.retrievedMemories);
    const uniqueMemories = [...new Map(memories.map(m => [m.id, m])).values()]; // Dedupe by ID

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uniqueMemories.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500 py-10">
                    No historical memories were triggered by this input.
                </div>
            ) : (
                uniqueMemories.map(mem => (
                    <div key={mem.id} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                mem.role === 'user' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                                {mem.role.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-gray-500">{new Date(mem.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-3 line-clamp-3">"{mem.content}"</p>
                        <div className="flex flex-wrap gap-1">
                            {mem.concepts.slice(0, 3).map(c => (
                                <span key={c} className="text-[9px] text-gray-500 bg-black/40 px-1.5 py-0.5 rounded">{c}</span>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function GraphView({ log, brainStats }: { log: CognitiveLogEntry, brainStats: any }) {
    return (
        <div className="h-full flex flex-col">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Nodes" value={brainStats.nodes} color="text-white" />
                <StatCard label="Synapses" value={brainStats.relations} color="text-gray-400" />
                <StatCard label="Entropy" value={`${brainStats.unsaved}%`} color="text-red-400" />
                <StatCard label="Stage" value={brainStats.stage} color="text-primary-500" />
            </div>

            <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-8 relative overflow-hidden flex items-center justify-center">
                {/* Visual Representation of Active Nodes */}
                <div className="relative w-64 h-64">
                    {/* Center Core */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_20px_white]" />
                    
                    {log.activeNodes.map((node, i) => {
                        const angle = (i / log.activeNodes.length) * Math.PI * 2;
                        const radius = 80 + Math.random() * 40;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        
                        return (
                            <React.Fragment key={node}>
                                {/* Connection Line */}
                                <div 
                                    className="absolute top-1/2 left-1/2 h-px bg-gradient-to-r from-white/50 to-transparent origin-left"
                                    style={{ 
                                        width: radius, 
                                        transform: `translate(0, 0) rotate(${angle * (180/Math.PI)}deg)` 
                                    }}
                                />
                                {/* Node */}
                                <div 
                                    className="absolute top-1/2 left-1/2 flex items-center justify-center"
                                    style={{ transform: `translate(${x}px, ${y}px)` }}
                                >
                                    <div className="relative group">
                                        <div className="w-3 h-3 bg-primary-500 rounded-full shadow-[0_0_10px_#f59e0b]" />
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/90 border border-white/10 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            {node}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
                <p className="absolute bottom-4 text-xs text-gray-500">Visualization of concept activation during this thought cycle.</p>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: any) {
    return (
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">{label}</div>
            <div className={`text-lg font-black ${color}`}>{value}</div>
        </div>
    );
}