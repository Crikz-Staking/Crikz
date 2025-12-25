import React, { useState } from 'react';
import { BookOpen, Search, BookMarked, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Language } from '@/types'; // FIXED: Add import

interface ReadingProps {
  dynamicColor: string;
  lang: Language;
}

const ARTICLES = [
  { id: 1, title: "Understanding Fibonacci in DeFi", category: "Mathematics", readTime: "5 min" },
  { id: 2, title: "Production Orders Explained", category: "Protocol", readTime: "8 min" },
  { id: 3, title: "The Power of Algorithmic Reputation", category: "Governance", readTime: "6 min" },
];

export default function Reading({ dynamicColor, lang }: ReadingProps) { // FIXED
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black text-white">Knowledge Base</h3>
          <p className="text-gray-400 text-sm">Deep dives into the Crikz ecosystem.</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search articles..." 
            className="bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ARTICLES.map((article) => (
          <motion.div 
            key={article.id}
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-primary-500/10 text-primary-500 px-2 py-1 rounded">
                {article.category}
              </span>
              <BookMarked size={16} className="text-gray-600 group-hover:text-primary-500 transition-colors" />
            </div>
            <h4 className="text-lg font-bold text-white mb-4 group-hover:text-primary-400 transition-colors">{article.title}</h4>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs text-gray-500 font-mono">{article.readTime} read</span>
              <ArrowRight size={16} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}