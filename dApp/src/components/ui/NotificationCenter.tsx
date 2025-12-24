import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertCircle, TrendingUp } from 'lucide-react';
import type { Language } from '@/types';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onToggle: () => void;
  lang: Language;
  dynamicColor: string;
}

export default function NotificationCenter({ isOpen, onToggle, lang, dynamicColor }: NotificationCenterProps) {
  // Start empty to rely on real interactions
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'success': return Check;
      case 'warning': return AlertCircle;
      default: return TrendingUp;
    }
  };

  const getColor = (type: string) => {
    switch(type) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  return (
    <>
      {/* Bell Icon Button */}
      <button
        onClick={onToggle}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell size={20} className="text-gray-400 hover:text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></span>
        )}
      </button>

      {/* Notification Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
            />
            
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-background-elevated border-l border-white/10 z-[80] overflow-hidden flex flex-col shadow-2xl"
            >
              
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div>
                  <h3 className="text-xl font-black text-white">
                    {lang === 'en' ? 'Notifications' : 'Njoftimet'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {unreadCount} {lang === 'en' ? 'unread' : 'të palexuara'}
                  </p>
                </div>
                <button
                  onClick={onToggle}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto bg-background-surface/50">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Bell size={24} className="opacity-40" />
                    </div>
                    <p className="font-bold text-white mb-1">{lang === 'en' ? 'All caught up' : 'Asnjë njoftim'}</p>
                    <p className="text-xs">{lang === 'en' ? 'Protocol updates will appear here' : 'Përditësimet e protokollit do të shfaqen këtu'}</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {notifications.map((notif) => {
                      const Icon = getIcon(notif.type);
                      const color = getColor(notif.type);
                      
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${
                            notif.read 
                              ? 'bg-white/5 border-white/5 opacity-60' 
                              : 'bg-background-elevated border-white/10 hover:border-white/20'
                          }`}
                        >
                            {!notif.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
                            )}
                             <div className="flex items-start gap-3">
                                <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                                style={{ backgroundColor: `${color}20`, color: color }}
                                >
                                <Icon size={16} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-white mb-1">{notif.title}</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">{notif.message}</p>
                                <p className="text-[10px] text-gray-600 mt-2 font-mono">
                                    {new Date(notif.timestamp).toLocaleTimeString()}
                                </p>
                                </div>
                            </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-white/10 bg-black/20">
                  <button
                    onClick={clearAll}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-gray-400 hover:text-white transition-all"
                  >
                    {lang === 'en' ? 'Clear All' : 'Pastro Të Gjitha'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}