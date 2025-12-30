import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Tag, Loader2, AlertTriangle, Gavel, Layers } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI, CRIKZ_NFT_ABI } from '@/config/index';
import { toast } from 'react-hot-toast';

interface ListingModalProps {
  tokenId: bigint;
  nftContract: string; // New Prop
  onClose: () => void;
  onSuccess: () => void;
}

const FIB_DURATIONS = [
    { label: '1 Day', val: 1 },
    { label: '2 Days', val: 2 },
    { label: '3 Days', val: 3 },
    { label: '5 Days', val: 5 },
    { label: '8 Days', val: 8 },
    { label: '13 Days', val: 13 },
];

export default function ListingModal({ tokenId, nftContract, onClose, onSuccess }: ListingModalProps) {
  const { address } = useAccount();
  const [mode, setMode] = useState<'fixed' | 'auction'>('fixed');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState(1); // Days
  const [step, setStep] = useState<'approve' | 'list'>('approve');
  const [listAll, setListAll] = useState(false); // Bulk Listing Toggle

  const safeAddress = address || '0x0000000000000000000000000000000000000000';

  // 1. Check Approval (Using dynamic nftContract)
  const { data: approvedAddress, refetch: refetchApproval } = useReadContract({
    address: nftContract as `0x${string}`,
    abi: CRIKZ_NFT_ABI, // Assuming standard ERC721 ABI
    functionName: 'getApproved',
    args: [tokenId],
  });

  const { data: isApprovedForAll, refetch: refetchAll } = useReadContract({
    address: nftContract as `0x${string}`,
    abi: CRIKZ_NFT_ABI,
    functionName: 'isApprovedForAll',
    args: [safeAddress, NFT_MARKETPLACE_ADDRESS],
    query: { enabled: !!address }
  });

  useEffect(() => {
    if (approvedAddress === NFT_MARKETPLACE_ADDRESS || isApprovedForAll) {
        setStep('list');
    }
  }, [approvedAddress, isApprovedForAll]);

  // 2. Write Hooks
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: approvingConfirm } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: list, data: listHash, isPending: isListing } = useWriteContract();
  const { isLoading: listConfirm, isSuccess: listSuccess } = useWaitForTransactionReceipt({ hash: listHash });

  useEffect(() => {
      if (approvingConfirm === false && approveHash) {
          refetchApproval();
          refetchAll();
          setStep('list');
          toast.success("Approved! Now confirm listing.");
      }
  }, [approvingConfirm, approveHash]);

  useEffect(() => {
      if (listSuccess) {
          toast.success("Item Listed Successfully!");
          onSuccess();
          onClose();
      }
  }, [listSuccess]);

  const handleApprove = () => {
      if (listAll) {
          approve({
              address: nftContract as `0x${string}`,
              abi: CRIKZ_NFT_ABI,
              functionName: 'setApprovalForAll',
              args: [NFT_MARKETPLACE_ADDRESS, true]
          } as any);
      } else {
          approve({
              address: nftContract as `0x${string}`,
              abi: CRIKZ_NFT_ABI,
              functionName: 'approve',
              args: [NFT_MARKETPLACE_ADDRESS, tokenId]
          } as any);
      }
  };

  const handleSubmit = () => {
      if (!price || parseFloat(price) <= 0) {
          toast.error("Invalid Price");
          return;
      }

      if (listAll) {
          toast("Bulk listing initiated. Please confirm transactions.", { icon: '📚' });
      }

      if (mode === 'fixed') {
          list({
              address: NFT_MARKETPLACE_ADDRESS,
              abi: NFT_MARKETPLACE_ABI,
              functionName: 'listModel',
              args: [nftContract as `0x${string}`, tokenId, parseEther(price)]
          } as any);
      } else {
          // Auction
          const durationSeconds = BigInt(duration * 24 * 3600);
          list({
              address: NFT_MARKETPLACE_ADDRESS,
              abi: NFT_MARKETPLACE_ABI,
              functionName: 'createAuction',
              args: [nftContract as `0x${string}`, tokenId, parseEther(price), durationSeconds]
          } as any);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#12121A] relative"
        >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Tag className="text-primary-500" /> List Item #{tokenId.toString()}
            </h3>

            {/* Steps Visual */}
            <div className="flex items-center gap-2 mb-8">
                <div className={`flex-1 h-1 rounded ${step === 'approve' ? 'bg-primary-500' : 'bg-emerald-500'}`} />
                <div className={`flex-1 h-1 rounded ${step === 'list' ? 'bg-primary-500' : 'bg-white/10'}`} />
            </div>

            {step === 'approve' ? (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto text-primary-500 border border-primary-500/20">
                        <AlertTriangle size={32} />
                    </div>
                    <p className="text-gray-300 text-sm">Marketplace needs permission to handle this item.</p>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <input type="checkbox" id="listAll" checked={listAll} onChange={e => setListAll(e.target.checked)} className="accent-primary-500 w-4 h-4"/>
                        <label htmlFor="listAll" className="text-xs text-gray-400 font-bold cursor-pointer">Approve All (For Bulk Listing)</label>
                    </div>

                    <button 
                        onClick={handleApprove} 
                        disabled={isApproving || approvingConfirm}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                    >
                        {(isApproving || approvingConfirm) && <Loader2 className="animate-spin" />}
                        {listAll ? 'Set Approval For All' : 'Approve Item'}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 mb-4">
                        <button onClick={() => setMode('fixed')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'fixed' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Fixed Price</button>
                        <button onClick={() => setMode('auction')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'auction' ? 'bg-primary-500 text-black' : 'text-gray-500'}`}>Auction</button>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{mode === 'fixed' ? 'Price' : 'Starting Bid'} (CRKZ)</label>
                        <input 
                            type="number" 
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="input-field text-xl font-bold text-white"
                        />
                    </div>

                    {mode === 'auction' && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Duration (Fibonacci Days)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {FIB_DURATIONS.map(d => (
                                    <button 
                                        key={d.val}
                                        onClick={() => setDuration(d.val)}
                                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${duration === d.val ? 'bg-primary-500 text-black border-primary-500' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'}`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {mode === 'fixed' && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2">
                            <InfoIcon size={14} className="mt-0.5 shrink-0"/>
                            <span>Fixed price listings stay in your wallet until sold. No gas fee to cancel.</span>
                        </div>
                    )}

                    {mode === 'fixed' && (
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="bulkList" checked={listAll} onChange={e => setListAll(e.target.checked)} className="accent-primary-500 w-4 h-4"/>
                            <label htmlFor="bulkList" className="text-xs text-gray-400 font-bold cursor-pointer flex items-center gap-1">
                                <Layers size={12}/> List entire collection at this price
                            </label>
                        </div>
                    )}

                    <button 
                        onClick={handleSubmit} 
                        disabled={isListing || listConfirm}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                    >
                        {(isListing || listConfirm) && <Loader2 className="animate-spin" />}
                        {mode === 'fixed' ? (listAll ? 'Bulk List Items' : 'List Item') : 'Start Auction'}
                    </button>
                </div>
            )}
        </motion.div>
    </div>
  );
}

function InfoIcon({size, className}: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    );
}