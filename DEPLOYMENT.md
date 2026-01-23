# Deployment Guide

## Quick Setup Checklist

### 1. Supabase Setup
- [ ] Create Supabase project at https://supabase.com
- [ ] Run SQL schema from `supabase/schema.sql` in SQL Editor
- [ ] Copy Project URL and anon key to `.env` file

### 2. Clerk Setup
- [ ] Create Clerk application at https://clerk.com
- [ ] Enable Email/Password authentication
- [ ] Copy Publishable Key to `.env` file
- [ ] Add redirect URLs:
  - Development: `http://localhost:3000`
  - Production: `https://your-app.vercel.app`

### 3. Environment Variables

Create `.env` file in root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 4. Vercel Deployment

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import your repository in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "Add New Project"
   - Import your repository
   - Vercel will auto-detect Vite framework

3. **Configure environment variables**
   - In the project settings, go to **Settings** → **Environment Variables**
   - Add the following variables (for Production, Preview, and Development):
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
     VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key (optional)
     VITE_GOOGLE_MAPS_MAP_ID=your_map_id (optional)
     VITE_GOOGLE_MAPS_DEFAULT_LOCATION=lat,lng (optional)
     GEMINI_API_KEY=your_gemini_api_key (if using Gemini features)
     ```

4. **Deploy!**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

5. **Update Clerk redirect URLs**
   - Go to your Clerk dashboard
   - Add your Vercel URL to allowed redirect URLs:
     - Production: `https://your-project.vercel.app`
     - Preview: `https://your-project-*.vercel.app` (for preview deployments)

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Set environment variables when prompted, or add them later in the dashboard

4. **For production deployment**
   ```bash
   vercel --prod
   ```

## Important Notes

- Clerk handles all authentication - no custom login/signup needed
- Supabase stores all data (events, messages, profiles)
- Row Level Security (RLS) is enabled for data protection
- Update Clerk redirect URLs after first deployment

