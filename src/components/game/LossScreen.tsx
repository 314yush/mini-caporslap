'use client';

import { useState, useEffect } from 'react';
import { Run } from '@/lib/game-core/types';
import { formatMarketCap } from '@/lib/game-core/comparison';
import { generateShareData, generateShareText, shareToClipboard, getSharePreview } from '@/lib/social/sharing';
import { miniAppComposeCast } from '@/lib/farcaster/sdk';
import { canOfferReprieve, getReprieveCopy, isReprieveFree } from '@/lib/game-core/reprieve';
import { useReprievePayment, PaymentStatus } from '@/hooks/useReprievePayment';
import { trackSocialShare, trackShareInSession, trackReprieveDecision, trackDropOff } from '@/lib/analytics';

interface LossScreenProps {
  run: Run;
  lossExplanation: string | null;
  onPlayAgain: () => void;
  onReprieveComplete: () => void; // Called after payment verified, to resume game
}

// Get status text for payment flow
function getStatusText(status: PaymentStatus): string {
  switch (status) {
    case 'confirming': return 'Confirm payment...';
    case 'pending': return 'Payment pending...';
    case 'verifying': return 'Verifying payment...';
    case 'success': return 'Payment verified!';
    case 'error': return 'Payment failed';
    default: return '';
  }
}

export function LossScreen({ 
  run, 
  lossExplanation: _lossExplanation, 
  onPlayAgain, 
  onReprieveComplete, 
}: LossScreenProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const lossScreenStartTime = useState(() => Date.now())[0];
  const reprieveDecisionStartTime = useState(() => Date.now())[0];
  
  // Track drop-off on loss screen
  useEffect(() => {
    return () => {
      const timeOnScreen = Date.now() - lossScreenStartTime;
      trackDropOff('loss_screen', timeOnScreen, run.streak);
    };
  }, [lossScreenStartTime, run.streak]);
  
  // Payment hook
  const { 
    status: paymentStatus,
    isPaying, 
    error: paymentError, 
    txHash,
    payForReprieve,
    reset: resetPayment,
    price,
    currency,
    chainName,
  } = useReprievePayment();

  // Delay showing actions for dramatic effect
  useEffect(() => {
    const timer = setTimeout(() => setShowActions(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // When payment succeeds, trigger reprieve continuation
  useEffect(() => {
    if (paymentStatus === 'success') {
      const paymentTime = Date.now() - reprieveDecisionStartTime;
      trackReprieveDecision('completed', run.streak, paymentTime, paymentTime);
      
      // Small delay to show success message
      const timer = setTimeout(() => {
        onReprieveComplete();
        resetPayment();
      }, 1000);
      return () => clearTimeout(timer);
    } else if (paymentStatus === 'error') {
      trackReprieveDecision('failed', run.streak, Date.now() - reprieveDecisionStartTime);
    }
  }, [paymentStatus, onReprieveComplete, resetPayment, run.streak, reprieveDecisionStartTime]);

  const handleShare = async () => {
    setSharing(true);
    
    // Track share analytics
    trackSocialShare('farcaster', run.streak, 'loss');
    trackShareInSession();
    
    const shareData = generateShareData(run);
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

  // Handle paid reprieve
  const handlePaidReprieve = async () => {
    const timeToDecide = Date.now() - reprieveDecisionStartTime;
    trackReprieveDecision('initiated', run.streak, timeToDecide);
    await payForReprieve(run.runId);
  };

  // Handle free reprieve (testing mode)
  const handleFreeReprieve = () => {
    const timeToDecide = Date.now() - reprieveDecisionStartTime;
    trackReprieveDecision('completed', run.streak, timeToDecide);
    onReprieveComplete();
  };

  const showReprieve = canOfferReprieve(run.streak, run.usedReprieve);
  const reprieveCopy = showReprieve ? getReprieveCopy(run.streak) : null;
  const isFree = isReprieveFree();
  
  // All users are authenticated, so paid reprieve is always available (unless free mode)
  const requiresPayment = !isFree;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6 overflow-y-auto py-8">
      {/* Dramatic vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50 pointer-events-none" />
      
      <div className="relative flex flex-col items-center gap-5 max-w-sm w-full">
        {/* Skull emoji */}
        <div className="text-5xl">💀</div>
        
        {/* Big streak number */}
        <div className="text-center">
          <div className="text-7xl font-black text-white tabular-nums">
            {run.streak}
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            You got rekt
          </div>
        </div>

        {/* Explanation */}
        {run.failedGuess && (
          <div className="w-full p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <p className="text-zinc-400 text-sm">
              You guessed{' '}
              <span className="text-white font-bold">
                {run.failedGuess.nextToken.symbol}
              </span>{' '}
              was{' '}
              <span className={run.failedGuess.guess === 'cap' ? 'text-emerald-400' : 'text-rose-400'}>
                {run.failedGuess.guess === 'cap' ? 'higher' : 'lower'}
              </span>
            </p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {run.failedGuess.currentToken.symbol}
                </div>
                <div className="text-sm text-emerald-400">
                  {formatMarketCap(run.failedGuess.currentToken.marketCap)}
                </div>
              </div>
              <div className="text-zinc-600 text-xl">→</div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {run.failedGuess.nextToken.symbol}
                </div>
                <div className="text-sm text-emerald-400">
                  {formatMarketCap(run.failedGuess.nextToken.marketCap)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="w-full flex flex-col gap-3 animate-fade-in">
            
            {/* REPRIEVE OPTION - Most prominent when available */}
            {showReprieve && reprieveCopy && (
              <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-600/50 relative overflow-hidden">
                {/* Candle glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col items-center gap-3">
                  {/* Candle icon */}
                  <div className="text-4xl animate-pulse">{reprieveCopy.emoji}</div>
                  
                  {/* Title */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-amber-300">
                      {reprieveCopy.title}
                    </h3>
                    <p className="text-amber-200/70 text-sm mt-1">
                      {reprieveCopy.description}
                    </p>
                  </div>
                  
                  {/* Payment status */}
                  {isPaying && (
                    <div className="w-full p-2 rounded-lg bg-amber-900/50 border border-amber-500/50 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                        <p className="text-amber-300 text-sm">{getStatusText(paymentStatus)}</p>
                      </div>
                      {txHash && (
                        <p className="text-amber-400/50 text-xs mt-1 truncate">
                          TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Payment error */}
                  {paymentError && (
                    <div className="w-full p-2 rounded-lg bg-rose-900/50 border border-rose-500/50 text-center">
                      <p className="text-rose-300 text-sm">{paymentError}</p>
                      <button 
                        onClick={resetPayment}
                        className="text-rose-400 text-xs underline mt-1"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                  
                  {/* Payment success */}
                  {paymentStatus === 'success' && (
                    <div className="w-full p-2 rounded-lg bg-emerald-900/50 border border-emerald-500/50 text-center">
                      <p className="text-emerald-300 text-sm">✓ Payment verified! Resuming game...</p>
                    </div>
                  )}
                  
                  {/* Continue button - only show when not processing */}
                  {paymentStatus !== 'success' && (
                    <button
                      onClick={requiresPayment ? handlePaidReprieve : handleFreeReprieve}
                      disabled={isPaying}
                      className="
                        w-full py-4 px-6 rounded-xl
                        bg-gradient-to-r from-amber-500 to-orange-500
                        hover:from-amber-400 hover:to-orange-400
                        text-white font-bold text-lg
                        shadow-lg shadow-amber-500/30
                        transform transition-all duration-200
                        hover:scale-[1.02] active:scale-[0.98]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                      "
                    >
                      {isPaying ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {isFree ? (
                            'Continue FREE'
                          ) : (
                            <>
                              Pay ${price} {currency}
                              <span className="text-amber-200/70 text-sm font-normal">
                                ({chainName})
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  )}
                  
                  {/* Info note */}
                  <p className="text-amber-400/50 text-xs text-center">
                    {requiresPayment ? (
                      <>USDC via Base Pay • One-time use per run</>
                    ) : (
                      <>One-time use per run • Your streak stays intact</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Divider if reprieve is shown */}
            {showReprieve && (
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-zinc-600 text-xs">or</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            )}

            {/* Share button - uses composeCast in Mini App */}
            <button
              onClick={handleShare}
              disabled={sharing || isPaying}
              className="
                w-full py-4 px-6 rounded-2xl
                bg-gradient-to-br from-violet-500 to-purple-600
                text-white font-bold text-lg
                shadow-lg shadow-violet-500/25
                transform transition-all
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50
              "
            >
              {copied ? '✅ Shared!' : sharing ? 'Opening...' : '📣 Cast My L'}
            </button>

            {/* Play Again button - renamed from Walk Away */}
            <button
              onClick={onPlayAgain}
              disabled={isPaying}
              className="
                w-full py-4 px-6 rounded-2xl
                bg-zinc-800 border border-zinc-700
                text-zinc-300 font-bold text-lg
                transform transition-all
                hover:bg-zinc-700 hover:text-white
                active:scale-[0.98]
                disabled:opacity-50
              "
            >
              🔄 Try Again
            </button>
            
            {/* Explanation text */}
            <p className="text-zinc-600 text-xs text-center">
              Start a new game from scratch
            </p>
          </div>
        )}

        {/* Share preview */}
        <div className="text-center text-xs text-zinc-600 mt-2">
          <p>{getSharePreview(run.streak)}</p>
        </div>
      </div>
    </div>
  );
}
