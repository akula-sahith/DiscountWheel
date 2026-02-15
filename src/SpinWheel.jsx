import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';

const HitSortWheel = () => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [particles, setParticles] = useState([]);
  const [confetti, setConfetti] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const selectedIndexRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    // Detect mobile devices
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const PRIZES = useMemo(() => [
    { label: '5 Rupees Off', color: '#ffffff', textColor: '#000', weight: 25 },
    { label: '10 Rupees Off', color: '#fbbf24', textColor: '#000', weight: 25 },
    { label: '15 Rupees Off', color: '#22c55e', textColor: '#fff', weight: 20 },
    { label: '2 Games @49', color: '#ffffff', textColor: '#000', weight: 15 },
    { label: '1 + 1 Off', color: '#fbbf24', textColor: '#000', weight: 14 },
    { label: '90% DISCOUNT', color: '#ef4444', textColor: '#fff', weight: 0 }, // Weight 0 = never win
  ], []);

  const count = PRIZES.length;
  const angleStep = 360 / count;
  const SPIN_DURATION = 4000;

  const getWeightedIndex = useCallback((prizes) => {
    // Filter out prizes with weight 0 (90% discount)
    const eligiblePrizes = prizes
      .map((p, idx) => ({ ...p, originalIndex: idx }))
      .filter(p => p.weight > 0);
    
    const totalWeight = eligiblePrizes.reduce((acc, p) => acc + p.weight, 0);
    if (totalWeight === 0) return 0;
    
    // Use crypto.getRandomValues for better randomness if available
    let random;
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      random = (array[0] / 4294967296) * totalWeight;
    } else {
      random = Math.random() * totalWeight;
    }
    
    let cumulative = 0;
    for (let i = 0; i < eligiblePrizes.length; i++) {
      cumulative += eligiblePrizes[i].weight;
      if (random < cumulative) {
        return eligiblePrizes[i].originalIndex;
      }
    }
    return eligiblePrizes[0].originalIndex;
  }, []);

  const generateParticles = useCallback(() => {
    // Reduce particles on mobile for performance
    const particleCount = isMobile ? 10 : 20;
    const newParticles = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: Math.random(),
        x: 50,
        y: 50,
        size: Math.random() * (isMobile ? 4 : 6) + 3,
        speedX: (Math.random() - 0.5) * (isMobile ? 6 : 8),
        speedY: (Math.random() - 0.5) * (isMobile ? 6 : 8),
        color: ['#22c55e', '#fbbf24', '#ef4444', '#fff'][Math.floor(Math.random() * 4)],
        life: 1,
      });
    }
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev.map(p => ({
          ...p,
          x: p.x + p.speedX,
          y: p.y + p.speedY,
          life: p.life - 0.02,
        })).filter(p => p.life > 0);
        
        if (updated.length === 0) {
          clearInterval(interval);
        }
        return updated;
      });
    }, isMobile ? 60 : 50);
  }, [isMobile]);

  const generateConfetti = useCallback(() => {
    // Reduce confetti on mobile for performance
    const confettiCount = isMobile ? 30 : 50;
    const newConfetti = [];
    for (let i = 0; i < confettiCount; i++) {
      newConfetti.push({
        id: Math.random(),
        x: Math.random() * 100,
        y: -10,
        size: Math.random() * (isMobile ? 6 : 8) + 4,
        speedY: Math.random() * 3 + 2,
        speedX: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: ['#22c55e', '#fbbf24', '#ef4444', '#fff', '#8b5cf6'][Math.floor(Math.random() * 5)],
      });
    }
    setConfetti(newConfetti);

    const interval = setInterval(() => {
      setConfetti(prev => {
        const updated = prev.map(c => ({
          ...c,
          x: c.x + c.speedX,
          y: c.y + c.speedY,
          rotation: c.rotation + c.rotationSpeed,
        })).filter(c => c.y < 110);
        
        if (updated.length === 0) {
          clearInterval(interval);
        }
        return updated;
      });
    }, isMobile ? 40 : 30);
  }, [isMobile]);

  const spinWheel = useCallback(() => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    generateParticles();
    
    const prizeIndex = getWeightedIndex(PRIZES);
    selectedIndexRef.current = prizeIndex;

    // Add randomness to full rotations (between 5-7 full spins)
    const fullRotations = 5 + Math.floor(Math.random() * 3);
    
    // Add small random offset to make it feel more natural
    const randomOffset = (Math.random() - 0.5) * 10;
    
    const targetAngle = (fullRotations * 360) + (360 - (prizeIndex * angleStep) - (angleStep / 2)) + randomOffset;
    const newRotation = rotation + targetAngle;

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(PRIZES[selectedIndexRef.current]);
      generateConfetti();
      setTimeout(() => setShowResult(true), 300);
      setHasSpun(true);
    }, SPIN_DURATION);
  }, [isSpinning, hasSpun, rotation, PRIZES, angleStep, getWeightedIndex, generateParticles, generateConfetti]);

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 font-sans text-white overflow-hidden relative">
      
      {/* Background ambient glow - reduced on mobile */}
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      {/* Particles overlay */}
      {particles.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                opacity: p.life,
                transform: 'translate(-50%, -50%)',
                filter: isMobile ? 'none' : 'blur(1px)',
              }}
            />
          ))}
        </div>
      )}

      {/* Confetti overlay */}
      {confetti.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map(c => (
            <div
              key={c.id}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: `${c.size}px`,
                height: `${c.size}px`,
                backgroundColor: c.color,
                transform: `translate(-50%, -50%) rotate(${c.rotation}deg)`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}
      
      <div className={`text-center mb-6 sm:mb-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
          HIT<span className="text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]">SORT</span>
        </h1>
        <p className="text-yellow-400 font-bold tracking-widest mt-2 uppercase text-xs sm:text-sm drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
          Featured Challenges
        </p>
      </div>

      <div className={`relative w-72 h-72 sm:w-80 sm:h-80 md:w-[450px] md:h-[450px] transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        {/* Outer glow ring - reduced on mobile */}
        {!isMobile && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/20 to-yellow-500/20 blur-xl animate-pulse" />
        )}
        
        {/* Selector Arrow with enhanced glow */}
        <div className="absolute left-1/2 top-[-15px] sm:top-[-20px] -translate-x-1/2 z-50 drop-shadow-[0_0_15px_rgba(34,197,94,1)] sm:drop-shadow-[0_0_20px_rgba(34,197,94,1)]" 
             style={{ 
               animation: isMobile ? 'none' : 'bounce 2s infinite',
               willChange: 'transform'
             }}>
          <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-l-transparent border-r-[15px] sm:border-r-[20px] border-r-transparent border-t-[30px] sm:border-t-[40px] border-t-green-500" />
          {!isMobile && (
            <div className="absolute inset-0 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-green-500 blur-md opacity-50" />
          )}
        </div>

        {/* Spinning indicator rings - simplified on mobile */}
        {isSpinning && !isMobile && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping" />
            <div className="absolute inset-4 rounded-full border-4 border-yellow-500/30 animate-ping" style={{ animationDelay: '0.2s' }} />
          </>
        )}

        <svg
          viewBox="-1 -1 2 2"
          className="w-full h-full drop-shadow-2xl relative z-10"
          style={{
            transform: `rotate(${rotation - 90}deg)`,
            transition: isSpinning ? `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0, 0.15, 1)` : 'none',
            filter: isSpinning && !isMobile ? 'brightness(1.2)' : 'brightness(1)',
            willChange: 'transform',
          }}
        >
          {PRIZES.map((prize, i) => {
            const startPercent = i / count;
            const endPercent = (i + 1) / count;
            const [startX, startY] = getCoordinatesForPercent(startPercent);
            const [endX, endY] = getCoordinatesForPercent(endPercent);
            const largeArcFlag = 0;

            const pathData = [
              `M 0 0`,
              `L ${startX} ${startY}`,
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `Z`,
            ].join(' ');

            const midAngleDegree = (i + 0.5) * angleStep;
            const midAngleRad = (midAngleDegree * Math.PI) / 180;
            
            const textRadius = 0.65;
            const textX = textRadius * Math.cos(midAngleRad);
            const textY = textRadius * Math.sin(midAngleRad);

            return (
              <g key={i}>
                <path 
                  d={pathData} 
                  fill={prize.color} 
                  stroke="#1e293b" 
                  strokeWidth="0.01"
                  style={{
                    filter: isMobile ? 'none' : 'drop-shadow(0 0 0.01px rgba(0,0,0,0.3))',
                  }}
                />
                <text
                  x={textX}
                  y={textY}
                  fill={prize.textColor}
                  transform={`rotate(${midAngleDegree}, ${textX}, ${textY})`}
                  style={{
                    fontSize: isMobile ? '0.07px' : '0.08px',
                    fontWeight: '900',
                    fontFamily: 'sans-serif',
                    textAnchor: 'middle',
                    dominantBaseline: 'middle',
                    textTransform: 'uppercase',
                    filter: prize.textColor === '#fff' && !isMobile ? 'drop-shadow(0 0 0.005px rgba(0,0,0,0.8))' : 'none',
                  }}
                >
                  {prize.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center hub with enhanced animation */}
        <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-[#0f172a] rounded-full border-3 sm:border-4 border-green-500 z-40 flex items-center justify-center shadow-2xl">
          {!isMobile && (
            <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-30" />
          )}
          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          <div className="absolute w-3 h-3 bg-green-500/50 rounded-full animate-pulse" />
        </div>
      </div>

      <button
        onClick={spinWheel}
        disabled={isSpinning || hasSpun}
        className={`mt-8 sm:mt-12 px-8 sm:px-12 py-3 sm:py-4 rounded-full font-black text-lg sm:text-xl transition-all duration-300 uppercase relative overflow-hidden group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${
          hasSpun 
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
          : 'bg-green-500 hover:bg-green-400 active:bg-green-600 text-black shadow-[0_0_20px_rgba(34,197,94,0.5)] sm:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:shadow-[0_0_40px_rgba(34,197,94,0.7)] active:scale-95 hover:scale-105'
        }`}
        style={{ 
          transitionDelay: mounted ? '600ms' : '0ms',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {!hasSpun && !isMobile && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        )}
        <span className="relative z-10 flex items-center gap-2 justify-center">
          {isSpinning && (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {isSpinning ? 'Spinning...' : hasSpun ? 'Offer Unlocked ✓' : 'Spin to Play'}
        </span>
      </button>

      {/* Result Modal with enhanced animations */}
      {showResult && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 border-green-500 rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-sm w-full text-center shadow-[0_0_60px_rgba(34,197,94,0.4)] sm:shadow-[0_0_80px_rgba(34,197,94,0.4)] animate-in zoom-in-95 duration-500 relative overflow-hidden">
            {/* Animated background gradient - reduced on mobile */}
            {!isMobile && (
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-yellow-500/10 animate-pulse" />
            )}
            
            {/* Shine effect - desktop only */}
            {!isMobile && (
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" />
            )}
            
            <div className="relative z-10">
              <div className="mb-3 sm:mb-4 inline-block">
                <div className="text-5xl sm:text-6xl" style={{ animation: isMobile ? 'none' : 'bounce 1s ease-in-out 3' }}>🎉</div>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-yellow-400 mb-2 sm:mb-3 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-in slide-in-from-top duration-700">
                CONGRATS!
              </h2>
              
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8 uppercase tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-in slide-in-from-bottom duration-700 delay-200">
                {wonPrize?.label}
              </div>
              
              <button 
                onClick={() => setShowResult(false)}
                className="w-full py-3 sm:py-4 bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-black rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] sm:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] relative overflow-hidden group animate-in slide-in-from-bottom duration-700 delay-500"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {!isMobile && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                )}
                <span className="relative z-10">CLAIM NOW</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes slide-in-from-top {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slide-in-from-bottom {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation-name: fade-in;
        }
        
        .zoom-in-95 {
          animation-name: zoom-in-95;
        }
        
        .slide-in-from-top {
          animation-name: slide-in-from-top;
        }
        
        .slide-in-from-bottom {
          animation-name: slide-in-from-bottom;
        }
        
        .delay-200 {
          animation-delay: 200ms;
        }
        
        .delay-500 {
          animation-delay: 500ms;
        }

        /* Mobile performance optimizations */
        @media (max-width: 768px) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
};

export default HitSortWheel;