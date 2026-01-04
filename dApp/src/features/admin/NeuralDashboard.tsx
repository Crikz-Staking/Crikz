import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, Activity, Wifi, Database, GitBranch, Cpu, 
    X, Sliders, Lock, Save, Battery, Download, FileText,
    Wallet, Award, Layers, ShieldCheck, AlertTriangle,
    HardDrive, History, RotateCcw, RefreshCw, Calendar, ChevronLeft, ChevronRight,
    MessageSquare, Terminal
} from 'lucide-react';
import { CognitiveLogEntry, InternalDrives } from '@/lib/brain/types';
import { formatEther } from 'viem';
import { useMemoryTimeline, MemorySnapshot } from '@/hooks/web3/useMemoryTimeline';

// --- UTILITY ---
const downloadData = (filename: string, data: any) => {
    try {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 200);
    } catch (e) {
        console.error("Export failed:", e);
    }
};

interface NeuralDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    logs: CognitiveLogEntry[];
    brainStats: any;
    isOwner: boolean;
    updateDrives?: (drives: InternalDrives) => void;
    toggleNeuralLink?: (active: boolean) => void;
    crystallize?: () => void;
    uploadFile?: (content: string) => void;
    isSyncing?: boolean;
    trainConcept?: any;
    simpleTrain?: any;
}

export default function NeuralDashboard({ 
    isOpen, onClose, logs, brainStats, isOwner, 
    updateDrives, toggleNeuralLink,
    crystallize, isSyncing
}: NeuralDashboardProps) {
    const [view, setView] = useState<'monitor' | 'cortex' | 'matrix' | 'timeline'>('monitor');
    
    const isConnected = brainStats?.connectivity?.isConnected || false;
    const stamina = brainStats?.connectivity?.stamina || 0;

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
            
            {/* SIDEBAR */}
            <div className="w-full md:w-20 md:border-r border-b md:border-b-0 border-white/10 bg-[#050508] flex md:flex-col items-center py-4 gap-4 z-20">
                <div className="md:mb-4">
                    <Brain className="text-primary-500" size={32} />
                </div>
                
                <NavButton active={view === 'monitor'} onClick={() => setView('monitor')} icon={Activity} label="Monitor" />
                <NavButton active={view === 'cortex'} onClick={() => setView('cortex')} icon={Database} label="Cortex" />
                <NavButton active={view === 'matrix'} onClick={() => setView('matrix')} icon={Sliders} label="Matrix" locked={!isOwner} />
                <NavButton active={view === 'timeline'} onClick={() => setView('timeline')} icon={History} label="History" />

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

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0F] relative">
                {/* Status Bar */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#050508]">
                    <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                        {view} Station <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 font-mono">v6.0.0 (LLM)</span>
                    </h2>
                    
                    {isOwner && (
                        <div className="flex items-center gap-4">
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
                            {!isOwner && view !== 'monitor' && view !== 'cortex' && view !== 'timeline' ? (
                                <AccessDenied />
                            ) : (
                                <>
                                    {view === 'monitor' && <MonitorView stats={brainStats} logs={logs} crystallize={crystallize} isSyncing={isSyncing} />}
                                    {view === 'cortex' && <CortexView logs={logs} />}
                                    {view === 'matrix' && updateDrives && <MatrixView stats={brainStats} onUpdate={updateDrives} />}
                                    {view === 'timeline' && <TimelineView isOwner={isOwner} />}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// --- VIEWS ---

function CortexView({ logs }: { logs: CognitiveLogEntry[] }) {
    const interactions = useMemo(() => logs.filter(l => l.type === 'INTERACTION'), [logs]);
    const systemLogs = useMemo(() => logs.filter(l => l.type !== 'INTERACTION'), [logs]);
    const [selected, setSelected] = useState<CognitiveLogEntry | null>(interactions[0] || systemLogs[0] || null);

    const formatVal = (val: bigint | undefined) => val ? (Number(formatEther(val))).toFixed(2) : '0.00';

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">
            <div className="md:col-span-3 bg-[#050508] rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Activity Log</h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {interactions.length > 0 && (
                        <div className="mb-2">
                            <div className="px-4 py-2 text-[10px] font-bold text-primary-500 uppercase bg-primary-500/5 flex items-center gap-2">
                                <MessageSquare size={10} /> Neural Interactions
                            </div>
                            {interactions.map(log => (
                                <LogItem key={log.id} log={log} selectedId={selected?.id} onClick={() => setSelected(log)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
                            <button onClick={() => downloadData(`log_${selected.id}.json`, selected)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all border border-white/5 hover:border-white/20">
                                <Download size={14} /> Download Entry
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Layers size={12}/> dApp State Context</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <ContextMetric label="Balance" value={formatVal(selected.dappContext?.user_balance)} icon={Wallet} color="text-emerald-400" />
                                        <ContextMetric label="Reputation" value={formatVal(selected.dappContext?.total_reputation)} icon={Award} color="text-cyan-400" />
                                        <ContextMetric label="Orders" value={selected.dappContext?.active_orders_count || 0} icon={Layers} color="text-purple-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
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

                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Final Output</label>
                                    <div className="text-sm text-gray-300 font-mono bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap leading-relaxed">
                                        {selected.output}
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

function TimelineView({ isOwner }: { isOwner: boolean }) {
    const { timeline, loading, refresh } = useMemoryTimeline();
    const [selectedDate, setSelectedDate] = useState<string>('');

    const { grouped, availableDates } = useMemo(() => {
        const groups: Record<string, MemorySnapshot[]> = {};
        timeline.forEach(snap => {
            const dateStr = new Date(snap.timestamp * 1000).toDateString();
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(snap);
        });
        const dates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        return { grouped: groups, availableDates: dates };
    }, [timeline]);

    React.useEffect(() => {
        if (availableDates.length > 0 && !availableDates.includes(selectedDate)) {
            setSelectedDate(availableDates[0]);
        }
    }, [availableDates]);

    const currentIndex = availableDates.indexOf(selectedDate);
    const currentSnapshots = grouped[selectedDate] || [];

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-background-elevated h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <History className="text-purple-500" /> Neural Timeline
                    </h3>
                    <p className="text-xs text-gray-500">{timeline.length} snapshots on-chain.</p>
                </div>
                <button onClick={refresh} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {availableDates.length > 0 ? (
                <div className="flex items-center justify-between bg-black/30 p-2 rounded-xl mb-4 border border-white/5">
                    <button onClick={() => setSelectedDate(availableDates[currentIndex + 1])} disabled={currentIndex >= availableDates.length - 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronLeft size={16}/></button>
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Calendar size={14} className="text-purple-500"/> 
                        {selectedDate === new Date().toDateString() ? 'Today' : selectedDate}
                    </div>
                    <button onClick={() => setSelectedDate(availableDates[currentIndex - 1])} disabled={currentIndex <= 0} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronRight size={16}/></button>
                </div>
            ) : (
                <div className="bg-black/30 p-4 rounded-xl mb-4 border border-white/5 text-center text-xs text-gray-500">
                    No history found.
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#12121A] z-10">
                        <tr className="text-[10px] font-bold text-gray-500 uppercase border-b border-white/10">
                            <th className="py-3 pl-4">ID</th>
                            <th className="py-3">Time</th>
                            <th className="py-3">CID</th>
                            <th className="py-3 pr-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {currentSnapshots.map((snap) => (
                            <tr key={snap.id} className="hover:bg-white/5 transition-colors group">
                                <td className="py-3 pl-4 text-sm font-mono text-gray-400">#{snap.id}</td>
                                <td className="py-3 text-xs text-white">{new Date(snap.timestamp * 1000).toLocaleTimeString()}</td>
                                <td className="py-3 text-xs font-mono text-gray-500 truncate max-w-[100px]">{snap.ipfsCid.substring(0, 10)}...</td>
                                <td className="py-3 pr-4 text-right">
                                    {isOwner && (
                                        <button className="px-3 py-1 bg-white/5 text-gray-400 rounded text-xs font-bold cursor-not-allowed opacity-50">
                                            Archived
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function MonitorView({ stats, logs, crystallize, isSyncing }: { stats: any, logs: CognitiveLogEntry[], crystallize?: () => void, isSyncing?: boolean }) {
    const isConnected = stats?.connectivity?.isConnected || false;
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-white/10 bg-black/40 relative overflow-hidden h-[400px] flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
                
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <motion.div 
                        animate={{ 
                            scale: isConnected ? [1, 1.1, 1] : 1,
                            rotate: isConnected ? 360 : 0
                        }}
                        transition={{ duration: isConnected ? 2 : 0, repeat: Infinity, ease: "linear" }}
                        className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${isConnected ? 'border-primary-500 shadow-[0_0_50px_rgba(245,158,11,0.3)]' : 'border-white/10'}`}
                    >
                        <Brain size={48} className={isConnected ? 'text-primary-500' : 'text-gray-600'} />
                    </motion.div>

                    {crystallize && (
                        <button 
                            onClick={crystallize}
                            disabled={isSyncing}
                            className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-500 rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            {isSyncing ? <RefreshCw className="animate-spin" /> : <Save />}
                            {isSyncing ? 'CRYSTALLIZING...' : 'CRYSTALLIZE MEMORY'}
                        </button>
                    )}
                </div>
            </div>
            <div className="space-y-4">
                <MetricCard label="Evolution Stage" value={stats?.stage || 'GENESIS'} color="text-purple-400" icon={GitBranch} />
                <MetricCard label="Total Ops" value={stats?.interactions || 0} color="text-emerald-400" icon={Cpu} />
                <MetricCard label="Pending Saves" value={stats?.unsaved || 0} color="text-red-400" icon={Save} warning={(stats?.unsaved || 0) > 10} />
            </div>
        </div>
    );
}

function MatrixView({ stats, onUpdate }: { stats: any, onUpdate: (d: InternalDrives) => void }) {
    const [drives, setDrives] = useState<InternalDrives>(stats.drives);
    
    // FIX: Explicitly type 'prev' to InternalDrives
    const handleChange = (k: keyof InternalDrives, v: number) => setDrives((prev: InternalDrives) => ({ ...prev, [k]: v }));

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
    );
}

// --- HELPERS ---

function NavButton({ active, onClick, icon: Icon, label, locked }: any) {
    return (
        <button
            onClick={onClick}
            className={`p-3 rounded-xl transition-all relative group ${
                active ? 'bg-primary-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
            title={label}
        >
            <Icon size={20} />
            {locked && <Lock size={10} className="absolute top-1 right-1 text-red-400" />}
            <span className="md:hidden ml-2">{label}</span>
        </button>
    );
}

function MetricCard({ label, value, color, icon: Icon, warning }: any) {
    return (
        <div className={`p-4 rounded-2xl bg-black/40 border ${warning ? 'border-red-500/50 animate-pulse' : 'border-white/5'} flex items-center justify-between`}>
            <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">{label}</div>
                <div className={`text-xl font-black ${color}`}>{value}</div>
            </div>
            <div className={`p-2 rounded-lg bg-white/5 ${color.replace('text', 'text-opacity-50')}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}

function DriveSlider({ label, value, onChange, color }: any) {
    return (
        <div>
            <div className="flex justify-between mb-2 text-xs font-bold uppercase">
                <span className={`text-${color}-400`}>{label}</span>
                <span className="text-white">{value}%</span>
            </div>
            <input 
                type="range" min="0" max="100" value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            />
        </div>
    );
}

function ContextMetric({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-black/30 p-2 rounded-lg text-center">
            <div className={`flex justify-center mb-1 ${color}`}><Icon size={14}/></div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">{label}</div>
            <div className="text-xs font-bold text-white">{value}</div>
        </div>
    );
}

const LogItem = ({ log, selectedId, onClick }: { log: CognitiveLogEntry, selectedId?: string, onClick: () => void }) => {
    const isSelected = log.id === selectedId;
    return (
        <button 
            onClick={onClick}
            className={`w-full text-left p-4 border-b border-white/5 transition-colors ${isSelected ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
        >
            <div className="flex justify-between items-center mb-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    log.type === 'INTERACTION' ? 'bg-blue-500/20 text-blue-400' : 
                    log.type === 'WEB_SYNC' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-purple-500/20 text-purple-400'
                }`}>{log.intent || log.type}</span>
                <span className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="text-xs font-bold text-white truncate">{log.input || "System Event"}</div>
        </button>
    );
};

function AccessDenied() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Lock size={48} className="text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-white">Access Restricted</h3>
            <p className="text-gray-500 mt-2 max-w-xs">Only the architect address can access this neural interface.</p>
        </div>
    );
}