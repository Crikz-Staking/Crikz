import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Or your state setter

export default function CommandPalette({ setSection, setView }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const actions = [
    { name: 'Go to Marketplace', section: 'active', view: 'marketplace' },
    { name: 'Create Production Order', section: 'active', view: 'production' },
    { name: 'Open Sportsbook', section: 'active', view: 'sportsbook' },
    { name: 'View Analytics', section: 'passive', view: 'analytics' },
    { name: 'Developer Tools', section: 'tools', view: 'dev' },
  ];

  const filtered = actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={() => setIsOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#12121A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center px-4 border-b border-white/10">
              <Search className="text-gray-500" size={20} />
              <input 
                autoFocus
                className="w-full bg-transparent p-4 text-white outline-none placeholder-gray-600"
                placeholder="Type a command..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <div className="text-xs text-gray-600 font-mono border border-white/10 px-2 py-1 rounded">ESC</div>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {filtered.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSection(action.section);
                    if(setView) setView(action.view);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary-500/10 hover:text-primary-500 text-gray-400 transition-colors group text-left"
                >
                  <span className="font-medium">{action.name}</span>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              {filtered.length === 0 && <div className="p-4 text-center text-gray-600 text-sm">No results found.</div>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}