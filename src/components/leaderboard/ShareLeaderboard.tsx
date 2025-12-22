'use client';

import { useState } from 'react';

interface ShareLeaderboardProps {
  rank: number;
  score: number;
  type: 'weekly' | 'global';
  prizeEstimate?: number;
}

export function ShareLeaderboard({ rank, score, type, prizeEstimate }: ShareLeaderboardProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const shareText = type === 'weekly' && prizeEstimate
        ? `I'm ranked #${rank} on CapOrSlap with ${score} score! $${prizeEstimate.toFixed(2)} estimated prize this week 🏆`
        : `I'm ranked #${rank} on CapOrSlap with ${score} score! 🏆`;
      
      const shareUrl = window.location.origin;
      
      // Try Web Share API first
      if (navigator.share) {
        await navigator.share({
          title: 'CapOrSlap Leaderboard',
          text: shareText,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('Copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="
        flex items-center gap-2 px-4 py-2
        bg-violet-600 hover:bg-violet-700
        text-white font-medium rounded-lg
        transition-colors disabled:opacity-50
      "
    >
      <span>{isSharing ? '...' : '📤'}</span>
      <span>{isSharing ? 'Sharing...' : 'Share'}</span>
    </button>
  );
}


