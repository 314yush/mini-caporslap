/**
 * Token categories and curated lists
 * Organized by category for diverse gameplay
 */

export type TokenCategory = 
  | 'l1_chains'      // Layer 1 blockchains
  | 'l2_chains'      // Layer 2 solutions
  | 'memecoins'      // Meme tokens
  | 'defi'           // DeFi protocols
  | 'infrastructure' // Infra & tooling
  | 'gaming'         // Gaming & metaverse
  | 'ai'             // AI tokens
  | 'rwa'            // Real World Assets
  | 'stablecoins'    // Stablecoins (excluded from game)
  | 'unknown';       // Unknown/uncategorized

export interface TokenInfo {
  id: string;           // CoinGecko ID
  symbol: string;
  name: string;
  category: TokenCategory;
  description?: string;
  website?: string;
  twitter?: string;
  chains?: string[];    // Which chains it's on
}

/**
 * Curated token list with categories
 * These are CoinGecko IDs for reliable data fetching
 */
export const CURATED_TOKENS: TokenInfo[] = [
  // ============ L1 CHAINS ============
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', category: 'l1_chains', description: 'The original cryptocurrency and largest by market cap.' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', category: 'l1_chains', description: 'The leading smart contract platform.' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', category: 'l1_chains', description: 'High-performance blockchain known for speed and low fees.' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', category: 'l1_chains', description: 'Native token of Binance Smart Chain.' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', category: 'l1_chains', description: 'Proof-of-stake blockchain with academic research foundation.' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', category: 'l1_chains', description: 'Fast, eco-friendly smart contracts platform.' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', category: 'l1_chains', description: 'Multi-chain protocol connecting blockchains.' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', category: 'l1_chains', description: 'Sharded, developer-friendly blockchain.' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos', category: 'l1_chains', description: 'Internet of Blockchains - connecting independent chains.' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', category: 'l1_chains', description: 'Layer 1 blockchain by former Meta engineers.' },
  { id: 'aptos', symbol: 'APT', name: 'Aptos', category: 'l1_chains', description: 'Safe, scalable Layer 1 blockchain.' },
  { id: 'toncoin', symbol: 'TON', name: 'Toncoin', category: 'l1_chains', description: 'Telegram-affiliated blockchain network.' },
  { id: 'internet-computer', symbol: 'ICP', name: 'Internet Computer', category: 'l1_chains', description: 'Decentralized cloud computing platform.' },
  { id: 'hedera-hashgraph', symbol: 'HBAR', name: 'Hedera', category: 'l1_chains', description: 'Enterprise-grade public network.' },
  { id: 'fantom', symbol: 'FTM', name: 'Fantom', category: 'l1_chains', description: 'Fast, scalable, secure smart contract platform.' },

  // ============ L2 CHAINS ============
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', category: 'l2_chains', description: 'Leading Ethereum Layer 2 scaling solution.' },
  { id: 'optimism', symbol: 'OP', name: 'Optimism', category: 'l2_chains', description: 'Ethereum L2 with optimistic rollups.' },
  { id: 'matic-network', symbol: 'POL', name: 'Polygon', category: 'l2_chains', description: 'Ethereum scaling and infrastructure platform.' },
  { id: 'starknet', symbol: 'STRK', name: 'Starknet', category: 'l2_chains', description: 'ZK-rollup scaling solution for Ethereum.' },
  { id: 'immutable-x', symbol: 'IMX', name: 'Immutable X', category: 'l2_chains', description: 'Layer 2 for NFTs and gaming on Ethereum.' },
  { id: 'mantle', symbol: 'MNT', name: 'Mantle', category: 'l2_chains', description: 'Modular Layer 2 blockchain.' },
  { id: 'metis-token', symbol: 'METIS', name: 'Metis', category: 'l2_chains', description: 'Ethereum Layer 2 rollup platform.' },
  { id: 'zksync', symbol: 'ZK', name: 'zkSync', category: 'l2_chains', description: 'ZK rollup for Ethereum scaling.' },
  { id: 'blast', symbol: 'BLAST', name: 'Blast', category: 'l2_chains', description: 'Ethereum L2 with native yield.' },
  { id: 'scroll', symbol: 'SCR', name: 'Scroll', category: 'l2_chains', description: 'zkEVM-based Layer 2 for Ethereum.' },

  // ============ MEMECOINS ============
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', category: 'memecoins', description: 'The original meme cryptocurrency.' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', category: 'memecoins', description: 'Ethereum-based memecoin and ecosystem.' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', category: 'memecoins', description: 'Frog-themed memecoin on Ethereum.' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', category: 'memecoins', description: 'Solana\'s dog-themed community memecoin.' },
  { id: 'dogwifcoin', symbol: 'WIF', name: 'dogwifhat', category: 'memecoins', description: 'Dog with a hat - Solana memecoin.' },
  { id: 'floki', symbol: 'FLOKI', name: 'Floki', category: 'memecoins', description: 'Viking-dog themed memecoin.' },
  { id: 'brett', symbol: 'BRETT', name: 'Brett', category: 'memecoins', description: 'Base chain\'s leading memecoin.' },
  { id: 'mog-coin', symbol: 'MOG', name: 'Mog Coin', category: 'memecoins', description: 'Internet culture memecoin.' },
  { id: 'popcat', symbol: 'POPCAT', name: 'Popcat', category: 'memecoins', description: 'Solana memecoin inspired by the viral cat meme.' },
  { id: 'cat-in-a-dogs-world', symbol: 'MEW', name: 'cat in a dogs world', category: 'memecoins', description: 'Solana cat memecoin.' },
  { id: 'gigachad-2', symbol: 'GIGA', name: 'Gigachad', category: 'memecoins', description: 'Chad-themed memecoin.' },
  { id: 'goatseus-maximus', symbol: 'GOAT', name: 'Goatseus Maximus', category: 'memecoins', description: 'AI-promoted memecoin on Solana.' },

  // ============ DEFI ============
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', category: 'defi', description: 'Leading decentralized exchange protocol.' },
  { id: 'aave', symbol: 'AAVE', name: 'Aave', category: 'defi', description: 'Decentralized lending and borrowing protocol.' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', category: 'defi', description: 'Decentralized oracle network.' },
  { id: 'maker', symbol: 'MKR', name: 'Maker', category: 'defi', description: 'Governance token for MakerDAO and DAI.' },
  { id: 'lido-dao', symbol: 'LDO', name: 'Lido DAO', category: 'defi', description: 'Liquid staking solution for Ethereum.' },
  { id: 'curve-dao-token', symbol: 'CRV', name: 'Curve', category: 'defi', description: 'Stablecoin-focused DEX protocol.' },
  { id: 'compound-governance-token', symbol: 'COMP', name: 'Compound', category: 'defi', description: 'Algorithmic money market protocol.' },
  { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter', category: 'defi', description: 'Solana\'s leading DEX aggregator.' },
  { id: 'raydium', symbol: 'RAY', name: 'Raydium', category: 'defi', description: 'AMM and liquidity provider on Solana.' },
  { id: 'pancakeswap-token', symbol: 'CAKE', name: 'PancakeSwap', category: 'defi', description: 'Leading DEX on BNB Chain.' },
  { id: '1inch', symbol: '1INCH', name: '1inch', category: 'defi', description: 'DEX aggregator for best swap rates.' },
  { id: 'synthetix-network-token', symbol: 'SNX', name: 'Synthetix', category: 'defi', description: 'Derivatives liquidity protocol.' },
  { id: 'gmx', symbol: 'GMX', name: 'GMX', category: 'defi', description: 'Decentralized perpetuals exchange.' },
  { id: 'pendle', symbol: 'PENDLE', name: 'Pendle', category: 'defi', description: 'Yield trading protocol.' },
  { id: 'eigenlayer', symbol: 'EIGEN', name: 'EigenLayer', category: 'defi', description: 'Restaking protocol for Ethereum.' },

  // ============ INFRASTRUCTURE ============
  { id: 'the-graph', symbol: 'GRT', name: 'The Graph', category: 'infrastructure', description: 'Indexing protocol for blockchain data.' },
  { id: 'filecoin', symbol: 'FIL', name: 'Filecoin', category: 'infrastructure', description: 'Decentralized storage network.' },
  { id: 'arweave', symbol: 'AR', name: 'Arweave', category: 'infrastructure', description: 'Permanent decentralized storage.' },
  { id: 'render-token', symbol: 'RENDER', name: 'Render', category: 'infrastructure', description: 'Distributed GPU rendering network.' },
  { id: 'helium', symbol: 'HNT', name: 'Helium', category: 'infrastructure', description: 'Decentralized wireless network.' },
  { id: 'pyth-network', symbol: 'PYTH', name: 'Pyth Network', category: 'infrastructure', description: 'Oracle for real-time market data.' },
  { id: 'akash-network', symbol: 'AKT', name: 'Akash', category: 'infrastructure', description: 'Decentralized cloud computing.' },
  { id: 'ens', symbol: 'ENS', name: 'Ethereum Name Service', category: 'infrastructure', description: 'Decentralized naming for wallets and websites.' },
  { id: 'livepeer', symbol: 'LPT', name: 'Livepeer', category: 'infrastructure', description: 'Decentralized video infrastructure.' },

  // ============ AI TOKENS ============
  { id: 'bittensor', symbol: 'TAO', name: 'Bittensor', category: 'ai', description: 'Decentralized machine learning network.' },
  { id: 'fetch-ai', symbol: 'FET', name: 'Fetch.ai', category: 'ai', description: 'AI-powered automation platform.' },
  { id: 'singularitynet', symbol: 'AGIX', name: 'SingularityNET', category: 'ai', description: 'Decentralized AI marketplace.' },
  { id: 'ocean-protocol', symbol: 'OCEAN', name: 'Ocean Protocol', category: 'ai', description: 'Data exchange for AI.' },
  { id: 'worldcoin-wld', symbol: 'WLD', name: 'Worldcoin', category: 'ai', description: 'Global identity and financial network.' },
  { id: 'ai16z', symbol: 'AI16Z', name: 'ai16z', category: 'ai', description: 'AI-managed DAO investment fund.' },
  { id: 'virtual-protocol', symbol: 'VIRTUAL', name: 'Virtuals Protocol', category: 'ai', description: 'AI agent creation platform.' },

  // ============ GAMING & METAVERSE ============
  { id: 'the-sandbox', symbol: 'SAND', name: 'The Sandbox', category: 'gaming', description: 'Virtual world and gaming platform.' },
  { id: 'decentraland', symbol: 'MANA', name: 'Decentraland', category: 'gaming', description: 'Virtual reality platform.' },
  { id: 'axie-infinity', symbol: 'AXS', name: 'Axie Infinity', category: 'gaming', description: 'Play-to-earn gaming ecosystem.' },
  { id: 'gala', symbol: 'GALA', name: 'Gala Games', category: 'gaming', description: 'Blockchain gaming platform.' },
  { id: 'illuvium', symbol: 'ILV', name: 'Illuvium', category: 'gaming', description: 'Open-world RPG adventure game.' },
  { id: 'apecoin', symbol: 'APE', name: 'ApeCoin', category: 'gaming', description: 'Bored Ape Yacht Club ecosystem token.' },
  { id: 'ronin', symbol: 'RON', name: 'Ronin', category: 'gaming', description: 'Gaming-focused blockchain by Sky Mavis.' },
  { id: 'beam-2', symbol: 'BEAM', name: 'Beam', category: 'gaming', description: 'Gaming ecosystem by Merit Circle.' },

  // ============ REAL WORLD ASSETS ============
  // Note: These are tokenized/synthetic versions where available
  { id: 'paxos-gold', symbol: 'PAXG', name: 'PAX Gold', category: 'rwa', description: 'Gold-backed stablecoin, 1 token = 1 oz gold.' },
  { id: 'tether-gold', symbol: 'XAUT', name: 'Tether Gold', category: 'rwa', description: 'Gold-backed token by Tether.' },
  { id: 'ondo-finance', symbol: 'ONDO', name: 'Ondo Finance', category: 'rwa', description: 'Tokenized securities and RWA protocol.' },
  { id: 'mantra-dao', symbol: 'OM', name: 'MANTRA', category: 'rwa', description: 'Real world asset tokenization platform.' },
  { id: 'reserve-rights-token', symbol: 'RSR', name: 'Reserve Rights', category: 'rwa', description: 'Stablecoin protocol with RWA backing.' },
  { id: 'centrifuge', symbol: 'CFG', name: 'Centrifuge', category: 'rwa', description: 'Real-world asset financing on-chain.' },
  { id: 'maple', symbol: 'MPL', name: 'Maple Finance', category: 'rwa', description: 'Institutional capital markets on-chain.' },
  { id: 'goldfinch', symbol: 'GFI', name: 'Goldfinch', category: 'rwa', description: 'Credit protocol for real-world loans.' },
];

/**
 * Get tokens by category
 */
export function getTokensByCategory(category: TokenCategory): TokenInfo[] {
  return CURATED_TOKENS.filter(t => t.category === category);
}

/**
 * Get all playable categories (excluding stablecoins)
 */
export function getPlayableCategories(): TokenCategory[] {
  return ['l1_chains', 'l2_chains', 'memecoins', 'defi', 'infrastructure', 'gaming', 'ai', 'rwa'];
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: TokenCategory): string {
  const names: Record<TokenCategory, string> = {
    l1_chains: 'Layer 1 Chains',
    l2_chains: 'Layer 2 Solutions',
    memecoins: 'Memecoins',
    defi: 'DeFi Protocols',
    infrastructure: 'Infrastructure',
    gaming: 'Gaming & Metaverse',
    ai: 'AI Tokens',
    rwa: 'Real World Assets',
    stablecoins: 'Stablecoins',
    unknown: 'Other',
  };
  return names[category];
}

/**
 * Get CoinGecko IDs for all curated tokens
 */
export function getAllCuratedIds(): string[] {
  return CURATED_TOKENS.map(t => t.id);
}

/**
 * Find token info by symbol
 */
export function findTokenInfoBySymbol(symbol: string): TokenInfo | undefined {
  return CURATED_TOKENS.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
}

/**
 * Find token info by CoinGecko ID
 */
export function findTokenInfoById(id: string): TokenInfo | undefined {
  return CURATED_TOKENS.find(t => t.id === id);
}

