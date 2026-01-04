import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, User, Send, Loader2, FileText, Layers, ExternalLink, Music, Video, Image as ImageIcon, Box, Globe, ShieldCheck, MessageSquare } from 'lucide-react';
import { formatTokenAmount, shortenAddress } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import IPFSImage from '@/components/ui/IPFSImage';

interface NFTDetailModalProps {
    item: any;
    onClose: () => void;
    onBuy: (id: bigint, price: bigint) => void;
    isPending: boolean;
}

// Helper to resolve IPFS for non-image assets (Video/Audio)
const resolveIPFS = (uri: string) => {
  if (!uri) return '';
  if (uri.startsWith('http')) return uri;
  const cid = uri.replace('ipfs://', '');
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
};

export default function NFTDetailModal({ item, onClose, onBuy, isPending }: NFTDetailModalProps) {
    const [showOffer, setShowOffer] = useState(false);
    const [offerPrice, setOfferPrice] = useState('');
    const [offerMsg, setOfferMsg] = useState('');

    const meta = item.metadata || {};
    const price = item.type === 'fixed' ? item.price : (item.highestBid || item.minPrice);
    
    // Resolve animation URL for video/audio
    const displayAnimation = resolveIPFS(meta.animation_url);

    // Lock Body Scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleMakeOffer = () => {
        if (!offerPrice) return toast.error("Enter a price");
        toast.success("Offer sent to owner!", { icon: '📩' });
        setShowOffer(false);
        setOfferPrice('');
        setOfferMsg('');
    };

    // Determine Media Type for Preview
    const getMediaType = () => {
        const fileType = meta.attributes?.find((a: any) => a.trait_type === 'Type')?.value?.toLowerCase() || '';
        if (fileType.includes('video') || displayAnimation?.endsWith('.mp4')) return 'video';
        if (fileType.includes('audio') || displayAnimation?.endsWith('.mp3')) return 'audio';
        return 'image';
    };

    const mediaType = getMediaType();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-6xl h-[90vh] bg-[#0A0A0F] rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row shadow-2xl"
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10"
                >
                    <X size={20}/>
                </button>

                {/* LEFT: Immersive Media Preview */}
                <div className="w-full md:w-7/12 bg-[#050508] flex items-center justify-center p-8 relative overflow-hidden">
                    {/* Ambient Background */}
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,#f59e0b_0%,transparent_60%)] blur-3xl" />
                    
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                        {mediaType === 'video' ? (
                            <video 
                                src={displayAnimation} 
                                controls 
                                autoPlay 
                                loop 
                                className="max-w-full max-h-full rounded-xl shadow-2xl border border-white/10"
                            />
                        ) : mediaType === 'audio' ? (
                            <div className="w-full max-w-md bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col items-center gap-6">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center animate-pulse">
                                    <Music size={48} className="text-white" />
                                </div>
                                <audio src={displayAnimation} controls className="w-full" />
                            </div>
                        ) : meta.image ? (
                            <IPFSImage 
                                src={meta.image} 
                                alt={meta.name} 
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl drop-shadow-[0_0_30px_rgba(245,158,11,0.2)]" 
                            />
                        ) : (
                            <div className="flex flex-col items-center text-gray-600">
                                <ImageIcon size={64} className="mb-4 opacity-50"/>
                                <span className="text-sm font-bold">No Preview Available</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Details & Action */}
                <div className="w-full md:w-5/12 bg-[#0A0A0F] border-l border-white/10 flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        
                        {/* System Attributes (Top) */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                                <Globe size={10}/> BSC Testnet
                            </div>
                            <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                                <ShieldCheck size={10}/> Official Protocol
                            </div>
                            <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[8px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                {mediaType === 'video' ? <Video size={10}/> : mediaType === 'audio' ? <Music size={10}/> : <ImageIcon size={10}/>}
                                {mediaType.toUpperCase()} Asset
                            </div>
                            <div className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 border ${item.type === 'fixed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                                <Tag size={10}/> {item.type === 'fixed' ? 'Fixed Price' : 'Auction'}
                            </div>
                        </div>

                        <h1 className="text-4xl font-black text-white mb-2 leading-tight">{meta.name || `Artifact #${item.tokenId}`}</h1>
                        
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-[10px] font-bold text-black">
                                <User size={12}/>
                            </div>
                            <span className="text-sm text-gray-400">Created by <span className="text-white font-mono font-bold">{shortenAddress(item.seller)}</span></span>
                        </div>

                        {/* Price Card */}
                        <div className="bg-gradient-to-br from-[#15151A] to-[#0f0f13] p-6 rounded-2xl border border-white/10 mb-8 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-500/10 transition-colors" />
                            
                            <div className="relative z-10">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{item.type === 'fixed' ? 'Current Price' : 'Highest Bid'}</p>
                                <div className="text-4xl font-black text-white mb-6 flex items-baseline gap-2">
                                    {formatTokenAmount(price)} <span className="text-lg text-primary-500">CRIKZ</span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {item.type === 'fixed' ? (
                                        <button 
                                            onClick={() => onBuy(item.listingId, item.price)}
                                            disabled={isPending}
                                            className="w-full py-4 bg-primary-500 hover:bg-primary-400 text-black font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {isPending ? <Loader2 className="animate-spin" size={18}/> : 'Buy Now'}
                                        </button>
                                    ) : (
                                        <button className="w-full py-4 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-xl text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                            Place Bid
                                        </button>
                                    )}

                                    {item.type === 'fixed' && !showOffer && (
                                        <button 
                                            onClick={() => setShowOffer(true)}
                                            className="w-full py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <Send size={16}/> Send Offer
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {showOffer && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: 'auto', opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden mt-4 pt-4 border-t border-white/10"
                                        >
                                            <div className="space-y-3">
                                                <input 
                                                    type="number" 
                                                    placeholder="Offer Amount (CRIKZ)" 
                                                    value={offerPrice}
                                                    onChange={e => setOfferPrice(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowOffer(false)} className="flex-1 py-2 bg-white/5 text-gray-400 rounded-lg text-xs font-bold hover:bg-white/10">Cancel</button>
                                                    <button onClick={handleMakeOffer} className="flex-1 py-2 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-emerald-400">Confirm Offer</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FileText size={14} className="text-primary-500"/> Description
                            </h3>
                            <div className="text-sm text-gray-400 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
                                {meta.description || "No description provided by the creator."}
                            </div>
                        </div>

                        {/* Attributes Grid */}
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Layers size={14} className="text-primary-500"/> Traits
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {/* Collection Trait */}
                                <div className="bg-[#15151A] p-3 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-primary-500/30 transition-colors">
                                    <span className="text-[9px] text-gray-500 uppercase font-bold mb-1">Collection</span>
                                    <span className="text-xs font-bold text-white">{meta.attributes?.find((a:any) => a.trait_type === 'Collection')?.value || 'General'}</span>
                                </div>
                                
                                {/* Dynamic Traits */}
                                {meta.attributes?.filter((a:any) => a.trait_type !== 'Collection' && a.trait_type !== 'Type').map((attr: any, i: number) => (
                                    <div key={i} className="bg-[#15151A] p-3 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-primary-500/30 transition-colors">
                                        <span className="text-[9px] text-gray-500 uppercase font-bold mb-1">{attr.trait_type}</span>
                                        <span className="text-xs font-bold text-primary-400">{attr.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Updated External Link */}
                        <a 
                            href={`https://testnet.bscscan.com/token/${item.nftContract}?a=${item.tokenId}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors w-full py-4 border-t border-white/5"
                        >
                            <ExternalLink size={12}/> View on BscScan
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}