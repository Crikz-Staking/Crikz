// src/components/TransactionModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  txHash: `0x${string}` | undefined;
  status: 'idle' | 'pending' | 'success' | 'error';
  themeColor: string;
}

export default function TransactionModal({ isOpen, txHash, status, themeColor }: TransactionModalProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Loader,
          title: 'Transaction Pending',
          description: 'Please wait while your transaction is being processed...',
          color: themeColor
        };
      case 'success':
        return {
          icon: CheckCircle,
          title: 'Transaction Successful',
          description: 'Your transaction has been confirmed!',
          color: '#00ff88'
        };
      case 'error':
        return {
          icon: XCircle,
          title: 'Transaction Failed',
          description: 'Something went wrong. Please try again.',
          color: '#ff3333'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config || !isOpen) return null;

  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card p-8 rounded-3xl border border-white/10 max-w-md w-full"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icon */}
              <motion.div
                animate={status === 'pending' ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ color: config.color }}
              >
                <Icon size={64} />
              </motion.div>

              {/* Title */}
              <h3 className="text-2xl font-black">{config.title}</h3>

              {/* Description */}
              <p className="text-gray-400">{config.description}</p>

              {/* Transaction Hash */}
              {txHash && (
                <a
                  href={`https://testnet.bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all"
                  style={{
                    background: `${themeColor}20`,
                    color: themeColor
                  }}
                >
                  <span>View on BSCScan</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}