import { Home, Map, Shield, Phone, Users, User, AlertTriangle, Luggage, MoreHorizontal, X, Radio, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const mainItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Map, label: "Routes", path: "/routes" },
  { icon: Shield, label: "SOS", path: "/sos", isSOS: true },
  { icon: Users, label: "Guardians", path: "/guardians" },
];

const moreItems = [
  { icon: MessageSquare, label: "Global Chat", path: "/chat" },
  { icon: Radio, label: "Live Track", path: "/live-tracking" },
  { icon: Luggage, label: "Trips", path: "/trips" },
  { icon: AlertTriangle, label: "Incidents", path: "/incidents" },
  { icon: Phone, label: "Services", path: "/services" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const moreActive = moreItems.some((item) => pathname === item.path);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
    }
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [moreOpen]);

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50 glass-dock rounded-[2rem] px-2">
      <div className="flex items-center justify-around py-3">
        {mainItems.map(({ icon: Icon, label, path, isSOS }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                isSOS
                  ? "relative -mt-6 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg sos-pulse"
                  : active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(isSOS ? "w-7 h-7" : "w-5 h-5")} />
              {!isSOS && <span className="text-[10px] font-medium">{label}</span>}
            </Link>
          );
        })}

        {/* More menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
              moreActive || moreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {moreOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
            <span className="text-[10px] font-medium">More</span>
          </button>

          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 mb-2 glass-card rounded-xl border border-border/50 p-1.5 min-w-[140px] shadow-xl"
              >
                {moreItems.map(({ icon: Icon, label, path }) => {
                  const active = pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
