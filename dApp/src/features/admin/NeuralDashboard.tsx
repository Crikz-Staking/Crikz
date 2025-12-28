import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, Activity, Wifi, Database, GitBranch, Cpu, 
    X, Search, ChevronRight, Terminal, Lock, Sliders, 
    PlusCircle, Save, Globe, Zap, Battery, Download, FileText,
    Wallet, Award, TrendingUp, Layers, ArrowRight, ShieldCheck, AlertTriangle,
    HardDrive, Check
} from 'lucide-react';
import { CognitiveLogEntry, InternalDrives } from '@/lib/brain/types';
import { AtomicConcept } from '@/lib/crikzling-atomic-knowledge';
import { formatEther } from 'viem';

// --- ROBUST DOWNLOAD UTILITY ---
const downloadData = (filename: string, data: any) => {
    try {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a); // Required for Firefox/some browsers
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (e) {
        console.error("Export failed:", e);
        alert("Failed to export data. Check console permissions.");
    }
};

interface NeuralDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    logs: CognitiveLogEntry[];
    brainStats: any;
    isOwner: boolean;
    updateDrives?: (drives: InternalDrives) => void;
    trainConcept?: (concept: AtomicConcept) => void;
    simpleTrain?: (text: string) => void;
    toggleNeuralLink?: (active: boolean) => void;
}

export default function NeuralDashboard({ 
    isOpen, onClose, logs, brainStats, isOwner, 
    updateDrives, trainConcept, simpleTrain, toggleNeuralLink 
}: NeuralDashboardProps) {
    const [view, setView] = useState<'monitor' | 'synapse' | 'cortex' | 'matrix'>('monitor');
    
    // Connectivity
    const { isConnected, stamina, bandwidthUsage } = brainStats.connectivity;

    if (!isOpen) return null;

    const handleFullExport = () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        downloadData(`crikz_full_state_${timestamp}.json`, {
            stats: brainStats,
            logs: logs,
            timestamp: Date.now()
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col md:flex-row overflow-hidden font-sans">
            
            {/* 1. SIDEBAR NAV */}
            <div className="w-full md:w-20 md:border-r border-b md:border-b-0 border-white/10 bg-[#050508] flex md:flex-col items-center py-4 gap-4 z-20">
                <div className="md:mb-4">
                    <Brain className="text-primary-500" size={32} />
                </div>
                
                <NavButton active={view === 'monitor'} onClick={() => setView('monitor')} icon={Activity} label="Monitor" />
                <NavButton active={view === 'synapse'} onClick={() => setView('synapse')} icon={Zap} label="Synapse" locked={!isOwner} />
                <NavButton active={view === 'cortex'} onClick={() => setView('cortex')} icon={Database} label="Cortex" />
                <NavButton active={view === 'matrix'} onClick={() => setView('matrix')} icon={Sliders} label="Matrix" locked={!isOwner} />

                <div className="md:mt-auto flex flex-col gap-4 items-center">
                    {isOwner && (
                        <button onClick={handleFullExport} className="p-3 text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-900/20 rounded-xl" title="Export Full System State">
                            <HardDrive size={20} />
                        </button>
                    )}
                    <button onClick={onClose} className="p-3 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-xl">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* 2. MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0F] relative">
                {/* Global Status Bar */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#050508]">
                    <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                        {view} Station <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 font-mono">v5.4.1</span>
                    </h2>
                    
                    {/* Connectivity Module */}
                    {isOwner && (
                        <div className="flex items-center gap-4">
                            {/* Stamina Bar */}
                            <div className="flex flex-col items-end w-32">
                                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase">
                                    <Battery size={10} /> Fuel {isConnected ? '∞' : `${Math.round(stamina)}%`}
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                    <motion.div 
                                        className={`h-full ${isConnected ? 'bg-emerald-400' : 'bg-primary-500'}`}
                                        animate={{ width: isConnected ? '100%' : `${stamina}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <button 
                                onClick={() => toggleNeuralLink && toggleNeuralLink(!isConnected)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                    isConnected 
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                <Wifi size={16} className={isConnected ? 'animate-pulse' : ''} />
                                <span className="text-xs font-bold uppercase">{isConnected ? 'Link Active' : 'Offline'}</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full"
                        >
                            {!isOwner && view !== 'monitor' && view !== 'cortex' ? (
                                <AccessDenied />
                            ) : (
                                <>
                                    {view === 'monitor' && <MonitorView stats={brainStats} logs={logs} />}
                                    {view === 'synapse' && simpleTrain && <SynapseView onTrain={simpleTrain} lastLog={logs[0]} />}
                                    {view === 'cortex' && <CortexView logs={logs} />}
                                    {view === 'matrix' && updateDrives && <MatrixView stats={brainStats} onUpdate={updateDrives} />}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// --- VIEW COMPONENTS ---

// Live Terminal: Shows actual WEB_SYNC events mixed with packet noise
const NetworkTerminal = ({ logs }: { logs: CognitiveLogEntry[] }) => {
    const [lines, setLines] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastLogIdRef = useRef<string>('');

    useEffect(() => {
        const interval = setInterval(() => {
            // Check for new real logs first
            const latest = logs[0];
            if (latest && latest.type === 'WEB_SYNC' && latest.id !== lastLogIdRef.current) {
                lastLogIdRef.current = latest.id;
                const msg = `[${new Date(latest.timestamp).toLocaleTimeString()}] >> ${latest.output.toUpperCase()}`;
                setLines(prev => [...prev.slice(-15), msg]);
            } else {
                // Background noise
                const actions = ['PACKET_IN', 'HANDSHAKE', 'SYN_ACK', 'GET_BLOCK', 'PARSING', 'VALIDATING'];
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
                const hash = Math.random().toString(36).substring(7);
                const newLine = `[${new Date().toLocaleTimeString()}] ${randomAction} :: ${hash}`;
                setLines(prev => [...prev.slice(-15), newLine]);
            }
        }, 800);
        return () => clearInterval(interval);
    }, [logs]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    return (
        <div className="absolute top-4 right-4 w-72 h-40 bg-black/80 border border-emerald-500/30 rounded-lg p-3 overflow-hidden pointer-events-none font-mono text-[10px] text-emerald-500 shadow-lg">
            <div className="mb-2 border-b border-emerald-500/20 pb-1 font-bold">NEURAL_UPLINK // ACTIVE</div>
            <div className="space-y-1">
                {lines.map((l, i) => (
                    <div key={i} className={l.includes('>>') ? 'text-white font-bold bg-emerald-500/20' : 'opacity-70'}>
                        {l}
                    </div>
                ))}
            </div>
            <div ref={bottomRef} />
        </div>
    );
};

function MonitorView({ stats, logs }: { stats: any, logs: CognitiveLogEntry[] }) {
    const { isConnected, bandwidthUsage } = stats.connectivity;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-white/10 bg-black/40 relative overflow-hidden h-[400px] flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
                
                {isConnected && <NetworkTerminal logs={logs} />}

                <div className="relative z-10">
                    <motion.div 
                        animate={{ 
                            scale: isConnected ? [1, 1.1, 1] : 1,
                            rotate: isConnected ? 360 : 0
                        }}
                        transition={{ duration: isConnected ? 2 : 0, repeat: Infinity, ease: "linear" }}
                        className={`w-40 h-40 rounded-full border-4 flex items-center justify-center ${isConnected ? 'border-primary-500 shadow-[0_0_50px_rgba(245,158,11,0.3)]' : 'border-white/10'}`}
                    >
                        <Brain size={64} className={isConnected ? 'text-primary-500' : 'text-gray-600'} />
                    </motion.div>
                </div>
                {isConnected && (
                    <div className="absolute bottom-4 left-4 font-mono text-[10px] text-primary-500">
                        <div className="flex items-center gap-2"><Activity size={10} className="animate-pulse"/> BANDWIDTH: {bandwidthUsage} MB/s</div>
                        <div>PACKETS: {Math.floor(Date.now() / 1000)}</div>
                        <div className="text-emerald-400 mt-1">SYNCING KNOWLEDGE GRAPH...</div>
                    </div>
                )}
            </div>
            <div className="space-y-4">
                <MetricCard label="Evolution Stage" value={stats.stage} color="text-purple-400" icon={GitBranch} />
                <MetricCard label="Graph Nodes" value={stats.nodes} color="text-blue-400" icon={Database} />
                <MetricCard label="Total Ops" value={stats.interactions} color="text-emerald-400" icon={Cpu} />
                <MetricCard label="Pending Saves" value={stats.unsaved} color="text-red-400" icon={Save} warning={stats.unsaved > 10} />
            </div>
        </div>
    );
}

function SynapseView({ onTrain, lastLog }: { onTrain: (txt: string) => void, lastLog?: CognitiveLogEntry }) {
    const [input, setInput] = useState('');
    const handleTrain = () => { if (!input.trim()) return; onTrain(input); setInput(''); };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-black text-white mb-2">Knowledge Injection</h3>
                <p className="text-gray-400 text-sm">Teach Crikzling new concepts using formal syntax.</p>
                <div className="flex gap-2 justify-center mt-2 text-[10px] text-gray-500 font-mono">
                    <span className="bg-white/5 px-2 py-1 rounded">Format: Concept := Definition</span>
                    <span className="bg-white/5 px-2 py-1 rounded">Format: Natural language association</span>
                </div>
            </div>
            <div className="glass-card p-1 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. 'arbitrage := The practice of taking advantage of price differences'"
                    className="w-full bg-[#050508] rounded-xl p-6 text-white min-h-[150px] outline-none text-lg resize-none font-mono"
                />
                <div className="p-2 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 ml-2">Characters: {input.length}</span>
                    <button 
                        onClick={handleTrain}
                        disabled={!input.trim()}
                        className="bg-primary-500 hover:bg-primary-400 text-black font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Zap size={18} /> Inject
                    </button>
                </div>
            </div>
            {lastLog && (lastLog.type === 'SYSTEM' || lastLog.type === 'WEB_SYNC') && (
                <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <div className="text-[10px] font-bold text-emerald-500 uppercase mb-1 flex items-center gap-2"><Check size={10} /> Latest Integration</div>
                    <p className="text-sm text-emerald-200 font-mono">{lastLog.output}</p>
                </div>
            )}
        </div>
    );
}

// --- CORTEX VIEW ---
function CortexView({ logs }: { logs: CognitiveLogEntry[] }) {
    const [selected, setSelected] = useState<CognitiveLogEntry | null>(logs[0] || null);

    const formatVal = (val: bigint | undefined) => val ? (Number(formatEther(val))).toFixed(2) : '0.00';

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">
            {/* Sidebar List */}
            <div className="md:col-span-3 bg-black/20 rounded-2xl border border-white/10 overflow-y-auto custom-scrollbar">
                {logs.map(log => (
                    <button 
                        key={log.id} 
                        onClick={() => setSelected(log)}
                        className={`w-full text-left p-4 border-b border-white/5 transition-colors ${selected?.id === log.id ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                log.type === 'INTERACTION' ? 'bg-blue-500/20 text-blue-400' : 
                                log.type === 'WEB_SYNC' ? 'bg-emerald-500/20 text-emerald-400' :
                                'bg-purple-500/20 text-purple-400'
                            }`}>{log.type}</span>
                            <span className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-xs font-bold text-white truncate">{log.input || "System Event"}</div>
                    </button>
                ))}
            </div>

            {/* Analysis Station */}
            <div className="md:col-span-9 glass-card p-6 rounded-2xl border border-white/10 overflow-y-auto bg-black/40 flex flex-col">
                {selected ? (
                    <>
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <div>
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <FileText size={18} className="text-primary-500" /> Interaction Analysis
                                </h3>
                                <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {selected.id}</p>
                            </div>
                            <button 
                                onClick={() => downloadData(`log_${selected.id}.json`, selected)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-all border border-white/5"
                            >
                                <Download size={14} /> Export Record
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* LEFT: FLOW & LOGIC */}
                            <div className="space-y-6">
                                {/* DAPP CONTEXT */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Globe size={12}/> dApp State Context</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <ContextMetric label="Balance" value={formatVal(selected.dappContext?.user_balance)} icon={Wallet} color="text-emerald-400" />
                                        <ContextMetric label="Reputation" value={formatVal(selected.dappContext?.total_reputation)} icon={Award} color="text-cyan-400" />
                                        <ContextMetric label="Orders" value={selected.dappContext?.active_orders_count || 0} icon={Layers} color="text-purple-400" />
                                    </div>
                                </div>

                                {/* THOUGHT PROCESS */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Cognitive Pipeline</h4>
                                    <div className="space-y-2">
                                        {selected.thoughtCycles.map((cycle, i) => (
                                            <div key={i} className="flex gap-3 items-start text-xs bg-white/5 p-3 rounded-lg border border-white/5">
                                                <div className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center font-bold shrink-0">{i+1}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap gap-1 mb-1">
                                                        {cycle.focusConcepts.map(c => <span key={c} className="bg-black/40 px-1.5 rounded text-[9px] text-gray-400">{c}</span>)}
                                                    </div>
                                                    {cycle.simResult && (
                                                        <div className="text-[10px] text-blue-300 bg-blue-900/20 px-2 py-1 rounded mt-1 border-l-2 border-blue-500">
                                                            Sim: {cycle.simResult.scenario}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: ACTION & OUTPUT */}
                            <div className="space-y-6">
                                {/* ACTION PLAN */}
                                {selected.actionPlan && (
                                    <div className={`p-4 rounded-xl border ${selected.actionPlan.requiresBlockchain ? 'bg-amber-900/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                                        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                            {selected.actionPlan.requiresBlockchain ? <AlertTriangle size={12} className="text-amber-500"/> : <ShieldCheck size={12} className="text-gray-500"/>}
                                            Decision Logic
                                        </h4>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-white">{selected.actionPlan.type}</span>
                                            <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-gray-400">Pri: {selected.actionPlan.priority}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 italic">"{selected.actionPlan.reasoning}"</p>
                                    </div>
                                )}

                                {/* OUTPUT */}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Final Output</label>
                                    <div className="text-sm text-gray-300 font-mono bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap leading-relaxed">
                                        {selected.output}
                                    </div>
                                </div>

                                {/* VECTOR SHIFT */}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Cognitive Shift</label>
                                    <div className="flex gap-1 h-16 items-end">
                                        {selected.vectors.response.map((v, i) => (
                                            <div key={i} className="flex-1 bg-primary-500/10 rounded-t-sm relative group h-full flex items-end">
                                                <div className="w-full bg-primary-500 transition-all rounded-t-sm" style={{ height: `${v * 100}%` }} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[9px] text-gray-600 mt-1 uppercase font-bold px-1">
                                        <span>Fin</span><span>Tec</span><span>Soc</span><span>Tim</span><span>Abs</span><span>Rsk</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-600">Select a log entry</div>
                )}
            </div>
        </div>
    );
}

function MatrixView({ stats, onUpdate }: { stats: any, onUpdate: (d: InternalDrives) => void }) {
    const [drives, setDrives] = useState<InternalDrives>(stats.drives);
    const handleChange = (k: keyof InternalDrives, v: number) => setDrives(prev => ({ ...prev, [k]: v }));

    return (
        <div className="max-w-xl mx-auto glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
            <h3 className="text-xl font-bold text-white mb-6">Core Drivers</h3>
            <div className="space-y-6">
                <DriveSlider label="Curiosity" value={drives.curiosity} onChange={(v: number) => handleChange('curiosity', v)} color="purple" />
                <DriveSlider label="Stability" value={drives.stability} onChange={(v: number) => handleChange('stability', v)} color="blue" />
                <DriveSlider label="Efficiency" value={drives.efficiency} onChange={(v: number) => handleChange('efficiency', v)} color="emerald" />
                <DriveSlider label="Social" value={drives.social} onChange={(v: number) => handleChange('social', v)} color="pink" />
            </div>
            <button onClick={() => onUpdate(drives)} className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all">
                Update Weights
            </button>
        </div>