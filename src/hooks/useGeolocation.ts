import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface GeolocationState {
  coords: { lat: number; lng: number } | null;
  timestamp: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

const CACHE_KEY = 'safeher_last_location';
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const useGeolocation = (options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) => {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    timestamp: null,
    accuracy: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    // Check cache first for sub-second response
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        setState((s) => ({ ...s, coords: parsed.coords, timestamp: parsed.timestamp, isLoading: false }));
      }
    }

    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser', isLoading: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) return;
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const data = {
          coords,
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy,
        };
        
        // Cache for fast subsequent loads
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        
        setState({
          ...data,
          error: null,
          isLoading: false,
        });
      },
      (error) => {
        if (!isMounted) return;
        console.warn('Geolocation Error:', error);
        let errorMessage = 'Failed to get location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable it in your settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Trying fallback...';
            break;
        }
        
        // Fallback to static safe zone (e.g., Delhi center for demo mode, or IP-based in real world)
        const fallbackCoords = { lat: 28.6139, lng: 77.209 }; 
        toast.warning(errorMessage + " Using best-guess location.", { id: "geo-warn" });
        
        setState((s) => ({
          ...s,
          coords: fallbackCoords,
          error: errorMessage,
          isLoading: false,
        }));
      },
      options
    );

    return () => {
      isMounted = false;
    };
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge]);

  return state;
};
