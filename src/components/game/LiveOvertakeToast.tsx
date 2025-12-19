'use client';

import { useEffect, useState, useRef } from 'react';

export interface LiveOvertakeData {
  overtakenUserId: string;
  overtakenUser: {
    address: string;
    displayName: string;
    avatarUrl?: string;
    source: string;
  };
  theirStreak: number;
  yourStreak: number;
}

interface LiveOvertakeToastProps {
  overtake: LiveOvertakeData;
  onDismiss: () => void;
}

export function LiveOvertakeToast({ overtake, onDismiss }: LiveOvertakeToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in immediately
    requestAnimationFrame(() => setIsVisible(true));
    
    // Auto-dismiss after 2 seconds
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 200);
    }, 2000);

    return () => clearTimeout(dismissTimer);
  }, [onDismiss]);

  return (
    <div
      className={`
        fixed top-20 right-4 z-50
        transition-all duration-200 ease-out
        ${isVisible && !isExiting 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-full'
        }
      `}
    >
      <div className="
        flex items-center gap-2 px-3 py-2
        bg-amber-900/80 backdrop-blur-sm
        border border-amber-500/30
        text-white
        text-xs font-medium
        rounded-lg
        shadow-lg shadow-amber-500/10
        min-w-[200px]
      ">
        <span className="text-sm">🎯</span>
        <span className="truncate">Passed {overtake.overtakenUser.displayName}</span>
      </div>
    </div>
  );
}

interface LiveOvertakeQueueProps {
  overtakes: LiveOvertakeData[];
  onClear: () => void;
}

export function LiveOvertakeQueue({ overtakes, onClear }: LiveOvertakeQueueProps) {
  const [queue, setQueue] = useState<LiveOvertakeData[]>([]);
  const [currentOvertake, setCurrentOvertake] = useState<LiveOvertakeData | null>(null);
  const [shownOvertakes, setShownOvertakes] = useState<Set<string>>(new Set());
  const processingRef = useRef(false);

  useEffect(() => {
    if (overtakes.length > 0) {
      // Filter out overtakes that have already been shown
      const newOvertakes = overtakes.filter(
        overtake => !shownOvertakes.has(overtake.overtakenUserId)
      );
      
      if (newOvertakes.length > 0) {
        // Avoid synchronous setState in effect body (can cascade renders).
        queueMicrotask(() => {
          // Mark these as shown
          setShownOvertakes(prev => {
            const updated = new Set(prev);
            newOvertakes.forEach(o => updated.add(o.overtakenUserId));
            return updated;
          });

          // Add to queue
          setQueue(prev => [...prev, ...newOvertakes]);
        });
      }
    }
  }, [overtakes, shownOvertakes]);

  useEffect(() => {
    // Process queue one at a time
    if (!processingRef.current && !currentOvertake && queue.length > 0) {
      processingRef.current = true;
      // Avoid synchronous setState in effect body (can cascade renders).
      queueMicrotask(() => {
        setCurrentOvertake(queue[0]);
        setQueue(prev => prev.slice(1));
      });
    }
  }, [currentOvertake, queue]);

  // Clear shown overtakes when queue is empty and no current overtake
  useEffect(() => {
    if (!currentOvertake && queue.length === 0 && shownOvertakes.size > 0) {
      // Clear shown overtakes after a delay to allow for new games
      const timer = setTimeout(() => {
        setShownOvertakes(new Set());
        onClear();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentOvertake, queue.length, shownOvertakes.size, onClear]);

  const handleDismiss = () => {
    setCurrentOvertake(null);
    processingRef.current = false;
  };

  if (!currentOvertake) return null;

  return (
    <LiveOvertakeToast
      overtake={currentOvertake}
      onDismiss={handleDismiss}
    />
  );
}
