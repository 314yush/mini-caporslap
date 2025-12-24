#!/bin/bash

# Test script for API endpoints
# Usage: ./scripts/test-api-endpoints.sh [domain]
# Example: ./scripts/test-api-endpoints.sh caporslap.fun

DOMAIN=${1:-"caporslap.fun"}
BASE_URL="https://${DOMAIN}"

echo "Testing API endpoints for ${DOMAIN}"
echo "=================================="
echo ""

# Test 1: Clear user profiles
echo "1. Testing: Clear user profiles"
echo "   Command: curl -X POST \"${BASE_URL}/api/admin/clear-cache?type=profiles\""
echo ""
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/clear-cache?type=profiles")
echo "   Response: $RESPONSE"
echo ""

# Test 2: Clear leaderboard (with confirmation)
echo "2. Testing: Clear leaderboard (requires confirmation)"
echo "   Command: curl -X POST \"${BASE_URL}/api/admin/clear-leaderboard?type=all&confirm=true\""
echo ""
read -p "   ⚠️  This will delete all leaderboard data! Continue? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/clear-leaderboard?type=all&confirm=true")
    echo "   Response: $RESPONSE"
else
    echo "   Skipped (user cancelled)"
fi
echo ""

echo "Done!"

