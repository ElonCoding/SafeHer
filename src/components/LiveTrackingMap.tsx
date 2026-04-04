import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Radio, Users } from "lucide-react";
import { motion } from "framer-motion";

interface TrackedUser {
  id: string;
  name: string;
  lat: number;
  lng: number;
  timestamp: number;
  avatar?: string;
}

interface LiveTrackingMapProps {
  className?: string;
  trackedUsers: TrackedUser[];
  myPosition?: { lat: number; lng: number } | null;
}

const LiveTrackingMap = ({ className, trackedUsers, myPosition }: LiveTrackingMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const myMarkerRef = useRef<L.Marker | null>(null);
  const trailsRef = useRef<Record<string, L.Polyline>>({});
  const historyRef = useRef<Record<string, [number, number][]>>({});

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const center: [number, number] = myPosition
      ? [myPosition.lat, myPosition.lng]
      : trackedUsers.length > 0
      ? [trackedUsers[0].lat, trackedUsers[0].lng]
      : [28.6139, 77.209];

    const map = L.map(mapRef.current, { zoomControl: false }).setView(center, 14);
    mapInstance.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
      markersRef.current = {};
      myMarkerRef.current = null;
      trailsRef.current = {};
      historyRef.current = {};
    };
  }, []);

  // Update my position
  useEffect(() => {
    if (!mapInstance.current || !myPosition) return;

    if (myMarkerRef.current) {
      myMarkerRef.current.setLatLng([myPosition.lat, myPosition.lng]);
    } else {
      myMarkerRef.current = L.marker([myPosition.lat, myPosition.lng], {
        icon: L.divIcon({
          html: `<div class="relative flex items-center justify-center">
            <div style="width:16px;height:16px;background:hsl(355,78%,56%);border-radius:50%;border:3px solid white;box-shadow:0 0 12px hsla(355,78%,56%,0.6)"></div>
            <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:hsla(355,78%,56%,0.15);animation:pulse 2s infinite"></div>
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          className: "bg-transparent",
        }),
      })
        .addTo(mapInstance.current)
        .bindPopup("<b>📍 You</b>");
    }
  }, [myPosition]);

  // Update tracked user markers with trails
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    trackedUsers.forEach((user) => {
      const latlng: [number, number] = [user.lat, user.lng];

      // Update trail history
      if (!historyRef.current[user.id]) historyRef.current[user.id] = [];
      historyRef.current[user.id].push(latlng);
      // Keep last 50 points
      if (historyRef.current[user.id].length > 50) {
        historyRef.current[user.id] = historyRef.current[user.id].slice(-50);
      }

      // Update or create marker
      if (markersRef.current[user.id]) {
        markersRef.current[user.id].setLatLng(latlng);
      } else {
        const initials = user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2);

        markersRef.current[user.id] = L.marker(latlng, {
          icon: L.divIcon({
            html: `<div style="position:relative;display:flex;align-items:center;justify-content:center">
              <div style="width:36px;height:36px;background:hsl(262,95%,58%);border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${initials}</div>
              <div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);background:hsl(142,70%,45%);color:white;font-size:8px;padding:1px 5px;border-radius:8px;font-weight:700;white-space:nowrap">${user.name.split(" ")[0]}</div>
            </div>`,
            iconSize: [44, 48],
            iconAnchor: [22, 24],
            className: "bg-transparent",
          }),
        })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:120px">
              <b>${user.name}</b><br/>
              <span style="font-size:11px;color:#94A3B8">Last update: ${new Date(user.timestamp).toLocaleTimeString()}</span>
            </div>`
          );
      }

      // Update trail polyline
      if (trailsRef.current[user.id]) {
        trailsRef.current[user.id].setLatLngs(historyRef.current[user.id]);
      } else if (historyRef.current[user.id].length > 1) {
        trailsRef.current[user.id] = L.polyline(historyRef.current[user.id], {
          color: "hsl(262, 95%, 58%)",
          weight: 3,
          opacity: 0.6,
          dashArray: "8 6",
        }).addTo(map);
      }
    });

    // Remove markers for users no longer tracked
    const activeIds = new Set(trackedUsers.map((u) => u.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
        if (trailsRef.current[id]) {
          map.removeLayer(trailsRef.current[id]);
          delete trailsRef.current[id];
        }
      }
    });
  }, [trackedUsers]);

  const timeSince = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 10) return "just now";
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

  return (
    <div className={`relative ${className || ""}`}>
      <div ref={mapRef} className="w-full h-full rounded-xl" style={{ minHeight: "400px" }} />

      {/* Status overlay */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur-md border border-border/50">
          <Radio className="w-3.5 h-3.5 text-safe animate-pulse" />
          <span className="text-[11px] font-bold text-foreground">
            {trackedUsers.length} contact{trackedUsers.length !== 1 ? "s" : ""} sharing
          </span>
        </div>
      </div>

      {/* Tracked users list */}
      {trackedUsers.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {trackedUsers.map((user) => (
              <motion.button
                key={user.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => {
                  mapInstance.current?.flyTo([user.lat, user.lng], 16, { duration: 0.8 });
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/90 backdrop-blur-md border border-border/50 shrink-0 hover:border-secondary/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary">
                  {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-foreground">{user.name.split(" ")[0]}</p>
                  <p className="text-[9px] text-safe">{timeSince(user.timestamp)}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingMap;
