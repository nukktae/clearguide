# Vercel Deployment Guide 🚀

This guide will help you deploy ClearGuide to Vercel for free.

## Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)
3. **OpenAI API Key** - Get from [platform.openai.com](https://platform.openai.com)
4. **Firebase Project** - Set up Firebase (if using authentication/storage)

## Step 1: Push Code to GitHub

First, commit and push your changes:

```bash
# Add all changes
git add .

# Commit changes
git commit -m "Prepare for Vercel deployment"

# Push to GitHub
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in (or sign up with GitHub)

2. **Click "Add New Project"**

3. **Import your GitHub repository**
   - Select your `clearguide` repository
   - Click "Import"

4. **Configure Project Settings**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

5. **Add Environment Variables**
   
   Click "Environment Variables" and add:

   **Required:**
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   **If using Firebase (Authentication/Storage):**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX (optional)
   ```

6. **Click "Deploy"**
   - Vercel will build and deploy your project
   - This usually takes 2-5 minutes

7. **Get Your Live URL**
   - Once deployed, you'll get a URL like: `clearguide.vercel.app`
   - You can also add a custom domain later

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No (first time)
# - Project name? clearguide
# - Directory? ./
# - Override settings? No

# For production deployment
vercel --prod
```

## Step 3: Configure Environment Variables in Vercel

After deployment, you need to add environment variables:

1. Go to your project dashboard on Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key
   - **Environment:** Production, Preview, Development (select all)
4. Click **Save**
5. **Redeploy** your project for changes to take effect

## Step 4: Verify Deployment

1. Visit your Vercel URL (e.g., `clearguide.vercel.app`)
2. Test the application:
   - Upload a document
   - Check if AI analysis works
   - Verify authentication (if enabled)

## Important Notes

### File Storage
- **Current Setup:** Files are stored locally in `/data/` directory
- **Vercel Limitation:** Vercel is serverless and doesn't persist files
- **Solution:** Use Firebase Storage for production (see `FIREBASE_COMPLETE_SETUP.md`)

### Build Settings
- Vercel auto-detects Next.js projects
- Build command: `npm run build`
- Node.js version: Auto-detected (should be 18+)

### Free Tier Limits
- **Bandwidth:** 100GB/month
- **Build Time:** 45 minutes/month
- **Function Execution:** 100GB-hours/month
- **Serverless Functions:** 100 hours/month

### Custom Domain (Optional)
1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` scripts are correct

### Environment Variables Not Working
- Make sure variables are added in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### API Routes Not Working
- Verify `OPENAI_API_KEY` is set
- Check API route logs in Vercel dashboard
- Ensure Firebase config is correct (if using)

### File Upload Issues
- Local file storage won't work on Vercel
- Migrate to Firebase Storage (see `FIREBASE_COMPLETE_SETUP.md`)

## Next Steps

1. ✅ Deploy to Vercel
2. ⚠️ Set up Firebase Storage for file uploads
3. ⚠️ Configure custom domain (optional)
4. ⚠️ Set up monitoring/analytics
5. ⚠️ Configure CI/CD for automatic deployments

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Vercel Support: https://vercel.com/support

