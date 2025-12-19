# Token Expansion Scope: 80 → 500 Tokens

## Current State

### Token Management
- **Current count**: ~80 manually curated tokens
- **Location**: `src/lib/data/token-categories.ts` (CURATED_TOKENS array)
- **Data source**: CoinGecko API (free tier)
- **Fetching**: Batched requests (100 IDs per batch, max 250 allowed)
- **Caching**: 15-minute in-memory cache
- **Fallback**: DexScreener API for additional tokens

### Current Constraints
1. **CoinGecko API Limits**:
   - Free tier: ~10-50 calls/minute
   - Max 250 IDs per request (currently using 100)
   - Rate limiting can cause failures

2. **Manual Curation**:
   - Each token has manually written description
   - Categories are assigned manually
   - Quality control for token selection

3. **References to "80 tokens"**:
   - `src/components/landing/LandingPage.tsx` (line 148)
   - `src/lib/game-core/difficulty.ts` (line 46)
   - `README.md` (lines 12, 121)

## Expansion Options

### Option A: Auto-Fetch Top 500 by Market Cap (Recommended)
**Pros:**
- ✅ Fastest to implement
- ✅ Always includes top tokens by market cap
- ✅ Automatically includes new tokens as they rise
- ✅ No manual maintenance required

**Cons:**
- ❌ Loses curated descriptions
- ❌ Loses category assignments (all become 'unknown')
- ❌ May include tokens with poor data quality

**Implementation:**
- Use CoinGecko's `/coins/markets` endpoint with `per_page=500`
- Single API call (within rate limits)
- Filter out stablecoins
- Cache for 15 minutes

### Option B: Hybrid Approach (Best Quality)
**Pros:**
- ✅ Maintains curated metadata for important tokens
- ✅ Auto-fetches top 500 for variety
- ✅ Best of both worlds

**Cons:**
- ⚠️ More complex implementation
- ⚠️ Requires maintaining curated list for top tokens

**Implementation:**
- Keep curated list for top 100-200 tokens (with descriptions/categories)
- Auto-fetch top 500 from CoinGecko
- Merge: use curated metadata when available, fallback to auto-fetched
- Prioritize curated tokens in game selection

### Option C: Fully Manual Curation
**Pros:**
- ✅ Highest quality control
- ✅ All tokens have descriptions and categories
- ✅ Consistent user experience

**Cons:**
- ❌ Very time-consuming (420+ new tokens to curate)
- ❌ Requires ongoing maintenance
- ❌ Doesn't scale well

## Recommended Approach: Option A (Auto-Fetch) with Option B Enhancements

### Phase 1: Core Expansion (Option A)
1. **Update `fetchCuratedTokens()` in `coingecko.ts`**:
   - Add new function `fetchTop500Tokens()` that uses `/coins/markets?per_page=500`
   - Keep existing curated fetch as fallback/enrichment

2. **Update `getTokenPool()` in `token-pool.ts`**:
   - Primary: Fetch top 500 from CoinGecko
   - Secondary: Enrich with curated metadata where available
   - Filter stablecoins
   - Sort by market cap

3. **Update batch size**:
   - Change from 100 to 250 IDs per batch (if using ID-based fetching)
   - Or use single market cap endpoint (simpler)

### Phase 2: Enhancements (Option B elements)
1. **Maintain curated metadata for top 100 tokens**:
   - Keep descriptions/categories for most popular tokens
   - Auto-enrich fetched tokens with curated data when IDs match

2. **Smart category assignment**:
   - Use CoinGecko categories if available
   - Fallback to symbol-based heuristics (e.g., tokens ending in "INU" → memecoins)

### Phase 3: UI/Content Updates
1. **Update references**:
   - `LandingPage.tsx`: "80+ tokens" → "500+ tokens"
   - `difficulty.ts`: `tokenPoolSize: 80` → `tokenPoolSize: 500`
   - `README.md`: Update token count references

## Technical Implementation Details

### API Changes

#### `src/lib/data/coingecko.ts`
```typescript
// New function to fetch top 500
export async function fetchTop500Tokens(): Promise<Token[]> {
  const response = await fetch(
    `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=500&page=1&sparkline=false`,
    {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }, // 5 minutes
    }
  );
  // ... implementation
}
```

#### `src/lib/data/token-pool.ts`
```typescript
// Update getTokenPool to use top 500 as primary source
export async function getTokenPool(): Promise<Token[]> {
  // PRIMARY: Fetch top 500 from CoinGecko
  const top500 = await fetchTop500Tokens();
  
  // Enrich with curated metadata
  const enriched = top500.map(token => {
    const curated = findTokenInfoById(token.address);
    return curated ? { ...token, ...curated } : token;
  });
  
  // Filter stablecoins
  // Sort by market cap
  // Cache
}
```

### Rate Limiting Considerations
- **Single endpoint call**: `/coins/markets?per_page=500` = 1 API call
- **Current cache**: 15 minutes = ~4 calls/hour (well within limits)
- **Fallback strategy**: If rate limited, use cached data

### Performance Impact
- **Memory**: 500 tokens × ~500 bytes = ~250KB (negligible)
- **API response**: ~500KB JSON (acceptable)
- **Cache hit rate**: Should remain high with 15-min cache
- **Game logic**: No changes needed (works with any token count)

## Files to Modify

### Core Changes
1. `src/lib/data/coingecko.ts`
   - Add `fetchTop500Tokens()` function
   - Update `fetchCuratedTokens()` to support both modes

2. `src/lib/data/token-pool.ts`
   - Update `getTokenPool()` to fetch top 500
   - Add enrichment logic for curated metadata
   - Update `MIN_TOKENS_REQUIRED` if needed (currently 30)

3. `src/lib/data/token-categories.ts`
   - Keep curated list for top tokens (optional enhancement)
   - Add helper to find curated info by CoinGecko ID

### UI/Content Updates
4. `src/components/landing/LandingPage.tsx`
   - Line 148: "80+ tokens" → "500+ tokens"

5. `src/lib/game-core/difficulty.ts`
   - Line 46: `tokenPoolSize: 80` → `tokenPoolSize: 500`

6. `README.md`
   - Update token count references

## Testing Checklist

- [ ] Verify top 500 tokens are fetched correctly
- [ ] Test rate limiting behavior
- [ ] Verify stablecoin filtering works
- [ ] Test cache behavior (15-min refresh)
- [ ] Verify game works with 500 tokens
- [ ] Check token selection diversity
- [ ] Verify fallback to cached data on API failure
- [ ] Test with CoinGecko API down (fallback behavior)
- [ ] Update UI text references
- [ ] Performance test (memory, API response time)

## Migration Strategy

1. **Deploy in stages**:
   - Stage 1: Add new fetch function (backward compatible)
   - Stage 2: Update token pool to use new function
   - Stage 3: Update UI references
   - Stage 4: Monitor and optimize

2. **Rollback plan**:
   - Keep old `fetchCuratedTokens()` as fallback
   - Feature flag to switch between 80 and 500 tokens
   - Can revert to curated-only if issues arise

## Estimated Effort

- **Phase 1 (Core)**: 2-3 hours
  - API changes: 1 hour
  - Token pool updates: 1 hour
  - Testing: 1 hour

- **Phase 2 (Enhancements)**: 1-2 hours
  - Metadata enrichment: 1 hour
  - Category assignment: 1 hour

- **Phase 3 (UI Updates)**: 30 minutes
  - Text updates: 15 minutes
  - Verification: 15 minutes

**Total**: ~4-6 hours

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rate limiting | High | Use single endpoint call, aggressive caching |
| Poor token quality | Medium | Filter by market cap threshold, exclude stablecoins |
| API downtime | Medium | Fallback to cached data, graceful degradation |
| Performance issues | Low | 500 tokens is small dataset, cache aggressively |
| Missing metadata | Low | Optional enhancement, game works without descriptions |

## Success Criteria

- ✅ Token pool contains 500+ tokens
- ✅ All tokens have valid market cap data
- ✅ Stablecoins are filtered out
- ✅ Game works smoothly with expanded pool
- ✅ API calls stay within rate limits
- ✅ Cache hit rate remains high (>90%)
- ✅ UI reflects new token count

## Future Enhancements

1. **Dynamic token list**: Auto-update based on market cap rankings
2. **Category auto-detection**: Use CoinGecko categories or ML-based classification
3. **Token quality scoring**: Filter out low-quality tokens automatically
4. **User preferences**: Allow filtering by category
5. **Token popularity tracking**: Track which tokens appear most in games

