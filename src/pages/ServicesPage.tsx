import { MapPin, Phone, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  { emoji: "🏥", name: "AIIMS Hospital", type: "Hospital", dist: "1.2 km", phone: "+91-11-26588500", address: "Sri Aurobindo Marg, New Delhi" },
  { emoji: "🏥", name: "Safdarjung Hospital", type: "Hospital", dist: "2.4 km", phone: "+91-11-26707437", address: "Ring Road, New Delhi" },
  { emoji: "🚔", name: "Parliament Street PS", type: "Police Station", dist: "0.8 km", phone: "100", address: "Parliament Street, New Delhi" },
  { emoji: "🚔", name: "Connaught Place PS", type: "Police Station", dist: "1.1 km", phone: "100", address: "Block A, CP, New Delhi" },
  { emoji: "🏨", name: "Safe Stay Hotel", type: "Safe Accommodation", dist: "0.5 km", phone: "+91-11-23456789", address: "Janpath, New Delhi" },
  { emoji: "🏨", name: "Women's Hostel", type: "Safe Accommodation", dist: "1.8 km", phone: "+91-11-23456790", address: "Lodhi Road, New Delhi" },
  { emoji: "📞", name: "Women Helpline", type: "Helpline", dist: "-", phone: "181", address: "24x7 Helpline" },
  { emoji: "📞", name: "Emergency", type: "Helpline", dist: "-", phone: "112", address: "Universal Emergency" },
];

const ServicesPage = () => {
  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          Emergency Services
        </h1>
        <p className="text-sm text-muted-foreground">Find help nearby, fast</p>
      </div>

      {/* Emergency Numbers */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Emergency", number: "112", color: "bg-danger/10 text-danger" },
          { label: "Women Helpline", number: "181", color: "bg-secondary/10 text-secondary" },
        ].map((n) => (
          <a key={n.number} href={`tel:${n.number}`} className={`${n.color} rounded-xl p-4 text-center`}>
            <p className="text-3xl font-black">{n.number}</p>
            <p className="text-xs font-semibold mt-1">{n.label}</p>
          </a>
        ))}
      </div>

      {/* All Services */}
      <div className="space-y-3">
        {services.map((svc, i) => (
          <motion.div
            key={svc.name}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{svc.emoji}</span>
              <div>
                <p className="text-sm font-bold text-foreground">{svc.name}</p>
                <p className="text-xs text-muted-foreground">{svc.type} • {svc.dist}</p>
                <p className="text-xs text-muted-foreground">{svc.address}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${svc.phone}`} className="w-9 h-9 rounded-full bg-safe/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-safe" />
              </a>
              <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ServicesPage;
