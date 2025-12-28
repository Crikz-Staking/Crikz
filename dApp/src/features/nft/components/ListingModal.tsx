import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Tag, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI, CRIKZ_NFT_ADDRESS, CRIKZ_NFT_ABI } from '@/config/index';
import { toast } from 'react-hot-toast';

interface ListingModalProps {
  tokenId: bigint;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ListingModal({ tokenId, onClose, onSuccess }: ListingModalProps) {
  const { address } = useAccount();
  const [price, setPrice] = useState('');
  const [step, setStep] = useState<'approve' | 'list'>('approve');

  // FIX: Provide fallback address to avoid undefined error
  const safeAddress = address || '0x0000000000000000000000000000000000000000';

  // 1. Check Approval
  const { data: approvedAddress, refetch: refetchApproval } = useReadContract({
    address: CRIKZ_NFT_ADDRESS,
    abi: CRIKZ_NFT_ABI,
    functionName: 'getApproved',
    args: [tokenId],
  });

  const { data: isApprovedForAll, refetch: refetchAll } = useReadContract({
    address: CRIKZ_NFT_ADDRESS,
    // FIX: Using CRIKZ_NFT_ABI now that it includes isApprovedForAll
    abi: CRIKZ_NFT_ABI,
    functionName: 'isApprovedForAll',
    args: [safeAddress, NFT_MARKETPLACE_ADDRESS],
    query: {
        enabled: !!address // Only run if address exists
    }
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
      approve({
          address: CRIKZ_NFT_ADDRESS,
          abi: CRIKZ_NFT_ABI,
          functionName: 'approve',
          args: [NFT_MARKETPLACE_ADDRESS, tokenId]
      } as any);
  };

  const handleList = () => {
      if (!price || parseFloat(price) <= 0) {
          toast.error("Invalid Price");
          return;
      }
      list({
          address: NFT_MARKETPLACE_ADDRESS,
          abi: NFT_MARKETPLACE_ABI,
          functionName: 'listModel',
          args: [CRIKZ_NFT_ADDRESS, tokenId, parseEther(price)]
      } as any);
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
                    <button 
                        onClick={handleApprove} 
                        disabled={isApproving || approvingConfirm}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                    >
                        {(isApproving || approvingConfirm) && <Loader2 className="animate-spin" />}
                        Approve Contract
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Price (CRKZ)</label>
                        <input 
                            type="number" 
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="input-field text-xl font-bold text-white"
                        />
                    </div>
                    <button 
                        onClick={handleList} 
                        disabled={isListing || listConfirm}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                    >
                        {(isListing || listConfirm) && <Loader2 className="animate-spin" />}
                        Confirm Listing
                    </button>
                </div>
            )}
        </motion.div>
    </div>
  );
}