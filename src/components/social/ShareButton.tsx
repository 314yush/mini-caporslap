'use client';

import { useState } from 'react';
import { getSharePreview } from '@/lib/social/sharing';
import { trackSocialShare, trackShareInSession } from '@/lib/analytics';

interface ShareButtonProps {
  streak: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Share button that uses Base's useComposeCast when available
 * Falls back to Farcaster SDK composeCast
 */
export function ShareButton({ streak, className = '', children }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false);
  
  const handleShare = async () => {
    setSharing(true);
    const shareText = getSharePreview(streak);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mini.caporslap.fun';
    
    // Track share analytics
    trackSocialShare('farcaster', streak, 'loss');
    trackShareInSession();
    
    try {
      // Try to use Base's composeCast via Farcaster SDK
      const sdk = await import('@/lib/farcaster/sdk');
      const success = await sdk.miniAppComposeCast({
        text: shareText,
        embeds: [appUrl],
      });
      
      if (!success) {
        // Fallback to Warpcast URL
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(appUrl)}`;
        window.open(warpcastUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to compose cast:', error);
      // Fallback to Warpcast URL
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(appUrl)}`;
      window.open(warpcastUrl, '_blank');
    }
    
    setSharing(false);
  };
  
  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className={className}
    >
      {children || (sharing ? 'Sharing...' : 'Share')}
    </button>
  );
}
