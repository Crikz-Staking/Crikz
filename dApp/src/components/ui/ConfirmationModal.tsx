import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

export default function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText,
  cancelText
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 relative overflow-hidden bg-[#15151A]"
          >
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed px-4">
                  {message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <X size={16} />
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary-500 text-black hover:bg-primary-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
              >
                <Check size={16} />
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}