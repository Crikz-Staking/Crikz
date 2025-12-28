import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, Activity, Database, GitBranch, Cpu, 
    X, Search, ChevronRight, Terminal, Lock, Sliders, PlusCircle, Save
} from 'lucide-react';
import { CognitiveLogEntry, InternalDrives } from '@/lib/brain/types';
import { AtomicConcept } from '@/lib/crikzling-atomic-knowledge';

interface NeuralDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    logs: CognitiveLogEntry[];
    brainStats: any;
    isOwner: boolean;
    updateDrives?: (drives: InternalDrives) => void;
    trainConcept?: (concept: AtomicConcept) => void;
}

export default function NeuralDashboard({ 
    isOpen, onClose, logs, brainStats, isOwner, updateDrives, trainConcept 
}: NeuralDashboardProps) {
    const [selectedLog, setSelectedLog] = useState<CognitiveLogEntry | null>(null);
    const [view, setView] = useState<'analysis' | 'controls' | 'training' | 'raw'>('analysis');

    // Auto-select newest log on open or update
    useEffect(() => {
        if (isOpen && logs.length > 0 && !selectedLog) {
            setSelectedLog(logs[0]);
        }
    }, [isOpen, logs]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col md:flex-row overflow-hidden font-sans">
            {/* Sidebar List */}
            <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-[#050508]">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="font-black text-white flex items-center gap-2 text-sm tracking-wider">
                        <Brain className="text-primary-500" size={18} /> NEURAL LAB <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">v5.1</span>
                    </h2>
                    <button onClick={onClose} className="md:hidden text-gray-500"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 text-xs">
                            Waiting for neural activity...
                        </div>
                    ) : (
                        logs.map((log) => (
                            <button
                                key={log.id}
                                onClick={() => { setSelectedLog(log); setView('analysis'); }}
                                className={`w-full text-left p-4 border-b border-white/5 transition-colors flex justify-between items-start group ${
                                    selectedLog?.id === log.id ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[9px] font-bold px-1.5 rounded ${
                                            log.type === 'DREAM' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {log.type}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-300 font-bold truncate group-hover:text-white">
                                        {isOwner ? log.input : '*** REDACTED ***'}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mt-1">
                                        &rarr; {log.output ? log.output.substring(0, 30) : 'Processing...'}...
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
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <TabButton active={view === 'analysis'} onClick={() => setView('analysis')} icon={Activity} label="Analysis" />
                        <TabButton active={view === 'controls'} onClick={() => setView('controls')} icon={Sliders} label="Cortex Control" locked={!isOwner} />
                        <TabButton active={view === 'training'} onClick={() => setView('training')} icon={Database} label="Training" locked={!isOwner} />
                        <TabButton active={view === 'raw'} onClick={() => setView('raw')} icon={Terminal} label="Raw Inspector" locked={!isOwner} />
                    </div>
                    <button onClick={onClose} className="hidden md:block p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content View */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                    {!isOwner && view !== 'analysis' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                            <div className="text-center p-8 border border-red-500/30 bg-red-900/10 rounded-2xl max-w-md">
                                <Lock size={48} className="text-red-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Architect Access Only</h3>
                                <p className="text-gray-400 text-sm">Neural parameter adjustment is restricted to the contract owner.</p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view + (selectedLog?.id || 'none')}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full"
                        >
                            {view === 'analysis' && selectedLog && <AnalysisView log={selectedLog} brainStats={brainStats} />}
                            {view === 'controls' && <ControlView stats={brainStats} onUpdate={updateDrives!} />}
                            {view === 'training' && <TrainingView onTrain={trainConcept!} />}
                            {view === 'raw' && selectedLog && <RawView data={selectedLog} />}
                            
                            {!selectedLog && view === 'analysis' && (
                                <div className="h-full flex items-center justify-center text-gray-600">
                                    <div className="text-center">
                                        <Activity size={48} className="mx-auto mb-4 opacity-20"/>
                                        <p>Select an event to inspect neural pathways.</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function TabButton({ active, onClick, icon: Icon, label, locked }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                active 
                ? 'bg-primary-500 text-black border-primary-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:border-white/10'
            }`}
        >
            <Icon size={14} /> {label} {locked && <Lock size={10} className="ml-1 opacity-50"/>}
        </button>
    );
}

// 1. ANALYSIS VIEW (Combines Trace, Graph, and Vector)
function AnalysisView({ log, brainStats }: { log: CognitiveLogEntry, brainStats: any }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Column: Trace & Metrics */}
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Intent" value={log.intent} color="text-purple-400" />
                    <StatCard label="Latency" value={`${log.executionTimeMs}ms`} color="text-emerald-400" />
                    <StatCard label="Stability Delta" value={log.emotionalShift.toFixed(2)} color="text-blue-400" />
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-black/20">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                        <GitBranch size={14} /> Reasoning Tree
                    </h3>
                    <div className="space-y-4 relative">
                        <div className="absolute left-[11px] top-4 bottom-4 w-px bg-white/10" />
                        {log.thoughtCycles.map((cycle, i) => (
                            <div key={i} className="relative flex gap-4 group">
                                <div className="w-6 h-6 rounded-full bg-[#12121A] border border-primary-500/50 flex items-center justify-center text-[10px] font-bold text-primary-500 z-10 group-hover:scale-110 transition-transform">
                                    {cycle.cycleIndex}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {cycle.focusConcepts.map(c => (
                                            <span key={c} className="text-[9px] bg-primary-500/10 text-primary-500 px-1.5 py-0.5 rounded border border-primary-500/20">{c}</span>
                                        ))}
                                    </div>
                                    {cycle.simResult && (
                                        <div className="mb-2 text-[10px] text-blue-400 bg-blue-900/10 px-2 py-1 rounded border-l-2 border-blue-500">
                                            Sim: {cycle.simResult.scenario} ({cycle.simResult.riskLevel.toFixed(1)} Risk)
                                        </div>
                                    )}
                                    {cycle.newAssociations.length > 0 && (
                                        <div className="text-[10px] text-gray-500">
                                            &rarr; Linked: {cycle.newAssociations.join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Vectors & Graph */}
            <div className="space-y-6">
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-black/20">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                        <Activity size={14} /> Vector Shift (Input vs Output)
                    </h3>
                    <div className="h-48 flex items-end justify-between gap-2 px-4 relative">
                        {/* Bars */}
                        {['FIN','TEC','SOC','TIM','ABS','RSK'].map((label, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                                <div className="w-full relative h-full flex items-end justify-center">
                                    {/* Input (Ghost) */}
                                    <div 
                                        className="w-1/2 bg-white/10 absolute bottom-0 rounded-t-sm transition-all group-hover:bg-white/20"
                                        style={{ height: `${log.vectors.input[i] * 100}%` }}
                                    />
                                    {/* Output (Active) */}
                                    <div 
                                        className="w-1/2 bg-primary-500/80 absolute bottom-0 rounded-t-sm backdrop-blur-sm"
                                        style={{ height: `${log.vectors.response[i] * 100}%` }}
                                    />
                                </div>
                                <span className="text-[9px] font-bold text-gray-500">{label}</span>
                                
                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 border border-white/10">
                                    In: {log.vectors.input[i].toFixed(2)} | Out: {log.vectors.response[i].toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-black/20 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-4 left-4 text-xs font-bold text-gray-500 uppercase">Active Concept Node</div>
                    <div className="relative w-48 h-48">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_20px_white] z-10" />
                        {log.activeNodes.slice(0, 10).map((node, i) => {
                            const angle = (i / Math.min(10, log.activeNodes.length)) * Math.PI * 2;
                            return (
                                <div key={node} className="absolute top-1/2 left-1/2 origin-left flex items-center" style={{ width: '100px', transform: `translate(0, 0) rotate(${angle}rad)` }}>
                                    <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
                                    <div className="absolute right-0 bg-black/80 px-2 py-0.5 rounded text-[9px] text-primary-500 border border-white/10" style={{ transform: `rotate(-${angle}rad)` }}>
                                        {node}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// 2. CONTROLS VIEW (Sliders)
function ControlView({ stats, onUpdate }: { stats: any, onUpdate: (d: InternalDrives) => void }) {
    const [drives, setDrives] = useState<InternalDrives>(stats.drives);

    const handleChange = (key: keyof InternalDrives, val: number) => {
        const newDrives = { ...drives, [key]: val };
        setDrives(newDrives);
    };

    const handleSave = () => onUpdate(drives);

    return (
        <div className="h-full flex flex-col max-w-2xl mx-auto">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">Neuro-Plasticity Controls</h3>
                <p className="text-sm text-gray-400">Adjust the weighting of internal drives to alter Crikzling's behavior patterns.</p>
            </div>

            <div className="space-y-6 bg-black/20 p-8 rounded-2xl border border-white/10">
                <DriveSlider label="Curiosity" value={drives.curiosity} color="accent-purple" onChange={(v) => handleChange('curiosity', v)} />
                <DriveSlider label="Stability" value={drives.stability} color="accent-cyan" onChange={(v) => handleChange('stability', v)} />
                <DriveSlider label="Efficiency" value={drives.efficiency} color="emerald-500" onChange={(v) => handleChange('efficiency', v)} />
                <DriveSlider label="Social" value={drives.social} color="pink-500" onChange={(v) => handleChange('social', v)} />
                <DriveSlider label="Energy" value={drives.energy} color="primary-500" onChange={(v) => handleChange('energy', v)} />
            </div>

            <button onClick={handleSave} className="mt-6 w-full py-4 bg-primary-500 text-black font-bold rounded-xl hover:bg-primary-400 flex items-center justify-center gap-2">
                <Save size={18} /> Update Matrix
            </button>
        </div>
    );
}

function DriveSlider({ label, value, color, onChange }: any) {
    return (
        <div>
            <div className="flex justify-between mb-2 text-xs font-bold uppercase">
                <span className={`text-${color}`}>{label}</span>
                <span className="text-white">{value}%</span>
            </div>
            <input 
                type="range" min="0" max="100" value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            />
        </div>
    );
}

// 3. TRAINING VIEW (Forms)
function TrainingView({ onTrain }: { onTrain: (c: AtomicConcept) => void }) {
    const [id, setId] = useState('');
    const [essence, setEssence] = useState('');
    const [domain, setDomain] = useState('TECHNICAL');

    const handleSubmit = () => {
        if (!id || !essence) return;
        const concept: AtomicConcept = {
            id: id.toLowerCase().replace(/\s/g, '_'),
            essence,
            semanticField: [id],
            examples: [],
            abstractionLevel: 0.5,
            technical_depth: 0.5,
            domain: domain as any
        };
        onTrain(concept);
        setId('');
        setEssence('');
    };

    return (
        <div className="h-full max-w-2xl mx-auto flex flex-col justify-center">
            <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <PlusCircle className="text-emerald-500" /> Inject Knowledge
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Concept ID (e.g., 'yield_farming')</label>
                        <input value={id} onChange={e => setId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" placeholder="unique_id" />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Essence (Definition)</label>
                        <textarea value={essence} onChange={e => setEssence(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white h-32 focus:border-emerald-500 outline-none" placeholder="The fundamental nature of..." />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Domain</label>
                        <select value={domain} onChange={e => setDomain(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none">
                            <option value="FINANCIAL">Financial</option>
                            <option value="TECHNICAL">Technical</option>
                            <option value="SOCIAL">Social</option>
                            <option value="PHILOSOPHICAL">Philosophical</option>
                        </select>
                    </div>

                    <button onClick={handleSubmit} disabled={!id || !essence} className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 mt-4 disabled:opacity-50">
                        Inject into Graph
                    </button>
                </div>
            </div>
        </div>
    );
}

// 4. RAW VIEW
function RawView({ data }: { data: any }) {
    return (
        <div className="h-full bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-gray-300 overflow-auto">
            <pre>{JSON.stringify(data, null, 2)}</pre>
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