'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface SaveScorePromptProps {
  streak: number;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Prompts guest users to connect wallet to save their score
 * Shows on loss screen for guests with streak >= 3
 */
export function SaveScorePrompt({ 
  streak, 
  onDismiss,
  className = '' 
}: SaveScorePromptProps) {
  const { login, ready } = usePrivy();
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Don't show if dismissed or streak is too low
  if (isDismissed || streak < 3) {
    return null;
  }
  
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };
  
  return (
    <div 
      className={`
        bg-linear-to-br from-violet-900/40 to-purple-900/40
        border border-violet-500/30
        rounded-2xl p-5
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h3 className="text-lg font-bold text-white">
            Nice streak!
          </h3>
        </div>
        
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Message */}
      <p className="text-zinc-300 text-sm mb-4">
        Connect your wallet to save your score of <span className="text-violet-400 font-bold">{streak}</span> to the leaderboard and compete with others!
      </p>
      
      {/* Benefits */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full">
          🏆 Leaderboard
        </span>
        <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full">
          📊 Track Progress
        </span>
        <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full">
          🎮 Compete
        </span>
      </div>
      
      {/* CTA */}
      <div className="flex items-center gap-3">
        <button
          onClick={login}
          disabled={!ready}
          className="
            flex-1 py-3 px-4
            bg-linear-to-r from-violet-500 to-purple-500
            hover:from-violet-400 hover:to-purple-400
            disabled:from-zinc-600 disabled:to-zinc-600
            text-white font-bold rounded-xl
            shadow-lg shadow-violet-500/25
            transform transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {ready ? 'Connect Wallet' : 'Loading...'}
        </button>
        
        <button
          onClick={handleDismiss}
          className="
            py-3 px-4
            text-zinc-400 hover:text-white
            text-sm font-medium
            transition-colors
          "
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

/**
 * Compact inline version for smaller spaces
 */
export function SaveScorePromptCompact({ 
  streak,
  onDismiss,
  className = '' 
}: SaveScorePromptProps) {
  const { login, ready } = usePrivy();
  const [isDismissed, setIsDismissed] = useState(false);
  
  if (isDismissed || streak < 3) {
    return null;
  }
  
  return (
    <div 
      className={`
        flex items-center justify-between gap-4
        bg-violet-900/30 border border-violet-700/50
        rounded-xl px-4 py-3
        ${className}
      `}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg">💾</span>
        <span className="text-sm text-zinc-300 truncate">
          Connect to save your score
        </span>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={login}
          disabled={!ready}
          className="
            py-1.5 px-3
            bg-violet-500 hover:bg-violet-400
            disabled:bg-zinc-600
            text-white text-sm font-semibold rounded-lg
            transition-colors
          "
        >
          Connect
        </button>
        
        <button
          onClick={() => {
            setIsDismissed(true);
            onDismiss?.();
          }}
          className="text-zinc-500 hover:text-zinc-300 p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

