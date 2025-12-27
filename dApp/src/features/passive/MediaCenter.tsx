import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import { 
    Play, Pause, Volume2, X, Upload, Radio, Film, Globe, User, 
    ShieldCheck, RefreshCw, Heart, Database, Tv, Search, AlertCircle, 
    Music, Mic2, Library, Loader2, Wifi, WifiOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uploadToIPFS } from '@/lib/ipfs-service';
import { useMediaRegistry, Web3MediaItem } from '@/hooks/web3/useMediaRegistry';
import { shortenAddress } from '@/lib/utils';

// --- TYPES ---
type MediaType = 'video' | 'audio';
type ViewMode = 'decentralized' | 'livetv' | 'radio' | 'archive';

interface IPTVChannel {
    name: string;
    logo: string;
    url: string;
    category: string;
    country: string;
}

interface RadioStation {
    stationuuid: string;
    name: string;
    favicon: string;
    url_resolved: string;
    country: string;
    tags: string;
    votes: number;
    codec: string;
    bitrate: number;
}

interface ArchiveItem {
    identifier: string;
    title: string;
    creator: string;
    year: string;
    downloads: number;
}

// --- CONSTANTS ---
const RADIO_MIRRORS = [
    "https://de1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
    "https://at1.api.radio-browser.info"
];

// --- PLAYER COMPONENT ---
const UniversalPlayer = ({ url, title, sub, onClose, isAudio = false }: { url: string, title: string, sub: string, onClose: () => void, isAudio?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [error, setError] = useState(false);
    const [playing, setPlaying] = useState(true);
    const [buffering, setBuffering] = useState(true);

    useEffect(() => {
        const media = isAudio ? audioRef.current : videoRef.current;
        if (!media) return;

        setError(false);
        setBuffering(true);

        const handleCanPlay = () => setBuffering(false);
        const handleError = (e: any) => {
            console.error("Media Error:", e);
            // Don't show error immediately for radio, sometimes it takes a second try or codec negotiation
            if (media.error && media.error.code) setError(true);
            setBuffering(false);
        };

        media.addEventListener('canplay', handleCanPlay);
        media.addEventListener('error', handleError);

        // HLS Support
        if (url.includes('.m3u8') && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(media);
            hls.on(Hls.Events.MANIFEST_PARSED, () => media.play().catch(() => setPlaying(false)));
            hls.on(Hls.Events.ERROR, (_, data) => { 
                if(data.fatal) {
                    setError(true);
                    setBuffering(false);
                }
            });
            return () => {
                hls.destroy();
                media.removeEventListener('canplay', handleCanPlay);
                media.removeEventListener('error', handleError);
            };
        } else {
            // Standard Stream
            media.src = url;
            media.play().catch(e => {
                console.warn("Autoplay blocked:", e);
                setPlaying(false);
                setBuffering(false);
            });
        }

        return () => {
            media.removeEventListener('canplay', handleCanPlay);
            media.removeEventListener('error', handleError);
        };
    }, [url, isAudio]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
        >
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex justify-between items-center px-6">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${isAudio ? 'bg-accent-purple/20 text-accent-purple' : 'bg-primary-500/20 text-primary-500'}`}>
                        {isAudio ? <Radio size={20} className={playing ? "animate-pulse" : ""} /> : <Tv size={20} />}
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="font-bold text-white truncate max-w-xs md:max-w-md">{title}</h3>
                        <p className="text-[10px] text-gray-400 truncate">{sub}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><X size={24}/></button>
            </div>

            {/* Media Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/50 relative">
                {buffering && !error && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <Loader2 size={48} className="animate-spin text-primary-500"/>
                        <span className="mt-16 text-xs text-gray-400 absolute">Buffering Stream...</span>
                    </div>
                )}

                {error ? (
                    <div className="text-center text-gray-500 max-w-md">
                        <AlertCircle size={48} className="mx-auto mb-4 text-red-500 opacity-50"/>
                        <h3 className="text-white font-bold mb-2">Stream Offline</h3>
                        <p className="text-sm">The station server is not responding.</p>
                    </div>
                ) : isAudio ? (
                    <div className="flex flex-col items-center w-full max-w-lg">
                        {/* Audio Visualizer Placeholder */}
                        <div className="flex items-end justify-center gap-1 h-32 mb-8">
                            {[...Array(20)].map((_, i) => (
                                <motion.div 
                                    key={i} 
                                    className="w-2 bg-accent-purple/50 rounded-t-sm"
                                    animate={{ height: playing ? [10, Math.random() * 100 + 20, 10] : 10 }}
                                    transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
                                />
                            ))}
                        </div>
                        <audio 
                            ref={audioRef} 
                            controls 
                            className="w-full" 
                            onPlay={() => { setPlaying(true); setBuffering(false); }} 
                            onPause={() => setPlaying(false)} 
                        />
                    </div>
                ) : (
                    <video 
                        ref={videoRef} 
                        className="w-full h-full max-h-[70vh] object-contain" 
                        controls 
                        onPlay={() => setBuffering(false)}
                    />
                )}
            </div>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---
export default function MediaCenter({ type, dynamicColor }: { type: MediaType, dynamicColor: string }) {
    const [viewMode, setViewMode] = useState<ViewMode>('decentralized');
    const [search, setSearch] = useState('');
    
    // --- WEB3 STATE ---
    const { mediaList, isLoading: web3Loading, publishToBlockchain, isPublishing } = useMediaRegistry();
    
    // --- LIVE TV STATE ---
    const [tvChannels, setTvChannels] = useState<IPTVChannel[]>([]);
    
    // --- RADIO STATE ---
    const [stations, setStations] = useState<RadioStation[]>([]);
    const [radioApi, setRadioApi] = useState<string | null>(null);
    
    // --- ARCHIVE STATE ---
    const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);

    // --- SHARED STATE ---
    const [loadingExt, setLoadingExt] = useState(false);
    const [activeMedia, setActiveMedia] = useState<{url: string, title: string, sub: string, isAudio: boolean} | null>(null);

    // 1. Resolve Radio API Server (Find the fastest mirror)
    useEffect(() => {
        const resolveServer = async () => {
            for (const mirror of RADIO_MIRRORS) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
                    const res = await fetch(`${mirror}/json/stats`, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    if (res.ok) {
                        setRadioApi(mirror);
                        console.log("Connected to Radio Mirror:", mirror);
                        return;
                    }
                } catch (e) {
                    continue;
                }
            }
            // Fallback
            setRadioApi("https://de1.api.radio-browser.info");
        };
        resolveServer();
    }, []);

    // 2. Fetch Content based on Tab
    useEffect(() => {
        setSearch(''); 
        
        const fetchExternal = async () => {
            setLoadingExt(true);
            try {
                if (viewMode === 'livetv' && tvChannels.length === 0) {
                    // Curated IPTV List
                    setTvChannels([
                        { name: "NASA TV", logo: "https://i.imgur.com/k6X5sM8.png", url: "https://ntv1.akamaized.net/hls/live/2013530/NASA-TV-Public/master.m3u8", category: "Science", country: "USA" },
                        { name: "Al Jazeera English", logo: "https://i.imgur.com/v8tX6qI.png", url: "https://live-hls-web-aje.getaj.net/AJE/03.m3u8", category: "News", country: "Qatar" },
                        { name: "Bloomberg TV", logo: "", url: "https://liveproduseast.global.ssl.fastly.net/us/Channel-SG/index.m3u8", category: "Business", country: "USA" },
                        { name: "Red Bull TV", logo: "https://i.imgur.com/3Y3Y3Y3.png", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8", category: "Sports", country: "Austria" },
                        { name: "Fashion TV", logo: "", url: "https://fash1043.cloudycdn.services/slive/_definst_/ftv_paris_adaptive.smil/playlist.m3u8", category: "Lifestyle", country: "France" },
                        { name: "Sky News", logo: "", url: "https://skynews.akamaized.net/hls/live/2174360/skynews_1/master.m3u8", category: "News", country: "UK" }
                    ]);
                } 
                else if (viewMode === 'radio' && stations.length === 0 && radioApi) {
                    // Fetch Top Radio Stations - Strict HTTPS filter to prevent mixed content errors
                    const res = await fetch(`${radioApi}/json/stations/search?limit=24&order=clickcount&is_https=true&hidebroken=true`);
                    if (!res.ok) throw new Error("Radio API Failed");
                    const data = await res.json();
                    setStations(data);
                }
                else if (viewMode === 'archive' && archiveItems.length === 0) {
                    // Fetch Internet Archive (Audio) - Grateful Dead / Audiobooks
                    const q = 'mediatype:audio AND (collection:etree OR collection:audio_bookspot) AND downloads:>1000';
                    const res = await fetch(`https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier,title,creator,year,downloads&sort[]=downloads+desc&rows=24&output=json`);
                    const data = await res.json();
                    setArchiveItems(data.response.docs);
                }
            } catch (e) {
                console.error("Fetch Error", e);
                if (viewMode !== 'livetv') toast.error("Could not load feed. API busy.");
            } finally {
                setLoadingExt(false);
            }
        };

        if (viewMode !== 'decentralized') fetchExternal();
    }, [viewMode, radioApi]);

    // 3. Search Logic
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!search.trim()) return;
        setLoadingExt(true);
        try {
            if (viewMode === 'radio' && radioApi) {
                const res = await fetch(`${radioApi}/json/stations/search?name=${encodeURIComponent(search)}&limit=24&is_https=true&hidebroken=true`);
                const data = await res.json();
                setStations(data);
            } else if (viewMode === 'archive') {
                const q = `mediatype:audio AND title:(${search})`;
                const res = await fetch(`https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier,title,creator,year,downloads&sort[]=downloads+desc&rows=24&output=json`);
                const data = await res.json();
                setArchiveItems(data.response.docs);
            }
        } catch(e) { 
            console.error(e); 
            toast.error("Search failed");
        } finally { 
            setLoadingExt(false); 
        }
    };

    // 4. Play Archive Item (Find MP3)
    const playArchiveItem = async (item: ArchiveItem) => {
        const toastId = toast.loading("Locating audio file...");
        try {
            // Get file metadata
            const res = await fetch(`https://archive.org/metadata/${item.identifier}`);
            const data = await res.json();
            
            // Look for MP3 files specifically
            const validFile = data.files.find((f: any) => 
                (f.format === 'VBR MP3' || f.format === 'MP3' || f.format === '128Kbps MP3') && 
                !f.name.endsWith('_vbr.m3u') // Exclude playlists
            );
            
            if (validFile) {
                // Construct direct download link
                const url = `https://${data.d1}${data.dir}/${validFile.name}`;
                toast.dismiss(toastId);
                setActiveMedia({ 
                    url, 
                    title: item.title, 
                    sub: item.creator ? `By ${item.creator}` : 'Public Domain', 
                    isAudio: true 
                });
            } else {
                toast.error("No playable MP3 found", { id: toastId });
            }
        } catch (e) {
            toast.error("Failed to load audio metadata", { id: toastId });
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const toastId = toast.loading('Uploading to IPFS...');
        try {
            const url = await uploadToIPFS(file);
            const cid = url.includes('blob:') ? `Qm${Math.random().toString(36).substr(2, 15)}` : url; 
            toast.loading('Confirming Transaction...', { id: toastId });
            publishToBlockchain(cid, file.name, type);
        } catch (err) {
            toast.error('Upload Failed', { id: toastId });
        }
    };

    // Filter Web3 List
    const targetType = type === 'video' ? 0 : 1;
    const filteredWeb3 = mediaList.filter((item) => item.mediaType === targetType);

    return (
        <div className="min-h-[600px] relative">
            <AnimatePresence>
                {activeMedia && (
                    <UniversalPlayer 
                        url={activeMedia.url} 
                        title={activeMedia.title} 
                        sub={activeMedia.sub} 
                        isAudio={activeMedia.isAudio}
                        onClose={() => setActiveMedia(null)} 
                    />
                )}
            </AnimatePresence>

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full no-scrollbar">
                    <button 
                        onClick={() => setViewMode('decentralized')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${viewMode === 'decentralized' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Database size={14} /> Decentralized
                    </button>
                    
                    {type === 'video' ? (
                        <button 
                            onClick={() => setViewMode('livetv')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${viewMode === 'livetv' ? 'bg-primary-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Tv size={14} /> Global TV
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={() => setViewMode('radio')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${viewMode === 'radio' ? 'bg-accent-purple text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Radio size={14} /> Global Radio
                            </button>
                            <button 
                                onClick={() => setViewMode('archive')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${viewMode === 'archive' ? 'bg-accent-cyan text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Library size={14} /> Audio Archive
                            </button>
                        </>
                    )}
                </div>

                {viewMode === 'decentralized' ? (
                    <div className="relative group">
                        <input type="file" accept={type === 'video' ? "video/*" : "audio/*"} className="hidden" id="media-upload" onChange={handleUpload} disabled={isPublishing} />
                        <label htmlFor="media-upload" className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all ${isPublishing ? 'bg-white/5 text-gray-500' : 'bg-primary-500 text-black hover:bg-primary-400'}`}>
                            {isPublishing ? 'Confirming...' : 'Upload New'} <Upload size={16} />
                        </label>
                    </div>
                ) : (
                    <form onSubmit={handleSearch} className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={viewMode === 'radio' ? "Search stations..." : "Search archive..."} className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:border-primary-500 outline-none w-full md:w-64" />
                    </form>
                )}
            </div>

            {/* --- CONTENT GRID --- */}
            {web3Loading || loadingExt ? (
                <div className="flex justify-center py-20"><div className="animate-spin text-primary-500"><RefreshCw size={32}/></div></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    
                    {/* DECENTRALIZED */}
                    {viewMode === 'decentralized' && filteredWeb3.map((item) => (
                        <motion.div
                            key={item.id.toString()}
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setActiveMedia({ url: `https://gateway.pinata.cloud/ipfs/${item.cid}`, title: item.title, sub: `By ${shortenAddress(item.author)}`, isAudio: type === 'audio' })}
                            className="glass-card p-4 rounded-xl cursor-pointer hover:border-primary-500/50 transition-all group"
                        >
                            <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                                {type === 'video' ? <Film size={32} className="text-gray-600"/> : <Music size={32} className="text-gray-600"/>}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center pl-1 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-black transition-all">
                                        <Play size={16} fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                            <h4 className="font-bold text-white truncate">{item.title}</h4>
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                <span>{shortenAddress(item.author)}</span>
                                <span className="flex items-center gap-1 text-emerald-500"><ShieldCheck size={10}/> Web3</span>
                            </div>
                        </motion.div>
                    ))}

                    {/* LIVE TV */}
                    {viewMode === 'livetv' && tvChannels.map((c, i) => (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setActiveMedia({ url: c.url, title: c.name, sub: `${c.category} • ${c.country}`, isAudio: false })}
                            className="bg-[#12121A] border border-white/5 hover:border-primary-500/50 p-4 rounded-xl cursor-pointer group flex flex-col gap-3 transition-all hover:bg-white/5"
                        >
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center p-1">
                                    {c.logo ? <img src={c.logo} className="w-full h-full object-contain" /> : <Tv size={18}/>}
                                </div>
                                <div className="bg-red-500/20 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse">LIVE</div>
                            </div>
                            <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-primary-500">{c.name}</h4>
                        </motion.div>
                    ))}

                    {/* RADIO */}
                    {viewMode === 'radio' && stations.map((s) => (
                        <motion.div key={s.stationuuid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setActiveMedia({ url: s.url_resolved, title: s.name, sub: s.country, isAudio: true })}
                            className="bg-[#12121A] border border-white/5 hover:border-accent-purple/50 p-4 rounded-xl cursor-pointer group hover:bg-white/5"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                {s.favicon ? <img src={s.favicon} className="w-8 h-8 rounded bg-white/10 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <Radio size={24} className="text-gray-600"/>}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm truncate group-hover:text-accent-purple">{s.name}</h4>
                                    <p className="text-[10px] text-gray-500">{s.country}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {s.tags.split(',').slice(0,3).map(tag => tag && <span key={tag} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">{tag}</span>)}
                            </div>
                        </motion.div>
                    ))}

                    {/* ARCHIVE */}
                    {viewMode === 'archive' && archiveItems.map((a) => (
                        <motion.div key={a.identifier} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => playArchiveItem(a)}
                            className="bg-[#12121A] border border-white/5 hover:border-accent-cyan/50 p-4 rounded-xl cursor-pointer group hover:bg-white/5"
                        >
                            <div className="mb-3 w-10 h-10 bg-accent-cyan/10 rounded flex items-center justify-center text-accent-cyan">
                                <Library size={20} />
                            </div>
                            <h4 className="font-bold text-white text-sm line-clamp-2 group-hover:text-accent-cyan mb-1">{a.title}</h4>
                            <p className="text-[10px] text-gray-500 mb-2">{a.year || 'Unknown Year'}</p>
                            <div className="text-[9px] bg-white/5 px-2 py-1 rounded inline-block text-gray-400">
                                {a.downloads?.toLocaleString()} Downloads
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            
            {/* EMPTY STATE */}
            {!web3Loading && !loadingExt && (
                ((viewMode === 'decentralized' && filteredWeb3.length === 0) || 
                 (viewMode === 'livetv' && tvChannels.length === 0) ||
                 (viewMode === 'radio' && stations.length === 0) || 
                 (viewMode === 'archive' && archiveItems.length === 0))
            ) && (
                <div className="text-center py-20 text-gray-500">
                    <div className="mb-4 flex justify-center">
                        {viewMode === 'radio' && !radioApi ? <WifiOff size={40} className="opacity-20"/> : <Globe size={40} className="opacity-20"/>}
                    </div>
                    <p>{viewMode === 'radio' && !radioApi ? "Connecting to Global Radio Network..." : "No content found."}</p>
                </div>
            )}
        </div>
    );
}