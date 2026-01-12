// Clerk configuration
// ClerkProvider will be set up in App.tsx
export const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

if (!clerkPubKey) {
  console.warn('Clerk Publishable Key is missing. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file');
}

