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
  networkInfo: {
    isTestnet: boolean;
    expectedChainId: number;
    networkName: string;
  };
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
    
    // Validate treasury address format
    if (!treasuryAddress.startsWith('0x') || treasuryAddress.length !== 42) {
      console.error('[Reprieve] Invalid treasury address format:', treasuryAddress);
      setError('Invalid payment configuration');
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
      const expectedChainId = testnet ? 84532 : 8453; // Base Sepolia: 84532, Base Mainnet: 8453
      
      // Note: Base Pay in mini apps automatically handles network switching
      // The SDK will prompt users to switch to Base network if needed
      // We log the expected network for debugging purposes
      console.log('[Reprieve] Expected network:', {
        chainId: expectedChainId,
        network: testnet ? 'Base Sepolia' : 'Base Mainnet',
        note: 'Base Pay will automatically handle network switching if needed',
      });
      
      console.log('[Reprieve] Initiating Base Pay payment:', {
        amount: REPRIEVE_PRICE_USDC.toFixed(2),
        to: treasuryAddress,
        testnet,
        expectedChainId,
        network: testnet ? 'Base Sepolia' : 'Base Mainnet',
      });
      
      // Trigger the Base Pay popup
      let payment;
      try {
        payment = await pay({
          amount: REPRIEVE_PRICE_USDC.toFixed(2), // e.g., "1.00"
          to: treasuryAddress as `0x${string}`,
          testnet,
        });
        
        console.log('[Reprieve] Payment initiated successfully:', {
          id: payment.id,
          amount: payment.amount,
          to: payment.to,
        });
      } catch (payError) {
        // Log the full error for debugging
        console.error('[Reprieve] Pay function error:', {
          error: payError,
          message: payError instanceof Error ? payError.message : String(payError),
          name: payError instanceof Error ? payError.name : 'Unknown',
          stack: payError instanceof Error ? payError.stack : undefined,
        });
        
        // Re-throw with more context
        throw payError;
      }
      
      setTxHash(payment.id);
      setStatus('pending');
      
      // Poll for payment status
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max
      
      console.log('[Reprieve] Starting payment status polling:', {
        paymentId: payment.id,
        testnet,
        maxAttempts,
      });
      
      while (attempts < maxAttempts) {
        try {
          const { status: paymentStatus } = await getPaymentStatus({ 
            id: payment.id,
            testnet,
          });
          
          console.log('[Reprieve] Payment status check:', {
            attempt: attempts + 1,
            status: paymentStatus,
            paymentId: payment.id,
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
            console.error('[Reprieve] Payment status is failed');
            throw new Error('Payment failed');
          }
          
          // Wait 1 second before next poll
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        } catch (statusError) {
          console.error('[Reprieve] Error checking payment status:', statusError);
          // Continue polling unless it's a critical error
          if (attempts >= maxAttempts - 1) {
            throw statusError;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      
      console.error('[Reprieve] Payment confirmation timed out after', maxAttempts, 'attempts');
      throw new Error('Payment confirmation timed out');
      
    } catch (err) {
      console.error('[Reprieve] Payment failed:', {
        error: err,
        message: err instanceof Error ? err.message : String(err),
        name: err instanceof Error ? err.name : 'Unknown',
        stack: err instanceof Error ? err.stack : undefined,
      });
      
      let errorMessage = 'Payment failed';
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        
        // More specific error detection
        if (msg.includes('user rejected') || msg.includes('user cancelled') || msg.includes('user denied')) {
          errorMessage = 'Payment cancelled by user';
        } else if (msg.includes('rejected') && !msg.includes('transaction')) {
          // "rejected" alone might mean user rejection
          errorMessage = 'Payment was rejected';
        } else if (msg.includes('cancelled') || msg.includes('denied')) {
          errorMessage = 'Payment cancelled';
        } else if (msg.includes('insufficient') || msg.includes('balance')) {
          errorMessage = 'Insufficient USDC balance';
        } else if (msg.includes('network') || msg.includes('connection')) {
          errorMessage = 'Network error - please ensure you are on Base network';
        } else if (msg.includes('chain') || msg.includes('chainid') || msg.includes('wrong network')) {
          errorMessage = 'Please switch to Base network to complete payment';
        } else if (msg.includes('timeout')) {
          errorMessage = 'Payment timed out - please try again';
        } else {
          // Show the actual error message (truncated)
          errorMessage = err.message.slice(0, 80);
        }
      }
      
      setError(errorMessage);
      setStatus('error');
      return false;
    }
  }, []);
  
  const testnet = isTestnet();
  const expectedChainId = testnet ? 84532 : 8453;
  const networkName = testnet ? 'Base Sepolia' : 'Base Mainnet';
  
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
    networkInfo: {
      isTestnet: testnet,
      expectedChainId,
      networkName,
    },
  };
}
