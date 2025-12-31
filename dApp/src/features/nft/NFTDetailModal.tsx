import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, User, Send, MessageSquare, Loader2, FileText, Layers, ShieldCheck, ExternalLink } from 'lucide-react';
import { formatTokenAmount, shortenAddress } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface NFTDetailModalProps {
    item: any;
    onClose: () => void;
    onBuy: (id: bigint, price: bigint) => void;
    isPending: boolean;
}

export default function NFTDetailModal({ item, onClose, onBuy, isPending }: NFTDetailModalProps) {
    const [showOffer, setShowOffer] = useState(false);
    const [offerPrice, setOfferPrice] = useState('');
    const [offerMsg, setOfferMsg] = useState('');

    const meta = item.metadata || {};
    const price = item.type === 'fixed' ? item.price : (item.highestBid || item.minPrice);

    const handleMakeOffer = () => {
        if (!offerPrice) return toast.error("Enter a price");
        toast.success("Offer sent to owner!", { icon: '📩' });
        setShowOffer(false);
        setOfferPrice('');
        setOfferMsg('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0A0A0F] relative overflow-hidden flex flex-col md:flex-row shadow-2xl max-h-[90vh]"
            >
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"><X size={20}/></button>

                {/* Left: Image */}
                <div className="w-full md:w-1/2 bg-[#12121A] flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/5 relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05),transparent_70%)]" />
                    <div className="aspect-square w-full max-w-md bg-black/40 rounded-2xl flex items-center justify-center text-6xl overflow-hidden relative border border-white/5 shadow-2xl">
                        {meta.image ? (
                             <img src={meta.image} alt="NFT" className="w-full h-full object-contain" />
                        ) : (
                             <span className="opacity-50">💠</span>
                        )}
                    </div>
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-8 flex flex-col h-full overflow-y-auto custom-scrollbar bg-[#0A0A0F]">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${item.type === 'fixed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                                {item.type === 'fixed' ? 'Fixed Price' : 'Auction'}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-500 px-2 py-1 rounded border border-primary-500/20 flex items-center gap-1">
                                <ShieldCheck size={10}/> Verified
                            </span>
                        </div>
                        
                        <h2 className="text-3xl font-black text-white mb-2 leading-tight">{meta.name || `Artifact #${item.tokenId}`}</h2>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                                <User size={12}/> <span className="text-gray-500 text-xs">Seller:</span> <span className="text-white font-mono text-xs">{shortenAddress(item.seller)}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                                <Layers size={12}/> <span className="text-gray-500 text-xs">Collection:</span> <span className="text-white font-bold text-xs">{meta.attributes?.find((a:any) => a.trait_type === 'Collection')?.value || 'General'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Price Box */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent p-6 rounded-2xl border border-white/10 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">{item.type === 'fixed' ? 'Current Price' : 'Highest Bid'}</div>
                        <div className="text-4xl font-black text-white mb-6 flex items-baseline gap-2">
                            {formatTokenAmount(price)} <span className="text-lg text-primary-500">CRKZ</span>
                        </div>
                        
                        <div className="flex gap-3 relative z-10">
                            {item.type === 'fixed' ? (
                                <button 
                                    onClick={() => onBuy(item.listingId, item.price)}
                                    disabled={isPending}
                                    className="flex-1 py-3.5 bg-primary-500 text-black font-black rounded-xl hover:bg-primary-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow-sm hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isPending ? <Loader2 className="animate-spin" size={18}/> : 'Buy Now'}
                                </button>
                            ) : (
                                <button className="flex-1 py-3.5 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400 shadow-lg shadow-purple-500/20">Place Bid</button>
                            )}
                            
                            {item.type === 'fixed' && (
                                <button 
                                    onClick={() => setShowOffer(!showOffer)}
                                    className="px-4 py-3.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 border border-white/10 transition-colors"
                                    title="Make Offer"
                                >
                                    <MessageSquare size={20}/>
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
                                            placeholder="Offer Amount (CRKZ)" 
                                            value={offerPrice}
                                            onChange={e => setOfferPrice(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-primary-500 transition-colors"
                                        />
                                        <button onClick={handleMakeOffer} className="w-full py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-emerald-500/20 flex items-center justify-center gap-2 transition-colors">
                                            <Send size={14}/> Send Offer
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-2 text-sm uppercase tracking-wider"><FileText size={14} className="text-gray-500"/> Description</h3>
                        <div className="text-sm text-gray-400 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                            {meta.description || "No description provided."}
                        </div>
                    </div>

                    {/* Attributes */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider"><Tag size={14} className="text-gray-500"/> Attributes</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {meta.attributes?.map((attr: any, i: number) => (
                                <div key={i} className="bg-[#15151A] p-3 rounded-xl border border-white/5 hover:border-primary-500/30 transition-colors group">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">{attr.trait_type}</div>
                                    <div className="text-sm font-bold text-white group-hover:text-primary-500 transition-colors">{attr.value}</div>
                                </div>
                            ))}
                            {(!meta.attributes || meta.attributes.length === 0) && (
                                <div className="col-span-2 text-center text-xs text-gray-600 italic py-4">No attributes found.</div>
                            )}
                        </div>
                    </div>
                    
                    {/* External Link */}
                    {meta.external_url && (
                        <a href={meta.external_url} target="_blank" rel="noreferrer" className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                            <ExternalLink size={12}/> View External Resource
                        </a>
                    )}
                </div>
            </motion.div>
        </div>
    );
}