import { Shield, MapPin, Bell, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: MapPin,
    label: "Prevention",
    desc: "Safe routes & danger alerts",
    color: "text-safe",
    bg: "bg-safe/10",
  },
  {
    icon: Shield,
    label: "Protection",
    desc: "Live tracking & guardian network",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Bell,
    label: "Response",
    desc: "SOS + emergency services",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const SplashPage = () => {
  const navigate = useNavigate();
  const { enterDemoMode } = useAuth();

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center px-6 overflow-hidden relative">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/20 blur-[100px]"
        />
      </div>

      {/* Shield logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 1.5, bounce: 0.4 }}
        className="relative z-10 mb-8 animate-float"
      >
        <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl">
          <Shield className="w-14 h-14 text-primary drop-shadow-[0_0_15px_rgba(255,51,71,0.5)]" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-[2rem] border-2 border-primary/30"
        />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="relative z-10 text-center mb-12"
      >
        <h1 className="text-6xl font-black tracking-tighter text-foreground mb-3">
          Safe<span className="text-gradient">Her</span>
        </h1>
        <p className="text-muted-foreground text-base font-medium max-w-[280px] mx-auto leading-relaxed">
          Your intelligent safety companion for solo travel
        </p>
      </motion.div>

      {/* Feature cards */}
      <div className="relative z-10 w-full max-w-sm space-y-4 mb-12">
        {features.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.2, duration: 0.5 }}
            className="glass-card rounded-2xl p-5 flex items-center gap-5 group hover:bg-white/5 transition-colors cursor-default"
          >
            <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
              <f.icon className={`w-6 h-6 ${f.color}`} />
            </div>
            <div>
              <p className="font-bold text-base text-foreground mb-0.5">{f.label}</p>
              <p className="text-sm text-muted-foreground leading-snug">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Buttons */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="relative z-10 w-full max-w-sm flex flex-col gap-4"
      >
        <button
          onClick={() => navigate("/auth")}
          className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_10px_30px_-10px_rgba(255,51,71,0.5)] hover:shadow-[0_15px_35px_-10px_rgba(255,51,71,0.6)] active:scale-[0.98] transition-all"
        >
          Secure Sign In
        </button>
        <button
          onClick={enterDemoMode}
          className="w-full h-16 rounded-2xl glass-card text-foreground font-bold text-lg hover:bg-white/5 active:scale-[0.98] transition-all"
        >
          Explore Demo Mode
        </button>
      </motion.div>
    </div>
  );
};

export default SplashPage;
