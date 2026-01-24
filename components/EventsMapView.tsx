import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { googleMapsMapId, googleMapsDefaultLocation } from '../lib/googleMaps';
import { useGoogleMaps } from '../lib/useGoogleMaps';
import { Event } from '../types';
import { Avatar } from './Layout';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const mapContainerStyleDesktop = {
  width: '100%',
  height: '400px',
};

interface EventsMapViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  className?: string;
  centerLocation?: { lat: number; lng: number } | null;
}

interface EventWithCoords extends Event {
  coordinates?: { lat: number; lng: number };
}

export const EventsMapView: React.FC<EventsMapViewProps> = ({
  events,
  onEventClick,
  className = '',
  centerLocation,
}) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isLoaded: isScriptLoaded, error: mapError, apiKey: googleMapsApiKey } = useGoogleMaps();
  const [mapCenter, setMapCenter] = useState(googleMapsDefaultLocation);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [eventsWithCoords, setEventsWithCoords] = useState<EventWithCoords[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Initialize geocoder when script is loaded
  useEffect(() => {
    if (isScriptLoaded && !geocoderRef.current && typeof window !== 'undefined' && (window as any).google?.maps) {
      try {
        geocoderRef.current = new google.maps.Geocoder();
      } catch (error) {
        console.error('Error initializing geocoder:', error);
      }
    }
  }, [isScriptLoaded]);

  // Update map center when centerLocation prop changes
  useEffect(() => {
    if (centerLocation) {
      setMapCenter(centerLocation);
      setMapZoom(12);
      // Pan map to new location if map is already loaded
      if (mapRef.current) {
        mapRef.current.panTo(centerLocation);
        mapRef.current.setZoom(12);
      }
    }
  }, [centerLocation]);

  // Get user's current location on mount (only if no centerLocation is provided)
  useEffect(() => {
    if (centerLocation) return; // Skip if centerLocation is provided
    
    const useAutoLocation = import.meta.env.VITE_GOOGLE_MAPS_USE_AUTO_LOCATION !== 'false';
    
    if (useAutoLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter({ lat: latitude, lng: longitude });
        },
        () => {
          setMapCenter(googleMapsDefaultLocation);
        }
      );
    } else {
      setMapCenter(googleMapsDefaultLocation);
    }
  }, [centerLocation]);

  // Geocode event locations
  useEffect(() => {
    if (!isScriptLoaded || !geocoderRef.current || events.length === 0) {
      if (!isScriptLoaded) {
        setEventsWithCoords([]);
      }
      return;
    }

    const geocodeEvents = async () => {
      setIsGeocoding(true);
      const geocodedEvents: EventWithCoords[] = [];

      // Process events in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map((event) => {
            return new Promise<void>((resolve) => {
              if (!geocoderRef.current) {
                resolve();
                return;
              }

              geocoderRef.current.geocode(
                { address: event.location },
                (results, status) => {
                  if (status === 'OK' && results && results[0]?.geometry?.location) {
                    const location = results[0].geometry.location;
                    geocodedEvents.push({
                      ...event,
                      coordinates: {
                        lat: location.lat(),
                        lng: location.lng(),
                      },
                    });
                  }
                  resolve();
                }
              );
            });
          })
        );

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < events.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setEventsWithCoords(geocodedEvents);
      setIsGeocoding(false);
    };

    geocodeEvents();
  }, [events, isScriptLoaded]);

  // Filter events based on map bounds
  const visibleEvents = useMemo(() => {
    if (!mapBounds) return eventsWithCoords;
    
    return eventsWithCoords.filter((event) => {
      if (!event.coordinates) return false;
      return mapBounds.contains(
        new google.maps.LatLng(event.coordinates.lat, event.coordinates.lng)
      );
    });
  }, [eventsWithCoords, mapBounds]);

  // Group visible events by approximate coordinates so we can show one marker per location
  const markerGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        lat: number;
        lng: number;
        hasPast: boolean;
        hasHappening: boolean;
        hasUpcoming: boolean;
        representativeEvent: EventWithCoords;
      }
    >();

    const now = new Date();

    visibleEvents.forEach((event) => {
      if (!event.coordinates) return;
      const { lat, lng } = event.coordinates;
      const key = `${lat.toFixed(5)}:${lng.toFixed(5)}`;

      const eventDateTime = new Date(`${event.date}T${event.time}`);
      const endDateTime = event.endTime
        ? new Date(`${event.date}T${event.endTime}`)
        : null;

      const isHappening = endDateTime
        ? eventDateTime <= now && endDateTime >= now
        : eventDateTime <= now &&
          eventDateTime >= new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const isPast = !isHappening && eventDateTime < now;
      const isUpcoming = !isHappening && !isPast;

      const existing = groups.get(key);
      if (existing) {
        existing.hasPast = existing.hasPast || isPast;
        existing.hasHappening = existing.hasHappening || isHappening;
        existing.hasUpcoming = existing.hasUpcoming || isUpcoming;
      } else {
        groups.set(key, {
          key,
          lat,
          lng,
          hasPast: isPast,
          hasHappening: isHappening,
          hasUpcoming: isUpcoming,
          representativeEvent: event,
        });
      }
    });

    return Array.from(groups.values());
  }, [visibleEvents]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Get initial bounds
    const bounds = map.getBounds();
    if (bounds) {
      setMapBounds(bounds);
    }
    // Ensure geocoder is initialized
    if (!geocoderRef.current && typeof window !== 'undefined' && (window as any).google?.maps) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, []);

  const onBoundsChanged = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        setMapBounds(bounds);
      }
    }
  }, []);

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      setMapZoom(mapRef.current.getZoom() || 12);
    }
  }, []);

  const handleMarkerClick = useCallback((event: Event) => {
    setSelectedEvent(event);
  }, []);

  const handleEventClick = useCallback((event: Event) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      navigate(`/event/${event.id}`);
    }
    setSelectedEvent(null);
  }, [onEventClick, navigate]);

  const formatEventTime = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const formatTime = (timeStr: string) => {
      // Reuse 24h or 12h based on locale; here keep simple HH:MM
      return timeStr;
    };

    if (days === 0) return `${t("date.today")}, ${formatTime(time)}`;
    if (days === 1) return `${t("date.tomorrow")}, ${formatTime(time)}`;

    // Basic localized date string
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    const dateLabel = new Date(date).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
    return `${dateLabel}, ${formatTime(time)}`;
  };

  const getSportIcon = (sport: string) => {
    const iconMap: Record<string, string> = {
      'Tennis': 'sports_tennis',
      'Pickleball': 'sports_tennis',
      'Badminton': 'sports_tennis',
      'Basketball': 'sports_basketball',
      'Soccer': 'sports_soccer',
      'Volleyball': 'sports_volleyball',
    };
    return iconMap[sport] || 'sports';
  };

  if (!googleMapsApiKey || googleMapsApiKey.trim() === '') {
    return (
      <div className={`${className} rounded-lg border border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center h-[500px] lg:h-[400px]`}>
        <div className="text-center text-yellow-400 p-6 max-w-md lg:p-4">
          <span className="material-symbols-outlined text-4xl mb-2 block lg:text-3xl lg:mb-1.5">warning</span>
          <p className="text-sm font-medium mb-2 lg:text-xs lg:mb-1.5">Google Maps API key is not configured</p>
          <p className="text-xs text-yellow-500/70 mt-2 lg:text-[11px] lg:mt-1.5">
            Please set <code className="bg-yellow-500/20 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in your <code className="bg-yellow-500/20 px-1 rounded">.env</code> file
          </p>
          <p className="text-xs text-yellow-500/60 mt-4">
            After adding the key, restart your dev server
          </p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (mapError) {
    return (
      <div className={`${className} rounded-lg border border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center h-[500px] lg:h-[400px]`}>
        <div className="text-center text-yellow-400 p-6 max-w-md lg:p-4">
          <span className="material-symbols-outlined text-4xl mb-2 block lg:text-3xl lg:mb-1.5">warning</span>
          <p className="text-sm font-medium mb-2 lg:text-xs lg:mb-1.5">{mapError}</p>
          <p className="text-xs text-yellow-500/70 mt-2 lg:text-[11px] lg:mt-1.5">
            Please check:
          </p>
          <ul className="text-xs text-yellow-500/70 mt-2 list-disc list-inside space-y-1 text-left">
            <li>API key is set in .env file: VITE_GOOGLE_MAPS_API_KEY</li>
            <li>Maps JavaScript API is enabled in Google Cloud Console</li>
            <li>Geocoding API is enabled</li>
            <li>Billing is enabled on your Google Cloud project</li>
            <li>API key restrictions allow your domain (or no restrictions)</li>
          </ul>
          <p className="text-xs text-yellow-500/60 mt-4">
            Check browser console (F12) for detailed error messages
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while script loads
  if (!isScriptLoaded && !mapError) {
    return (
      <div className={`${className} rounded-lg border border-white/10 bg-slate-800 flex items-center justify-center h-[500px] lg:h-[400px]`}>
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 block animate-pulse lg:text-3xl lg:mb-1.5">map</span>
          <p className="text-sm lg:text-xs">Loading map...</p>
          <p className="text-xs mt-2 text-slate-500 lg:text-[11px] lg:mt-1.5">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  // Don't render map if script isn't loaded
  if (!isScriptLoaded) {
    return null;
  }

  return (
      <div className={`${className} relative`}>
          {isGeocoding && (
            <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                <span>Loading event locations...</span>
              </div>
            </div>
          )}
          
          <div className="rounded-lg overflow-hidden border border-white/10 h-[500px] lg:h-[400px]">
            <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={mapZoom}
            onLoad={onMapLoad}
            onBoundsChanged={onBoundsChanged}
            onZoomChanged={onZoomChanged}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              gestureHandling: 'greedy',
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
            {markerGroups.map((group) => {
              const { key, lat, lng, hasPast, hasHappening, hasUpcoming, representativeEvent } = group;

              // Determine colors present at this location
              const colors: string[] = [];
              if (hasPast) colors.push('#6b7280');     // grey
              if (hasHappening) colors.push('#22c55e'); // green
              if (hasUpcoming) colors.push('#3b82f6');  // blue

              const uniqueColors = Array.from(new Set(colors));

              let svgFill = uniqueColors[0] ?? '#3b82f6';
              let gradientDef = '';

              // If more than one status at this point, use a simple linear gradient
              if (uniqueColors.length > 1) {
                const stopCount = uniqueColors.length;
                const stops: string[] = [];
                uniqueColors.forEach((color, index) => {
                  const start = (index / stopCount) * 100;
                  const end = ((index + 1) / stopCount) * 100;
                  stops.push(
                    `<stop offset="${start}%" stop-color="${color}" />`,
                    `<stop offset="${end}%" stop-color="${color}" />`
                  );
                });

                gradientDef = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops.join(
                  ''
                )}</linearGradient></defs>`;
                svgFill = 'url(#g)';
              }

              const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
${gradientDef}
<circle cx="12" cy="12" r="7" fill="${svgFill}" stroke="#ffffff" stroke-width="3" />
</svg>`;

              const icon = {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
                scaledSize: new google.maps.Size(24, 24),
              };
              
              return (
                <Marker
                  key={key}
                  position={{ lat, lng }}
                  onClick={() => handleMarkerClick(representativeEvent)}
                  icon={icon}
                />
              );
            })}

            {selectedEvent && (() => {
              const eventCoords = eventsWithCoords.find((e) => e.id === selectedEvent.id)?.coordinates;
              if (!eventCoords) return null;

              // Find all events at (approximately) the same coordinates
              const epsilon = 1e-5;
              const eventsAtLocation = eventsWithCoords.filter((e) => {
                if (!e.coordinates) return false;
                return (
                  Math.abs(e.coordinates.lat - eventCoords.lat) < epsilon &&
                  Math.abs(e.coordinates.lng - eventCoords.lng) < epsilon
                );
              });

              return (
                <InfoWindow
                  position={eventCoords}
                  onCloseClick={() => setSelectedEvent(null)}
                  options={{
                    pixelOffset: new google.maps.Size(0, -10),
                  }}
                >
                  <div style={{ 
                    backgroundColor: '#1C232B', 
                    color: 'white', 
                    padding: '12px', 
                    minWidth: '250px', 
                    maxWidth: '300px',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {eventsAtLocation.length > 1 && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#f97316', 
                        marginBottom: '6px',
                        fontWeight: 600 
                      }}>
                        {eventsAtLocation.length} {t("events.atLocation") || "events at this location"}
                      </div>
                    )}

                    {eventsAtLocation.map((event) => {
                      const now = new Date();
                      const eventDateTime = new Date(`${event.date}T${event.time}`);
                      const endDateTime = event.endTime
                        ? new Date(`${event.date}T${event.endTime}`)
                        : null;
                      const isHappening = endDateTime
                        ? eventDateTime <= now && endDateTime >= now
                        : eventDateTime <= now &&
                          eventDateTime >= new Date(now.getTime() - 2 * 60 * 60 * 1000);

                      return (
                        <div
                          key={event.id}
                          style={{ 
                            marginBottom: '8px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            lastChild: { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }
                          }}
                        >
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '12px', 
                          marginBottom: '4px',
                          backgroundColor: isHappening ? 'rgba(22, 163, 74, 0.28)' : 'transparent',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          border: isHappening ? '1px solid rgba(74, 222, 128, 0.9)' : '1px solid transparent',
                          boxShadow: isHappening
                            ? '0 0 12px rgba(34, 197, 94, 0.6)'
                            : 'none'
                        }}>
                          <div style={{
                            display: 'flex',
                            height: '40px',
                            width: '40px',
                            flexShrink: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(13, 124, 242, 0.2)',
                            color: '#0d7cf2',
                            border: '1px solid rgba(13, 124, 242, 0.3)'
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                              {getSportIcon(event.sport)}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ 
                              fontWeight: 'bold', 
                              fontSize: '14px', 
                              marginBottom: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {event.title}
                            </h3>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '12px', 
                              color: '#94a3b8',
                              marginBottom: '2px'
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                              <span>{formatEventTime(event.date, event.time)}</span>
                            </div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#9ca3af'
                            }}>
                              {event.currentPlayers}/{event.maxPlayers} {t("events.players")}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEventClick(event)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '8px',
                              backgroundColor: '#0d7cf2',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(13, 124, 242, 0.8)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0d7cf2'}
                          >
                            {t("events.viewDetails")}
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </InfoWindow>
              );
            })()}
          </GoogleMap>
          </div>

          {visibleEvents.length > 0 && (
            <div className="mt-3 text-xs text-slate-400 text-center">
              Showing {visibleEvents.length} event{visibleEvents.length !== 1 ? 's' : ''} in this area
            </div>
          )}
        </div>
  );
};
