import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Users, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  timestamp: number;
}

const ChatPage = () => {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [activeUsers, setActiveUsers] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const getDisplayName = () => {
    if (isDemo) return "Demo Traveler";
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Anonymous Traveler";
  };

  const currentUserId = user?.id || "demo-id";

  useEffect(() => {
    // Scroll to bottom when messages change
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // Initialize Supabase Channel for Global Chat
    const channel = supabase.channel("room:global", {
      config: {
        presence: { key: currentUserId },
      },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event: "message" }, (payload) => {
        const newMessage = payload.payload as ChatMessage;
        setMessages((prev) => [...prev, newMessage]);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setActiveUsers(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          await channel.track({ user_name: getDisplayName(), online_at: new Date().toISOString() });
          toast.success("Connected to Travelers Lounge!");
        } else if (status === "CHANNEL_ERROR") {
          toast.error("Lost connection to chat.");
          setIsConnected(false);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUserId]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !channelRef.current || !isConnected) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: currentUserId,
      user_name: getDisplayName(),
      text: inputText.trim(),
      timestamp: Date.now(),
    };

    // Optimistically add to UI
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Broadcast to others
    const resp = await channelRef.current.send({
      type: "broadcast",
      event: "message",
      payload: newMessage,
    });

    if (resp !== "ok") {
      toast.error("Failed to send message. Connection dropped.");
    }
  };

  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(new Date(ts));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-background">
      {/* Header */}
      <div className="glass-card border-b border-border/50 px-4 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="text-base font-black text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Travelers Lounge
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-safe animate-pulse" : "bg-danger"}`} />
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                {isConnected ? "Live Global Chat" : "Connecting..."}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-secondary" />
          <span className="text-xs font-bold text-foreground">{activeUsers}</span>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold text-foreground">Welcome to the Lounge</h3>
            <p className="text-xs text-muted-foreground max-w-[250px] mt-2">
              This is a live, ephemeral global chat. Say hi to other solo travelers! Messages fade when you leave.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMine = msg.user_id === currentUserId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex flex-col w-full ${isMine ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] text-muted-foreground font-semibold mb-1 px-1">
                    {isMine ? "You" : msg.user_name}
                  </span>
                  <div className="flex items-end gap-2 max-w-[85%]">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(var(--primary),0.25)] rounded-br-sm"
                          : "glass-card border-none rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-muted/50 border-border/50 h-12 rounded-xl focus-visible:ring-primary"
            disabled={!isConnected}
          />
          <Button 
            type="submit" 
            disabled={!inputText.trim() || !isConnected}
            className="h-12 w-12 rounded-xl p-0 shrink-0"
          >
            {isConnected ? <Send className="w-5 h-5 ml-0.5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
