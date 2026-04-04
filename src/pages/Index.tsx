import { useState, useEffect } from "react";
import { Shield, MapPin, Bell, Share2 } from "lucide-react";
import SafeMap from "@/components/SafeMap";
import SafetyScore from "@/components/SafetyScore";
import SOSButton from "@/components/SOSButton";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { IncidentMarker } from "@/data/incidents";

const Index = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentMarker[]>([]);

  useEffect(() => {
    supabase
      .from("incidents")
      .select("id, category, severity, title, location_lat, location_lng, location_name, upvotes, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
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
        }
      });
  }, []);
  return (
    <div className="relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            <h1 className="text-lg font-black tracking-tight">
              Safe<span className="text-primary">Her</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Bell className="w-4 h-4 text-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Share2 className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Map with incident overlays */}
      <div className="pt-14">
        <SafeMap className="h-[55vh]" incidents={incidents} />
      </div>

      {/* Bottom Panel */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative -mt-8 z-10 px-4 space-y-4 pb-4"
      >
        {/* Safety Score + SOS */}
        <div className="flex items-center justify-between glass-card rounded-2xl p-4">
          <SafetyScore score={72} />
          <SOSButton />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "🆘", label: "Quick SOS", desc: "1-tap alert", path: "/sos" },
            { icon: "📍", label: "Live Track", desc: "Real-time", path: "/live-tracking" },
            { icon: "🚨", label: "Fake Call", desc: "Escape tool", path: "/sos" },
          ].map((action) => (
            <div
              key={action.label}
              onClick={() => navigate(action.path)}
              className="glass-card rounded-xl p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="text-2xl mb-1">{action.icon}</div>
              <p className="text-xs font-bold text-foreground">{action.label}</p>
              <p className="text-[10px] text-muted-foreground">{action.desc}</p>
            </div>
          ))}
        </div>

        {/* Nearby Services */}
        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Nearby Emergency Services
          </h3>
          <div className="space-y-2">
            {[
              { emoji: "🏥", name: "AIIMS Hospital", dist: "1.2 km", type: "Hospital" },
              { emoji: "🚔", name: "Central Police Station", dist: "0.8 km", type: "Police" },
              { emoji: "🏨", name: "Safe Stay Hotel", dist: "0.5 km", type: "Safe Hotel" },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{svc.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">{svc.type} • {svc.dist}</p>
                  </div>
                </div>
                <a href="tel:112" className="text-xs bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-full">
                  Call
                </a>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
