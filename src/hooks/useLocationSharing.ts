import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const useLocationSharing = () => {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const watchRef = useRef<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const positionRef = useRef<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const startSharing = useCallback(async () => {
    if (!user || !navigator.geolocation) {
      toast.error("Geolocation not available");
      return;
    }

    // Subscribe to channel first so listeners can attach
    const channel = supabase.channel(`location:${user.id}`);
    await channel.subscribe();
    channelRef.current = channel;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(coords);
        positionRef.current = coords;
      },
      (err) => {
        console.error("Geolocation error:", err);
        toast.error("Could not get your location");
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    // Broadcast position every 5 seconds via realtime channel AND backend
    intervalRef.current = setInterval(async () => {
      const pos = positionRef.current;
      if (!pos) return;

      // 1. P2P Broadcast for low-latency map updates
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "location_update",
          payload: {
            lat: pos.lat,
            lng: pos.lng,
            timestamp: Date.now(),
            user_id: user.id,
          },
        });
      }

      // 2. HTTP Sync for persistence and server-side safety logic
      try {
        await api.post("/api/realtime/tracking", { 
          lat: pos.lat, 
          lng: pos.lng 
        });
      } catch (err) {
        console.error("Failed to sync location to backend:", err);
      }
    }, 5000);

    setSharing(true);
    toast.success("📍 Location sharing started");
  }, [user]);

  const stopSharing = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setSharing(false);
    setPosition(null);
    positionRef.current = null;
    toast.info("Location sharing stopped");
  }, []);

  useEffect(() => {
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return { sharing, position, startSharing, stopSharing };
};

// Hook to subscribe to someone's location
export const useTrackLocation = (userId: string | null) => {
  const [trackedPosition, setTrackedPosition] = useState<{
    lat: number;
    lng: number;
    timestamp: number;
    user_id?: string;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`location:${userId}`)
      .on("broadcast", { event: "location_update" }, (payload) => {
        setTrackedPosition(payload.payload as { lat: number; lng: number; timestamp: number; user_id?: string });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return trackedPosition;
};

// Hook to track multiple users simultaneously
export const useTrackMultipleLocations = (userIds: string[]) => {
  const [positions, setPositions] = useState<
    Record<string, { lat: number; lng: number; timestamp: number }>
  >({});

  useEffect(() => {
    if (userIds.length === 0) return;

    const channels = userIds.map((uid) => {
      const channel = supabase
        .channel(`location:${uid}`)
        .on("broadcast", { event: "location_update" }, (payload) => {
          const data = payload.payload as { lat: number; lng: number; timestamp: number };
          setPositions((prev) => ({ ...prev, [uid]: data }));
        })
        .subscribe();
      return channel;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [userIds.join(",")]);

  return positions;
};
