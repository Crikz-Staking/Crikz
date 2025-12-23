// src/components/learning/Reading.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, ThumbsUp, ChevronDown } from 'lucide-react';
import { useAccount } from 'wagmi';
// FIX: Correct import
import type { Language } from '@/types';

interface ReadingProps {
  dynamicColor: string;
  lang: Language;
}

export default function Reading({ dynamicColor, lang }: ReadingProps) {
  const { isConnected } = useAccount();
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  
  // Mock Data
  const rawPosts = [
    { id: 1, type: 'official', author: 'Crikz Team', title: 'Protocol Upgrade v2.1', date: 'Dec 20, 2024', summary: 'Optimized gas costs & UI refresh.', content: 'Full details about v2.1...', upvotes: 150 },
    { id: 2, type: 'community', author: 'DeFi_Wizard', title: 'Strategy: Tier 4 Yields', date: 'Dec 18, 2024', summary: 'Why 233-day lock is optimal.', content: 'Deep dive into APR...', upvotes: 45 },
    { id: 3, type: 'official', author: 'Governance', title: 'Proposal #42 Passed', date: 'Dec 15, 2024', summary: 'Production fund allocation increased.', content: 'Voting results...', upvotes: 200 },
    { id: 4, type: 'community', author: 'CryptoUser1', title: 'My Experience', date: 'Dec 10, 2024', summary: 'Review of the dApp.', content: 'I like it...', upvotes: 12 },
    { id: 5, type: 'official', author: 'Crikz Team', title: 'Old Update', date: 'Jan 01, 2024', summary: 'Legacy news.', content: 'Old stuff...', upvotes: 100 },
  ];

  const t = {
    en: { official: "OFFICIAL", community: "COMMUNITY", readMore: "Read Details", upvote: "Upvote" },
    sq: { official: "ZYRTARE", community: "KOMUNITETI", readMore: "Lexo Detajet", upvote: "Voto" }
  }[lang];

  // Sorting Logic: 2 latest official, then community by upvotes
  const sortedPosts = useMemo(() => {
    const officials = rawPosts.filter(p => p.type === 'official').slice(0, 2); // Top 2 latest official
    const community = rawPosts.filter(p => p.type === 'community').sort((a, b) => b.upvotes - a.upvotes);
    return [...officials, ...community];
  }, []);

  return (
    <div className="space-y-4">
      {sortedPosts.map((post) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-6 rounded-2xl border transition-all relative overflow-hidden group ${post.type === 'official' ? 'border-l-4 border-l-amber-500' : 'border-white/10'}`}
          style={{ borderColor: post.type === 'official' ? undefined : 'rgba(255,255,255,0.1)' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
               {post.type === 'official' ? (
                 <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-500 px-2 py-1 rounded">
                   <ShieldCheck size={12} /> {t.official}
                 </span>
               ) : (
                 <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                   <User size={12} /> {t.community}
                 </span>
               )}
               <span className="text-xs text-gray-500">{post.date}</span>
            </div>
            {post.type === 'community' && (
              <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                <ThumbsUp size={12} /> {post.upvotes}
              </div>
            )}
          </div>

          {/* Title & Quick Read */}
          <h3 className="text-lg font-bold text-white mb-2">{post.title}</h3>
          <p className="text-sm text-gray-300 mb-4">{post.summary}</p>

          {/* Interaction */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <button 
              onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              className="text-xs font-bold text-primary-500 flex items-center gap-1 hover:text-white transition-colors"
            >
              {t.readMore} <ChevronDown size={14} className={`transition-transform ${expandedPost === post.id ? 'rotate-180' : ''}`} />
            </button>
            
            {post.type === 'community' && (
               <button 
                 disabled={!isConnected}
                 className="text-[10px] font-bold border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50"
               >
                 {t.upvote}
               </button>
            )}
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
             {expandedPost === post.id && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 text-sm text-gray-400 leading-relaxed border-t border-white/5 mt-4">
                  {post.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}