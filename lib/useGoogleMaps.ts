import { useState, useEffect } from 'react';

let scriptLoading = false;
let scriptLoaded = false;
let scriptError: string | null = null;
const scriptLoadCallbacks: Array<() => void> = [];
const scriptErrorCallbacks: Array<(error: string) => void> = [];

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(scriptLoaded);
  const [error, setError] = useState<string | null>(scriptError);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    // If already loaded, return immediately
    if (scriptLoaded) {
      setIsLoaded(true);
      return;
    }

    // If there's an error, return it
    if (scriptError) {
      setError(scriptError);
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script tag exists, check if it's loaded
      if ((window as any).google?.maps) {
        scriptLoaded = true;
        setIsLoaded(true);
        return;
      }
      // Script tag exists but not loaded yet, wait for it
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps) {
          scriptLoaded = true;
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // If script is already loading, just wait for it
    if (scriptLoading) {
      scriptLoadCallbacks.push(() => setIsLoaded(true));
      scriptErrorCallbacks.push((err) => setError(err));
      return;
    }

    // Start loading the script
    if (!googleMapsApiKey) {
      scriptError = 'Google Maps API key is not configured';
      setError(scriptError);
      return;
    }

    scriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      setIsLoaded(true);
      // Notify all waiting callbacks
      scriptLoadCallbacks.forEach(cb => cb());
      scriptLoadCallbacks.length = 0;
    };

    script.onerror = () => {
      scriptError = 'Failed to load Google Maps script';
      scriptLoading = false;
      setError(scriptError);
      // Notify all waiting callbacks
      scriptErrorCallbacks.forEach(cb => cb(scriptError!));
      scriptErrorCallbacks.length = 0;
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts
    };
  }, [googleMapsApiKey]);

  return { isLoaded, error, apiKey: googleMapsApiKey };
};
