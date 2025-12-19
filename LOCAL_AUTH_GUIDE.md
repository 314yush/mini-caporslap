# Local Development Authentication Guide

## Problem

**Quick Auth only works in Base App**, which means you can't test authentication locally. The `sdk.quickAuth.getToken()` method requires the Base App environment and Farcaster identity system.

## Solution

We've added a **development mode authentication** that automatically detects when you're running locally (not in Base App) and uses **wallet connection** (MetaMask, Rabby, etc.) instead.

## How It Works

### Automatic Detection

The app automatically detects the environment:
- **Base App**: Uses Quick Auth (Farcaster identity)
- **Local Development**: Uses wallet connection (MetaMask/Rabby/etc.)

### Development Mode Features

1. **Wallet Connection**: Connects to any Ethereum wallet (MetaMask, Rabby, Coinbase Wallet, etc.)
2. **Mock FID Generation**: Generates a consistent mock FID from your wallet address
3. **Session Persistence**: Remembers your connection across page reloads
4. **Full Game Functionality**: All game features work with the mock identity

## Usage

### Step 1: Install a Wallet

If you don't have one already, install:
- [MetaMask](https://metamask.io/)
- [Rabby](https://rabby.io/)
- Or any other Ethereum wallet

### Step 2: Connect Your Wallet

1. Start your local dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Click **"Connect Wallet (Dev)"** button
4. Approve the connection in your wallet
5. You're now authenticated! 🎉

### Step 3: Test the Game

- Play games
- Build streaks
- Submit to leaderboard
- All features work with your mock identity

## How It Works Under the Hood

### Environment Detection

```typescript
// Automatically detects if running in Base App or local dev
const isDevelopment = detectEnvironment() === 'web';
```

### Mock FID Generation

Your wallet address is converted to a consistent FID:
- Same address = Same FID (persistent across sessions)
- FID range: 1000-999999 (realistic FID range)
- Username: `dev_xxxxxx` (from address)

### Session Storage

Development auth stores:
- `dev_auth_address`: Your wallet address
- `dev_auth_fid`: Generated mock FID
- `dev_auth_user`: User object with FID, username, displayName

## Production Behavior

When deployed to Base App:
- ✅ Automatically uses Quick Auth
- ✅ No wallet connection needed
- ✅ Real Farcaster identity
- ✅ All production features work

## Troubleshooting

### "No wallet found" Error

**Problem**: No Ethereum wallet detected

**Solution**: 
1. Install MetaMask or Rabby browser extension
2. Refresh the page
3. Try connecting again

### Wallet Connection Fails

**Problem**: Wallet popup doesn't appear or connection fails

**Solution**:
1. Check wallet extension is enabled
2. Make sure you're on Base network (or any network - doesn't matter for dev)
3. Try disconnecting and reconnecting
4. Check browser console for errors

### Mock FID Changes

**Problem**: FID changes between sessions

**Solution**: This shouldn't happen - FID is generated deterministically from your address. If it changes, clear session storage and reconnect.

## Code Structure

### Files Added/Modified

- `src/hooks/useAuthDev.ts` - Development wallet connection hook
- `src/hooks/useAuth.ts` - Updated to use dev auth when in web mode
- `src/components/auth/ConnectButton.tsx` - Shows "Connect Wallet (Dev)" in dev mode

### Key Functions

```typescript
// Development auth hook
useAuthDev() // Returns: { connect, disconnect, isConnected, fid, user }

// Main auth hook (auto-detects environment)
useAuth() // Returns: { login, logout, isAuthenticated, fid, user }
```

## Testing Checklist

- [ ] Wallet connection works
- [ ] Mock FID is generated and consistent
- [ ] Session persists across page reloads
- [ ] Game can be played with mock identity
- [ ] Leaderboard submission works
- [ ] Analytics events fire correctly
- [ ] Production mode still uses Quick Auth (when deployed)

## Notes

- **Development only**: This wallet connection is only active in local development
- **No real FID**: The FID is a mock - it won't match any real Farcaster user
- **Base network**: Wallet can be on any network - we just need the address
- **Privacy**: Your wallet address is only stored in session storage (cleared on browser close)

## Alternative: Tunneling (For Testing Quick Auth)

If you want to test the actual Quick Auth flow locally, you can use tunneling:

1. **Install ngrok**: `npm install -g ngrok`
2. **Start your app**: `npm run dev`
3. **Tunnel it**: `ngrok http 3000`
4. **Use ngrok URL**: Open the ngrok URL in Base App
5. **Test Quick Auth**: Now you can test the real authentication flow

However, the wallet connection approach is much simpler for local development! 🚀

