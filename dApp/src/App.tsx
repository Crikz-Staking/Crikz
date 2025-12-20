import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import toast, { Toaster } from 'react-hot-toast';
import { 
  TrendingUp, TrendingDown, Wallet, Award, Target, Clock, Zap, 
  Activity, BarChart3, PieChart, Lock, DollarSign, Flame, 
  Box, Layers, FileText, Cpu, Shield, AlertTriangle, AlertCircle
} from 'lucide-react';

// --- SAFETY: ERROR BOUNDARY TO CATCH CRASHES ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', background: '#111', color: '#ff3333', height: '100vh', fontFamily: 'monospace' }}>
          <h1>⚠️ The App Crashed</h1>
          <p>Please check the following error message:</p>
          <pre style={{ background: '#222', padding: '20px', borderRadius: '10px', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- CONFIGURATION WITH FALLBACKS ---
// We use try/catch for import.meta.env to prevent crashes in non-Vite environments
let TOKEN_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000';
let STAKING_POOL_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000';
let EXPECTED_CHAIN_ID = 97;

try {
  // @ts-ignore
  if (import.meta.env) {
    // @ts-ignore
    TOKEN_ADDRESS = (import.meta.env.VITE_TOKEN_ADDRESS as `0x${string}`) || TOKEN_ADDRESS;
    // @ts-ignore
    STAKING_POOL_ADDRESS = (import.meta.env.VITE_STAKING_POOL_ADDRESS as `0x${string}`) || STAKING_POOL_ADDRESS;
    // @ts-ignore
    EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_EXPECTED_CHAIN_ID) || 97;
  }
} catch (e) {
  console.warn("Environment variables could not be loaded", e);
}

const TOKEN = TOKEN_ADDRESS;
const POOL = STAKING_POOL_ADDRESS;

// --- ABIS ---
const TOKEN_ABI = [
  { name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'allowance', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'approve', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const;

const POOL_ABI = [
  { name: 'stake', inputs: [{ type: 'uint256' }, { type: 'uint8' }], outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { name: 'claimRewards', inputs: [], outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { name: 'withdrawEarly', inputs: [{ type: 'uint256' }], outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { name: 'pendingRewards', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'getUserTotalStaked', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'totalWeightedStake', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'totalStaked', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'totalRewardsDistributed', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'userLifetimeRewards', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { name: 'userTaxesPaid', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const;

// --- CONSTANTS ---
const TIERS = [
  { days: 8, multiplierBP: 10000, name: "Epoch I", scale: 1 },
  { days: 13, multiplierBP: 11180, name: "Epoch II", scale: 1.05 },
  { days: 21, multiplierBP: 12500, name: "Epoch III", scale: 1.10 },
  { days: 34, multiplierBP: 13980, name: "Epoch IV", scale: 1.15 },
  { days: 55, multiplierBP: 15630, name: "Epoch V", scale: 1.20 },
  { days: 89, multiplierBP: 17480, name: "Epoch VI", scale: 1.25 },
  { days: 144, multiplierBP: 19540, name: "Epoch VII", scale: 1.30 },
  { days: 233, multiplierBP: 21850, name: "Epoch VIII", scale: 1.35 },
  { days: 377, multiplierBP: 24420, name: "Epoch IX", scale: 1.40 },
  { days: 610, multiplierBP: 27300, name: "Epoch X", scale: 1.45 },
  { days: 987, multiplierBP: 30520, name: "Epoch XI", scale: 1.50 },
  { days: 1597, multiplierBP: 34130, name: "Epoch XII", scale: 1.55 },
  { days: 2584, multiplierBP: 38180, name: "Epoch XIII", scale: 1.618 },
];

// --- HELPER COMPONENTS ---

const NumberTicker = ({ value, label, subValue, subLabel, icon: Icon, color, size = 'md' }: any) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    // Safety check for invalid values
    if (!value || typeof value !== 'string') return;
    
    let start = parseFloat(displayValue.replace(/,/g, ''));
    const end = parseFloat(value.replace(/,/g, ''));
    
    if (isNaN(start)) start = 0;
    if (isNaN(end)) {
        setDisplayValue(value);
        return;
    }
    
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      
      const current = start + (end - start) * ease;
      setDisplayValue(current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div style={{
      marginBottom: '24px',
      position: 'relative',
      paddingLeft: '16px',
      borderLeft: `2px solid ${color}40`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        {Icon && <Icon size={size === 'lg' ? 28 : 18} color={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />}
        <span style={{ 
          fontSize: '12px', 
          color: '#8899aa', 
          textTransform: 'uppercase', 
          letterSpacing: '2px',
          fontWeight: 600
        }}>{label}</span>
      </div>
      <div style={{ 
        fontSize: size === 'lg' ? '42px' : '28px', 
        fontWeight: 900, 
        color: '#fff',
        fontFamily: 'monospace',
        textShadow: `0 0 15px ${color}40`
      }}>
        {displayValue}
      </div>
      {subValue && (
        <div style={{ 
          fontSize: '14px', 
          color: color, 
          marginTop: '4px', 
          opacity: 0.8,
          display: 'flex', 
          alignItems: 'center',
          gap: '6px' 
        }}>
          <span style={{ fontSize: '100%' }}>{subValue}</span>
          <span style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase' }}>{subLabel}</span>
        </div>
      )}
    </div>
  );
};

const BlockchainBlock = ({ delay, xPos, size }: { delay: number, xPos: number, size: number }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: `${xPos}%`,
    width: `${size}px`,
    height: `${size}px`,
    border: '1px solid rgba(0, 255, 136, 0.3)',
    background: 'rgba(0, 255, 136, 0.05)',
    animation: `blockFade 8s infinite ${delay}s`,
    opacity: 0,
    transform: 'translateY(-50%) rotate(45deg)',
    backdropFilter: 'blur(2px)'
  }} />
);

// --- MAIN CONTENT WRAPPED IN SAFETY ---

function MainAppContent() {
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState(5);
  const [activeTab, setActiveTab] = useState('stake');
  const [pulsatingColor, setPulsatingColor] = useState('#00ff88');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [glowIntensity, setGlowIntensity] = useState(0.5);

  // Safe Address Handling
  const { address: walletAddress } = useAccount();
  
  // Fib Timer
  useEffect(() => {
    const fibSequence = [1, 1, 2, 3, 5, 8, 13, 21];
    let fibIndex = 0;
    
    const interval = setInterval(() => {
      const time = Date.now() / 1000;
      const hue = (Math.sin(time * 0.1) * 30 + 150); 
      const color = `hsl(${hue}, 100%, 50%)`;
      setPulsatingColor(color);
      
      const intensity = (Math.sin(time * fibSequence[fibIndex % fibSequence.length]) + 1) / 2;
      setGlowIntensity(0.3 + (intensity * 0.4)); 
      
      fibIndex++;
    }, 100);

    const dataTimer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(dataTimer);
    };
  }, []);

  // --- WAGMI READS (Wrapped safely) ---
  // Using conditional enablement to prevent 'undefined' address errors
  const { data: walletBal, refetch: refetchWallet } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: 'balanceOf', args: [walletAddress || '0x0000000000000000000000000000000000000000'], query: { enabled: !!walletAddress } });
  const { data: poolBal, refetch: refetchPool } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: 'balanceOf', args: [POOL] });
  const { data: totalSupply } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: 'totalSupply' });
  const { data: totalStaked } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: 'totalStaked' });
  const { data: totalWeighted } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: 'totalWeightedStake' });
  const { data: pending, refetch: refetchPending } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: 'pendingRewards', args: [walletAddress || '0x0000000000000000000000000000000000000000'], query: { enabled: !!walletAddress } });
  const { data: userStaked } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: 'getUserTotalStaked', args: [walletAddress || '0x0000000000000000000000000000000000000000'], query: { enabled: !!walletAddress } });
  const { data: lifetimeRewards } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: 'userLifetimeRewards', args: [walletAddress || '0x0000000000000000000000000000000000000000'], query: { enabled: !!walletAddress } });
  const { data: userTaxes } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: 'userTaxesPaid', args: [walletAddress || '0x0000000000000000000000000000000000000000'], query: { enabled: !!walletAddress } });
  const { data: totalRewardsDistributed } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: 'totalRewardsDistributed' });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: 'allowance', args: [walletAddress || '0x0000000000000000000000000000000000000000', POOL], query: { enabled: !!walletAddress } });

  useEffect(() => {
    refetchWallet();
    refetchPool();
    refetchPending();
    refetchAllowance();
  }, [currentTime]);

  const { writeContract, data: hash, isPending: writing } = useWriteContract();
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash });

  // Safe Calculations
  const baseAPY = useMemo(() => {
    if (poolBal && totalWeighted && totalWeighted > 0n) {
      try {
        return (Number(formatEther(poolBal)) / Number(formatEther(totalWeighted))) * 365 * 100;
      } catch (e) { return 0; }
    }
    return 0;
  }, [poolBal, totalWeighted]);

  const tierAPY = (baseAPY * TIERS[selectedTier].multiplierBP / 10000).toFixed(2);
  
  const price = useMemo(() => {
    if (totalSupply && poolBal) {
      try {
        const supplyNum = Number(formatEther(totalSupply));
        if (supplyNum === 0) return 0.00437500;
        return Number(formatEther(poolBal)) * 0.0001 / supplyNum;
      } catch (e) { return 0.00437500; }
    }
    return 0.00437500;
  }, [totalSupply, poolBal]);
  
  const totalTaxes = totalRewardsDistributed ? Number(formatEther(totalRewardsDistributed)) * 0.1 : 0; 
  const totalPenalties = totalRewardsDistributed ? Number(formatEther(totalRewardsDistributed)) * 0.05 : 0;
  const userPenalties = lifetimeRewards ? Number(formatEther(lifetimeRewards)) * 0.05 : 0;

  useEffect(() => { 
    if (confirmed) { 
      toast.dismiss(); 
      toast.success('Transaction Successful'); 
      setAmount('');
    } 
  }, [confirmed]);

  const handleStake = () => {
    try {
        const val = parseEther(amount || '0');
        if (val === 0n) return toast.error('Enter amount');
        if (!allowance || allowance < val) {
          writeContract({ address: TOKEN, abi: TOKEN_ABI, functionName: 'approve', args: [POOL, val] });
          toast.loading('Approving...');
        } else {
          writeContract({ address: POOL, abi: POOL_ABI, functionName: 'stake', args: [val, selectedTier] });
          toast.loading('Staking...');
        }
    } catch (e) {
        toast.error("Invalid amount entered");
    }
  };

  const handleClaim = () => {
    writeContract({ address: POOL, abi: POOL_ABI, functionName: 'claimRewards' });
    toast.loading('Claiming...');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      color: '#e0e0e0',
      fontFamily: '"SF Mono", "Roboto Mono", monospace',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'rgba(0,20,10,0.95)',
          color: pulsatingColor,
          border: `1px solid ${pulsatingColor}`,
          fontFamily: 'monospace'
        }
      }} />

      {/* STYLES */}
      <style>{`
        @keyframes blockFade {
          0% { opacity: 0; transform: translateY(-30%) rotate(45deg); }
          20% { opacity: ${glowIntensity}; transform: translateY(-50%) rotate(45deg); }
          80% { opacity: ${glowIntensity}; transform: translateY(-50%) rotate(45deg); }
          100% { opacity: 0; transform: translateY(-70%) rotate(45deg); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 10px ${pulsatingColor}20; }
          50% { box-shadow: 0 0 30px ${pulsatingColor}40; }
          100% { box-shadow: 0 0 10px ${pulsatingColor}20; }
        }
        @keyframes floatAlien {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .tier-box:hover {
          background: ${pulsatingColor}15 !important;
          border-color: ${pulsatingColor} !important;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: ${pulsatingColor}40; border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(5, 5, 5, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${pulsatingColor}30`,
        height: '140px'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
           <BlockchainBlock delay={1} xPos={10} size={40} />
           <BlockchainBlock delay={2} xPos={23} size={20} />
           <BlockchainBlock delay={3} xPos={35} size={60} />
           <BlockchainBlock delay={5} xPos={50} size={30} />
           <BlockchainBlock delay={8} xPos={68} size={50} />
           <BlockchainBlock delay={13} xPos={85} size={25} />
        </div>

        <div style={{ maxWidth: '1800px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', zIndex: 2 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               <Box size={40} color={pulsatingColor} />
               <h1 style={{ 
                 fontSize: '32px', 
                 margin: 0, 
                 letterSpacing: '4px', 
                 fontWeight: 300,
                 textShadow: `0 0 20px ${pulsatingColor}60`
               }}>CRIKZ<span style={{ fontWeight: 900, color: pulsatingColor }}>PHI</span></h1>
             </div>
             <ConnectButton showBalance={false} />
           </div>

           <nav style={{ display: 'flex', padding: '0 40px', gap: '5px', zIndex: 2 }}>
             {['Stake', 'Swap', 'Learn', 'Analytics', 'Docs'].map((tab) => {
               const isActive = activeTab === tab.toLowerCase();
               return (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab.toLowerCase())}
                   style={{
                     flex: 1,
                     maxWidth: '200px',
                     padding: '15px 0',
                     background: isActive ? `linear-gradient(180deg, ${pulsatingColor}10 0%, transparent 100%)` : 'transparent',
                     border: `1px solid ${isActive ? pulsatingColor : 'transparent'}`,
                     borderBottom: 'none',
                     borderRadius: '12px 12px 0 0',
                     color: isActive ? '#fff' : '#666',
                     fontSize: '14px',
                     textTransform: 'uppercase',
                     letterSpacing: '2px',
                     cursor: 'pointer',
                     transition: 'all 0.3s ease',
                     backdropFilter: isActive ? 'blur(10px)' : 'none',
                     opacity: isActive ? 1 : 0.6
                   }}
                 >
                   {tab}
                 </button>
               );
             })}
           </nav>
        </div>
      </header>

      {/* LAYOUT: 22.5% | 40% | 37.5% */}
      {activeTab === 'stake' ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '22.5fr 40fr 37.5fr', 
          minHeight: 'calc(100vh - 140px)',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          
          {/* LEFT: GLOBAL */}
          <aside style={{
            background: 'linear-gradient(90deg, #050505 0%, #080808 100%)',
            borderRight: `1px solid ${pulsatingColor}20`,
            padding: '40px',
            overflowY: 'auto'
          }}>
             <h3 style={{ 
               color: pulsatingColor, 
               fontSize: '18px', 
               marginBottom: '40px', 
               display: 'flex', 
               alignItems: 'center', 
               gap: '10px',
               textShadow: `0 0 10px ${pulsatingColor}`
             }}>
               <Activity size={20} /> GLOBAL METRICS
             </h3>

             <NumberTicker label="Token Price" value={price.toFixed(8)} icon={DollarSign} color={pulsatingColor} size="lg" />
             <NumberTicker label="Total Supply" value={totalSupply ? formatEther(totalSupply) : "0"} icon={Layers} color="#00d4ff" />
             <NumberTicker label="Total Staked" value={totalStaked ? formatEther(totalStaked) : "0"} icon={Lock} color="#ff00e6" />
             <NumberTicker label="Rewards Distributed" value={totalRewardsDistributed ? formatEther(totalRewardsDistributed) : "0"} icon={Award} color="#ffaa00" />
             <NumberTicker label="Taxes Added" value={totalTaxes.toFixed(2)} icon={Shield} color="#ff3333" />
             <NumberTicker label="Penalty Rewards" value={totalPenalties.toFixed(2)} icon={AlertTriangle} color="#ff3333" />
          </aside>

          {/* MIDDLE: INTERACTION */}
          <main style={{
            position: 'relative',
            background: '#020202',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRight: `1px solid ${pulsatingColor}20`,
            overflowY: 'auto'
          }}>
            {/* BACKGROUND ANIMATION */}
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              height: '600px',
              background: `radial-gradient(circle, ${pulsatingColor}10 0%, transparent 70%)`,
              zIndex: 0,
              pointerEvents: 'none',
              animation: 'pulseGlow 4s infinite'
            }}>
               <div style={{
                 position: 'absolute', top: '25%', left: '25%', width: '50%', height: '50%',
                 border: `2px dashed ${pulsatingColor}20`, borderRadius: '50%',
                 animation: 'floatAlien 6s infinite ease-in-out'
               }}></div>
               <div style={{
                 position: 'absolute', top: '15%', left: '15%', width: '70%', height: '70%',
                 border: `1px solid ${pulsatingColor}10`, borderRadius: '50%',
                 animation: 'floatAlien 8s infinite ease-in-out reverse'
               }}></div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '800px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '6px', marginBottom: '40px', color: '#fff', fontWeight: 100 }}>
                SELECT <span style={{ color: pulsatingColor }}>EPOCH</span>
              </h2>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: '50px' }}>
                {TIERS.map((tier, i) => {
                  const isActive = selectedTier === i;
                  const sizeMultiplier = tier.scale; 
                  return (
                    <div 
                      key={i}
                      onClick={() => setSelectedTier(i)}
                      className="tier-box"
                      style={{
                        flex: `1 1 ${100 * sizeMultiplier}px`,
                        height: `${80 * sizeMultiplier}px`,
                        minWidth: '100px',
                        background: isActive ? `${pulsatingColor}20` : 'rgba(20,20,20,0.6)',
                        border: `1px solid ${isActive ? pulsatingColor : '#333'}`,
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        backdropFilter: 'blur(5px)'
                      }}
                    >
                      {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', width: '100%', background: pulsatingColor, boxShadow: `0 0 15px ${pulsatingColor}` }}></div>}
                      <span style={{ fontSize: `${12 * sizeMultiplier}px`, color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>{tier.days} Days</span>
                      <span style={{ fontSize: `${18 * sizeMultiplier}px`, fontWeight: 900, color: '#fff' }}>{(baseAPY * tier.multiplierBP / 10000).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'rgba(10,10,10,0.8)', padding: '40px', borderRadius: '20px', border: `1px solid ${pulsatingColor}30`, boxShadow: `0 0 50px rgba(0,0,0,0.5)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#666', letterSpacing: '1px' }}>AMOUNT TO STAKE</span>
                  <span style={{ fontSize: '12px', color: pulsatingColor, cursor: 'pointer' }} onClick={() => walletBal && setAmount(formatEther(walletBal))}>
                    MAX: {walletBal ? parseFloat(formatEther(walletBal)).toFixed(2) : '0'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                  <input 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '2px solid #333', fontSize: '36px', color: '#fff', fontFamily: 'monospace', padding: '10px 0', outline: 'none' }}
                  />
                  <button 
                    onClick={handleStake}
                    disabled={!amount || writing}
                    style={{
                      background: !amount ? '#222' : pulsatingColor,
                      color: !amount ? '#555' : '#000',
                      border: 'none',
                      padding: '0 40px',
                      borderRadius: '4px',
                      fontSize: '16px',
                      fontWeight: 900,
                      cursor: !amount ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)'
                    }}
                  >
                    {writing ? 'INITIATING...' : 'ENGAGE'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1, padding: '15px', background: '#111', borderRadius: '4px', border: '1px solid #222' }}>
                     <div style={{ fontSize: '10px', color: '#666' }}>PROJECTED RETURN</div>
                     <div style={{ fontSize: '18px', color: pulsatingColor }}>
                       {amount && !isNaN(parseFloat(amount)) 
                         ? (parseFloat(amount) * (parseFloat(tierAPY)/100/365 * TIERS[selectedTier].days)).toFixed(2) 
                         : '0.00'} CRIKZ
                     </div>
                  </div>
                  <button 
                    onClick={handleClaim}
                    disabled={!pending || pending === 0n}
                    style={{ flex: 1, background: 'transparent', border: `1px solid ${pulsatingColor}`, color: pulsatingColor, fontWeight: 700, cursor: (!pending || pending === 0n) ? 'not-allowed' : 'pointer', opacity: (!pending || pending === 0n) ? 0.3 : 1 }}
                  >
                    CLAIM REWARDS
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT: PERSONAL */}
          <aside style={{
            background: 'linear-gradient(90deg, #080808 0%, #050505 100%)',
            padding: '40px',
            overflowY: 'auto'
          }}>
             <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', textAlign: 'right' }}>
               PERSONAL LEDGER <Wallet size={20} color={pulsatingColor} />
             </h3>

             <NumberTicker 
               label="Wallet Balance" 
               value={walletBal ? formatEther(walletBal) : "0"} 
               icon={Cpu} 
               color={pulsatingColor}
               subValue={userStaked ? formatEther(userStaked) : "0"}
               subLabel={`STAKED (${((Number(userStaked || 0)/Number((Number(userStaked || 0) + Number(walletBal || 0)) || 1))*100).toFixed(1)}%)`}
             />

             <NumberTicker label="Your Stake" value={userStaked ? formatEther(userStaked) : "0"} icon={Lock} color="#00d4ff" />
             <NumberTicker label="Lifetime Earned" value={lifetimeRewards ? formatEther(lifetimeRewards) : "0"} icon={TrendingUp} color="#ff00e6" />
             <NumberTicker label="Taxes Paid" value={userTaxes ? formatEther(userTaxes) : "0"} icon={FileText} color="#ffaa00" />
             <NumberTicker label="Penalties Paid" value={userPenalties.toFixed(2)} icon={AlertTriangle} color="#ff3333" />
          </aside>
        </div>
      ) : (
        <div style={{ height: 'calc(100vh - 140px)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: '#333' }}>
          <Activity size={100} color={pulsatingColor} style={{ opacity: 0.2 }} />
          <h1 style={{ fontSize: '40px', marginTop: '20px', color: '#444' }}>MODULE: {activeTab.toUpperCase()}</h1>
          <p style={{ color: pulsatingColor }}>INITIATING SEQUENTIAL LOAD...</p>
        </div>
      )}
    </div>
  );
}

// --- APP ENTRY POINT ---
export default function App() {
  return (
    <ErrorBoundary>
      <MainAppContent />
    </ErrorBoundary>
  );
}