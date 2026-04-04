import { useState, useCallback } from "react";
import { Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SOSButton = () => {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  const startSOS = useCallback(() => {
    setActive(true);
    setCountdown(5);
    let count = 5;
    const id = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(id);
        triggerSOS();
      }
    }, 1000);
    setTimerId(id);
  }, [user]);

  const cancelSOS = useCallback(() => {
    if (timerId) clearInterval(timerId);
    setActive(false);
    setCountdown(5);
    toast.info("SOS cancelled");
  }, [timerId]);

  const triggerSOS = async () => {
    setActive(false);
    setCountdown(5);

    // Get location
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      console.warn("Could not get location for SOS");
    }

    toast.success("🆘 SOS Alert Sent!", {
      description: "Emergency contacts are being notified with your location.",
      duration: 5000,
    });

    // Send SMS via edge function if user is authenticated (skip for demo mode)
    if (user && user.id !== "demo-user-id") {
      try {
        const { data, error } = await supabase.functions.invoke("send-sos-sms", {
          body: {
            user_id: user.id,
            lat,
            lng,
            message: "Emergency! I need help immediately.",
            from_phone: "+15017122661",
          },
        });
        if (error) {
          console.error("SOS SMS error:", error);
          toast.error("SMS alerts could not be sent");
        } else if (data?.sent > 0) {
          toast.success(`📱 ${data.sent} emergency contact(s) notified via SMS`);
        } else if (data?.sent === 0) {
          toast.warning("No emergency contacts set up. Add them in your profile.");
        }
      } catch (err) {
        console.error("SOS function error:", err);
      }
    } else if (!user) {
      toast.warning("Sign in to send SMS alerts to emergency contacts");
    }
  };

  return (
    <>
      <motion.button
        onClick={startSOS}
        className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl sos-pulse"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
      >
        <Shield className="w-9 h-9" />
      </motion.button>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-8"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-40 h-40 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <div className="w-28 h-28 rounded-full bg-primary flex items-center justify-center">
                <span className="text-5xl font-black text-primary-foreground">{countdown}</span>
              </div>
            </motion.div>

            <p className="text-xl font-bold text-foreground">Sending SOS in {countdown}s...</p>
            <p className="text-muted-foreground text-center px-8">
              Your location and emergency alert will be sent to all emergency contacts via SMS.
            </p>

            <button
              onClick={cancelSOS}
              className="px-8 py-3 rounded-full border-2 border-muted-foreground text-muted-foreground font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SOSButton;
