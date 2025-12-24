// src/components/TransactionModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, XCircle, ExternalLink, Zap } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  txHash: `0x${string}` | undefined;
  status: 'idle' | 'pending' | 'success' | 'error';
  dynamicColor: string;
}

export default function TransactionModal({ isOpen, txHash, status, dynamicColor }: TransactionModalProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Loader,
          title: 'Transaction Pending',
          description: 'Please wait while your transaction is being processed on the blockchain...',
          color: dynamicColor,
          animate: true
        };
      case 'success':
        return {
          icon: CheckCircle,
          title: 'Transaction Successful',
          description: 'Your transaction has been confirmed on the blockchain!',
          color: '#10B981',
          animate: false
        };
      case 'error':
        return {
          icon: XCircle,
          title: 'Transaction Failed',
          description: 'Something went wrong with your transaction. Please try again.',
          color: '#EF4444',
          animate: false
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="glass-card p-8 sm:p-10 rounded-3xl border border-white/10 max-w-md w-full relative overflow-hidden"
          >
            {/* Background Glow */}
            <motion.div
              className="absolute inset-0 opacity-10 blur-3xl"
              animate={config.animate ? {
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)`
              }}
            />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <motion.div
                animate={config.animate ? { rotate: 360 } : { scale: [1, 1.1, 1] }}
                transition={config.animate ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                } : {
                  duration: 0.5,
                  times: [0, 0.5, 1]
                }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: `${config.color}20`,
                  boxShadow: `0 0 40px ${config.color}40`
                }}
              >
                <Icon size={40} style={{ color: config.color }} />
              </motion.div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl font-black">{config.title}</h3>

              {/* Description */}
              <p className="text-sm text-gray-400 leading-relaxed">
                {config.description}
              </p>

              {/* Transaction Hash */}
              {txHash && (
                <motion.a
                  href={`https://testnet.bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-bold text-sm"
                  style={{
                    background: `${config.color}20`,
                    color: config.color,
                    border: `1px solid ${config.color}40`
                  }}
                >
                  <Zap size={16} />
                  <span>View on BSCScan</span>
                  <ExternalLink size={14} />
                </motion.a>
              )}

              {/* Status Indicator */}
              {status === 'pending' && (
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: config.color }}
                  />
                  <span>Awaiting confirmation...</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}