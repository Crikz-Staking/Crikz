import React, { useState } from 'react';
import { QrCode, Download, Link, Type } from 'lucide-react';

export default function QRCodeGen() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);

  // Using a reliable public API for the image source to avoid heavy dependencies
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;

  const handleDownload = async () => {
    if (!text) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crikz-qr.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  return (
    <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <QrCode size={20} className="text-white" /> QR Generator
      </h3>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Content</label>
            <div className="relative">
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter wallet address, URL, or text..."
                className="input-field h-32 pl-10"
              />
              <div className="absolute left-3 top-3 text-gray-500">
                {text.startsWith('http') ? <Link size={16} /> : <Type size={16} />}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Size ({size}px)</label>
            <input 
              type="range" 
              min="100" 
              max="500" 
              value={size} 
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-4 border-white/10 relative">
          {text ? (
            <>
              <img src={qrUrl} alt="QR Code" className="rounded-lg shadow-sm" />
              <button 
                onClick={handleDownload}
                className="absolute bottom-4 right-4 p-2 bg-black text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                title="Download PNG"
              >
                <Download size={16} />
              </button>
            </>
          ) : (
            <div className="text-gray-300 flex flex-col items-center gap-2">
              <QrCode size={48} className="opacity-20 text-black" />
              <span className="text-xs font-bold text-gray-400">Enter text to generate</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}