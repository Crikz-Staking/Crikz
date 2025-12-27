import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Pause, Volume2, VolumeX, Maximize, X, 
    Upload, Radio, Film, Globe, User, ShieldCheck, 
    Activity, Signal, Share2, Heart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uploadToIPFS } from '@/lib/ipfs-service';

// --- TYPES & MOCK DATA ---

type MediaType = 'video' | 'audio';
type Channel = 'global' | 'verified' | 'personal';

interface MediaItem {
    id: string;
    type: MediaType;
    title: string;
    creator: string;
    views: number;
    timestamp: number;
    cid: string;
    url: string;
    verified: boolean; // Simulating Chainlink Verification
    channel: Channel;
    description: string;
}

const MOCK_DB: MediaItem[] = [
    {
        id: 'v1', type: 'video', channel: 'verified',
        title: 'The Future of DeFi 2.0', creator: 'Vitalik_Fan',
        views: 1204, timestamp: Date.now() - 1000000,
        cid: 'QmXyZ...', verified: true,
        url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4', // Public test video
        description: 'An in-depth look at how algorithmic reputation models are reshaping decentralized finance governance structures.'
    },
    {
        id: 'v2', type: 'video', channel: 'global',
        title: 'Building on Crikz Protocol', creator: 'DevDAO',
        views: 85, timestamp: Date.now() - 500000,
        cid: 'QmAbC...', verified: false,
        url: 'https://media.w3.org/2010/05/bunny/trailer.mp4', // Public test video
        description: 'Tutorial on integrating the Fibonacci yield hooks into your dApp.'
    },
    {
        id: 'a1', type: 'audio', channel: 'verified',
        title: 'Crypto Morning Update', creator: 'DailyGwei',
        views: 4500, timestamp: Date.now() - 200000,
        cid: 'QmAud...', verified: true,
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Public test audio
        description: 'Market analysis, gas prices, and the latest governance proposals.'
    },
    {
        id: 'a2', type: 'audio', channel: 'global',
        title: 'Lofi Coding Beats', creator: 'Anon',
        views: 9999, timestamp: Date.now() - 8000000,
        cid: 'QmLofi...', verified: false,
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        description: 'Focus music for smart contract development.'
    }
];

// --- SUB-COMPONENTS ---

const PlayerOverlay = ({ item, onClose }: { item: MediaItem, onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [verified, setVerified] = useState(false);

    // Simulate Chainlink Verification
    useEffect(() => {
        const timer = setTimeout(() => setVerified(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    const togglePlay = () => {
        if (item.type === 'video' && videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
        } else if (item.type === 'audio' && audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
        >
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex justify-between items-center px-6">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-white truncate max-w-md">{item.title}</h3>
                    {item.verified && (
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${verified ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' : 'bg-white/5 text-gray-500'}`}>
                            {verified ? <ShieldCheck size={12}/> : <Activity size={12} className="animate-spin"/>}
                            {verified ? 'Chainlink Verified' : 'Verifying Source...'}
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={24}/></button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-radial from-primary-500/10 to-transparent opacity-20 pointer-events-none" />

                {item.type === 'video' ? (
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <video 
                            ref={videoRef}
                            src={item.url} 
                            className="w-full h-full object-contain"
                            controls={false}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />
                        {/* Custom Controls Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-6 opacity-0 hover:opacity-100 transition-opacity">
                            <button onClick={togglePlay} className="p-4 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all transform hover:scale-110">
                                {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-3xl glass-card p-12 rounded-3xl border border-white/10 flex flex-col items-center text-center relative">
                        <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-primary-500/20 to-accent-purple/20 flex items-center justify-center mb-8 border-4 border-white/5 shadow-[0_0_50px_rgba(167,139,250,0.2)] animate-pulse-slow">
                            <Volume2 size={64} className="text-white opacity-80" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">{item.title}</h2>
                        <p className="text-gray-400 mb-8 font-mono text-sm">Creator: {item.creator} • IPFS: {item.cid.substring(0,8)}...</p>
                        
                        <audio ref={audioRef} src={item.url} onEnded={() => setIsPlaying(false)} />
                        
                        <div className="flex gap-4">
                            <button onClick={togglePlay} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-glow-lg">
                                {isPlaying ? <Pause size={24} fill="black"/> : <Play size={24} fill="black" className="ml-1"/>}
                            </button>
                        </div>
                        
                        {/* Visualizer Simulation */}
                        <div className="flex gap-1 h-12 items-center mt-12 opacity-50">
                            {Array.from({length: 40}).map((_, i) => (
                                <motion.div 
                                    key={i}
                                    className="w-1 bg-accent-cyan rounded-full"
                                    animate={{ height: isPlaying ? [10, Math.random() * 40 + 10, 10] : 4 }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Info Footer */}
            <div className="h-20 bg-background-elevated border-t border-white/5 px-8 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Data Source</span>
                    <span className="font-mono text-xs text-accent-emerald flex items-center gap-1">
                        <Globe size={10} /> Decentralized Storage Network (DSN)
                    </span>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">
                        <Share2 size={16} /> Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors text-pink-500">
                        <Heart size={16} /> Tip Creator
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---

export default function MediaCenter({ type, dynamicColor }: { type: MediaType, dynamicColor: string }) {
    const [activeChannel, setActiveChannel] = useState<Channel>('global');
    const [mediaItems, setMediaItems] = useState<MediaItem[]>(MOCK_DB);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Filter Items
    const filteredItems = mediaItems.filter(item => {
        const typeMatch = item.type === type;
        const channelMatch = activeChannel === 'global' ? true : item.channel === activeChannel;
        return typeMatch && channelMatch;
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const toastId = toast.loading('Encrypting & Pinning to IPFS...');

        try {
            const url = await uploadToIPFS(file);
            
            // Create new item
            const newItem: MediaItem = {
                id: `u-${Date.now()}`,
                type: type, // Matches current view
                channel: 'personal',
                title: file.name.split('.')[0],
                creator: 'You (0x...123)',
                views: 0,
                timestamp: Date.now(),
                cid: `Qm${Math.random().toString(36).substring(7)}`,
                verified: true,
                url: url,
                description: 'User uploaded content'
            };

            setMediaItems(prev => [newItem, ...prev]);
            setActiveChannel('personal'); // Switch to personal tab to show it
            toast.success('Broadcast Live!', { id: toastId });
        } catch (err) {
            toast.error('Upload Failed', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-[600px] relative">
            <AnimatePresence>
                {selectedItem && <PlayerOverlay item={selectedItem} onClose={() => setSelectedItem(null)} />}
            </AnimatePresence>

            {/* Top Bar: Channels & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                    {[
                        { id: 'global', label: 'Global Feed', icon: Globe },
                        { id: 'verified', label: 'Verified', icon: ShieldCheck },
                        { id: 'personal', label: 'My Uploads', icon: User }
                    ].map((ch) => (
                        <button
                            key={ch.id}
                            onClick={() => setActiveChannel(ch.id as Channel)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeChannel === ch.id 
                                ? 'bg-white/10 text-white shadow-lg' 
                                : 'text-gray-500 hover:text-white'
                            }`}
                        >
                            <ch.icon size={14} style={{ color: activeChannel === ch.id ? dynamicColor : 'currentColor' }} />
                            {ch.label}
                        </button>
                    ))}
                </div>

                <div className="relative group">
                    <input 
                        type="file" 
                        accept={type === 'video' ? "video/*" : "audio/*"}
                        className="hidden" 
                        id="media-upload"
                        onChange={handleUpload}
                        disabled={isUploading}
                    />
                    <label 
                        htmlFor="media-upload"
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                            isUploading ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-primary-500 text-black hover:bg-primary-400'
                        }`}
                    >
                        {isUploading ? (
                            <><RefreshCw size={16} className="animate-spin"/> Processing...</>
                        ) : (
                            <><Upload size={16} /> Upload {type === 'video' ? 'Video' : 'Audio'}</>
                        )}
                    </label>
                </div>
            </div>

            {/* Content Grid */}
            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        {type === 'video' ? <Film size={32} className="text-gray-600"/> : <Radio size={32} className="text-gray-600"/>}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Signal Found</h3>
                    <p className="text-gray-500 text-sm max-w-xs">There are no broadcasts in this channel yet. Be the first to upload.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => setSelectedItem(item)}
                            className="glass-card rounded-2xl overflow-hidden border border-white/10 group cursor-pointer bg-background-elevated hover:border-primary-500/30 transition-all hover:-translate-y-1"
                        >
                            {/* Thumbnail Area */}
                            <div className="aspect-video bg-black/60 relative flex items-center justify-center overflow-hidden">
                                {type === 'video' ? (
                                    <video src={item.url} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-black flex items-center justify-center">
                                        <Signal size={40} className="text-indigo-400 opacity-50" />
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center pl-1 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-black transition-all">
                                        <Play size={20} className="text-white group-hover:text-black" fill="currentColor" />
                                    </div>
                                </div>

                                {item.verified && (
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-bold text-accent-cyan flex items-center gap-1 border border-white/10">
                                        <ShieldCheck size={10} /> VERIFIED
                                    </div>
                                )}
                                
                                <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300">
                                    {type === 'video' ? '12:04' : '45:00'}
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="p-4">
                                <h4 className="text-white font-bold truncate mb-1 group-hover:text-primary-500 transition-colors">{item.title}</h4>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><User size={10}/> {item.creator}</span>
                                    <span>{item.views.toLocaleString()} views</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}