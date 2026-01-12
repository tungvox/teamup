# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Clerk Configuration  
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here

# Default Location (optional - defaults to San Francisco if not set)
# Option 1: Comma-separated format
VITE_GOOGLE_MAPS_DEFAULT_LOCATION=10.762622,106.660172
# Option 2: Individual lat/lng
# VITE_GOOGLE_MAPS_DEFAULT_LAT=10.762622
# VITE_GOOGLE_MAPS_DEFAULT_LNG=106.660172

# Auto-detect user location (optional - defaults to true)
# Set to 'false' to always use the default location
# VITE_GOOGLE_MAPS_USE_AUTO_LOCATION=false
```

## How to Get Your Supabase Project URL

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** (it looks like: `https://xxxxx.supabase.co`)
5. Replace `YOUR_PROJECT_ID` in the `.env` file above

## Important Notes

- **Never commit `.env` to git** - it's already in `.gitignore`
- **Never share your API keys publicly** - keep them secure in your `.env` file
- The **Clerk secret key** is for backend use only - we only need the publishable key for the frontend
- After updating `.env`, restart your dev server

## Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
4. Go to **APIs & Services** → **Credentials**
5. Create an API key or use an existing one
6. Add the key to your `.env` file as `VITE_GOOGLE_MAPS_API_KEY`
7. **Important**: Enable billing on your Google Cloud project (Google Maps requires billing to be enabled)

### Using Custom Map Styles

If you have created a custom map style in Google Cloud Console:

1. Go to **Maps** → **Map Styles** in Google Cloud Console
2. Find your custom style and copy its **Map ID** (it looks like: `abc123def456` or `mymapstyle`)
3. Add it to your `.env` file as `VITE_GOOGLE_MAPS_MAP_ID`
4. The map will automatically use your custom style instead of the default inline styles

### Setting Default Location

You can configure the default location that the map centers on when it first loads:

**Option 1: Comma-separated format (recommended)**
```env
VITE_GOOGLE_MAPS_DEFAULT_LOCATION=10.762622,106.660172
```

**Option 2: Individual latitude and longitude**
```env
VITE_GOOGLE_MAPS_DEFAULT_LAT=10.762622
VITE_GOOGLE_MAPS_DEFAULT_LNG=106.660172
```

**To get coordinates:**
- Use Google Maps: Right-click on a location → Click the coordinates to copy them
- Or use a tool like [latlong.net](https://www.latlong.net/)

**Disable auto-location detection:**
If you want to always use your default location instead of trying to detect the user's location:
```env
VITE_GOOGLE_MAPS_USE_AUTO_LOCATION=false
```

**Note:** If no default location is set, it will default to San Francisco (37.7749, -122.4194)

## Security Note

⚠️ **Never commit your `.env` file to git** - it's already in `.gitignore`. Keep your API keys private and never share them publicly.

