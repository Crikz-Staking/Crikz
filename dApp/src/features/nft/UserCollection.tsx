import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderPlus, Image as ImageIcon } from 'lucide-react';
import { useUserNFTs } from '@/hooks/web3/useUserNFTs';

interface Collection {
  id: string;
  name: string;
  items: any[];
}

const DEFAULT_COLLECTIONS: Collection[] = [
    { id: 'default', name: 'General', items: [] },
    { id: 'favs', name: 'Favorites', items: [] }
];

export default function UserCollection({ dynamicColor }: { dynamicColor: string }) {
  const { nfts } = useUserNFTs();
  const [collections, setCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);
  const [view, setView] = useState<'grid' | 'manage'>('grid');
  const [activeCollectionId, setActiveCollectionId] = useState('default');

  // Helper to create collection
  const createCollection = (name: string) => {
    const newColl: Collection = { id: `col-${Date.now()}`, name, items: [] };
    setCollections([...collections, newColl]);
  };

  return (
    <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-white">My Collections</h2>
            <div className="flex gap-2">
                <button onClick={() => createCollection(prompt("Collection Name:") || "New Collection")} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">
                    <FolderPlus size={16}/> Create New
                </button>
            </div>
        </div>

        {/* Collection Tabs */}
        <div className="flex gap-4 overflow-x-auto pb-2">
            {collections.map(col => (
                <button 
                    key={col.id} 
                    onClick={() => setActiveCollectionId(col.id)}
                    className={`px-6 py-8 rounded-2xl border flex flex-col items-center justify-center min-w-[150px] transition-all ${activeCollectionId === col.id ? 'bg-primary-500/10 border-primary-500' : 'bg-black/20 border-white/10 hover:border-white/20'}`}
                >
                    <span className="font-bold text-lg text-white mb-1">{col.name}</span>
                    <span className="text-xs text-gray-500">0 Items</span>
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-gray-400 uppercase text-sm">Items in {collections.find(c => c.id === activeCollectionId)?.name}</h3>
            </div>

            {/* If Default, show all wallet NFTs */}
            {activeCollectionId === 'default' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {nfts.map((nft) => (
                        <div key={nft.id.toString()} className="bg-black/40 rounded-xl p-3 border border-white/5 hover:border-primary-500/50 transition-colors group relative">
                            <div className="aspect-square bg-white/5 rounded-lg mb-3 overflow-hidden">
                                {nft.image ? <img src={nft.image} className="w-full h-full object-cover"/> : <ImageIcon className="m-auto mt-10 opacity-20"/>}
                            </div>
                            <div className="font-bold text-sm truncate">{nft.name}</div>
                            
                            {/* Hover Actions */}
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-xl">
                                <button className="px-3 py-1 bg-primary-500 text-black text-xs font-bold rounded">Move</button>
                                <button className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <FolderPlus size={40} className="mx-auto mb-4 opacity-20"/>
                    <p>This collection is empty. Import items from your wallet.</p>
                </div>
            )}
        </div>
    </div>
  );
}