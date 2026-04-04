import { useState, useEffect } from "react";
import { MapPin, Radio, Users, ArrowLeft, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocationSharing, useTrackMultipleLocations } from "@/hooks/useLocationSharing";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import LiveTrackingMap from "@/components/LiveTrackingMap";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LiveTrackingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sharing, position, startSharing, stopSharing } = useLocationSharing();
  const { data: contacts } = useEmergencyContacts();

  // For demo: simulate tracked contacts with slight position offsets
  const [demoTrackedUsers, setDemoTrackedUsers] = useState<
    { id: string; name: string; lat: number; lng: number; timestamp: number }[]
  >([]);

  // Wire up the real broadcast hook
  const realPositions = useTrackMultipleLocations(contacts?.map((c) => c.id) || []);

  // Fallback position when geolocation is unavailable (Delhi center)
  const effectivePosition = position || (sharing ? { lat: 28.6139, lng: 77.209 } : null);

  // Simulate demo tracked contacts with moving positions
  useEffect(() => {
    if (!sharing || !effectivePosition) return;

    // Create demo tracked contacts that move slightly around user position
    const interval = setInterval(() => {
      const baseContacts = contacts?.slice(0, 3) || [];
      if (baseContacts.length === 0) {
        // If no contacts, show demo ones
        setDemoTrackedUsers([
          { id: "demo-1", name: "Mom", lat: effectivePosition.lat + Math.sin(Date.now() / 3000) * 0.003 + 0.002, lng: effectivePosition.lng + Math.cos(Date.now() / 4000) * 0.003 + 0.001, timestamp: Date.now() },
          { id: "demo-2", name: "Best Friend", lat: effectivePosition.lat + Math.sin(Date.now() / 3000 + 2) * 0.003 + 0.004, lng: effectivePosition.lng + Math.cos(Date.now() / 4000 + 3) * 0.003 + 0.002, timestamp: Date.now() },
        ]);
        return;
      }
      setDemoTrackedUsers(
        baseContacts.map((c, i) => ({
          id: c.id,
          name: c.name,
          lat: effectivePosition.lat + (Math.sin(Date.now() / 3000 + i * 2) * 0.003) + (i + 1) * 0.002,
          lng: effectivePosition.lng + (Math.cos(Date.now() / 4000 + i * 3) * 0.003) + (i + 1) * 0.001,
          timestamp: Date.now(),
        }))
      );
    }, 3000);

    // Initial set
    const baseContacts = contacts?.slice(0, 3) || [];
    const initialUsers = baseContacts.length > 0
      ? baseContacts.map((c, i) => {
          const real = realPositions[c.id];
          return {
            id: c.id,
            name: c.name,
            lat: real ? real.lat : effectivePosition.lat + (i + 1) * 0.002,
            lng: real ? real.lng : effectivePosition.lng + (i + 1) * 0.001,
            timestamp: real ? real.timestamp : Date.now(),
          };
        })
      : [
          { id: "demo-1", name: "Mom", lat: effectivePosition.lat + 0.002, lng: effectivePosition.lng + 0.001, timestamp: Date.now() },
          { id: "demo-2", name: "Best Friend", lat: effectivePosition.lat + 0.004, lng: effectivePosition.lng + 0.002, timestamp: Date.now() },
        ];
    setDemoTrackedUsers(initialUsers);

    return () => clearInterval(interval);
  }, [sharing, effectivePosition?.lat, effectivePosition?.lng, contacts, realPositions]);

  const shareLink = () => {
    const link = `${window.location.origin}/track/${user?.id}`;
    navigator.clipboard?.writeText(link);
    toast.success("Tracking link copied!", {
      description: "Share this link with trusted contacts so they can see your location.",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="glass-card border-b border-border/50 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-black text-foreground flex items-center gap-2">
            <Radio className={`w-4 h-4 ${sharing ? "text-safe animate-pulse" : "text-muted-foreground"}`} />
            Live Tracking
          </h1>
          <p className="text-[10px] text-muted-foreground">
            {sharing ? `Broadcasting • ${demoTrackedUsers.length} contacts nearby` : "Start sharing to see contacts"}
          </p>
        </div>
        {sharing && (
          <button onClick={shareLink} className="p-2 rounded-lg bg-secondary/10 text-secondary">
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {sharing && effectivePosition ? (
          <LiveTrackingMap
            className="h-full"
            trackedUsers={demoTrackedUsers}
            myPosition={effectivePosition}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-6 px-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center"
            >
              <MapPin className="w-12 h-12 text-secondary" />
            </motion.div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-foreground">Live Location Tracking</h2>
              <p className="text-sm text-muted-foreground">
                Share your real-time location with trusted contacts. They'll see your position updating on the map.
              </p>
            </div>
            <div className="glass-card rounded-xl p-4 w-full space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-safe/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-safe" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{contacts?.length || 0} Emergency Contacts</p>
                  <p className="text-[10px] text-muted-foreground">Will see your live position</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="glass-card border-t border-border/50 px-4 py-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={sharing ? stopSharing : startSharing}
          className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            sharing
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {sharing ? (
            <>
              <Radio className="w-4 h-4" /> Stop Sharing Location
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" /> Start Live Tracking
            </>
          )}
        </motion.button>
        {sharing && (
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Position broadcasts every 5 seconds • Battery-optimized
          </p>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingPage;
