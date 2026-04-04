import { useState, useEffect, useRef } from "react";
import { Shield, Star, MessageCircle, Phone, MapPin, ChevronLeft, Send, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Guardian {
  id: string;
  full_name: string;
  trust_score: number;
  verified: boolean;
  bio: string | null;
  skills: string[] | null;
  languages: string[] | null;
  location_lat: number | null;
  location_lng: number | null;
}

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
}

const getTrustColor = (score: number) => {
  if (score >= 85) return "text-safe";
  if (score >= 60) return "text-warning";
  return "text-danger";
};

const FALLBACK_GUARDIANS: Guardian[] = [
  { id: "demo-1", full_name: "Ananya Sharma", trust_score: 94, verified: true, bio: "Local resident & certified first-aid responder. Happy to help solo travelers navigate safely.", skills: ["First Aid", "Local Guide", "Self Defense"], languages: ["Hindi", "English"], location_lat: 28.618, location_lng: 77.21 },
  { id: "demo-2", full_name: "Priya Patel", trust_score: 87, verified: true, bio: "Tour guide with 5 years experience. I know every safe route in the city.", skills: ["Translation", "Local Guide"], languages: ["Hindi", "English", "Gujarati"], location_lat: 28.625, location_lng: 77.215 },
  { id: "demo-3", full_name: "Meera Reddy", trust_score: 78, verified: false, bio: "Nurse at city hospital. Can provide medical guidance and safe accommodation referrals.", skills: ["Medical", "Accommodation"], languages: ["Telugu", "English"], location_lat: 28.61, location_lng: 77.22 },
  { id: "demo-4", full_name: "Kavita Singh", trust_score: 91, verified: true, bio: "Lawyer and self-defense instructor. Dedicated to women's safety advocacy.", skills: ["Self Defense", "Legal Aid"], languages: ["Hindi", "English", "Punjabi"], location_lat: 28.63, location_lng: 77.205 },
];

const GuardiansPage = () => {
  const { user } = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGuardians = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_guardian", true)
        .neq("id", user?.id || "")
        .order("trust_score", { ascending: false });
      if (data && data.length > 0) {
        setGuardians(data as unknown as Guardian[]);
      } else {
        setGuardians(FALLBACK_GUARDIANS);
      }
      setLoading(false);
    };
    fetchGuardians();
  }, [user?.id]);

  const openChat = async (guardian: Guardian) => {
    setSelectedGuardian(guardian);
    setChatOpen(true);
    // Fetch existing messages
    if (!user) return;
    const { data } = await supabase
      .from("guardian_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${guardian.id}),and(sender_id.eq.${guardian.id},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as unknown as ChatMessage[]);
  };

  // Realtime subscription for messages
  useEffect(() => {
    if (!chatOpen || !selectedGuardian || !user) return;

    const channel = supabase
      .channel(`chat-${selectedGuardian.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guardian_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (
            (msg.sender_id === user.id && msg.receiver_id === selectedGuardian.id) ||
            (msg.sender_id === selectedGuardian.id && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatOpen, selectedGuardian?.id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !user || !selectedGuardian) return;
    const { error } = await supabase.from("guardian_messages").insert({
      sender_id: user.id,
      receiver_id: selectedGuardian.id,
      content: message.trim(),
    });
    if (error) {
      toast.error("Failed to send message");
      return;
    }
    setMessage("");
  };

  const requestHelp = (guardian: Guardian) => {
    toast.success(`Help request sent to ${guardian.full_name}!`, {
      description: "They will be notified of your location.",
    });
  };

  // Chat view
  if (chatOpen && selectedGuardian) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        <div className="glass-card border-b border-border/50 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setChatOpen(false)}>
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-secondary/20 text-secondary text-sm font-bold">
              {selectedGuardian.full_name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{selectedGuardian.full_name}</p>
            <p className="text-[10px] text-safe">Guardian</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">Start a conversation with {selectedGuardian.full_name}</p>
          )}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  msg.sender_id === user?.id
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="glass-card border-t border-border/50 px-4 py-3 flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-muted/50 border-0 text-sm"
          />
          <Button size="icon" onClick={sendMessage} disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Guardian list
  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">Guardian Network</h1>
        <p className="text-sm text-muted-foreground">Verified helpers nearby ready to assist</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Nearby", value: String(guardians.length), icon: MapPin, color: "text-secondary" },
          { label: "Verified", value: String(guardians.filter((g) => g.verified).length), icon: Shield, color: "text-safe" },
          { label: "Avg Trust", value: guardians.length ? String(Math.round(guardians.reduce((a, g) => a + g.trust_score, 0) / guardians.length)) : "—", icon: Star, color: "text-warning" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-3 text-center">
            <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
            <p className="text-lg font-black text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : guardians.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No guardians available nearby yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Guardians will appear as more people join the network.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {guardians.map((guardian, i) => (
            <motion.div
              key={guardian.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-secondary/20 text-secondary font-bold">
                      {guardian.full_name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-foreground text-sm">{guardian.full_name}</p>
                    {guardian.verified && <CheckCircle className="w-3.5 h-3.5 text-safe" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-bold ${getTrustColor(guardian.trust_score)}`}>
                      {guardian.trust_score}/100
                    </span>
                  </div>
                </div>
              </div>

              {guardian.bio && (
                <p className="text-xs text-muted-foreground leading-relaxed">{guardian.bio}</p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {guardian.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-[10px] px-2 py-0.5 bg-secondary/10 text-secondary border-0">
                    {skill}
                  </Badge>
                ))}
                {guardian.languages?.map((lang) => (
                  <Badge key={lang} variant="outline" className="text-[10px] px-2 py-0.5 border-border/50 text-muted-foreground">
                    {lang}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs h-9" variant="outline" onClick={() => openChat(guardian)}>
                  <MessageCircle className="w-3.5 h-3.5 mr-1" /> Chat
                </Button>
                <Button size="sm" className="flex-1 text-xs h-9" onClick={() => requestHelp(guardian)}>
                  <Shield className="w-3.5 h-3.5 mr-1" /> Request Help
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardiansPage;
