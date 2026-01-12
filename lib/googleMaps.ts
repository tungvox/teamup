// Google Maps configuration
export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const googleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '';

// Default location (latitude, longitude)
// Can be set via environment variables: VITE_GOOGLE_MAPS_DEFAULT_LAT and VITE_GOOGLE_MAPS_DEFAULT_LNG
// Or as a comma-separated string: VITE_GOOGLE_MAPS_DEFAULT_LOCATION="lat,lng"
const getDefaultLocation = () => {
  // Try comma-separated format first
  const locationString = import.meta.env.VITE_GOOGLE_MAPS_DEFAULT_LOCATION;
  if (locationString) {
    const [lat, lng] = locationString.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  
  // Try individual lat/lng
  const lat = parseFloat(import.meta.env.VITE_GOOGLE_MAPS_DEFAULT_LAT || '');
  const lng = parseFloat(import.meta.env.VITE_GOOGLE_MAPS_DEFAULT_LNG || '');
  if (!isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }
  
  // Default to San Francisco if nothing is configured
  return { lat: 37.7749, lng: -122.4194 };
};

export const googleMapsDefaultLocation = getDefaultLocation();

if (!googleMapsApiKey) {
  console.warn('Google Maps API Key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file');
}

