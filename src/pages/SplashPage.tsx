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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 overflow-hidden relative">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.08, 0.05] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-secondary blur-[100px]"
        />
      </div>

      {/* Shield logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 1, bounce: 0.4 }}
        className="relative z-10 mb-6"
      >
        <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl border border-primary/20"
        />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 text-center mb-10"
      >
        <h1 className="text-5xl font-black tracking-tight text-foreground">
          Safe<span className="text-primary">Her</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-[250px]">
          Your safety companion for solo travel
        </p>
      </motion.div>

      {/* Feature cards */}
      <div className="relative z-10 w-full max-w-sm space-y-3 mb-10">
        {features.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.15 }}
            className="glass-card rounded-2xl p-4 flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center`}>
              <f.icon className={`w-5 h-5 ${f.color}`} />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 w-full max-w-sm space-y-3"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/auth")}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base flex items-center justify-center gap-2"
        >
          Get Started
          <Shield className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { enterDemoMode(); navigate("/"); }}
          className="w-full py-3 rounded-2xl border border-border text-muted-foreground font-semibold text-sm hover:text-foreground hover:border-primary/50 transition-colors"
        >
          Explore Demo Mode →
        </motion.button>
        <p className="text-center text-[11px] text-muted-foreground">
          Protecting women travelers across India 🇮🇳
        </p>
      </motion.div>
    </div>
  );
};

export default SplashPage;
