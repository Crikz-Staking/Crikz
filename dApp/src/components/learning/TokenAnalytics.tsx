// src/components/learning/TokenAnalytics.tsx
import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { Language } from '../../App';

interface TokenAnalyticsProps {
  dynamicColor: string;
  lang: Language;
}

export default function TokenAnalytics({ dynamicColor, lang }: TokenAnalyticsProps) {
  const t = {
    en: { title: "Token Analytics", message: "Real-time market data is not available on the current network." },
    sq: { title: "Analitika e Tokenit", message: "Të dhënat e tregut në kohë reale nuk janë të disponueshme në rrjetin aktual." }
  }[lang];

  return (
    <div className="glass-card p-12 rounded-3xl border border-white/10 bg-background-elevated flex flex-col items-center justify-center text-center">
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: `${dynamicColor}10` }}
      >
        <BarChart3 size={40} style={{ color: dynamicColor }} />
      </div>
      <h3 className="text-2xl font-black text-white mb-2">{t.title}</h3>
      <p className="text-gray-400 max-w-md mx-auto">{t.message}</p>
      
      <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-500 font-mono">
        Contract: Connected
        <br/>
        Oracle: Not Connected
      </div>
    </div>
  );
}