import React from 'react';
import { Play, Music, Film } from 'lucide-react';

export default function MediaPlayer({ type, dynamicColor }: { type: 'audio' | 'video', dynamicColor: string }) {
    const items = [1, 2, 3, 4]; // Mocks

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map(i => (
                <div key={i} className="glass-card rounded-2xl overflow-hidden border border-white/10 group cursor-pointer">
                    <div className="aspect-video bg-black/40 relative flex items-center justify-center">
                        {type === 'audio' ? <Music size={40} className="text-gray-600"/> : <Film size={40} className="text-gray-600"/>}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center pl-1">
                                <Play size={20} className="text-black fill-black" />
                            </div>
                        </div>
                    </div>
                    <div className="p-4">
                        <h4 className="text-white font-bold truncate">{type === 'audio' ? 'Decentralized Beats Vol. 1' : 'Crypto Summit 2025 Keynote'}</h4>
                        <p className="text-xs text-gray-500 mt-1">Artist / Creator Name</p>
                    </div>
                </div>
            ))}
        </div>
    );
}