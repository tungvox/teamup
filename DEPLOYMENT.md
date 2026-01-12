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

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Important Notes

- Clerk handles all authentication - no custom login/signup needed
- Supabase stores all data (events, messages, profiles)
- Row Level Security (RLS) is enabled for data protection
- Update Clerk redirect URLs after first deployment

