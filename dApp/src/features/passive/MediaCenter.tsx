import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Pause, Volume2, X, Upload, Radio, Film, Globe, User, 
    ShieldCheck, RefreshCw, Share2, Heart, Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { useMediaRegistry, Web3MediaItem } from '@/hooks/web3/useMediaRegistry';
import { formatTokenAmount, shortenAddress } from '@/lib/utils';

// --- TYPES ---
type MediaType = 'video' | 'audio';

// --- PLAYER COMPONENT ---
const PlayerOverlay = ({ item, onClose }: { item: Web3MediaItem, onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Resolve Gateway (Using a public gateway for the demo)
    const url = `https://gateway.pinata.cloud/ipfs/${item.cid}`;

    const togglePlay = () => {
        const media = item.mediaType === 0 ? videoRef.current : audioRef.current;
        if (media) {
            if (isPlaying) media.pause();
            else media.play();
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
        >
            <div className="h-16 border-b border-white/10 flex justify-between items-center px-6">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-white truncate max-w-md">{item.title}</h3>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                        <Database size={12}/> On-Chain
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={24}/></button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                {item.mediaType === 0 ? (
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <video 
                            ref={videoRef} src={url} className="w-full h-full object-contain"
                            controls={true} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
                        />
                    </div>
                ) : (
                    <div className="w-full max-w-3xl glass-card p-12 rounded-3xl border border-white/10 flex flex-col items-center text-center">
                        <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-primary-500/20 to-accent-purple/20 flex items-center justify-center mb-8 border-4 border-white/5 animate-pulse-slow">
                            <Volume2 size={64} className="text-white opacity-80" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">{item.title}</h2>
                        <p className="text-gray-400 mb-8 font-mono text-sm">Author: {shortenAddress(item.author)}</p>
                        <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} controls className="w-full" />
                    </div>
                )}
            </div>

            <div className="h-20 bg-background-elevated border-t border-white/5 px-8 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Immutable CID</span>
                    <span className="font-mono text-xs text-accent-emerald">{item.cid}</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors text-pink-500">
                    <Heart size={16} /> Tip Author
                </button>
            </div>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---
export default function MediaCenter({ type, dynamicColor }: { type: MediaType, dynamicColor: string }) {
    const { mediaList, isLoading, publishToBlockchain, isPublishing } = useMediaRegistry();
    const [selectedItem, setSelectedItem] = useState<Web3MediaItem | null>(null);
    const [isUploadingIPFS, setIsUploadingIPFS] = useState(false);

    // Convert string type to int for filtering (0=Video, 1=Audio)
    const targetType = type === 'video' ? 0 : 1;
    const filteredItems = mediaList.filter(item => item.mediaType === targetType);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingIPFS(true);
        const toastId = toast.loading('1/2 Uploading to IPFS...');

        try {
            // 1. Upload to IPFS
            const url = await uploadToIPFS(file);
            // Extract mock CID from the blob URL for demo purposes 
            // (In prod, uploadToIPFS returns the actual CID string like "Qm...")
            const fakeCid = `Qm${Math.random().toString(36).substr(2, 15)}...`; 
            
            toast.loading('2/2 Waiting for Wallet Signature...', { id: toastId });
            
            // 2. Publish to Blockchain
            publishToBlockchain(fakeCid, file.name, type);
            
            // Note: The toast success will be handled by the hook upon tx confirmation
        } catch (err) {
            toast.error('Upload Failed', { id: toastId });
        } finally {
            setIsUploadingIPFS(false);
        }
    };

    return (
        <div className="min-h-[600px] relative">
            <AnimatePresence>
                {selectedItem && <PlayerOverlay item={selectedItem} onClose={() => setSelectedItem(null)} />}
            </AnimatePresence>

            {/* Header Actions */}
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {type === 'video' ? <Film className="text-primary-500"/> : <Radio className="text-accent-purple"/>}
                    Decentralized Feed
                </h3>

                <div className="relative group">
                    <input 
                        type="file" 
                        accept={type === 'video' ? "video/*" : "audio/*"}
                        className="hidden" 
                        id="media-upload"
                        onChange={handleUpload}
                        disabled={isUploadingIPFS || isPublishing}
                    />
                    <label 
                        htmlFor="media-upload"
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                            (isUploadingIPFS || isPublishing) 
                            ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                            : 'bg-primary-500 text-black hover:bg-primary-400'
                        }`}
                    >
                        {isUploadingIPFS ? 'Uploading IPFS...' : isPublishing ? 'Confirming TX...' : 'Upload New'}
                        <Upload size={16} />
                    </label>
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin text-primary-500"><RefreshCw size={32}/></div></div>
            ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Globe size={32} className="text-gray-600"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Registry Empty</h3>
                    <p className="text-gray-500 text-sm max-w-xs">Be the first to publish a {type} to the Crikz smart contract.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <motion.div
                            key={item.id.toString()}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setSelectedItem(item)}
                            className="glass-card rounded-2xl overflow-hidden border border-white/10 group cursor-pointer bg-background-elevated hover:border-primary-500/30 transition-all hover:-translate-y-1"
                        >
                            <div className="aspect-video bg-black/60 relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                                    {type === 'video' ? <Film size={40} className="text-gray-700"/> : <Radio size={40} className="text-gray-700"/>}
                                </div>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center pl-1 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-black transition-all">
                                        <Play size={20} className="text-white group-hover:text-black" fill="currentColor" />
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-bold text-emerald-400 flex items-center gap-1 border border-white/10">
                                    <ShieldCheck size={10} /> ON-CHAIN
                                </div>
                            </div>

                            <div className="p-4">
                                <h4 className="text-white font-bold truncate mb-1 group-hover:text-primary-500 transition-colors">{item.title}</h4>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><User size={10}/> {shortenAddress(item.author)}</span>
                                    <span>{new Date(Number(item.timestamp) * 1000).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}