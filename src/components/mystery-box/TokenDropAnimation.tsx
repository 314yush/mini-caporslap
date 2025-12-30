'use client';

import { useEffect, useState } from 'react';
import { MysteryBoxReward } from '@/lib/mystery-box/generator';

interface TokenDropAnimationProps {
  rewards: MysteryBoxReward[];
  onAnimationComplete?: () => void;
}

export function TokenDropAnimation({
  rewards,
  onAnimationComplete,
}: TokenDropAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simple fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
      if (onAnimationComplete) {
        setTimeout(() => onAnimationComplete(), 500);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  const totalValue = rewards.reduce((sum, r) => sum + r.usdValue, 0);

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6">
      <div
        className="text-center w-full"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.8s ease-in',
        }}
      >
        {/* Party popper emoji */}
        <div className="text-5xl md:text-6xl mb-4">🎉</div>
        
        {/* You Won! text */}
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
          You Won!
        </h3>
        
        {/* Large dollar amount - main focus */}
        <div className="text-7xl md:text-8xl font-black text-emerald-400 mb-6 tabular-nums">
          ${totalValue.toFixed(2)}
        </div>
        
        {/* Total label at bottom */}
        <div className="pt-4 border-t border-zinc-800/50">
          <p className="text-emerald-400 font-bold text-lg md:text-xl">
            Total: ${totalValue.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
