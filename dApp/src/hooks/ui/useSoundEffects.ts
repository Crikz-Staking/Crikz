import { useCallback } from 'react';

// Short, futuristic UI sounds (Base64 to avoid file imports)
const SOUNDS = {
  hover: "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...", // (Shortened for brevity, use a real short blip)
  click: "data:audio/wav;base64,UklGRi...", 
  success: "data:audio/wav;base64,UklGRj..."
};

// Simple synthesizer fallback if you don't want to manage mp3 files
export function useSoundEffects() {
  const playTone = useCallback((freq: number, type: 'sine' | 'square' | 'sawtooth', duration: number) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  return {
    playHover: () => playTone(400, 'sine', 0.1),
    playClick: () => playTone(600, 'square', 0.15),
    playSuccess: () => {
      playTone(440, 'sine', 0.1);
      setTimeout(() => playTone(554, 'sine', 0.1), 100);
      setTimeout(() => playTone(659, 'sine', 0.2), 200);
    },
    playError: () => playTone(150, 'sawtooth', 0.3)
  };
}