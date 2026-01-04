import React from 'react';
import { Github, Twitter, Facebook } from 'lucide-react';
import BrandLogo from './BrandLogo';
import NetworkStatus from '@/components/ui/NetworkStatus';

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/5 bg-black/20 backdrop-blur-lg z-10">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex flex-col items-center md:items-start gap-4">
            <BrandLogo size="lg" />
            <p className="text-gray-500 text-sm max-w-xs text-center md:text-left">
              A decentralized production protocol powered by Fibonacci mathematics and algorithmic reputation.
            </p>
          </div>

          <div className="flex gap-6">
            <SocialLink 
              href="https://github.com/Crikz-Staking/Crikz" 
              icon={<Github size={20} />} 
              label="GitHub"
            />
            <SocialLink 
              href="http://x.com/crikztoken" 
              icon={<Twitter size={20} />} 
              label="X (Twitter)"
            />
            <SocialLink 
              href="https://www.facebook.com/crikztoken" 
              icon={<Facebook size={20} />} 
              label="Facebook"
            />
          </div>
        </div>
        
        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left text-[10px] text-gray-600 font-mono">
            © 2025 Crikz Protocol. All systems nominal.
          </div>
          
          {/* Network Status Widget */}
          <NetworkStatus />
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-gray-500 hover:text-primary-500 transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10"
      aria-label={label}
    >
      {icon}
    </a>
  );
}