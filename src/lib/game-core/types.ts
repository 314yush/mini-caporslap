// ==========================================
// Core Types for CapOrSlap Game
// ==========================================

// Environment detection
export type Environment = 'web' | 'miniapp';

// User identity types
export type UserType = 'anon' | 'wallet' | 'farcaster' | 'privy';

export interface User {
  userId: string;
  userType: UserType;
  displayName: string;
  avatarUrl?: string;
}

// Token categories
export type TokenCategory = 
  | 'l1_chains'
  | 'l2_chains'
  | 'memecoins'
  | 'defi'
  | 'infrastructure'
  | 'gaming'
  | 'ai'
  | 'rwa'
  | 'stablecoins'
  | 'unknown';

// Token data
export interface Token {
  id: string;
  symbol: string;
  name: string;
  logoUrl: string;
  marketCap: number;
  chain: string;
  address: string;
  // Extended info
  category?: TokenCategory;
  description?: string;
  website?: string;
  twitter?: string;
}

// Token pair for comparison
export interface TokenPair {
  current: Token;
  next: Token;
}

// Player guess
export type Guess = 'cap' | 'slap'; // cap = higher, slap = lower

// Result of a guess
export interface GuessResult {
  correct: boolean;
  guess: Guess;
  currentToken: Token;
  nextToken: Token;
  correctAnswer: Guess;
}

// Game state
export type GamePhase = 'playing' | 'correct' | 'loss';

export interface GameState {
  phase: GamePhase;
  currentToken: Token | null;
  nextToken: Token | null;
  streak: number;
  hasUsedReprieve: boolean;
  runId: string;
  preloadedTokens: Token[]; // Queue of preloaded tokens ready to use
}

// A completed run (for leaderboard/sharing)
export interface Run {
  runId: string;
  userId: string;
  streak: number;
  usedReprieve: boolean;
  timestamp: number;
  lastToken: Token;
  failedGuess?: GuessResult;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  user: User;
  bestStreak: number; // Best single streak
  cumulativeScore?: number; // Cumulative score for weekly (sum of all streaks)
  usedReprieve: boolean;
  timestamp: number;
}

// Share data for generating challenge
export interface ShareData {
  streak: number;
  runId: string;
  userId: string;
  message: string;
  url: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StartGameResponse {
  runId: string;
  token: Token;
}

export interface GuessResponse {
  result: GuessResult;
  newStreak: number;
  nextToken?: Token;
  gameOver: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number;
}

// Feature flags
export interface FeatureFlags {
  reprieve: boolean;
  walletConnect: boolean;
}

