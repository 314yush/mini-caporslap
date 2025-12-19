# 🎮 CapOrSlap

A fast, social, skill-based crypto market cap guessing game. Compare two tokens, guess which has the higher market cap, build streaks, and challenge others!

![Game Screenshot](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)

## ✨ Features

- **🎯 Instant Play**: No login, no wallet required - just play
- **📊 500+ Tokens**: Top tokens by market cap, enriched with curated metadata
- **📈 Real-time Data**: Token prices from CoinGecko API (15-min cache)
- **🏆 Global Leaderboards**: Weekly and all-time rankings
- **📤 Social Sharing**: Challenge friends with shareable links
- **📱 Mobile-first**: Split-screen UI designed for touch
- **💡 Token Info**: Click any ticker for project details (without revealing mcap!)
- **🕯️ Reprieve System**: Pay $1 to continue after a loss (streak 5+)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- [Upstash Redis](https://console.upstash.com/) account (for leaderboards)

### Installation

```bash
# Clone the repo
git clone https://github.com/314yush/clap-or-slap.git
cd clap-or-slap

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

## ⚙️ Environment Variables

Create a `.env` file (see `env.example`):

```env
# Required for leaderboard
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Feature flags
NEXT_PUBLIC_FEATURE_REPRIEVE=true

# App URL (for sharing)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎮 How to Play

1. **See the known token** (top) with its market cap revealed
2. **Guess the mystery token** (bottom) - Higher or Lower?
3. **Build your streak** - correct guesses increase your score
4. **Share your L** - when you lose, share and challenge friends!

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Upstash Redis |
| Data Source | CoinGecko API |
| Deployment | Vercel |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── game/start/    # Initialize game
│   │   ├── tokens/next/   # Get next token
│   │   └── leaderboard/   # Score submission
│   ├── leaderboard/       # Leaderboard page
│   └── page.tsx           # Main game
├── components/
│   └── game/              # GameScreen, TokenPanel, LossScreen
├── hooks/
│   ├── useGame.ts         # Core game state
│   ├── useIdentity.ts     # Anonymous user ID
│   └── useEnvironment.ts  # Web vs MiniApp detection
└── lib/
    ├── game-core/         # Comparison, streak, reprieve logic
    ├── data/              # CoinGecko client, token categories
    ├── social/            # Sharing system
    └── redis.ts           # Leaderboard storage
```

## 🪙 Token Categories

| Category | Examples |
|----------|----------|
| L1 Chains | BTC, ETH, SOL, BNB, ADA, AVAX, DOT |
| L2 Solutions | ARB, OP, POL, STRK, ZK, BASE |
| Memecoins | DOGE, SHIB, PEPE, BONK, WIF, BRETT |
| DeFi | UNI, AAVE, LINK, MKR, CRV, GMX |
| AI Tokens | TAO, FET, WLD, VIRTUAL, AI16Z |
| Gaming | SAND, MANA, AXS, GALA, RON |
| RWA | PAXG, ONDO, OM, CFG |

## 🛣️ Roadmap

### Phase 0 ✅ Web MVP
- [x] Core gameplay with split-screen UI
- [x] 500+ tokens (top by market cap, enriched with curated metadata)
- [x] Anonymous users (localStorage UUID)
- [x] Global leaderboard
- [x] Token info tooltips
- [x] Reprieve system

### Phase 1 🚧 Farcaster Mini-App
- [ ] Farcaster SDK integration
- [ ] Social identity (FID)
- [ ] Cast embeds
- [ ] Friends leaderboard
- [ ] Payment integration for reprieve

## 🧑‍💻 Development

```bash
# Development server
npm run dev

# Type checking
npm run build

# Lint
npm run lint

# Start production build
npm start
```

## 📄 License

MIT © 2024

---

**Built with ❤️ for degens who think they know market caps**
