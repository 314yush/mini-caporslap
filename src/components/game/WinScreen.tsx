'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Run } from '@/lib/game-core/types';
import { generateWinShareData, generateShareText, shareToClipboard } from '@/lib/social/sharing';
import { miniAppComposeCast } from '@/lib/farcaster/sdk';
import { trackSocialShare } from '@/lib/analytics/engagement';
import { trackShareInSession } from '@/lib/analytics/session';

interface WinScreenProps {
  run: Run;
  winType: 'personal_best' | 'top_3';
  rank?: number; // Optional rank if top 3
  onPlayAgain: () => void;
}

export function WinScreen({ 
  run, 
  winType,
  rank,
  onPlayAgain, 
}: WinScreenProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  
  // Delay showing actions for dramatic effect
  useEffect(() => {
    const timer = setTimeout(() => setShowActions(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    setSharing(true);
    
    // Track share analytics
    trackSocialShare('farcaster', run.streak, 'win');
    trackShareInSession();
    
    const shareData = generateWinShareData(run, winType, rank);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mini.caporslap.fun';
    
    // Try composeCast first (native Mini App share)
    const shareText = `${shareData.message}\n\nCan you beat me?`;
    const castSuccess = await miniAppComposeCast({
      text: shareText,
      embeds: [appUrl],
    });
    
    if (castSuccess) {
      // Cast composer opened successfully
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Fallback to clipboard for web users
      const fullText = generateShareText(shareData);
      const clipboardSuccess = await shareToClipboard(fullText);
      if (clipboardSuccess) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
    setSharing(false);
  };

  // Get celebration emoji and message based on win type
  const getCelebrationEmoji = () => {
    if (winType === 'top_3') {
      if (rank === 1) return '👑';
      if (rank === 2) return '🥈';
      if (rank === 3) return '🥉';
      return '🏆';
    }
    return '🎉';
  };

  const getWinMessage = () => {
    if (winType === 'top_3' && rank) {
      return `You're Ranked #${rank}!`;
    }
    return 'New Personal Best!';
  };

  const getSubMessage = () => {
    if (winType === 'top_3') {
      return 'Top 3 on the leaderboard!';
    }
    return 'Your highest streak yet!';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6 overflow-y-auto py-8">
      {/* Celebration vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-emerald-900/20 pointer-events-none" />
      
      {/* Leaderboard link - top right */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
        <Link 
          href="/leaderboard" 
          className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors"
        >
          🏆
        </Link>
      </div>
      
      <div className="relative flex flex-col items-center gap-5 max-w-sm w-full">
        {/* Celebration emoji */}
        <div className="text-5xl animate-bounce">{getCelebrationEmoji()}</div>
        
        {/* Big streak number */}
        <div className="text-center">
          <div className="text-7xl font-black text-white tabular-nums">
            {run.streak}
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {getWinMessage()}
          </div>
          <div className="text-sm text-emerald-300/70 mt-1">
            {getSubMessage()}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="w-full flex flex-col gap-3 animate-fade-in">
            {/* Share button - uses composeCast in Mini App */}
            <button
              onClick={handleShare}
              disabled={sharing}
              className="
                w-full py-4 px-6 rounded-2xl
                bg-gradient-to-br from-emerald-500 to-green-600
                text-white font-bold text-lg
                shadow-lg shadow-emerald-500/25
                transform transition-all
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50
              "
            >
              {copied ? '✅ Shared!' : sharing ? 'Opening...' : '📣 Share Victory'}
            </button>

            {/* Play Again button */}
            <button
              onClick={onPlayAgain}
              className="
                w-full py-4 px-6 rounded-2xl
                bg-zinc-800 border border-zinc-700
                text-zinc-300 font-bold text-lg
                transform transition-all
                hover:bg-zinc-700 hover:text-white
                active:scale-[0.98]
              "
            >
              🔄 Play Again
            </button>
            
            {/* Explanation text */}
            <p className="text-zinc-600 text-xs text-center">
              Start a new game from scratch
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
