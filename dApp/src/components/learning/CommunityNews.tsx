// src/components/learning/CommunityNews.tsx
import React from 'react';
import { BookOpen } from 'lucide-react';

interface CommunityNewsProps {
  dynamicColor: string;
}

export default function CommunityNews({ dynamicColor }: CommunityNewsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background-elevated p-4 rounded-2xl border border-white/5">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen size={20} style={{ color: dynamicColor }} />
          Community Updates
        </h3>
      </div>

      <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
        <p className="text-gray-400">No official announcements published yet.</p>
      </div>
    </div>
  );
}