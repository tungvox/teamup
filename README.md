# TeamUp - Sports Social Platform

A modern social platform for amateur athletes to find local pickup games, manage teams, track stats, and connect.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- Clerk account
- Vercel account (for deployment)

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Get your project URL and anon key from Settings → API
4. Add them to your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Clerk

1. Create a new application at [clerk.com](https://clerk.com)
2. Get your Publishable Key from the dashboard
3. Add it to your `.env` file:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

4. Configure Clerk:
   - Enable Email/Password authentication
   - Set up redirect URLs:
     - Development: `http://localhost:3000`
     - Production: `https://your-domain.vercel.app`

### 5. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 6. Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CLERK_PUBLISHABLE_KEY`
4. Deploy!

### 3. Update Clerk Redirect URLs

After deployment, add your Vercel URL to Clerk's allowed redirect URLs.

## Database Schema

The app uses the following main tables:
- `user_profiles` - User information linked to Clerk IDs
- `events` - Sports events/games
- `chats` - Chat conversations
- `messages` - Individual messages
- `ratings` - Player ratings after events

See `supabase/schema.sql` for the complete schema.

## Features

- ✅ User authentication with Clerk
- ✅ Create and manage events
- ✅ Join/leave events
- ✅ Real-time messaging
- ✅ User profiles with stats
- ✅ Search and filter events
- ✅ Player ratings
- ✅ Notification settings

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT
