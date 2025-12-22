'use client';

import { useState, useCallback } from 'react';

interface AddMiniAppButtonProps {
  className?: string;
  onSuccess?: (hasNotifications: boolean) => void;
  onError?: (error: string) => void;
}

/**
 * Button to prompt users to add the Mini App to their profile
 * This enables notifications and adds the app to their saved apps
 * 
 * See: https://docs.base.org/mini-apps/core-concepts/notifications
 */
export function AddMiniAppButton({ 
  className = '', 
  onSuccess, 
  onError 
}: AddMiniAppButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'added' | 'error' | null>(null);

  const handleAddMiniApp = useCallback(async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Dynamically import SDK to avoid SSR issues
      const { sdk } = await import('@farcaster/miniapp-sdk');
      
      if (!sdk?.actions?.addMiniApp) {
        // Not in a Mini App context
        setResult('error');
        onError?.('Not available in this context');
        return;
      }

      const response = await sdk.actions.addMiniApp();

      if (response.notificationDetails) {
        setResult('success');
        onSuccess?.(true);
      } else {
        setResult('added');
        onSuccess?.(false);
      }
    } catch (error) {
      console.error('[AddMiniApp] Error:', error);
      setResult('error');
      onError?.(error instanceof Error ? error.message : 'Failed to add app');
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  // Don't show if already added
  if (result === 'success' || result === 'added') {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-emerald-400 text-sm">
          {result === 'success' ? '✅ Added with notifications!' : '✅ Added to your apps!'}
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleAddMiniApp}
      disabled={isLoading}
      className={`
        px-4 py-2 rounded-xl
        bg-gradient-to-r from-violet-500 to-purple-600
        hover:from-violet-400 hover:to-purple-500
        text-white font-semibold text-sm
        shadow-lg shadow-violet-500/25
        transform transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <span>🔔</span>
          Enable Notifications
        </>
      )}
    </button>
  );
}

/**
 * Inline notification prompt for strategic placement in the app
 * Shows after achievements or key moments
 */
export function NotificationPrompt({ 
  message = "Never miss when you get overtaken!",
  onDismiss,
}: { 
  message?: string;
  onDismiss?: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full p-4 rounded-xl bg-gradient-to-r from-violet-900/50 to-purple-900/50 border border-violet-500/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-violet-200 text-sm mb-3">{message}</p>
          <AddMiniAppButton 
            onSuccess={() => {
              setDismissed(true);
              onDismiss?.();
            }}
          />
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-zinc-500 hover:text-zinc-300 text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
}




