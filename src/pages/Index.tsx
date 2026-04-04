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
    <div className="relative min-h-screen bg-mesh pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-black tracking-tighter">
              Safe<span className="text-gradient">Her</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
            </button>
            <button className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center hover:bg-white/5 transition-colors">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Map with incident overlays */}
      <div className="pt-20">
        <div className="mx-4 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
          <SafeMap className="h-[45vh]" incidents={incidents} />
        </div>
      </div>

      {/* Bottom Panel */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative -mt-10 z-10 px-4 space-y-6 pb-4"
      >
        {/* Safety Score + SOS */}
        <div className="flex items-center justify-between glass-card rounded-[2.5rem] p-5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
          <SafetyScore score={72} />
          <SOSButton />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: "🆘", label: "Quick SOS", desc: "1-tap alert", path: "/sos", color: "from-primary/20 to-primary/5" },
            { icon: "📍", label: "Live Track", desc: "Real-time", path: "/live-tracking", color: "from-secondary/20 to-secondary/5" },
            { icon: "🚨", label: "Fake Call", desc: "Escape tool", path: "/sos", color: "from-warning/20 to-warning/5" },
          ].map((action) => (
            <div
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`glass-card rounded-3xl p-4 text-center cursor-pointer hover:border-primary/50 transition-all hover:scale-105 bg-gradient-to-br ${action.color}`}
            >
              <div className="text-3xl mb-2 drop-shadow-lg">{action.icon}</div>
              <p className="text-xs font-bold text-foreground mb-1">{action.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{action.desc}</p>
            </div>
          ))}
        </div>

        {/* Nearby Services */}
        <div className="glass-card rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Safety Services
            </h3>
            <button className="text-xs font-bold text-primary hover:underline">View All</button>
          </div>
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
