import React from 'react';
import { motion } from 'framer-motion';
import { Github, Facebook, Twitter } from 'lucide-react';

interface FooterProps {
  dynamicColor: string;
}

export default function Footer({ dynamicColor }: FooterProps) {
  return (
    <footer className="relative mt-20 border-t border-white/5 bg-black/20 backdrop-blur-lg z-10">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Brand & Date */}
          <div className="flex flex-col gap-1 items-center md:items-start">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${dynamicColor} 0%, ${dynamicColor}80 100%)`
                }}
              >
                <span className="text-xs font-black text-black">Φ</span>
              </div>
              <span className="text-lg font-black tracking-widest text-white">CRIKZ</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">
              December 2025 • Crikz dApp
            </span>
          </div>

          {/* Social Shortcuts */}
          <div className="flex items-center gap-4">
            <SocialLink 
              href="https://github.com/Crikz-Staking" 
              icon={<Github size={18} />} 
              label="Github" 
            />
            <SocialLink 
              href="https://www.facebook.com/crikztoken/" 
              icon={<Facebook size={18} />} 
              label="Facebook" 
            />
            <SocialLink 
              href="https://x.com/CrikzToken" 
              icon={<Twitter size={18} />} // X (Twitter)
              label="X" 
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

// Helper for consistency
function SocialLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
      title={label}
    >
      {icon}
    </motion.a>
  );
}