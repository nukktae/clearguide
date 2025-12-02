#!/bin/bash

# Script to update production environment variables in Vercel
# Specifically for KAKAO_REDIRECT_URI which needs the production URL

set -e

PROD_URL="https://clearguide-qm01wy9p1-anu-bilegdemberels-projects.vercel.app"
KAKAO_REDIRECT_URI="${PROD_URL}/api/auth/kakao/callback"

echo "🔄 Updating KAKAO_REDIRECT_URI for production..."
echo "   Production URL: ${PROD_URL}"
echo "   Redirect URI: ${KAKAO_REDIRECT_URI}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Install it with: npm i -g vercel"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in. Please login first: vercel login"
    exit 1
fi

# Remove existing production KAKAO_REDIRECT_URI if it exists
echo "🗑️  Removing existing KAKAO_REDIRECT_URI (if exists)..."
vercel env rm KAKAO_REDIRECT_URI production --yes 2>/dev/null || true

# Add new production KAKAO_REDIRECT_URI
echo "➕ Adding new KAKAO_REDIRECT_URI..."
echo "${KAKAO_REDIRECT_URI}" | vercel env add KAKAO_REDIRECT_URI production

echo ""
echo "✅ KAKAO_REDIRECT_URI updated successfully!"
echo ""
echo "📝 Note: You also need to update this in your Kakao Developer Console:"
echo "   https://developers.kakao.com/console/app"
echo "   Go to: 앱 설정 > 플랫폼 > Redirect URI"
echo "   Add: ${KAKAO_REDIRECT_URI}"
echo ""
echo "🚀 To redeploy with new environment variables:"
echo "   vercel --prod"

