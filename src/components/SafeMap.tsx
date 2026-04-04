import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import type { IncidentMarker } from "@/data/incidents";
import { CATEGORIES } from "@/data/incidentTypes";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const dangerZones = [
  { lat: 28.6139, lng: 77.209, radius: 500, level: "high", name: "Chandni Chowk Late Night" },
  { lat: 28.6329, lng: 77.2195, radius: 350, level: "medium", name: "Old Delhi Station Area" },
  { lat: 28.5672, lng: 77.21, radius: 400, level: "high", name: "Sarai Kale Khan" },
];

const emergencyServices = [
  { lat: 28.6127, lng: 77.2296, type: "hospital", name: "AIIMS Hospital" },
  { lat: 28.6218, lng: 77.2149, type: "police", name: "Central Police Station" },
  { lat: 28.6304, lng: 77.2177, type: "hotel", name: "Safe Stay Hotel" },
];

const serviceIcons: Record<string, string> = {
  hospital: "🏥",
  police: "🚔",
  hotel: "🏨",
};

const severityColors: Record<string, string> = {
  low: "#94A3B8",
  medium: "#F4A261",
  high: "#E63946",
  critical: "#DC2626",
};

const severityRadius: Record<string, number> = {
  low: 150,
  medium: 250,
  high: 350,
  critical: 450,
};

const severityIntensity: Record<string, number> = {
  low: 0.3,
  medium: 0.5,
  high: 0.8,
  critical: 1.0,
};

interface SafeMapProps {
  className?: string;
  incidents?: IncidentMarker[];
  showIncidents?: boolean;
  showHeatmap?: boolean;
}

const SafeMap = ({ className, incidents = [], showIncidents = true, showHeatmap = true }: SafeMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const incidentLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<any>(null);
  const [heatmapVisible, setHeatmapVisible] = useState(showHeatmap);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, { zoomControl: false }).setView([28.6139, 77.209], 13);
    mapInstance.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    // User location
    map.locate({ setView: true, maxZoom: 14 });
    map.on("locationfound", (e) => {
      L.marker(e.latlng).addTo(map).bindPopup("📍 You are here");
    });

    // Danger zones
    dangerZones.forEach((zone) => {
      L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        color: zone.level === "high" ? "#E63946" : "#F4A261",
        fillColor: zone.level === "high" ? "#E63946" : "#F4A261",
        fillOpacity: 0.2,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(`<b>⚠️ ${zone.name}</b><br/>Risk: ${zone.level.toUpperCase()}`);
    });

    // Emergency services
    emergencyServices.forEach((svc) => {
      L.marker([svc.lat, svc.lng], {
        icon: L.divIcon({
          html: `<div style="font-size:24px;text-align:center">${serviceIcons[svc.type]}</div>`,
          iconSize: [30, 30],
          className: "bg-transparent",
        }),
      })
        .addTo(map)
        .bindPopup(svc.name);
    });

    // Create incident layer group
    incidentLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
      incidentLayerRef.current = null;
      heatLayerRef.current = null;
    };
  }, []);

  // Update incident overlays + heatmap when data changes
  useEffect(() => {
    if (!incidentLayerRef.current || !mapInstance.current) return;

    incidentLayerRef.current.clearLayers();

    if (showIncidents) {
      incidents.forEach((incident) => {
        const color = severityColors[incident.severity] || "#F4A261";
        const radius = severityRadius[incident.severity] || 250;
        const catInfo = CATEGORIES.find((c) => c.value === incident.category);
        const icon = catInfo?.icon || "⚠️";

        L.circle([incident.lat, incident.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: "5 5",
        })
          .addTo(incidentLayerRef.current!)
          .bindPopup(
            `<div style="min-width:160px">` +
            `<b>${icon} ${incident.title}</b><br/>` +
            `<span style="color:${color};font-weight:bold;text-transform:uppercase;font-size:11px">${incident.severity}</span>` +
            `<br/><span style="font-size:12px;color:#94A3B8">📍 ${incident.locationName}</span>` +
            `<br/><span style="font-size:11px;color:#94A3B8">👍 ${incident.upvotes} reports • ${incident.createdAt}</span>` +
            `</div>`
          );

        L.marker([incident.lat, incident.lng], {
          icon: L.divIcon({
            html: `<div style="font-size:18px;text-align:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${icon}</div>`,
            iconSize: [24, 24],
            className: "bg-transparent",
          }),
        }).addTo(incidentLayerRef.current!);
      });
    }

    // Heatmap layer
    if (heatLayerRef.current) {
      mapInstance.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (heatmapVisible && incidents.length > 0) {
      const heatPoints = incidents.map((i) => [
        i.lat,
        i.lng,
        severityIntensity[i.severity] || 0.5,
      ] as [number, number, number]);

      // Also add danger zone centers as heat sources
      dangerZones.forEach((zone) => {
        heatPoints.push([zone.lat, zone.lng, zone.level === "high" ? 0.9 : 0.5]);
      });

      heatLayerRef.current = (L as any).heatLayer(heatPoints, {
        radius: 35,
        blur: 25,
        maxZoom: 15,
        max: 1.0,
        gradient: {
          0.2: "#3B82F6",
          0.4: "#7B2FF7",
          0.6: "#F4A261",
          0.8: "#E63946",
          1.0: "#DC2626",
        },
      }).addTo(mapInstance.current);
    }
  }, [incidents, showIncidents, heatmapVisible]);

  const toggleHeatmap = () => setHeatmapVisible((v) => !v);

  return (
    <div className={`relative ${className || ""}`}>
      <div ref={mapRef} className="w-full h-full rounded-xl" style={{ minHeight: "400px" }} />
      {/* Heatmap toggle */}
      {incidents.length > 0 && (
        <button
          onClick={toggleHeatmap}
          className={`absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded-lg text-[11px] font-bold backdrop-blur-md border transition-all ${
            heatmapVisible
              ? "bg-primary/20 border-primary/40 text-primary-foreground"
              : "bg-card/80 border-border/50 text-muted-foreground"
          }`}
        >
          🔥 {heatmapVisible ? "Heatmap On" : "Heatmap Off"}
        </button>
      )}
    </div>
  );
};

export default SafeMap;
