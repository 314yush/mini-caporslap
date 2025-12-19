'use client';

import { useState, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import { 
  buildReprieveTransaction, 
  REPRIEVE_PRICE_USDC,
} from '@/lib/payments/usdc-payment';

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

export function useReprievePayment(): UseReprievePaymentReturn {
  const { wallets } = useWallets();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
  }, []);
  
  const payForReprieve = useCallback(async (runId: string): Promise<boolean> => {
    setStatus('confirming');
    setError(null);
    setTxHash(null);
    
    try {
      // Get the first connected wallet
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error('No wallet connected');
      }
      
      // Switch to Base if not already
      try {
        await wallet.switchChain(8453); // Base mainnet
      } catch {
        console.warn('Could not switch to Base, trying to proceed anyway');
      }
      
      // Get the EIP-1193 provider
      const provider = await wallet.getEthereumProvider();
      
      // Create viem wallet client
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(provider),
      });
      
      // Get the account
      const [account] = await walletClient.getAddresses();
      if (!account) {
        throw new Error('No account found');
      }
      
      // Build the transaction
      const tx = buildReprieveTransaction();
      
      // Send the transaction
      setStatus('pending');
      const hash = await walletClient.sendTransaction({
        account,
        to: tx.to,
        data: tx.data,
        chain: base,
      });
      
      setTxHash(hash);
      setStatus('verifying');
      
      // Verify the transaction on our server
      const verifyResponse = await fetch('/api/reprieve/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: hash,
          userAddress: account,
          runId,
        }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Transaction verification failed');
      }
      
      setStatus('success');
      return true;
      
    } catch (err) {
      console.error('Reprieve payment failed:', err);
      
      let errorMessage = 'Payment failed';
      if (err instanceof Error) {
        if (err.message.includes('rejected') || err.message.includes('denied')) {
          errorMessage = 'Transaction cancelled';
        } else if (err.message.includes('insufficient')) {
          errorMessage = 'Insufficient USDC balance';
        } else {
          errorMessage = err.message.slice(0, 60); // Truncate long errors
        }
      }
      
      setError(errorMessage);
      setStatus('error');
      return false;
    }
  }, [wallets]);
  
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
