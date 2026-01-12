# Quick Start Guide

## ✅ Credentials Setup

- ✅ Clerk Publishable Key: Configured in `.env`
- ✅ Supabase Anon Key: Configured in `.env`
- ✅ Google Maps API Key: Configured in `.env`
- ⏳ Supabase Project URL: **Need to get from dashboard**

## Step 1: Get Supabase Project URL

1. Go to https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** (format: `https://xxxxx.supabase.co`)
5. Update `.env` file:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   ```

## Step 2: Set Up Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run** to execute
5. Verify tables were created in **Table Editor**

## Step 3: Update .env File

Edit `.env` and replace `YOUR_PROJECT_URL_HERE` with your actual Supabase URL.

## Step 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Step 5: Test the App

1. Open http://localhost:3000
2. Click "Get Started"
3. You should see Clerk's sign-up form
4. Create an account
5. You should be redirected to the app!

## Troubleshooting

- **"Supabase URL or Anon Key is missing"**: Check `.env` file exists and has correct values
- **Database errors**: Make sure you ran the SQL schema
- **Clerk errors**: Verify the publishable key is correct
- **CORS errors**: Check Supabase dashboard → Settings → API → CORS settings

