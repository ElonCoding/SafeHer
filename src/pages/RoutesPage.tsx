import { useState, useEffect } from "react";
import SafeMap from "@/components/SafeMap";
import { Map, AlertTriangle, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { DEMO_INCIDENTS, type IncidentMarker } from "@/data/incidents";
import { supabase } from "@/integrations/supabase/client";

const RoutesPage = () => {
  const [incidents, setIncidents] = useState<IncidentMarker[]>([]);

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

  const highSeverity = incidents.filter((i) => i.severity === "high" || i.severity === "critical");

  return (
    <div className="space-y-4">
      <div className="px-4 pt-4 space-y-2">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Map className="w-6 h-6 text-secondary" />
          Safe Routes
        </h1>
        <p className="text-sm text-muted-foreground">Navigate safely with danger zone alerts</p>
      </div>

      <SafeMap className="h-[40vh] mx-4 rounded-2xl overflow-hidden" incidents={incidents} />

      {/* Route Suggestion */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-4 glass-card rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-safe" />
          <h3 className="font-bold text-sm text-foreground">Recommended Safe Route</h3>
        </div>
        <div className="bg-safe/5 rounded-xl p-3">
          <p className="text-sm text-foreground font-medium">Connaught Place → India Gate</p>
          <p className="text-xs text-muted-foreground mt-1">
            Via Barakhamba Rd • Well-lit • CCTV coverage • 2.1 km
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-safe/20 text-safe px-2 py-0.5 rounded-full font-semibold">Safety: 89/100</span>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">~25 min walk</span>
          </div>
        </div>
      </motion.div>

      {/* Danger Zones */}
      <div className="mx-4 glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-danger" />
          <h3 className="font-bold text-sm text-foreground">Reported Incidents Nearby</h3>
        </div>
        {highSeverity.length === 0 ? (
          <p className="text-xs text-muted-foreground">No high-severity incidents nearby</p>
        ) : (
          highSeverity.map((incident) => (
            <div key={incident.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-semibold text-foreground">{incident.title}</p>
                <p className="text-xs text-muted-foreground">{incident.locationName}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                incident.severity === "critical" ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
              }`}>
                {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoutesPage;
