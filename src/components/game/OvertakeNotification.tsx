'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { OvertakeEvent } from '@/lib/leaderboard/overtake';

interface OvertakeNotificationProps {
  overtake: OvertakeEvent;
  onDismiss: () => void;
  index: number;
}

function OvertakeCard({ overtake, onDismiss, index }: OvertakeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Stagger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), index * 300);
    
    // Auto dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, 4000 + index * 300);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [index, onDismiss]);
  
  const { overtakenUser, newRank, board } = overtake;
  
  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div 
        onClick={onDismiss}
        className="
          bg-gradient-to-r from-amber-900/90 to-orange-900/90
          backdrop-blur-sm
          border border-amber-500/30
          rounded-xl p-3
          shadow-lg shadow-amber-500/20
          cursor-pointer
          hover:scale-[1.02] transition-transform
          flex items-center gap-3
          min-w-[240px]
        "
      >
        {/* Avatar */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-700 shrink-0">
          {overtakenUser.avatarUrl ? (
            <Image
              src={overtakenUser.avatarUrl}
              alt={overtakenUser.displayName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              {overtakenUser.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-amber-300 text-lg">🎯</span>
            <span className="text-white font-semibold text-sm truncate">
              You passed {overtakenUser.displayName}
            </span>
          </div>
          <div className="text-amber-200/70 text-xs">
            Now ranked #{newRank} {board === 'weekly' ? '(this week)' : ''}
          </div>
        </div>
        
        {/* Badge icon */}
        <div className="text-2xl">
          🏆
        </div>
      </div>
    </div>
  );
}

interface OvertakeQueueProps {
  overtakes: OvertakeEvent[];
  onClear: () => void;
}

export function OvertakeQueue({ overtakes, onClear }: OvertakeQueueProps) {
  const [visibleOvertakes, setVisibleOvertakes] = useState<OvertakeEvent[]>([]);
  
  useEffect(() => {
    setVisibleOvertakes(overtakes);
  }, [overtakes]);
  
  const handleDismiss = (index: number) => {
    setVisibleOvertakes(prev => prev.filter((_, i) => i !== index));
    if (visibleOvertakes.length <= 1) {
      onClear();
    }
  };
  
  if (visibleOvertakes.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-[300px]">
      {visibleOvertakes.slice(0, 5).map((overtake, index) => (
        <OvertakeCard
          key={`${overtake.overtakenUserId}-${index}`}
          overtake={overtake}
          onDismiss={() => handleDismiss(index)}
          index={index}
        />
      ))}
      
      {/* More indicator */}
      {visibleOvertakes.length > 5 && (
        <div className="text-center text-amber-400/60 text-xs py-1">
          +{visibleOvertakes.length - 5} more
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline overtake display for loss screen
 */
export function OvertakeSummary({ overtakes }: { overtakes: OvertakeEvent[] }) {
  if (overtakes.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 w-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🏆</span>
        <span className="text-amber-300 font-semibold">
          You climbed the leaderboard!
        </span>
      </div>
      
      <div className="space-y-2">
        {overtakes.slice(0, 3).map((overtake, index) => (
          <div 
            key={`${overtake.overtakenUserId}-${index}`}
            className="flex items-center gap-2 text-sm"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-700 shrink-0">
              {overtake.overtakenUser.avatarUrl ? (
                <Image
                  src={overtake.overtakenUser.avatarUrl}
                  alt=""
                  width={24}
                  height={24}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                  {overtake.overtakenUser.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-white/80 truncate">
              Passed {overtake.overtakenUser.displayName}
            </span>
          </div>
        ))}
        
        {overtakes.length > 3 && (
          <div className="text-amber-400/60 text-xs">
            +{overtakes.length - 3} more players
          </div>
        )}
      </div>
      
      {overtakes[0] && (
        <div className="mt-3 pt-3 border-t border-amber-700/30 text-center">
          <span className="text-amber-200 text-sm">
            New rank: <span className="font-bold text-white">#{overtakes[0].newRank}</span>
          </span>
        </div>
      )}
    </div>
  );
}





