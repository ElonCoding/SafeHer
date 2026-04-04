import { useState } from "react";
import { Shield, UserPlus, Phone, ArrowRight, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ContactForm {
  name: string;
  phone: string;
  relationship: string;
}

const OnboardingPage = () => {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [contacts, setContacts] = useState<ContactForm[]>([
    { name: "", phone: "", relationship: "Parent" },
  ]);
  const [saving, setSaving] = useState(false);

  const addContact = () => {
    if (contacts.length >= 5) return;
    setContacts([...contacts, { name: "", phone: "", relationship: "Friend" }]);
  };

  const removeContact = (i: number) => {
    if (contacts.length <= 1) return;
    setContacts(contacts.filter((_, idx) => idx !== i));
  };

  const updateContact = (i: number, field: keyof ContactForm, value: string) => {
    const updated = [...contacts];
    updated[i] = { ...updated[i], [field]: value };
    setContacts(updated);
  };

  const saveContacts = async () => {
    const valid = contacts.filter((c) => c.name.trim() && c.phone.trim());
    if (valid.length === 0) {
      toast.error("Add at least one emergency contact");
      return;
    }
    if (isDemo) {
      toast.success("Demo mode — contacts saved locally! 🎉");
      navigate("/");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("emergency_contacts").insert(
      valid.map((c, i) => ({
        user_id: user!.id,
        name: c.name.trim(),
        phone: c.phone.trim(),
        relationship: c.relationship,
        is_primary: i === 0,
      }))
    );
    if (error) {
      toast.error("Failed to save contacts");
      console.error(error);
    } else {
      toast.success("Emergency contacts saved! 🎉");
      navigate("/");
    }
    setSaving(false);
  };

  const relationships = ["Parent", "Sibling", "Partner", "Friend", "Other"];

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-foreground">Welcome to SafeHer!</h1>
            <p className="text-muted-foreground max-w-xs">
              Let's set up your safety network. Add emergency contacts who will receive alerts when you need help.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(1)}
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="contacts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <UserPlus className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-xl font-black text-foreground">Emergency Contacts</h2>
              <p className="text-sm text-muted-foreground">These people will be alerted via SMS when you trigger SOS</p>
            </div>

            <div className="space-y-4">
              {contacts.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card rounded-xl p-4 space-y-3 relative"
                >
                  {contacts.length > 1 && (
                    <button
                      onClick={() => removeContact(i)}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                  {i === 0 && (
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Primary Contact</span>
                  )}
                  <input
                    placeholder="Name"
                    value={c.name}
                    onChange={(e) => updateContact(i, "name", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        placeholder="+1 (555) 123-4567"
                        value={c.phone}
                        onChange={(e) => updateContact(i, "phone", e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <select
                      value={c.relationship}
                      onChange={(e) => updateContact(i, "relationship", e.target.value)}
                      className="px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {relationships.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>

            {contacts.length < 5 && (
              <button
                onClick={addContact}
                className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-semibold hover:border-primary/50 hover:text-primary transition-colors"
              >
                + Add Another Contact
              </button>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-3 rounded-xl border border-border text-muted-foreground font-semibold"
              >
                Skip for Now
              </button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={saveContacts}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"} <Check className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingPage;
