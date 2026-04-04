import { useState, useEffect } from "react";
import { Shield, MapPin, Bell, Share2 } from "lucide-react";
import SafeMap from "@/components/SafeMap";
import SafetyScore from "@/components/SafetyScore";
import SOSButton from "@/components/SOSButton";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import type { IncidentMarker } from "@/data/incidents";

const Index = () => {
  const navigate = useNavigate();
  // We'll store DB incidents directly to easily work with useRealtimeData
  const [dbIncidents, setDbIncidents] = useState<any[]>([]);

  // Map to the marker format expected by SafeMap
  const incidents: IncidentMarker[] = dbIncidents.map((d) => ({
    id: d.id,
    category: d.category,
    severity: d.severity,
    title: d.title,
    lat: d.location_lat || d.lat, // Handle insert mapping format gap
    lng: d.location_lng || d.lng,
    locationName: d.location_name,
    upvotes: d.upvotes,
    createdAt: d.created_at,
  }));

  useEffect(() => {
    supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setDbIncidents(data);
      });
  }, []);

  useRealtimeData("incidents", setDbIncidents);
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Edge-to-Edge Background Map */}
      <div className="fixed inset-0 z-0">
        <SafeMap className="w-full h-full" incidents={incidents} showHeatmap={true} />
        {/* Subtle gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-background/40 pointer-events-none" />
      </div>

      {/* Foreground HUD Content */}
      <div className="relative z-10 h-full flex flex-col pt-safe">
        
        {/* Floating Header */}
        <div className="px-4 py-4 mt-2">
          <div className="glass-card rounded-[2rem] px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(180,80,250,0.5)]">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-foreground">
                Safe<span className="text-primary">Solo</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Bell className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Dashboard Elements */}
        <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4 scrollbar-none mt-2">
          
          {/* Main Status HUD */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card rounded-[2.5rem] p-5 shadow-2xl border-l-[3px] border-l-safe"
          >
            <div className="flex items-center justify-between mb-4">
               <div>
                  <p className="text-[10px] uppercase font-black text-safe tracking-widest">System Status</p>
                  <h2 className="text-2xl font-black text-foreground">Secure</h2>
               </div>
               <SafetyScore score={85} />
            </div>
            
            <button onClick={() => navigate("/live-tracking")} className="w-full bg-safe/10 hover:bg-safe/20 text-safe font-bold py-3.5 rounded-[1.5rem] border border-safe/20 flex items-center justify-center gap-2 transition-all">
               <Share2 className="w-4 h-4" /> Broadcast Live Status
            </button>
          </motion.div>

          {/* Quick Tools Grid */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            {[
              { icon: "🆘", label: "Instant SOS", desc: "Alert contacts", path: "/sos", color: "text-danger flex-row" },
              { icon: "🗺️", label: "AI Routing", desc: "Plan safely", path: "/trips", color: "text-primary flex-row" },
            ].map((action) => (
              <div
                key={action.label}
                onClick={() => navigate(action.path)}
                className="glass-card rounded-3xl p-4 cursor-pointer hover:border-white/20 transition-all hover:scale-[1.02]"
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <p className={`text-sm font-black mb-0.5 ${action.color.split(' ')[0]}`}>{action.label}</p>
                <p className="text-[10px] text-muted-foreground">{action.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Real-time Intel */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-[2rem] p-5"
          >
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary" />
                  Area Intelligence
                </h3>
             </div>
             
             {incidents.slice(0, 3).map((inc, i) => (
                 <div key={inc.id} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                    <div className={`w-2 h-2 rounded-full ${inc.severity === 'high' ? 'bg-danger shadow-[0_0_10px_rgba(255,0,0,0.5)]' : 'bg-warning'}`} />
                    <div className="flex-1">
                        <p className="text-xs font-bold text-foreground line-clamp-1">{inc.title}</p>
                        <p className="text-[10px] text-muted-foreground">{inc.locationName}</p>
                    </div>
                 </div>
             ))}
             {incidents.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Scanning environment... no recent reports.</p>
             )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Index;
