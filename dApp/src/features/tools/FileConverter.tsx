import React, { useState } from 'react';
import { Upload, ArrowRight, Download, RefreshCw } from 'lucide-react';
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
            // In a real app, integrate ffmpeg.wasm for video/audio
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
                // Mock for non-images
                setTimeout(() => {
                    setConvertedUrl(URL.createObjectURL(file)); // Just return original for mock
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
        <div className="p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-white mb-6">Local File Converter</h2>
            
            <div className="space-y-6">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-black/20">
                    <input type="file" onChange={handleUpload} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload size={32} className="text-gray-500" />
                        <span className="text-gray-300 font-bold">{file ? file.name : "Click to Upload File"}</span>
                        <span className="text-xs text-gray-500">Processed locally in your browser</span>
                    </label>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 justify-center">
                    <span className="text-gray-500 font-bold text-sm uppercase">Convert to:</span>
                    <select 
                        value={targetFormat} 
                        onChange={(e) => setTargetFormat(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    >
                        <option value="png">PNG Image</option>
                        <option value="jpg">JPG Image</option>
                        <option value="webp">WebP Image</option>
                        <option value="txt">Text (Extract)</option>
                    </select>
                </div>

                <div className="flex justify-center">
                    <button 
                        onClick={convert}
                        disabled={!file || isConverting}
                        className="bg-primary-500 text-black font-black px-8 py-3 rounded-xl flex items-center gap-2 hover:bg-primary-400 disabled:opacity-50"
                    >
                       {isConverting ? <RefreshCw className="animate-spin" /> : <ArrowRight />} 
                       {isConverting ? 'Processing...' : 'Convert Now'}
                    </button>
                </div>

                {/* Result */}
                {convertedUrl && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500"><Download size={20}/></div>
                            <div>
                                <div className="text-emerald-500 font-bold">Ready for Download</div>
                                <div className="text-xs text-emerald-500/60">Your file has been processed</div>
                            </div>
                        </div>
                        <a 
                            href={convertedUrl} 
                            download={`converted-file.${targetFormat}`}
                            className="text-sm font-bold bg-emerald-500 text-black px-4 py-2 rounded-lg hover:bg-emerald-400"
                        >
                            Download
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}