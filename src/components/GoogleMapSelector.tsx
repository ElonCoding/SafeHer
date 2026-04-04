import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GoogleMapSelectorProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  onRegionSelect?: (bounds: google.maps.LatLngBounds) => void;
}

const GoogleMapSelector: React.FC<GoogleMapSelectorProps> = ({ onPlaceSelect, onRegionSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        // Dynamic script loading for the new functional API
        if (!window.google) {
          const script = document.createElement("script");
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);

          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { Autocomplete } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
        const { DrawingManager } = await google.maps.importLibrary("drawing") as google.maps.DrawingLibrary;

        if (!mapRef.current) return;

        const newMap = new Map(mapRef.current, {
          center: { lat: 28.6139, lng: 77.209 },
          zoom: 13,
          mapId: "SAFE_HER_MAP_ID",
          disableDefaultUI: true,
          zoomControl: true,
        });

        setMap(newMap);
        setLoading(false);

        // Setup Search Box
        if (inputRef.current) {
          const autocomplete = new Autocomplete(inputRef.current);
          autocomplete.bindTo("bounds", newMap);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
              toast.error("No details available for this place.");
              return;
            }

            if (place.geometry.viewport) {
              newMap.fitBounds(place.geometry.viewport);
            } else {
              newMap.setCenter(place.geometry.location);
              newMap.setZoom(17);
            }

            setSelectedPlace(place);
            onPlaceSelect(place);
          });
        }

        // Setup Drawing Manager
        const drawingManager = new DrawingManager({
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
              google.maps.drawing.OverlayType.RECTANGLE,
              google.maps.drawing.OverlayType.CIRCLE
            ],
          },
        });
        drawingManager.setMap(newMap);

        google.maps.event.addListener(drawingManager, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
          if (onRegionSelect) {
            onRegionSelect(rectangle.getBounds()!);
            toast.success("Region selected for safety analysis.");
          }
        });
      } catch (e) {
        console.error("Google Maps Load Error:", e);
        toast.error("Failed to load Google Maps. Please check your API key.");
        setLoading(false);
      }
    };

    initMap();
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-4"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-foreground">Initializing Google Maps...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for safe POIs or regions..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl glass-card border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      <div ref={mapRef} className="w-full h-full" />

      {selectedPlace && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-6 left-6 right-6 z-10 glass-card p-5 rounded-3xl border-l-4 border-primary shadow-2xl"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base text-foreground leading-tight">{selectedPlace.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{selectedPlace.formatted_address}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Rating: {selectedPlace.rating || "N/A"} ⭐
                </span>
                <span className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  {selectedPlace.business_status || "Active"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GoogleMapSelector;
