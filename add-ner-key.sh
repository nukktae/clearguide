#!/bin/bash
# Interactive script to add NER API keys

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Add NER API Keys                                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    exit 1
fi

# HuggingFace API Key
echo "📝 HuggingFace API Key Setup"
echo "─────────────────────────────"
read -p "Enter your HuggingFace API key (or press Enter to skip): " hf_key

if [ ! -z "$hf_key" ]; then
    # Remove existing HUGGINGFACE_API_KEY if present
    sed -i.bak '/^HUGGINGFACE_API_KEY=/d' .env.local
    sed -i.bak '/^#.*HUGGINGFACE_API_KEY=/d' .env.local
    
    # Add new key
    echo "HUGGINGFACE_API_KEY=$hf_key" >> .env.local
    echo "✅ HuggingFace API key added!"
else
    echo "⏭️  Skipped HuggingFace API key"
fi

echo ""

# Cloudflare Worker URL
echo "📝 Cloudflare Worker URL (Optional)"
echo "────────────────────────────────────"
read -p "Enter your Cloudflare Worker URL (or press Enter to skip): " cf_url

if [ ! -z "$cf_url" ]; then
    # Remove existing NER_CLOUDFLARE_WORKER_URL if present
    sed -i.bak '/^NER_CLOUDFLARE_WORKER_URL=/d' .env.local
    sed -i.bak '/^#.*NER_CLOUDFLARE_WORKER_URL=/d' .env.local
    
    # Add new URL
    echo "NER_CLOUDFLARE_WORKER_URL=$cf_url" >> .env.local
    echo "✅ Cloudflare Worker URL added!"
else
    echo "⏭️  Skipped Cloudflare Worker URL"
fi

echo ""
echo "✅ Setup complete! Current NER configuration:"
grep -E "^.*NER_|^.*HUGGINGFACE" .env.local 2>/dev/null || echo "   (No active NER config)"

