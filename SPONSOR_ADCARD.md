# Sponsor Ad Card Documentation

## Overview

The Sponsor Ad Card is a prominent UI component displayed on the leaderboard that showcases sponsors of the weekly prize pool. When a company sponsors the prize pool, their ad card appears in the leaderboard, and the reprieve mechanic changes to require purchasing their token.

## Current Implementation

### Component Location
- **File**: `src/components/leaderboard/SponsorAdCard.tsx`
- **Usage**: Displayed on the leaderboard page after the top 3 podium

### Current Features

1. **Visual Design**
   - Purple/blue gradient background with subtle coin emoji pattern
   - Company logo or initial letter in a circular avatar
   - "🔥 Sponsored" badge
   - Company name and token symbol display
   - "Trade Now" CTA button

2. **Data Structure**
   ```typescript
   interface SponsorAdCardProps {
     sponsor: {
       companyName: string;
       tokenSymbol: string;
       tokenName: string;
       logoUrl?: string;
     };
     ctaText?: string;
     ctaUrl?: string;
   }
   ```

3. **Current Behavior**
   - Opens sponsor URL in new tab when CTA is clicked
   - Static display with no analytics tracking
   - No dynamic content or personalization

## Planned Enhancements

### Phase 1: Analytics & Tracking
- [ ] Track ad impressions
- [ ] Track CTA clicks
- [ ] Measure conversion rates
- [ ] A/B testing for different ad copy/designs

### Phase 2: Dynamic Content
- [ ] Rotate multiple sponsors (if multiple sponsors exist)
- [ ] Show different CTAs based on user behavior
- [ ] Personalize messaging based on user's rank/score
- [ ] Display sponsor-specific promotions or offers

### Phase 3: Interactive Features
- [ ] In-app token swap integration
- [ ] Direct trading from the ad card
- [ ] Show real-time token price
- [ ] Display sponsor's leaderboard position (if applicable)

### Phase 4: Advanced Features
- [ ] Video ads support
- [ ] Animated transitions between sponsors
- [ ] Sponsor-specific game mechanics (e.g., bonus points for trading)
- [ ] Social proof (e.g., "X players traded this token")

## Integration Points

### Prize Pool System
- **File**: `src/lib/leaderboard/prizepool.ts`
- The sponsor is linked to the weekly prize pool
- When a sponsor is active, the reprieve mechanic changes

### Reprieve System
- **File**: `src/lib/game-core/reprieve.ts`
- When a sponsor is active, reprieves require buying the sponsor's token
- Price increases exponentially with each reprieve use

### Game Start
- **File**: `src/app/api/game/start/route.ts`
- First token in the game defaults to the sponsor's token (if active)

### Leaderboard Display
- **File**: `src/app/leaderboard/page.tsx`
- Ad card is positioned after the top 3 podium
- Only displayed when a sponsor is active

## API Endpoints

### Get Sponsor Info
- **Endpoint**: `GET /api/prizepool`
- **Response**: Includes sponsor information if active

### Set Sponsor (Admin)
- **Endpoint**: `POST /api/prizepool`
- **Body**: `{ action: 'setSponsor', sponsor: { ... } }`
- **Note**: Requires admin authentication

## Data Flow

1. **Sponsor Setup** (Admin)
   ```
   Admin → POST /api/prizepool → Redis (prizepool:weekly:{weekKey}:sponsor)
   ```

2. **Leaderboard Load**
   ```
   User → GET /api/prizepool → Sponsor data → SponsorAdCard component
   ```

3. **Reprieve Flow** (When sponsor active)
   ```
   User loses → Check sponsor → Show sponsor token payment → Process payment → Continue game
   ```

## Future Considerations

### Monetization
- Charge sponsors for ad placement
- Revenue share from token swaps
- Premium ad placements (top of leaderboard, etc.)

### User Experience
- Make ads less intrusive
- Provide value to users (discounts, bonuses)
- Ensure ads don't disrupt gameplay

### Technical
- Cache sponsor data for performance
- Support multiple sponsors per week
- Implement ad rotation logic
- Add analytics dashboard for sponsors

## Notes

- The sponsor ad card is currently a static component
- Future enhancements will make it more dynamic and interactive
- All sponsor-related changes should maintain backward compatibility
- Consider user privacy when tracking ad interactions
