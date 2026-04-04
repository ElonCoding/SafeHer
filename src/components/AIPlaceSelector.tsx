import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

export interface AIPlaceSelectorHandle {
  /** Programmatically set the display text without triggering onPlaceSelect */
  setDisplayValue: (value: string) => void;
  /** Clear the input field */
  clear: () => void;
}

interface AIPlaceSelectorProps {
  id: string;
  label: string;
  placeholder: string;
  biasCoords?: { lat: number; lng: number } | null;
  onPlaceSelect: (place: google.maps.places.PlaceResult | null, isCurrentLocation?: boolean) => void;
  defaultValue?: string;
  /** A controlled display value — when this changes externally, the input updates */
  displayValue?: string;
  showCurrentLocationAction?: boolean;
}

const AIPlaceSelector = forwardRef<AIPlaceSelectorHandle, AIPlaceSelectorProps>(({
  id,
  label,
  placeholder,
  biasCoords,
  onPlaceSelect,
  defaultValue = '',
  displayValue,
  showCurrentLocationAction = false,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasValue, setHasValue] = useState(!!defaultValue);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    setDisplayValue: (value: string) => {
      if (inputRef.current) {
        inputRef.current.value = value;
        setHasValue(!!value);
      }
    },
    clear: () => {
      if (inputRef.current) {
        inputRef.current.value = '';
        setHasValue(false);
      }
    },
  }));

  // Sync with controlled displayValue prop
  useEffect(() => {
    if (displayValue !== undefined && inputRef.current) {
      inputRef.current.value = displayValue;
      setHasValue(!!displayValue);
    }
  }, [displayValue]);

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) return false;
      
      if (!inputRef.current) return true;

      const options: google.maps.places.AutocompleteOptions = {
        fields: ['formatted_address', 'geometry', 'name', 'place_id'],
        strictBounds: false,
      };

      // Bias autocomplete results to the user's current or approximate location
      if (biasCoords?.lat && biasCoords?.lng) {
         const circle = new google.maps.Circle({
            center: biasCoords,
            radius: 50000, 
         });
         options.bounds = circle.getBounds() ?? undefined;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options);
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          onPlaceSelect(null);
          setHasValue(false);
          return;
        }
        // Update input display to the place name
        if (inputRef.current) {
          inputRef.current.value = place.name || place.formatted_address || '';
          setHasValue(true);
        }
        onPlaceSelect(place);
      });

      setIsLoaded(true);
      return true;
    };

    if (!initAutocomplete()) {
      // Poll waiting for google maps script to load globally
      checkInterval = setInterval(() => {
        if (initAutocomplete()) {
          clearInterval(checkInterval);
        }
      }, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (autocompleteRef.current) {
        window.google?.maps?.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [biasCoords]);

  const handleUseCurrentLocation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!biasCoords) return;
    
    if (inputRef.current) {
      inputRef.current.value = "📍 Current Location";
      setHasValue(true);
    }
    
    // Construct a mock PlaceResult for current location
    const mockPlace = {
      name: "Current Location",
      formatted_address: "Your current GPS position",
      geometry: {
        location: new window.google.maps.LatLng(biasCoords.lat, biasCoords.lng)
      }
    } as google.maps.places.PlaceResult;
    
    onPlaceSelect(mockPlace, true);
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
      setHasValue(false);
    }
    onPlaceSelect(null);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
        <input
          id={id}
          ref={inputRef}
          type="text"
          defaultValue={defaultValue}
          placeholder={isLoaded ? placeholder : "Loading AI Suggestions..."}
          disabled={!isLoaded}
          onChange={(e) => setHasValue(!!e.target.value)}
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-muted/50 border border-border/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
        />
        {hasValue ? (
          <button 
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        ) : !isLoaded ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        ) : null}
      </div>
      
      {showCurrentLocationAction && biasCoords && (
        <motion.button
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleUseCurrentLocation}
          className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-1"
        >
          <MapPin className="w-3 h-3" /> Use Current Location
        </motion.button>
      )}
    </div>
  );
});

AIPlaceSelector.displayName = 'AIPlaceSelector';

export default AIPlaceSelector;
