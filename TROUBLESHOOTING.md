# Troubleshooting Clerk SignUp Component Not Rendering

## Issue
The CreateProfile page shows the heading but Clerk's SignUp component doesn't render.

## Possible Causes & Solutions

### 1. Dev Server Not Restarted
**Solution**: Restart your dev server to load the `.env` file:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 2. Check Browser Console
Open browser DevTools (F12) and check for errors:
- Look for Clerk-related errors
- Check if `VITE_CLERK_PUBLISHABLE_KEY` is loaded
- Look for any JavaScript errors

### 3. Verify Clerk Key
Check if the Clerk key is being loaded:
1. Open browser console
2. Type: `console.log(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)`
3. Should show your key, not `undefined`

### 4. Clerk Dashboard Settings
Verify in Clerk dashboard:
1. Go to https://dashboard.clerk.com
2. Check your application settings
3. Ensure "Email" authentication is enabled
4. Check allowed redirect URLs include:
   - `http://localhost:3000`
   - `http://localhost:3000/#/*`

### 5. Network Issues
Check if Clerk's scripts are loading:
1. Open Network tab in DevTools
2. Look for requests to `clerk.com` or `clerk.dev`
3. Check if any are failing (red status)

### 6. Try Direct URL
Navigate directly to:
```
http://localhost:3000/#/create-profile
```

### 7. Clear Browser Cache
Sometimes cached files cause issues:
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear browser cache

### 8. Check Component Mounting
The component now logs to console when it mounts. Check browser console for:
- "CreateProfile component mounted"
- "Clerk key: Set" or "Clerk key: Missing"

## Quick Test
Try this in browser console:
```javascript
// Check if Clerk is loaded
console.log(window.Clerk);

// Check environment variable
console.log(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
```

If `window.Clerk` is undefined, Clerk's scripts aren't loading properly.

