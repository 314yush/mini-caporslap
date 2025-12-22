/**
 * Reprieve system - allows continuing a streak once after losing
 * This is a monetization feature - pay $1 to continue
 * Payment integration hooks ready for future implementation
 */

export interface ReprieveState {
  available: boolean;
  used: boolean;
  price: number;
  minStreak: number;
  currency: 'USD' | 'ETH' | 'USDC';
  sponsorToken?: {
    address: string;
    symbol: string;
    name: string;
    logoUrl?: string;
  };
  reprieveCount?: number; // Number of reprieves used in this game
}

export interface ReprieveResult {
  success: boolean;
  paymentRequired: boolean;
  paymentAmount?: number;
  paymentCurrency?: 'USD' | 'ETH' | 'USDC';
  transactionId?: string;
  error?: string;
}

export interface PaymentRequest {
  userId: string;
  runId: string;
  amount: number;
  currency: 'USD' | 'ETH' | 'USDC';
  streak: number;
}

// Minimum streak required to unlock reprieve
const MIN_STREAK_FOR_REPRIEVE = 5;
const REPRIEVE_PRICE = 1.00; // $1 USD
const REPRIEVE_CURRENCY = 'USD' as const;

// Feature flag for free reprieves during testing
const REPRIEVE_FREE = process.env.NEXT_PUBLIC_REPRIEVE_FREE === 'true';

/**
 * Checks if reprieve can be offered
 * @param streak - Current streak
 * @param hasUsedReprieve - Whether reprieve was already used this run
 * @returns Whether reprieve is available
 */
export function canOfferReprieve(
  streak: number,
  hasUsedReprieve: boolean
): boolean {
  // Can only use once per run
  if (hasUsedReprieve) return false;
  
  // Must meet minimum streak
  return streak >= MIN_STREAK_FOR_REPRIEVE;
}

/**
 * Gets active sponsor (if any)
 */
export async function getActiveSponsor(): Promise<{
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  logoUrl?: string;
  companyName: string;
  reprievePrice: number;
} | null> {
  try {
    const { getSponsor } = await import('@/lib/leaderboard/prizepool');
    return await getSponsor();
  } catch (error) {
    console.error('Error fetching active sponsor:', error);
    return null;
  }
}

/**
 * Calculates reprieve price with exponential pricing
 * Formula: basePrice * (1.5 ^ (reprieveCount))
 * @param basePrice - Base price (default $1)
 * @param reprieveCount - Number of reprieves already used (0-indexed)
 * @returns Calculated price
 */
export function calculateReprievePrice(basePrice: number, reprieveCount: number): number {
  if (reprieveCount <= 0) return basePrice;
  return basePrice * Math.pow(1.5, reprieveCount);
}

/**
 * Gets reprieve state for display
 * @param streak - Current streak
 * @param hasUsedReprieve - Whether reprieve was already used
 * @param reprieveCount - Number of reprieves used in this game (for exponential pricing)
 * @returns Reprieve state object
 */
export async function getReprieveState(
  streak: number,
  hasUsedReprieve: boolean,
  reprieveCount: number = 0
): Promise<ReprieveState> {
  const sponsor = await getActiveSponsor();
  
  // If sponsor is active, use sponsor token pricing
  if (sponsor) {
    const price = calculateReprievePrice(sponsor.reprievePrice || REPRIEVE_PRICE, reprieveCount);
    return {
      available: canOfferReprieve(streak, hasUsedReprieve),
      used: hasUsedReprieve,
      price,
      minStreak: MIN_STREAK_FOR_REPRIEVE,
      currency: 'USD', // Price is in USD, but payment is in sponsor token
      sponsorToken: {
        address: sponsor.tokenAddress,
        symbol: sponsor.tokenSymbol,
        name: sponsor.tokenName,
        logoUrl: sponsor.logoUrl,
      },
      reprieveCount,
    };
  }
  
  // No sponsor - use regular USDC pricing
  const price = calculateReprievePrice(REPRIEVE_PRICE, reprieveCount);
  return {
    available: canOfferReprieve(streak, hasUsedReprieve),
    used: hasUsedReprieve,
    price,
    minStreak: MIN_STREAK_FOR_REPRIEVE,
    currency: REPRIEVE_CURRENCY,
    reprieveCount,
  };
}

/**
 * Generates the reprieve offer copy
 * @param streak - Current streak
 * @param reprieveState - Reprieve state (includes price and sponsor info)
 * @returns Copy for the reprieve button
 */
export function getReprieveCopy(
  streak: number,
  reprieveState: ReprieveState
): {
  title: string;
  description: string;
  buttonText: string;
  emoji: string;
} {
  const priceText = REPRIEVE_FREE 
    ? 'FREE (testing)' 
    : `$${reprieveState.price.toFixed(2)}`;
  
  const sponsorText = reprieveState.sponsorToken
    ? ` (${reprieveState.sponsorToken.symbol})`
    : '';
  
  return {
    title: 'One Last Candle',
    description: `Keep your ${streak} streak alive`,
    buttonText: `Continue for ${priceText}${sponsorText}`,
    emoji: '🕯️',
  };
}

/**
 * Gets the minimum streak required for reprieve
 */
export function getMinStreakForReprieve(): number {
  return MIN_STREAK_FOR_REPRIEVE;
}

/**
 * Gets the reprieve price
 */
export function getReprievePrice(): number {
  return REPRIEVE_PRICE;
}

/**
 * Check if reprieves are currently free
 */
export function isReprieveFree(): boolean {
  return REPRIEVE_FREE;
}

// ===========================================
// PAYMENT INTEGRATION HOOKS
// ===========================================

/**
 * Payment provider interface
 * Implement this for different payment methods
 */
export interface PaymentProvider {
  name: string;
  processPayment(request: PaymentRequest): Promise<ReprieveResult>;
  verifyPayment(transactionId: string): Promise<boolean>;
}

/**
 * Mock payment provider for testing
 */
export const mockPaymentProvider: PaymentProvider = {
  name: 'mock',
  async processPayment(request: PaymentRequest): Promise<ReprieveResult> {
    console.log('[Reprieve] Mock payment processed:', request);
    
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      paymentRequired: false,
      transactionId: `mock_${Date.now()}_${request.runId}`,
    };
  },
  async verifyPayment(transactionId: string): Promise<boolean> {
    return transactionId.startsWith('mock_');
  },
};

/**
 * Stripe payment provider placeholder
 * TODO: Implement when ready
 */
export const stripePaymentProvider: PaymentProvider = {
  name: 'stripe',
  async processPayment(request: PaymentRequest): Promise<ReprieveResult> {
    // TODO: Implement Stripe payment intent creation
    // 1. Create payment intent on server
    // 2. Return client secret for frontend to complete
    // 3. Verify payment webhook
    
    console.log('[Reprieve] Stripe payment not yet implemented:', request);
    return {
      success: false,
      paymentRequired: true,
      paymentAmount: request.amount,
      paymentCurrency: request.currency,
      error: 'Stripe payments not yet implemented',
    };
  },
  async verifyPayment(_transactionId: string): Promise<boolean> {
    // TODO: Verify with Stripe API
    return false;
  },
};

/**
 * Crypto payment provider placeholder (USDC, ETH)
 * TODO: Implement when ready
 */
export const cryptoPaymentProvider: PaymentProvider = {
  name: 'crypto',
  async processPayment(request: PaymentRequest): Promise<ReprieveResult> {
    // TODO: Implement crypto payment
    // 1. Generate payment address or use Coinbase Commerce
    // 2. Wait for confirmation
    // 3. Verify on-chain
    
    console.log('[Reprieve] Crypto payment not yet implemented:', request);
    return {
      success: false,
      paymentRequired: true,
      paymentAmount: request.amount,
      paymentCurrency: request.currency,
      error: 'Crypto payments not yet implemented',
    };
  },
  async verifyPayment(_transactionId: string): Promise<boolean> {
    // TODO: Verify on-chain
    return false;
  },
};

/**
 * Get the active payment provider
 */
export function getPaymentProvider(): PaymentProvider {
  // During testing, use mock provider if reprieve is free
  if (REPRIEVE_FREE) {
    return mockPaymentProvider;
  }
  
  // TODO: Select based on user preference or config
  // For now, default to mock
  return mockPaymentProvider;
}

/**
 * Process a reprieve request
 * Main entry point for reprieve payment
 */
export async function processReprieve(
  userId: string,
  runId: string,
  streak: number,
  hasUsedReprieve: boolean,
  reprieveCount: number = 0
): Promise<ReprieveResult> {
  // Check if reprieve is available
  if (!canOfferReprieve(streak, hasUsedReprieve)) {
    return {
      success: false,
      paymentRequired: false,
      error: hasUsedReprieve 
        ? 'Reprieve already used this run' 
        : `Minimum streak of ${MIN_STREAK_FOR_REPRIEVE} required`,
    };
  }
  
  // Get reprieve state to check for sponsor
  const reprieveState = await getReprieveState(streak, hasUsedReprieve, reprieveCount);
  
  // If free, just allow it
  if (REPRIEVE_FREE) {
    return {
      success: true,
      paymentRequired: false,
      transactionId: `free_${Date.now()}_${runId}`,
    };
  }
  
  // If sponsor is active, use sponsor token payment
  if (reprieveState.sponsorToken) {
    // Sponsor token payment will be handled by sponsor-payment.ts
    return {
      success: true,
      paymentRequired: true,
      paymentAmount: reprieveState.price,
      paymentCurrency: 'USD', // Price in USD, but payment in sponsor token
      transactionId: undefined, // Will be set after payment
    };
  }
  
  // Process regular USDC payment
  const provider = getPaymentProvider();
  const request: PaymentRequest = {
    userId,
    runId,
    amount: reprieveState.price,
    currency: REPRIEVE_CURRENCY,
    streak,
  };
  
  return provider.processPayment(request);
}

/**
 * Verify a reprieve payment was completed
 */
export async function verifyReprievePayment(transactionId: string): Promise<boolean> {
  // Free reprieves are always valid
  if (transactionId.startsWith('free_')) {
    return true;
  }
  
  const provider = getPaymentProvider();
  return provider.verifyPayment(transactionId);
}
