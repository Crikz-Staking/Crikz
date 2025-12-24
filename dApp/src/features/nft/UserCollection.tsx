import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Tag, Wallet, Search } from 'lucide-react';
import { useUserNFTs } from '@/hooks/web3/useUserNFTs';

export default function UserCollection({ dynamicColor }: { dynamicColor: string }) {
  const { nfts, isLoading, balance } = useUserNFTs();
  
  // State for "Watching" external items not in wallet
  const [watchedItems, setWatchedItems] = useState<any[]>([]); 
  const [watchForm, setWatchForm] = useState({ address: '', tokenId: '' });

  const handleWatch = () => {
    if(!watchForm.address || !watchForm.tokenId) return;
    setWatchedItems([...watchedItems, { ...watchForm, id: watchForm.tokenId, name: 'External Watch', isExternal: true }]);
    setWatchForm({ address: '', tokenId: '' });
  };

  return (
    <div className="space-y-8">
      {/* Wallet Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="text-primary-500" /> Wallet Collection
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">{balance} Items</span>
            </h2>
            {isLoading && <span className="text-xs text-primary-500 animate-pulse">Scanning BSC Testnet...</span>}
        </div>

        {nfts.length === 0 && !isLoading ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                <p className="text-gray-500 mb-2">No Crikz Artifacts found in your wallet.</p>
                <button className="text-primary-500 text-sm font-bold hover:underline">Mint your first Artifact</button>
            </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nfts.map((nft, i) => (
                  <NFTCard key={i} nft={nft} />
              ))}
          </div>
        )}
      </div>

      {/* Watch External Section */}
      <div className="space-y-4 pt-4">
         <div className="glass-card p-6 rounded-2xl border border-white/10 bg-background-elevated">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
              <Search size={16} /> Watch External Item
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Contract Address</label>
                  <input 
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary-500 outline-none"
                      value={watchForm.address} onChange={e => setWatchForm({...watchForm, address: e.target.value})}
                      placeholder="0x..."
                  />
              </div>
              <div className="w-full md:w-32">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Token ID</label>
                  <input 
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary-500 outline-none"
                      value={watchForm.tokenId} onChange={e => setWatchForm({...watchForm, tokenId: e.target.value})}
                      placeholder="1"
                  />
              </div>
              <button onClick={handleWatch} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold text-sm flex items-center gap-2 transition-colors">
                <Eye size={16} /> Watch
              </button>
            </div>
         </div>

         {watchedItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {watchedItems.map((nft, i) => (
                    <NFTCard key={`watch-${i}`} nft={nft} isExternal />
                ))}
            </div>
         )}
      </div>
    </div>
  );
}

function NFTCard({ nft, isExternal }: any) {
    return (
        <motion.div 
            initial={{opacity:0, scale:0.95}} 
            animate={{opacity:1, scale:1}} 
            className={`glass-card p-4 rounded-xl border transition-colors ${isExternal ? 'border-dashed border-gray-600' : 'border-white/10 hover:border-primary-500/50'}`}
        >
            <div className="aspect-square bg-black/40 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative group">
                {nft.image ? (
                    <img src={nft.image} alt={nft.name} className="w-full h-full object-cover"/>
                ) : (
                    <div className="text-4xl grayscale">🎨</div>
                )}
                {isExternal && <div className="absolute top-2 right-2 bg-gray-800 text-xs px-2 py-1 rounded text-white font-bold">Watched</div>}
            </div>
            <div className="font-bold text-white truncate">{nft.name || `Asset #${nft.id}`}</div>
            <div className="text-xs text-gray-500 truncate mb-4">ID: {nft.id.toString()}</div>
            <button disabled={isExternal} className="w-full py-2 bg-primary-500 text-black font-bold rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Tag size={14} /> {isExternal ? 'ReadOnly' : 'List for Sale'}
            </button>
        </motion.div>
    );
}