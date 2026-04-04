import { useState, useEffect } from "react";
import { MapPin, Radio, Users, ArrowLeft, Share2, Shield } from "lucide-react";
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

  // Wire up the real broadcast hook for accurate live-tracking
  const realPositions = useTrackMultipleLocations(contacts?.map((c) => c.id) || []);

  // Map real WebSockets data to the expected format, removing any simulated offset
  const trackedUsers = (contacts || [])
    .map((c) => {
      const real = realPositions[c.id];
      if (real) return { id: c.id, name: c.name, ...real };
      return null;
    })
    .filter(Boolean) as { id: string; name: string; lat: number; lng: number; timestamp: number }[];

  // Rely strictly on device hardware position for accuracy
  const effectivePosition = position;
  const shareLink = () => {
    const link = `${window.location.origin}/track/${user?.id}`;
    navigator.clipboard?.writeText(link);
    toast.success("Tracking link copied!", {
      description: "Share this link with trusted contacts so they can see your location.",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-background">
      {/* Header */}
      <div className="glass-card border-b border-border/50 px-4 py-4 flex items-center gap-3 z-10 sticky top-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-black text-foreground flex items-center gap-2">
            <Radio className={`w-4 h-4 ${sharing ? "text-safe animate-pulse shadow-[0_0_10px_rgba(0,255,100,0.5)]" : "text-muted-foreground"}`} />
            Solo Sentinel Tracker 
          </h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            {sharing ? `Broadcasting • ${trackedUsers.length} observers` : "Network Offline"}
          </p>
        </div>
        {sharing && (
          <button onClick={shareLink} className="p-2.5 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Map Content */}
      <div className="flex-1 relative overflow-hidden">
        {sharing ? (
          effectivePosition ? (
            <LiveTrackingMap
              className="w-full h-full"
              trackedUsers={trackedUsers}
              myPosition={effectivePosition}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">Acquiring high-accuracy GPS lock...</p>
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-8 px-6 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative w-32 h-32 rounded-[2rem] glass-card flex items-center justify-center border border-primary/30 shadow-2xl">
                 <Shield className="w-12 h-12 text-primary" />
              </div>
            </motion.div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-foreground max-w-[250px] mx-auto leading-tight">Activate Solo Sentinel</h2>
              <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                Start a secure, real-time broadcast of your physical coordinates to your trusted emergency contacts.
              </p>
            </div>
            
            <div className="glass-card rounded-[2rem] p-5 w-full space-y-2 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-safe/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-safe" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-foreground">{contacts?.length || 0} Registered Observers</p>
                  <p className="text-[10px] text-muted-foreground">Will be pinged when broadcast starts</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={sharing ? stopSharing : startSharing}
          className={`w-full py-4 rounded-full font-black flex items-center justify-center gap-2 transition-all shadow-2xl pointer-events-auto border-2 ${
            sharing
              ? "bg-destructive/90 text-destructive-foreground border-destructive/50"
              : "bg-primary/90 text-primary-foreground border-primary/50"
          } backdrop-blur-md`}
        >
          {sharing ? (
            <>
              <Radio className="w-5 h-5 animate-pulse" /> TERMINATE BROADCAST
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" /> INITIATE SENTINEL MODE
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default LiveTrackingPage;
