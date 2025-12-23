// src/components/learning/CommunityNews.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, User, ShieldCheck, Megaphone, ChevronDown, Filter } from 'lucide-react';

interface CommunityNewsProps {
  dynamicColor: string;
}

type PostCategory = 'all' | 'official' | 'community';

export default function CommunityNews({ dynamicColor }: CommunityNewsProps) {
  const [filter, setFilter] = useState<PostCategory>('all');
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  const posts = [
    { 
      id: 1, 
      type: 'official', 
      author: 'Crikz Team', 
      title: 'Protocol Upgrade v2.1 Announcement', 
      date: 'Dec 20, 2024', 
      content: 'We are pleased to announce the upcoming release of v2.1 which introduces optimized gas costs for the Fibonacci tiers and a refreshed UI.',
      tag: 'Update'
    },
    { 
      id: 2, 
      type: 'community', 
      author: 'DeFi_Wizard', 
      title: 'Strategy: Maximizing Yield with Tier 4', 
      date: 'Dec 18, 2024', 
      content: 'After analyzing the APR curves, the 233-day lock offers the best risk-adjusted return currently. Here is my breakdown...',
      tag: 'Strategy'
    },
    { 
      id: 3, 
      type: 'official', 
      author: 'Governance', 
      title: 'Proposal #42 Passed', 
      date: 'Dec 15, 2024', 
      content: 'The community has voted to increase the production fund allocation. Changes will be implemented on-chain within 48 hours.',
      tag: 'Governance'
    },
  ];

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.type === filter);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background-elevated p-4 rounded-2xl border border-white/5">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen size={20} style={{ color: dynamicColor }} />
          Knowledge Base
        </h3>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <div className="flex bg-background-surface rounded-lg p-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'official', label: 'Official' },
              { id: 'community', label: 'Community' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id as PostCategory)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  filter === opt.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              className={`glass-card p-6 rounded-2xl border cursor-pointer transition-all hover:border-white/20 relative overflow-hidden group`}
              style={{
                borderColor: post.type === 'official' ? `${dynamicColor}40` : 'rgba(255,255,255,0.1)',
                backgroundColor: post.type === 'official' ? `${dynamicColor}05` : 'rgba(28, 28, 38, 0.6)'
              }}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {post.type === 'official' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/20">
                      <ShieldCheck size={12} /> Official
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/20">
                      <User size={12} /> Community
                    </span>
                  )}
                  <span className="text-xs text-gray-500 font-mono">{post.date}</span>
                </div>
                <div className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">
                  #{post.tag}
                </div>
              </div>

              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                {post.title}
              </h4>

              <div className="text-sm text-gray-400 leading-relaxed">
                {expandedPost === post.id ? post.content : `${post.content.substring(0, 100)}...`}
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-500">
                 <span>By {post.author}</span>
                 {expandedPost !== post.id && (
                   <span className="text-primary-500 ml-auto flex items-center gap-1">
                     Read more <ChevronDown size={12} />
                   </span>
                 )}
              </div>

              {/* Decorative flash for official posts */}
              {post.type === 'official' && (
                <div 
                  className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent blur-xl pointer-events-none" 
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Creator Actions (Simulation) */}
      <div className="text-center pt-8 border-t border-white/5">
        <button className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto">
          <Megaphone size={14} />
          Creators: Connect wallet to publish updates
        </button>
      </div>
    </div>
  );
}