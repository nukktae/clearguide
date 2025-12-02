#!/bin/bash

# Bulk update Vercel environment variables from .env.local file
# Usage: ./bulk-update-vercel-env.sh [environment]
# Example: ./bulk-update-vercel-env.sh production

set -e

ENV=${1:-production}
ENV_FILE=${2:-.env.local}

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ File $ENV_FILE not found!"
    exit 1
fi

if [ "$ENV" != "production" ] && [ "$ENV" != "preview" ] && [ "$ENV" != "development" ]; then
    echo "❌ Invalid environment. Use: production, preview, or development"
    exit 1
fi

echo "📝 Reading environment variables from $ENV_FILE"
echo "🌍 Target environment: $ENV"
echo ""

# Read .env.local and update each variable
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ $key =~ ^[[:space:]]*# ]] && continue
    [[ -z "${key// }" ]] && continue
    
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Remove quotes if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    if [ -z "$key" ] || [ -z "$value" ]; then
        continue
    fi
    
    echo "🔄 Updating $key..."
    
    # Try to add, if it exists, remove and re-add
    echo "$value" | vercel env add "$key" "$ENV" 2>/dev/null || {
        echo "   ⚠️  Variable exists, updating..."
        vercel env rm "$key" "$ENV" --yes 2>/dev/null || true
        echo "$value" | vercel env add "$key" "$ENV"
    }
    
    echo "   ✅ $key updated"
done < "$ENV_FILE"

echo ""
echo "✅ All environment variables updated!"
echo ""
echo "🚀 To redeploy, run:"
echo "   vercel --prod"

