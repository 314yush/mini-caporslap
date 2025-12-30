'use client';

import { useState, useEffect } from 'react';
import { MysteryBox as MysteryBoxType, MysteryBoxReward } from '@/lib/mystery-box/generator';
import { ScratchCard } from './ScratchCard';
import { ClaimFlow } from './ClaimFlow';
import { TokenDropAnimation } from './TokenDropAnimation';
import { shareMysteryBoxReward } from '@/lib/social/sharing';
import confetti from 'canvas-confetti';

interface MysteryBoxProps {
  box: MysteryBoxType;
  onClaimSuccess: () => void;
  onClose?: () => void;
}

export function MysteryBox({
  box,
  onClaimSuccess,
  onClose,
}: MysteryBoxProps) {
  const [revealed, setRevealed] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component only renders on client to avoid hydration issues
  // Use a ref to track if we've already set mounted to avoid setState in effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use a microtask to defer setState outside of effect body
      Promise.resolve().then(() => {
        setMounted(true);
      });
    }
  }, []);

  // Trigger confetti when revealed
  useEffect(() => {
    if (revealed) {
      // High energy confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF'],
      });

      // Additional bursts
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500'],
        });
      }, 250);

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500'],
        });
      }, 400);
    }
  }, [revealed]);

  const handleReveal = () => {
    setRevealed(true);
  };

  const handleClaimSuccess = () => {
    setClaimed(true);
    onClaimSuccess();
  };

  const handleShareReward = async () => {
    setSharing(true);
    try {
      await shareMysteryBoxReward(
        box.rewards.map(r => ({ symbol: r.symbol, usdValue: r.usdValue })),
        box.totalValue
      );
    } catch (error) {
      console.error('[MysteryBox] Error sharing reward:', error);
      // Don't block user flow if sharing fails
    } finally {
      setSharing(false);
      if (onClose) {
        onClose();
      }
    }
  };

  const handleClaimError = (error: string) => {
    // Don't log "already claimed" as an error - it's expected after successful claim
    if (!error.includes('already claimed')) {
      console.error('Claim error:', error);
    }
    // Error is already shown in ClaimFlow component
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="relative p-4 md:p-6 bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-b border-amber-600/50">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="relative text-center">
            <div className="text-4xl md:text-5xl mb-2">🎁</div>
            <h2 className="text-xl md:text-2xl font-black text-amber-300 mb-1">
              Mystery Box!
            </h2>
            <p className="text-amber-200/70 text-xs md:text-sm">
              Scratch to reveal your rewards
            </p>
          </div>
        </div>

        {/* Scratch card area */}
        <div className="p-3 md:p-6">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-950 border-2 border-amber-600/50">
            <ScratchCard onReveal={handleReveal} revealed={revealed}>
              {/* Content underneath scratch layer */}
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 relative overflow-hidden">
                {revealed ? (
                  <TokenDropAnimation rewards={box.rewards} />
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4">❓</div>
                    <p className="text-zinc-400 text-sm">
                      Scratch to reveal
                    </p>
                  </div>
                )}
              </div>
            </ScratchCard>
          </div>
        </div>

        {/* Claim flow (shown after reveal) */}
        {revealed && !claimed && (
          <div className="p-3 md:p-6 pt-0">
            <ClaimFlow
              boxId={box.boxId}
              rewards={box.rewards}
              onSuccess={handleClaimSuccess}
              onError={handleClaimError}
            />
          </div>
        )}

        {/* Success state */}
        {claimed && (
          <div className="p-3 md:p-6 pt-0">
            <div className="p-3 md:p-4 rounded-xl bg-emerald-900/50 border border-emerald-500/50 text-center">
              <div className="text-3xl md:text-4xl mb-2">✅</div>
              <p className="text-emerald-300 font-bold mb-2 text-sm md:text-base">
                Reward Claimed!
              </p>
              <p className="text-emerald-200/70 text-xs md:text-sm mb-3 md:mb-4">
                Your tokens are on the way
              </p>
              <button
                onClick={handleShareReward}
                disabled={sharing}
                className="w-full py-2 md:py-3 px-4 md:px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm md:text-base transition-colors disabled:opacity-50 touch-manipulation"
              >
                {sharing ? 'Sharing...' : 'Share Reward'}
              </button>
            </div>
          </div>
        )}

        {/* Close button (only when not claimed) */}
        {!claimed && onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 md:top-4 right-2 md:right-4 w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors text-lg md:text-xl touch-manipulation"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}


