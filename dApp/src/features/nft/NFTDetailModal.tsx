import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Tag, User, Clock, ShieldCheck, MessageSquare, Send, Loader2 } from 'lucide-react';
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

    const handleMakeOffer = () => {
        if (!offerPrice) return toast.error("Enter a price");
        // Simulation of off-chain offer
        toast.success("Offer sent to owner!", { icon: '📩' });
        setShowOffer(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card w-full max-w-4xl rounded-3xl border border-white/10 bg-[#12121A] relative overflow-hidden flex flex-col md:flex-row"
            >
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-white/20"><X size={20}/></button>

                {/* Left: Image */}
                <div className="w-full md:w-1/2 bg-black/40 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/5">
                    <div className="aspect-square w-full max-w-sm bg-white/5 rounded-2xl flex items-center justify-center text-6xl">
                        💠
                    </div>
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-8 flex flex-col h-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-1 rounded text-gray-400">
                                {item.type === 'fixed' ? 'Fixed Price' : 'Auction'}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-500 px-2 py-1 rounded border border-primary-500/20">
                                Verified
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">Artifact #{item.tokenId.toString()}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <User size={14}/> Seller: <span className="text-white font-mono">{shortenAddress(item.seller)}</span>
                        </div>
                    </div>

                    <div className="bg-black/30 p-6 rounded-2xl border border-white/5 mb-6">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Current Price</div>
                        <div className="text-4xl font-black text-white mb-4">
                            {formatTokenAmount(item.price || item.highestBid || item.minPrice)} <span className="text-lg text-primary-500">CRKZ</span>
                        </div>
                        
                        <div className="flex gap-3">
                            {item.type === 'fixed' ? (
                                <button 
                                    onClick={() => onBuy(item.listingId, item.price)}
                                    disabled={isPending}
                                    className="flex-1 py-3 bg-primary-500 text-black font-bold rounded-xl hover:bg-primary-400 transition-all flex items-center justify-center gap-2"
                                >
                                    {isPending ? <Loader2 className="animate-spin"/> : 'Buy Now'}
                                </button>
                            ) : (
                                <button className="flex-1 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400">Place Bid</button>
                            )}
                            
                            {item.type === 'fixed' && (
                                <button 
                                    onClick={() => setShowOffer(!showOffer)}
                                    className="px-4 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 border border-white/10"
                                >
                                    <MessageSquare size={20}/>
                                </button>
                            )}
                        </div>

                        {/* Make Offer Form */}
                        <AnimatePresence>
                            {showOffer && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }} 
                                    animate={{ height: 'auto', opacity: 1 }} 
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mt-4 pt-4 border-t border-white/10"
                                >
                                    <h4 className="text-sm font-bold text-white mb-3">Make Private Offer</h4>
                                    <div className="space-y-3">
                                        <input 
                                            type="number" 
                                            placeholder="Offer Amount (CRKZ)" 
                                            value={offerPrice}
                                            onChange={e => setOfferPrice(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary-500"
                                        />
                                        <textarea 
                                            placeholder="Message to owner..." 
                                            value={offerMsg}
                                            onChange={e => setOfferMsg(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary-500 h-20"
                                        />
                                        <button onClick={handleMakeOffer} className="w-full py-2 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/30 flex items-center justify-center gap-2">
                                            <Send size={14}/> Send Offer
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Attributes Placeholder */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-white flex items-center gap-2"><Tag size={16}/> Attributes</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="text-[10px] text-gray-500 uppercase">Type</div>
                                <div className="text-sm font-bold text-white">Digital Asset</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="text-[10px] text-gray-500 uppercase">Chain</div>
                                <div className="text-sm font-bold text-white">BSC Testnet</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}