#!/bin/bash

# Script to update Vercel environment variables and redeploy
# Usage: ./update-vercel-env.sh [environment] [key=value] [key=value] ...
# Example: ./update-vercel-env.sh production OPENAI_API_KEY=sk-xxx FIREBASE_API_KEY=xxx

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Install it with: npm i -g vercel"
    exit 1
fi

# Check if logged in
echo -e "${BLUE}Checking Vercel login status...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in. Please login first:${NC}"
    echo "vercel login"
    exit 1
fi

# Get environment (default to production)
ENV=${1:-production}
shift

if [ "$ENV" != "production" ] && [ "$ENV" != "preview" ] && [ "$ENV" != "development" ]; then
    echo "❌ Invalid environment. Use: production, preview, or development"
    exit 1
fi

if [ $# -eq 0 ]; then
    echo "Usage: $0 [environment] [key=value] [key=value] ..."
    echo "Example: $0 production OPENAI_API_KEY=sk-xxx NEXT_PUBLIC_FIREBASE_API_KEY=xxx"
    echo ""
    echo "To update from .env.local file:"
    echo "  $0 production \$(cat .env.local | grep -v '^#' | xargs)"
    exit 1
fi

echo -e "${BLUE}Updating environment variables for: ${ENV}${NC}"

# Update each environment variable
for arg in "$@"; do
    if [[ $arg == *"="* ]]; then
        KEY="${arg%%=*}"
        VALUE="${arg#*=}"
        
        echo -e "${YELLOW}Setting ${KEY}...${NC}"
        vercel env add "${KEY}" "${ENV}" <<< "${VALUE}" || {
            echo -e "${YELLOW}Variable ${KEY} might already exist. Updating...${NC}"
            vercel env rm "${KEY}" "${ENV}" --yes
            vercel env add "${KEY}" "${ENV}" <<< "${VALUE}"
        }
    else
        echo "⚠️  Skipping invalid format: $arg (should be KEY=VALUE)"
    fi
done

echo -e "${GREEN}✅ Environment variables updated!${NC}"
echo ""
echo -e "${BLUE}To redeploy, run one of:${NC}"
echo "  vercel --prod                    # Deploy to production"
echo "  vercel                           # Create preview deployment"
echo ""
echo -e "${BLUE}Or trigger a redeploy via Git:${NC}"
echo "  git commit --allow-empty -m 'Trigger redeploy'"
echo "  git push"

