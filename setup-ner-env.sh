#!/bin/bash
# Helper script to set up NER environment variables

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          NER Environment Setup                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Creating it..."
    touch .env.local
fi

# Check for HuggingFace API key
if grep -q "^HUGGINGFACE_API_KEY=" .env.local 2>/dev/null; then
    echo "✅ HUGGINGFACE_API_KEY already exists in .env.local"
else
    echo ""
    echo "📝 To add HuggingFace API key:"
    echo "   1. Visit: https://huggingface.co/settings/tokens"
    echo "   2. Create a new token (Read permission)"
    echo "   3. Run: echo 'HUGGINGFACE_API_KEY=hf_your_token_here' >> .env.local"
fi

# Check for Cloudflare Worker URL
if grep -q "^NER_CLOUDFLARE_WORKER_URL=" .env.local 2>/dev/null; then
    echo "✅ NER_CLOUDFLARE_WORKER_URL already exists in .env.local"
else
    echo ""
    echo "📝 Cloudflare Worker URL is optional (commented out by default)"
    echo "   If you have a Cloudflare Worker, uncomment and set:"
    echo "   NER_CLOUDFLARE_WORKER_URL=https://your-worker.workers.dev"
fi

echo ""
echo "Current NER configuration:"
grep -E "^#?.*NER_|^#?.*HUGGINGFACE" .env.local 2>/dev/null || echo "   (No NER config found)"
echo ""

