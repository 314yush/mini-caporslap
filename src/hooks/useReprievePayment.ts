'use client';

import { useState, useCallback } from 'react';
import { REPRIEVE_PRICE_USDC } from '@/lib/payments/usdc-payment';
import { isReprieveFree } from '@/lib/game-core/reprieve';

export type PaymentStatus = 'idle' | 'confirming' | 'pending' | 'verifying' | 'success' | 'error';

export interface UseReprievePaymentReturn {
  // State
  status: PaymentStatus;
  isPaying: boolean;
  error: string | null;
  txHash: string | null;
  
  // Actions
  payForReprieve: (runId: string) => Promise<boolean>;
  reset: () => void;
  
  // Info
  price: number;
  currency: string;
  chainName: string;
}

// Get treasury address from environment
function getTreasuryAddress(): string {
  const address = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
  if (!address) {
    console.warn('[Reprieve] NEXT_PUBLIC_TREASURY_ADDRESS not set');
    return '';
  }
  return address;
}

// Check if we're in testnet mode
function isTestnet(): boolean {
  // Use testnet if NEXT_PUBLIC_USE_TESTNET is set to 'true'
  return process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
}

/**
 * Hook for handling reprieve payments using Base Pay.
 * 
 * Uses the @base-org/account SDK to process USDC payments via Base Pay.
 * Works seamlessly with Base Accounts in mini apps - users pay with one tap,
 * gas is sponsored automatically, and payments confirm in seconds.
 */
export function useReprievePayment(): UseReprievePaymentReturn {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
  }, []);
  
  const payForReprieve = useCallback(async (runId: string): Promise<boolean> => {
    // If reprieves are free, skip payment
    if (isReprieveFree()) {
      setStatus('success');
      return true;
    }
    
    const treasuryAddress = getTreasuryAddress();
    if (!treasuryAddress) {
      setError('Payment not configured');
      setStatus('error');
      return false;
    }
    
    setStatus('confirming');
    setError(null);
    setTxHash(null);
    
    try {
      // Dynamically import to avoid SSR issues
      // Wrap in retry logic to handle chunk loading failures after deployments
      let baseAccount;
      try {
        baseAccount = await import('@base-org/account');
      } catch (chunkError) {
        // Chunk loading failed (likely stale deployment) - try one reload
        console.warn('[Reprieve] Chunk load failed, attempting reload...', chunkError);
        
        // If this is a ChunkLoadError, suggest reload
        if (chunkError instanceof Error && chunkError.name === 'ChunkLoadError') {
          // Force reload the page to get fresh chunks
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
          throw new Error('App updated - please try again');
        }
        throw chunkError;
      }
      
      const { pay, getPaymentStatus } = baseAccount;
      
      const testnet = isTestnet();
      
      // Trigger the Base Pay popup
      const payment = await pay({
        amount: REPRIEVE_PRICE_USDC.toFixed(2), // e.g., "1.00"
        to: treasuryAddress as `0x${string}`,
        testnet,
      });
      
      setTxHash(payment.id);
      setStatus('pending');
      
      // Poll for payment status
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max
      
      while (attempts < maxAttempts) {
        const { status: paymentStatus } = await getPaymentStatus({ 
          id: payment.id,
          testnet,
        });
        
        if (paymentStatus === 'completed') {
          // Verify the payment on our server
          setStatus('verifying');
          
          const verifyResponse = await fetch('/api/reprieve/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txHash: payment.id,
              runId,
              paymentMethod: 'base_pay',
            }),
          });
          
          const verifyData = await verifyResponse.json();
          
          if (!verifyData.success) {
            throw new Error(verifyData.error || 'Payment verification failed');
          }
          
          setStatus('success');
          return true;
        }
        
        if (paymentStatus === 'failed') {
          throw new Error('Payment failed');
        }
        
        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      throw new Error('Payment confirmation timed out');
      
    } catch (err) {
      console.error('[Reprieve] Payment failed:', err);
      
      let errorMessage = 'Payment failed';
      if (err instanceof Error) {
        if (err.message.includes('rejected') || err.message.includes('cancelled') || err.message.includes('denied')) {
          errorMessage = 'Payment cancelled';
        } else if (err.message.includes('insufficient')) {
          errorMessage = 'Insufficient USDC balance';
        } else {
          errorMessage = err.message.slice(0, 60);
        }
      }
      
      setError(errorMessage);
      setStatus('error');
      return false;
    }
  }, []);
  
  return {
    status,
    isPaying: status !== 'idle' && status !== 'success' && status !== 'error',
    error,
    txHash,
    payForReprieve,
    reset,
    price: REPRIEVE_PRICE_USDC,
    currency: 'USDC',
    chainName: 'Base',
  };
}
