import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PriceTicker() {
  // Mock data for display - in production, fetch from CoinGecko/Chainlink
  const prices = [
    { pair: "BTC/USD", price: "98,432.10", change: 2.4 },
    { pair: "ETH/USD", price: "3,892.45", change: -1.2 },
    { pair: "BNB/USD", price: "612.30", change: 0.8 },
    { pair: "CRKZ/USD", price: "0.0618", change: 6.18 }, // The Protocol Token
    { pair: "SOL/USD", price: "145.20", change: 4.5 },
  ];

  return (
    <div className="w-full bg-[#050508] border-b border-white/5 h-8 overflow-hidden flex items-center relative z-50">
      <div className="flex whitespace-nowrap">
        <motion.div 
          className="flex gap-8 px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {/* Duplicate list to create seamless loop */}
          {[...prices, ...prices, ...prices].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
              <span className="font-bold text-gray-400">{item.pair}</span>
              <span className="text-white">{item.price}</span>
              <span className={`flex items-center ${item.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {item.change >= 0 ? <TrendingUp size={10} className="mr-0.5"/> : <TrendingDown size={10} className="mr-0.5"/>}
                {item.change}%
              </span>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#050508] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#050508] to-transparent pointer-events-none" />
    </div>
  );
}