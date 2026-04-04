import { MapPin, Phone, ExternalLink, Search, Globe, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GoogleMapSelector from "@/components/GoogleMapSelector";
import { useState } from "react";
import { toast } from "sonner";

const ServicesPage = () => {
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place);
    toast.success(`Selected: ${place.name}. Verifying safety data...`);
  };

  return (
    <div className="bg-mesh min-h-screen pb-24 space-y-8">
      <div className="px-6 pt-6 space-y-2">
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tighter">
          <Globe className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          Safety POI Explorer
        </h1>
        <p className="text-sm text-muted-foreground font-medium">Search for safe locations and verify place details</p>
      </div>

      {/* Google Maps Selector Section */}
      <div className="mx-4 space-y-6">
        <div className="h-[50vh]">
          <GoogleMapSelector onPlaceSelect={handlePlaceSelect} />
        </div>

        <AnimatePresence>
          {selectedPlace && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="glass-card rounded-[2.5rem] p-6 space-y-6 shadow-2xl border-l-4 border-safe"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-safe/20 flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-safe" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground tracking-tight">{selectedPlace.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Verified Safety Point</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-safe tracking-tighter">{selectedPlace.rating || "4.5"}</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">User Rating</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                  <p className="text-sm font-bold text-foreground capitalize">{selectedPlace.business_status?.toLowerCase().replace('_', ' ') || "Operational"}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Phone</p>
                  <p className="text-sm font-bold text-foreground truncate">{selectedPlace.formatted_phone_number || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Location Details</p>
                <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    {selectedPlace.formatted_address}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <a 
                  href={`tel:${selectedPlace.formatted_phone_number}`}
                  className="flex-1 h-14 rounded-2xl bg-safe text-safe-foreground font-bold flex items-center justify-center gap-2 shadow-lg shadow-safe/20 active:scale-95 transition-all"
                >
                  <Phone className="w-4 h-4" /> Call Place
                </a>
                <button 
                  onClick={() => window.open(selectedPlace.url, '_blank')}
                  className="flex-1 h-14 rounded-2xl glass-card text-foreground font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <ExternalLink className="w-4 h-4" /> Directions
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Emergency Quick Access */}
      <div className="mx-4 glass-card rounded-[2.5rem] p-6 space-y-6">
        <h3 className="font-bold text-base text-foreground px-1 flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          Quick Emergency Access
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Police", number: "100", color: "from-primary/20 to-primary/5", icon: "🚔" },
            { label: "Women Helpline", number: "181", color: "from-secondary/20 to-secondary/5", icon: "📞" },
          ].map((n) => (
            <a 
              key={n.number} 
              href={`tel:${n.number}`} 
              className={`bg-gradient-to-br ${n.color} rounded-3xl p-5 border border-white/5 hover:scale-105 transition-transform active:scale-95`}
            >
              <span className="text-2xl mb-2 block">{n.icon}</span>
              <p className="text-2xl font-black tracking-tighter text-foreground">{n.number}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{n.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
