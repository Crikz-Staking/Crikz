import React, { useState } from 'react';
import { Upload, ArrowRight, Download, RefreshCw, FileImage } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FileConverter({ dynamicColor }: { dynamicColor: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [targetFormat, setTargetFormat] = useState('png');
    const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setConvertedUrl(null);
        }
    };

    const convert = async () => {
        if (!file) return;
        setIsConverting(true);
        toast.loading("Converting...", { id: 'conv' });

        try {
            // Simulated Conversion Logic using Canvas for Images
            if (file.type.startsWith('image/')) {
                const bitmap = await createImageBitmap(file);
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(bitmap, 0, 0);
                
                const mimeType = targetFormat === 'png' ? 'image/png' : 'image/jpeg';
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setConvertedUrl(url);
                        toast.success("Conversion Complete!", { id: 'conv' });
                    }
                }, mimeType);
            } else {
                setTimeout(() => {
                    setConvertedUrl(URL.createObjectURL(file)); 
                    toast.success("Conversion Simulated", { id: 'conv' });
                }, 1000);
            }
        } catch (e) {
            toast.error("Conversion failed");
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <FileImage size={24} className="text-indigo-500" /> Media Converter
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-black/20 hover:border-indigo-500/50 transition-colors relative group">
                    <input type="file" onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <Upload size={32} className="text-gray-500 group-hover:text-indigo-500 transition-colors" />
                        <span className="text-gray-300 font-bold">{file ? file.name : "Drop File Here"}</span>
                        <span className="text-xs text-gray-500">Supports JPG, PNG, WEBP</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-6">
                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Target Format</label>
                        <select 
                            value={targetFormat} 
                            onChange={(e) => setTargetFormat(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="png">PNG Image</option>
                            <option value="jpg">JPG Image</option>
                            <option value="webp">WebP Image</option>
                        </select>
                    </div>

                    <button 
                        onClick={convert}
                        disabled={!file || isConverting}
                        className="w-full bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-400 disabled:opacity-50 transition-all"
                    >
                       {isConverting ? <RefreshCw className="animate-spin" /> : <ArrowRight />} 
                       {isConverting ? 'Processing...' : 'Convert Now'}
                    </button>

                    {convertedUrl && (
                        <motion.a 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            href={convertedUrl} 
                            download={`converted.${targetFormat}`}
                            className="block w-full text-center text-sm font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 py-3 rounded-xl hover:bg-emerald-500/20"
                        >
                            <Download size={16} className="inline mr-2"/> Download Result
                        </motion.a>
                    )}
                </div>
            </div>
        </div>
    );
}