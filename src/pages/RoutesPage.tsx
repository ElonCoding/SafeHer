import { useState, useEffect, useCallback } from "react";
import SafeMap from "@/components/SafeMap";
import { Map, AlertTriangle, Navigation, MapPin, Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_INCIDENTS, type IncidentMarker } from "@/data/incidents";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";
import { toast } from "sonner";

const RoutesPage = () => {
  const [incidents, setIncidents] = useState<IncidentMarker[]>([]);
  const [startPoint, setStartPoint] = useState<L.LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<L.LatLng | null>(null);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; time: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("incidents")
      .select("id, category, severity, title, location_lat, location_lng, location_name, upvotes, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setIncidents(
            data.map((d: any) => ({
              id: d.id,
              category: d.category,
              severity: d.severity,
              title: d.title,
              lat: d.location_lat,
              lng: d.location_lng,
              locationName: d.location_name,
              upvotes: d.upvotes,
              createdAt: d.created_at,
            }))
          );
        } else {
          setIncidents(DEMO_INCIDENTS);
        }
      });
  }, []);

  const handleMapClick = useCallback((latlng: L.LatLng) => {
    if (!startPoint) {
      setStartPoint(latlng);
      toast.info("Start point set. Now click to set destination.");
    } else if (!endPoint) {
      setEndPoint(latlng);
      toast.info("Destination set. Computing optimal route...");
    } else {
      setStartPoint(latlng);
      setEndPoint(null);
      setRoutePath([]);
      setRouteInfo(null);
      toast.info("New start point set.");
    }
  }, [startPoint, endPoint]);

  const computeRoute = async () => {
    if (!startPoint || !endPoint) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("compute-route", {
        body: {
          origin: { lat: startPoint.lat, lng: startPoint.lng },
          destination: { lat: endPoint.lat, lng: endPoint.lng }
        }
      });

      if (error) throw error;

      setRoutePath(data.path);
      setRouteInfo({ distance: data.distance, time: data.time });
      toast.success("Route computed successfully!");
    } catch (err) {
      console.error("Routing error:", err);
      toast.error("Failed to compute route. Destination might be unreachable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startPoint && endPoint) {
      computeRoute();
    }
  }, [startPoint, endPoint]);

  const highSeverity = incidents.filter((i) => i.severity === "high" || i.severity === "critical");

  return (
    <div className="space-y-6 bg-mesh min-h-screen pb-24">
      <div className="px-6 pt-6 space-y-2">
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tighter">
          <Map className="w-8 h-8 text-secondary drop-shadow-[0_0_10px_rgba(var(--secondary),0.5)]" />
          Safe Routes
        </h1>
        <p className="text-sm text-muted-foreground font-medium">Click on the map to set your start and end points</p>
      </div>

      <div className="mx-4 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl relative">
        <SafeMap 
          className="h-[45vh]" 
          incidents={incidents} 
          onMapClick={handleMapClick}
          startPoint={startPoint}
          endPoint={endPoint}
          routePath={routePath}
        />
        {loading && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="glass-card p-6 rounded-3xl flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-bold">Computing shortest path...</p>
            </div>
          </div>
        )}
      </div>

      {/* Route Selection Status */}
      <AnimatePresence>
        {!routeInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mx-4 grid grid-cols-2 gap-4"
          >
            <div className={`glass-card p-4 rounded-3xl border-l-4 ${startPoint ? 'border-safe' : 'border-muted'}`}>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className={`w-4 h-4 ${startPoint ? 'text-safe' : 'text-muted-foreground'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start</span>
              </div>
              <p className="text-xs font-bold truncate">
                {startPoint ? `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}` : "Select on map"}
              </p>
            </div>
            <div className={`glass-card p-4 rounded-3xl border-l-4 ${endPoint ? 'border-danger' : 'border-muted'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Search className={`w-4 h-4 ${endPoint ? 'text-danger' : 'text-muted-foreground'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destination</span>
              </div>
              <p className="text-xs font-bold truncate">
                {endPoint ? `${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}` : "Select on map"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Route Suggestion Result */}
      <AnimatePresence>
        {routeInfo && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mx-4 glass-card rounded-[2rem] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-safe/20 flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-safe" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Optimal Safe Route</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Computed by Dijkstra's</p>
                </div>
              </div>
              <button 
                onClick={() => { setStartPoint(null); setEndPoint(null); setRoutePath([]); setRouteInfo(null); }}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <div className="space-y-1">
                  <p className="text-2xl font-black tracking-tighter text-foreground">
                    {routeInfo.distance.toFixed(2)} <span className="text-sm text-muted-foreground font-medium">km</span>
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">Total Distance</p>
                </div>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="space-y-1 text-right">
                  <p className="text-2xl font-black tracking-tighter text-foreground">
                    {Math.round(routeInfo.time)} <span className="text-sm text-muted-foreground font-medium">min</span>
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">Est. Walk Time</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <span className="text-[10px] bg-safe/20 text-safe px-3 py-1 rounded-full font-black uppercase tracking-wider">Safety Score: 94/100</span>
                <span className="text-[10px] bg-white/10 text-muted-foreground px-3 py-1 rounded-full font-black uppercase tracking-wider">Well-lit Route</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Danger Zones Nearby */}
      <div className="mx-4 glass-card rounded-[2rem] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <h3 className="font-bold text-base text-foreground tracking-tight">Active Danger Zones</h3>
        </div>
        <div className="space-y-3">
          {highSeverity.length === 0 ? (
            <p className="text-xs text-muted-foreground font-medium">No high-severity incidents nearby</p>
          ) : (
            highSeverity.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-bold text-foreground">{incident.title}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{incident.locationName}</p>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                  incident.severity === "critical" ? "bg-danger text-white" : "bg-primary/20 text-primary"
                }`}>
                  {incident.severity}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutesPage;

