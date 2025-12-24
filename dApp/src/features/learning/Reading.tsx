import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, BookOpen, Megaphone, ChevronDown, Filter } from 'lucide-react';
import { Language } from '@/types';

interface ReadingProps {
  dynamicColor: string;
  lang: Language;
}

type Category = 'All' | 'Updates' | 'Education' | 'Community';

interface Post {
  id: string;
  category: Category;
  title: string;
  date: string;
  summary: string;
  content: React.ReactNode;
  isOfficial: boolean;
}

export default function Reading({ dynamicColor, lang }: ReadingProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // REAL DATA - No Mocks
  const posts: Post[] = [
    {
      id: 'upgrade-v2',
      category: 'Updates',
      title: 'Protocol Upgrade: Crikz Architecture v2.0',
      date: 'Dec 24, 2025',
      isOfficial: true,
      summary: 'Major structural optimization and directory overhaul for enhanced dApp efficiency.',
      content: (
        <div className="space-y-4">
          <p>
            We are proud to announce the successful deployment of the <strong>Crikz Protocol v2.0</strong> architecture. 
            This upgrade focuses on modularity and high-efficiency asset management within the dApp structure.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li><strong>Optimized Directory:</strong> Streamlined logic separation between UI, Features, and Core Logic.</li>
            <li><strong>Logic Implementation:</strong> Hardened asset logic replacing placeholder mocks.</li>
            <li><strong>Visual Identity:</strong> New "C-Phi" branding integration across the interface.</li>
          </ul>
          <p>
            This update lays the foundation for the upcoming Token Generation Event (TGE) and the activation of the Production Fund.
          </p>
        </div>
      )
    }
  ];

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'All') return posts;
    return posts.filter(p => p.category === activeCategory);
  }, [posts, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Filter size={14} className="text-gray-500 mr-2" />
        {(['All', 'Updates', 'Education', 'Community'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeCategory === cat 
                ? 'bg-primary-500/20 border-primary-500 text-primary-500' 
                : 'bg-white/5 border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="grid gap-4">
        {filteredPosts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card p-6 rounded-2xl border transition-all relative overflow-hidden ${
              post.isOfficial ? 'border-primary-500/30' : 'border-white/10'
            }`}
          >
            {post.isOfficial && (
              <div className="absolute top-0 right-0 p-2 bg-primary-500/10 rounded-bl-xl border-b border-l border-primary-500/20">
                <ShieldCheck size={14} className="text-primary-500" />
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                post.category === 'Updates' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-300'
              }`}>
                {post.category}
              </span>
              <span className="text-xs text-gray-600 font-mono">{post.date}</span>
            </div>

            <h3 className="text-lg font-black text-white mb-2">{post.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{post.summary}</p>

            <button 
              onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
              className="flex items-center gap-2 text-xs font-bold text-primary-500 hover:text-white transition-colors"
            >
              {expandedId === post.id ? 'Close Details' : 'Read Full Update'}
              <ChevronDown size={14} className={`transition-transform ${expandedId === post.id ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {expandedId === post.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-white/5 text-sm text-gray-300 leading-relaxed">
                    {post.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}