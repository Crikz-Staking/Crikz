import React, { useState } from 'react';
import { useSignMessage, useAccount } from 'wagmi';
import { verifyMessage } from 'viem';
import { PenTool, ShieldCheck, CheckCircle, XCircle, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SignatureTool() {
    const { address } = useAccount();
    const [mode, setMode] = useState<'sign' | 'verify'>('sign');
    
    // Sign State
    const [messageToSign, setMessageToSign] = useState('');
    const { signMessageAsync, isPending } = useSignMessage();
    const [lastSignature, setLastSignature] = useState('');

    // Verify State
    const [verifyMsg, setVerifyMsg] = useState('');
    const [verifySig, setVerifySig] = useState('');
    const [verifyAddress, setVerifyAddress] = useState('');
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const handleSign = async () => {
        try {
            const sig = await signMessageAsync({ message: messageToSign });
            setLastSignature(sig);
            toast.success("Message Signed!");
        } catch (e) {
            toast.error("User rejected signature");
        }
    };

    const handleVerify = async () => {
        try {
            const valid = await verifyMessage({
                address: verifyAddress as `0x${string}`,
                message: verifyMsg,
                signature: verifySig as `0x${string}`,
            });
            setIsValid(valid);
            if(valid) toast.success("Signature Valid");
            else toast.error("Invalid Signature");
        } catch (e) {
            setIsValid(false);
            toast.error("Verification Error");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="glass-card p-8 rounded-3xl border border-white/10 bg-background-elevated">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <PenTool size={20} className="text-accent-purple" /> 
                    Signature & Identity
                </h3>
                <div className="bg-black/40 p-1 rounded-lg border border-white/5 flex text-xs font-bold">
                    <button onClick={() => setMode('sign')} className={`px-3 py-1 rounded-md transition-colors ${mode === 'sign' ? 'bg-primary-500 text-black' : 'text-gray-500'}`}>Sign</button>
                    <button onClick={() => setMode('verify')} className={`px-3 py-1 rounded-md transition-colors ${mode === 'verify' ? 'bg-primary-500 text-black' : 'text-gray-500'}`}>Verify</button>
                </div>
            </div>

            {mode === 'sign' ? (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Message</label>
                        <textarea 
                            value={messageToSign}
                            onChange={(e) => setMessageToSign(e.target.value)}
                            className="input-field min-h-[100px]"
                            placeholder="Type a message to sign..."
                        />
                    </div>
                    <button 
                        onClick={handleSign} 
                        disabled={!messageToSign || isPending}
                        className="btn-primary w-full py-3"
                    >
                        {isPending ? 'Signing...' : 'Sign Message'}
                    </button>
                    
                    {lastSignature && (
                        <div className="bg-black/40 p-4 rounded-xl border border-white/10 break-all relative group">
                            <label className="text-[10px] text-gray-500 uppercase block mb-1">Resulting Signature</label>
                            <p className="text-xs text-accent-purple font-mono">{lastSignature}</p>
                            <button onClick={() => copyToClipboard(lastSignature)} className="absolute top-2 right-2 p-2 bg-white/10 rounded hover:bg-white/20">
                                <Copy size={14} />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Signer Address</label>
                        <input value={verifyAddress} onChange={e=>setVerifyAddress(e.target.value)} className="input-field" placeholder="0x..." />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Original Message</label>
                        <textarea value={verifyMsg} onChange={e=>setVerifyMsg(e.target.value)} className="input-field h-20" placeholder="Message content..." />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Signature Hash</label>
                        <textarea value={verifySig} onChange={e=>setVerifySig(e.target.value)} className="input-field h-24 font-mono text-xs" placeholder="0x..." />
                    </div>
                    <button onClick={handleVerify} className="btn-primary w-full py-3 bg-accent-cyan hover:bg-cyan-400">Verify Signature</button>
                    
                    {isValid !== null && (
                        <div className={`flex items-center gap-2 justify-center p-3 rounded-xl font-bold ${isValid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                            {isValid ? <CheckCircle /> : <XCircle />}
                            {isValid ? "Valid Signature" : "Invalid Signature"}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}