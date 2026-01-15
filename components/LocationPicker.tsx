import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GoogleMap, Autocomplete, Marker } from '@react-google-maps/api';
import { googleMapsMapId, googleMapsDefaultLocation } from '../lib/googleMaps';
import { useGoogleMaps } from '../lib/useGoogleMaps';
import { useLanguage } from '../context/LanguageContext';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

interface LocationPickerProps {
  location: string;
  onLocationChange: (address: string, lat?: number, lng?: number) => void;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onLocationChange,
  className = '',
}) => {
  const { t } = useLanguage();
  const { isLoaded: isScriptLoaded, error: mapError, apiKey: googleMapsApiKey } = useGoogleMaps();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState(googleMapsDefaultLocation);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Get user's current location on mount (optional - can be disabled)
  useEffect(() => {
    // Check if auto-location is disabled via environment variable
    const useAutoLocation = import.meta.env.VITE_GOOGLE_MAPS_USE_AUTO_LOCATION !== 'false';
    
    if (useAutoLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter({ lat: latitude, lng: longitude });
          setIsLoadingLocation(false);
        },
        () => {
          // If geolocation fails, use configured default center
          setMapCenter(googleMapsDefaultLocation);
          setIsLoadingLocation(false);
        }
      );
    } else {
      // Use configured default center
      setMapCenter(googleMapsDefaultLocation);
      setIsLoadingLocation(false);
    }
  }, []);


  const onLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Combine place name and address for better display
        let displayText = '';
        if (place.name && place.formatted_address) {
          // If we have both name and address, show "Name, Address"
          displayText = `${place.name}, ${place.formatted_address}`;
        } else if (place.name) {
          // If only name is available
          displayText = place.name;
        } else if (place.formatted_address) {
          // If only address is available
          displayText = place.formatted_address;
        } else {
          // Fallback to location string
          displayText = location;
        }
        
        setSelectedLocation({ lat, lng });
        setMapCenter({ lat, lng });
        onLocationChange(displayText, lat, lng);
      }
    }
  }, [location, onLocationChange]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedLocation({ lat, lng });
      setMapCenter({ lat, lng });
      
      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          onLocationChange(results[0].formatted_address, lat, lng);
        } else {
          onLocationChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
        }
      });
    }
  }, [onLocationChange]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fallback map placeholder
  const fallbackMap = (
    <div className="rounded-lg overflow-hidden border border-white/10 h-32 bg-slate-800 flex items-center justify-center lg:h-24 lg:rounded">
      <div className="text-center text-slate-400">
        <span className="material-symbols-outlined text-3xl mb-1 block lg:text-2xl">map</span>
        <p className="text-xs lg:text-[10px]">{t('events.mapUnavailable')}</p>
        <p className="text-xs mt-1 lg:text-[10px] lg:mt-0.5">{t('events.enterLocationAbove')}</p>
      </div>
    </div>
  );

  // Error message component
  const errorMessage = mapError && (
    <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 mb-3">
      <p className="text-yellow-400 text-sm flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">warning</span>
        {mapError}
      </p>
      <p className="text-yellow-500/70 text-xs mt-2">
        You can still enter a location manually. To enable the map, ensure in Google Cloud Console:
      </p>
      <ul className="text-yellow-500/70 text-xs mt-1 list-disc list-inside space-y-1">
        <li>Maps JavaScript API is enabled</li>
        <li>Places API is enabled</li>
        <li>Geocoding API is enabled</li>
        <li>Billing is enabled on your Google Cloud project</li>
        <li>API key has no restrictions or includes your domain</li>
      </ul>
    </div>
  );

  // Don't render if API key is missing
  if (!googleMapsApiKey) {
    return (
      <div className={className}>
        <input
          type="text"
          placeholder={t('events.locationPlaceholder')}
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="w-full bg-surface rounded-xl px-4 h-12 outline-none border border-white/10 focus:border-primary transition-colors text-white placeholder:text-slate-400 mb-3"
        />
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 mb-3">
          <p className="text-yellow-400 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Google Maps API key is not configured
          </p>
          <p className="text-yellow-500/70 text-xs mt-2">
            Please set VITE_GOOGLE_MAPS_API_KEY in your .env file
          </p>
        </div>
        {fallbackMap}
      </div>
    );
  }

  return (
    <div className={className}>
          {isScriptLoaded && !mapError ? (
            <>
              {/* Autocomplete wraps the input element */}
              <Autocomplete
                onLoad={onLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                  types: ['establishment', 'geocode'],
                }}
              >
                <input
                  type="text"
                  placeholder={t('events.locationPlaceholder')}
                  value={location}
                  onChange={(e) => {
                    const value = e.target.value;
                    onLocationChange(value);
                    // Clear marker if input is cleared
                    if (!value) {
                      setSelectedLocation(null);
                    }
                  }}
                  className="w-full bg-surface rounded-xl px-3 h-10 outline-none border border-white/10 focus:border-primary transition-colors text-white placeholder:text-slate-400 mb-2 text-sm"
                />
              </Autocomplete>
              
              <div className="rounded-lg overflow-hidden border border-white/10 lg:rounded h-[140px] lg:h-[100px]">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter}
                  zoom={selectedLocation ? 15 : 10}
                  onClick={onMapClick}
                  onLoad={onMapLoad}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    // Use custom map style (mapId) if provided, otherwise use inline styles
                    ...(googleMapsMapId ? { mapId: googleMapsMapId } : {
                      styles: [
                        {
                          featureType: 'all',
                          elementType: 'geometry',
                          stylers: [{ color: '#1C232B' }],
                        },
                        {
                          featureType: 'all',
                          elementType: 'labels.text.fill',
                          stylers: [{ color: '#93a2b7' }],
                        },
                        {
                          featureType: 'water',
                          elementType: 'geometry',
                          stylers: [{ color: '#0d7cf2' }],
                        },
                        {
                          featureType: 'road',
                          elementType: 'geometry',
                          stylers: [{ color: '#2d3748' }],
                        },
                      ],
                    }),
                  }}
                >
                  {selectedLocation && (
                    <Marker
                      position={selectedLocation}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#0d7cf2',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                      }}
                    />
                  )}
                </GoogleMap>
              </div>
            </>
          ) : (
            <>
              {/* Show input even if script hasn't loaded yet */}
              <input
                type="text"
                placeholder={t('events.locationPlaceholder')}
                value={location}
                onChange={(e) => {
                  const value = e.target.value;
                  onLocationChange(value);
                  if (!value) {
                    setSelectedLocation(null);
                  }
                }}
                className="w-full bg-surface rounded-xl px-4 h-12 outline-none border border-white/10 focus:border-primary transition-colors text-white placeholder:text-slate-400 mb-3"
              />
              {errorMessage}
          {fallbackMap}
        </>
      )}
    </div>
  );
};
