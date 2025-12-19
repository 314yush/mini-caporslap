'use client';

import { useEffect, useState } from 'react';

interface CorrectOverlayProps {
  streak: number;
  onComplete: () => void;
  milestoneMessage?: string | null;
}

export function CorrectOverlay({ streak, onComplete, milestoneMessage }: CorrectOverlayProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 400ms
    const timer = setTimeout(() => {
      setShow(false);
      onComplete();
    }, 400);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Green flash background */}
      <div 
        className="absolute inset-0 bg-emerald-500/20 animate-pulse"
        style={{ animationDuration: '200ms' }}
      />
      
      {/* Content */}
      <div className="relative flex flex-col items-center gap-2 animate-bounce">
        {/* +1 indicator */}
        <div className="text-emerald-400 text-4xl font-bold animate-ping">
          +1
        </div>
        
        {/* Streak */}
        <div className="text-white text-6xl font-black">
          {streak}
        </div>
        
        {/* Milestone message */}
        {milestoneMessage && (
          <div className="text-amber-400 text-xl font-bold mt-2 animate-pulse">
            {milestoneMessage}
          </div>
        )}
      </div>
    </div>
  );
}



