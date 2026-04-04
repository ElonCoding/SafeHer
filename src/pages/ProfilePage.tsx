import { Shield, MapPin, Clock, Plus, LogOut, Trash2, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { useEmergencyContacts, useAddEmergencyContact, useDeleteEmergencyContact } from "@/hooks/useEmergencyContacts";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const DEMO_PROFILE = {
  full_name: "Demo User",
  trust_score: 75,
  avatar_url: null,
  bio: "Exploring SafeHer in demo mode",
};

const ProfilePage = () => {
  const { user, signOut, isDemo } = useAuth();
  const navigate = useNavigate();
  const { sharing, startSharing, stopSharing, position } = useLocationSharing();
  const { data: contacts, isLoading: contactsLoading } = useEmergencyContacts();
  const addContact = useAddEmergencyContact();
  const deleteContact = useDeleteEmergencyContact();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "Friend" });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (isDemo) return DEMO_PROFILE;
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    await addContact.mutateAsync(newContact);
    toast.success("Contact added!");
    setNewContact({ name: "", phone: "", relationship: "Friend" });
    setShowAddForm(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* Profile Header */}
      <div className="glass-card rounded-2xl p-6 text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto text-4xl">
          👩
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground">{profile?.full_name || "Loading..."}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-safe" />
          <span className="text-sm font-bold text-safe">Trust Score: {profile?.trust_score || 50}/100</span>
        </div>
      </div>

      {/* Live Location Toggle */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className={`w-5 h-5 ${sharing ? "text-safe" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm font-bold text-foreground">Live Location Sharing</p>
              <p className="text-xs text-muted-foreground">
                {sharing ? `Active • ${position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : "Getting location..."}` : "Off"}
              </p>
            </div>
          </div>
          <button
            onClick={sharing ? stopSharing : startSharing}
            className={`w-12 h-7 rounded-full transition-colors relative ${sharing ? "bg-safe" : "bg-muted"}`}
          >
            <div className={`w-5 h-5 rounded-full bg-foreground absolute top-1 transition-all ${sharing ? "right-1" : "left-1"}`} />
          </button>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground">Emergency Contacts</h3>
          <button onClick={() => setShowAddForm(!showAddForm)} className="text-xs text-primary font-semibold">
            {showAddForm ? "Cancel" : "+ Add"}
          </button>
        </div>

        {showAddForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2 p-3 bg-muted/50 rounded-xl">
            <input placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm" />
            <input placeholder="+1 555-123-4567" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm" />
            <select value={newContact.relationship} onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
              {["Parent", "Sibling", "Partner", "Friend", "Other"].map((r) => <option key={r}>{r}</option>)}
            </select>
            <button onClick={handleAddContact} disabled={addContact.isPending} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              {addContact.isPending ? "Saving..." : "Add Contact"}
            </button>
          </motion.div>
        )}

        {contactsLoading ? (
          <p className="text-xs text-muted-foreground">Loading contacts...</p>
        ) : contacts && contacts.length > 0 ? (
          contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.name} {c.is_primary && <span className="text-[10px] text-primary font-bold">PRIMARY</span>}</p>
                  <p className="text-xs text-muted-foreground">{c.relationship} • {c.phone}</p>
                </div>
              </div>
              <button onClick={() => deleteContact.mutate(c.id)} className="p-1.5 rounded-full hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          ))
        ) : (
          <button onClick={() => navigate("/onboarding")} className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-semibold hover:border-primary/50 hover:text-primary transition-colors">
            + Set Up Emergency Contacts
          </button>
        )}
      </div>

      {/* Sign Out */}
      <button onClick={handleSignOut} className="w-full py-3 rounded-xl glass-card text-destructive font-semibold flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
};

export default ProfilePage;
