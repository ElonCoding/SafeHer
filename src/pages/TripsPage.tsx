import React, { useState, useEffect } from "react";
import {
  MapPin, Calendar, Plus, Share2, ArrowLeft, Send, Clock,
  ChevronRight, Trash2, Navigation, Bell, BellOff, UserPlus, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import AIPlaceSelector from "@/components/AIPlaceSelector";
import { getAIOptimizedRoutes, type AIRouteRecommendation } from "@/lib/routingAI";
import SafeMap from "@/components/SafeMap";

type TripStatus = "planned" | "active" | "completed" | "cancelled";

interface SharedContact {
  id: string;
  name: string;
  phone: string;
  notifyOnDeviation: boolean;
}

interface Trip {
  id: string;
  title: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  notes: string;
  sharedWith: SharedContact[];
}

const STATUS_CONFIG: Record<TripStatus, { label: string; color: string; bg: string }> = {
  planned: { label: "Planned", color: "text-secondary", bg: "bg-secondary/10" },
  active: { label: "Active", color: "text-safe", bg: "bg-safe/10" },
  completed: { label: "Completed", color: "text-muted-foreground", bg: "bg-muted/30" },
  cancelled: { label: "Cancelled", color: "text-danger", bg: "bg-danger/10" },
};

const DEMO_TRIPS: Trip[] = [
  {
    id: "1",
    title: "Delhi to Jaipur",
    origin: "New Delhi",
    destination: "Jaipur",
    startDate: "2026-03-30",
    endDate: "2026-04-02",
    status: "active",
    notes: "Taking the morning Shatabdi Express. Hotel booked near Hawa Mahal.",
    sharedWith: [
      { id: "s1", name: "Mom", phone: "+91 98765 43210", notifyOnDeviation: true },
      { id: "s2", name: "Priya", phone: "+91 87654 32109", notifyOnDeviation: true },
    ],
  },
  {
    id: "2",
    title: "Jaipur to Udaipur",
    origin: "Jaipur",
    destination: "Udaipur",
    startDate: "2026-04-03",
    endDate: "2026-04-06",
    status: "planned",
    notes: "Road trip via Ajmer. Staying at lakeside hotel.",
    sharedWith: [
      { id: "s3", name: "Mom", phone: "+91 98765 43210", notifyOnDeviation: true },
    ],
  },
];

const TripsPage = () => {
  const { user, isDemo } = useAuth();
  const [view, setView] = useState<"list" | "create" | "detail" | "analytics">("list");
  const [trips, setTrips] = useState<Trip[]>(DEMO_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    if (isDemo || !user) return;
    supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTrips(
            data.map((t: any) => ({
              id: t.id,
              title: t.title,
              origin: t.origin,
              destination: t.destination,
              startDate: t.start_date,
              endDate: t.end_date,
              status: t.status,
              notes: t.notes || "",
              sharedWith: [],
            }))
          );
        }
      });
  }, [user, isDemo]);

  // Create form state
  const [title, setTitle] = useState("");
  const [originPlace, setOriginPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [waypoints, setWaypoints] = useState<(google.maps.places.PlaceResult | null)[]>([]);
  const [destinationPlace, setDestinationPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState<SharedContact[]>([]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  
  // AI Routing state
  const geo = useGeolocation();
  const [routes, setRoutes] = useState<AIRouteRecommendation[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Auto-calculate routes when locations are selected
  useEffect(() => {
    if (originPlace?.geometry?.location && destinationPlace?.geometry?.location) {
      calculateOptimizeRoutes();
    }
  }, [originPlace, destinationPlace, waypoints]);

  const calculateOptimizeRoutes = async () => {
    if (!originPlace?.geometry?.location || !destinationPlace?.geometry?.location) return;
    
    setIsRouting(true);
    try {
      const validWaypoints = waypoints
        .filter(w => w?.geometry?.location)
        .map(w => w!.geometry!.location!);

      const recommendations = await getAIOptimizedRoutes(
        originPlace.geometry.location,
        destinationPlace.geometry.location,
        validWaypoints
      );
      setRoutes(recommendations);
      if (recommendations.length > 0) {
        setSelectedRouteIndex(0); // Default to safest 
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRouting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setOriginPlace(null);
    setWaypoints([]);
    setDestinationPlace(null);
    setRoutes([]);
    setSelectedRouteIndex(null);
    setStartDate("");
    setEndDate("");
    setNotes("");
    setContacts([]);
    setNewContactName("");
    setNewContactPhone("");
    setShowAddContact(false);
  };

  const addContact = () => {
    if (!newContactName.trim()) return;
    setContacts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newContactName,
        phone: newContactPhone,
        notifyOnDeviation: true,
      },
    ]);
    setNewContactName("");
    setNewContactPhone("");
    setShowAddContact(false);
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const createTrip = async () => {
    if (!title.trim() || !originPlace || !destinationPlace || !startDate || !endDate) {
      toast.error("Please fill in all required fields and select locations.");
      return;
    }

    const originName = originPlace.name || originPlace.formatted_address || "Origin";
    const destName = destinationPlace.name || destinationPlace.formatted_address || "Destination";

    if (!isDemo && user) {
      const { error } = await supabase.from("trips").insert({
        user_id: user.id,
        title,
        origin: originName,
        destination: destName,
        start_date: startDate,
        end_date: endDate,
        notes,
      }).select().single();

      if (error) {
        toast.error("Failed to save trip");
        return;
      }
    }

    const newTrip: Trip = {
      id: Date.now().toString(),
      title,
      origin: originName,
      destination: destName,
      startDate,
      endDate,
      status: "planned",
      notes,
      sharedWith: contacts,
    };
    setTrips((prev) => [newTrip, ...prev]);
    toast.success("Trip created!", {
      description: contacts.length > 0
        ? `Shared with ${contacts.length} contact${contacts.length > 1 ? "s" : ""}`
        : "Add contacts to share your trip",
    });
    resetForm();
    setView("list");
  };

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  // Detail view
  if (view === "detail" && selectedTrip) {
    const cfg = STATUS_CONFIG[selectedTrip.status];
    return (
      <div className="px-4 pt-4 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView("list"); setSelectedTrip(null); }}>
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-foreground">{selectedTrip.title}</h1>
            <Badge className={`text-[10px] px-1.5 py-0 border-0 ${cfg.bg} ${cfg.color} mt-1`}>{cfg.label}</Badge>
          </div>
        </div>

        {/* Route */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-safe border-2 border-safe/30" />
              <div className="w-0.5 h-8 bg-border/50" />
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary/30" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-sm font-bold text-foreground">{selectedTrip.origin}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="text-sm font-bold text-foreground">{selectedTrip.destination}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
            <Calendar className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs text-muted-foreground">
              {formatDate(selectedTrip.startDate)} — {formatDate(selectedTrip.endDate)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {selectedTrip.notes && (
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
            <p className="text-sm text-foreground leading-relaxed">{selectedTrip.notes}</p>
          </div>
        )}

        {/* Shared With */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Shared With
            </p>
            <span className="text-xs text-secondary font-semibold">{selectedTrip.sharedWith.length} contacts</span>
          </div>
          {selectedTrip.sharedWith.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
              <div>
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {c.notifyOnDeviation ? (
                  <><Bell className="w-3 h-3 text-safe" /> Alerts on</>
                ) : (
                  <><BellOff className="w-3 h-3" /> Alerts off</>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 text-xs" onClick={() => toast.info("Live tracking would start here")}>
            <Navigation className="w-3.5 h-3.5 mr-1" /> Start Tracking
          </Button>
          <Button className="flex-1 text-xs" onClick={() => toast.success("Trip link copied to clipboard!")}>
            <Share2 className="w-3.5 h-3.5 mr-1" /> Share Link
          </Button>
        </div>
      </div>
    );
  }

  // Create form
  if (view === "create") {
    return (
      <div className="px-4 pt-4 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView("list"); resetForm(); }}>
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground">Plan a Trip</h1>
            <p className="text-xs text-muted-foreground">Share your itinerary for safety</p>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Trip Name</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend in Goa" className="bg-muted/50 border-border/50" />
        </div>

        {/* Route AI Selection */}
        <div className="glass-card rounded-3xl p-5 space-y-4">
          <div className="flex gap-4">
            {/* Dynamic visual path line */}
            <div className="flex flex-col items-center mt-6 mb-3">
              <div className="w-3 h-3 rounded-full bg-safe border-2 border-safe/30 flex-shrink-0" />
              <div className="w-0.5 flex-1 bg-border/50 my-1 min-h-[4rem]" />
              {waypoints.map((_, i) => (
                 <React.Fragment key={`line-${i}`}>
                    <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                    <div className="w-0.5 flex-1 bg-border/50 my-1 min-h-[4rem]" />
                 </React.Fragment>
              ))}
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary/30 flex-shrink-0" />
            </div>
            
            <div className="flex-1 space-y-5">
              <AIPlaceSelector
                id="origin"
                label="Current Location / Origin"
                placeholder="Where are you starting?"
                biasCoords={geo.coords}
                showCurrentLocationAction={true}
                onPlaceSelect={(place) => setOriginPlace(place)}
              />

              {/* Waypoints */}
              <AnimatePresence>
                {waypoints.map((wp, i) => (
                  <motion.div 
                    key={`wp-${i}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-1">
                      <AIPlaceSelector
                        id={`waypoint-${i}`}
                        label={`Stop ${i + 1}`}
                        placeholder="Search for a stopover..."
                        biasCoords={geo.coords}
                        onPlaceSelect={(place) => {
                          const newWp = [...waypoints];
                          newWp[i] = place;
                          setWaypoints(newWp);
                        }}
                      />
                    </div>
                    <button 
                      onClick={() => setWaypoints(waypoints.filter((_, idx) => idx !== i))} 
                      className="mt-6 p-2 rounded-full hover:bg-danger/10 text-danger transition-colors shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button 
                onClick={() => setWaypoints([...waypoints, null])} 
                className="text-[11px] font-bold text-secondary flex items-center gap-1 hover:underline uppercase tracking-wide"
              >
                <Plus className="w-3 h-3" /> Add Safe Stop
              </button>

              <AIPlaceSelector
                id="destination"
                label="Destination"
                placeholder="Where to?"
                biasCoords={geo.coords}
                onPlaceSelect={(place) => setDestinationPlace(place)}
              />
            </div>
          </div>
        </div>

        {/* AI Route Options */}
        {isRouting ? (
           <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center gap-4 border border-safe/30">
               <div className="w-8 h-8 rounded-full border-2 border-safe border-t-transparent animate-spin" />
               <p className="text-sm font-bold text-foreground">AI calculating optimal routes...</p>
           </div>
        ) : routes.length > 0 && selectedRouteIndex !== null ? (
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">AI Route Recommendations</h3>
             <div className="grid gap-3">
                 {routes.map((rec, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedRouteIndex(i)}
                      className={`glass-card rounded-2xl p-4 cursor-pointer transition-all border-2 ${
                        selectedRouteIndex === i ? "border-safe bg-safe/5" : "border-transparent hover:border-white/10"
                      }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <Badge className={`text-[10px] uppercase font-black px-2 ${
                                rec.aiLabel === "Safest & Fastest" ? "bg-safe/20 text-safe" :
                                rec.aiLabel === "Safest" ? "bg-primary/20 text-primary" :
                                rec.aiLabel === "Fastest" ? "bg-warning/20 text-warning" :
                                "bg-muted text-muted-foreground"
                            }`}>
                                ✨ {rec.aiLabel}
                            </Badge>
                            <span className="text-lg font-black">{Math.round(rec.durationMs / 60000)} min</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Via {rec.route.summary}</p>
                                <p className="text-xs text-muted-foreground">{(rec.distanceMeters / 1000).toFixed(1)} km</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Safety Score</p>
                                <p className={`text-xl font-black ${rec.safetyScore >= 80 ? 'text-safe' : rec.safetyScore >= 50 ? 'text-warning' : 'text-danger'}`}>
                                    {rec.safetyScore}/100
                                </p>
                            </div>
                        </div>
                        {rec.warnings.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-border/30 flex flex-wrap gap-1">
                                {rec.warnings.map((w, idx) => (
                                    <span key={idx} className="text-[9px] bg-danger/10 text-danger px-1.5 py-0.5 rounded-sm flex items-center">
                                      ⚠️ {w}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                 ))}
             </div>
          </div>
        ) : null}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-muted/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-muted/50 border-border/50" />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Transport, hotel, important details..."
            rows={2}
            className="w-full rounded-lg bg-muted/50 border border-border/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Share with contacts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Share With</label>
            <button onClick={() => setShowAddContact(true)} className="text-xs text-primary font-semibold flex items-center gap-1">
              <UserPlus className="w-3 h-3" /> Add
            </button>
          </div>

          {contacts.map((c) => (
            <div key={c.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
              </div>
              <button onClick={() => removeContact(c.id)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-danger transition-colors" />
              </button>
            </div>
          ))}

          {contacts.length === 0 && !showAddContact && (
            <button
              onClick={() => setShowAddContact(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-semibold hover:border-secondary/50 hover:text-secondary transition-colors"
            >
              + Add emergency contact to share with
            </button>
          )}

          <AnimatePresence>
            {showAddContact && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card rounded-xl p-3 space-y-2">
                  <Input value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder="Contact name" className="bg-muted/50 border-border/50 text-sm" />
                  <Input value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} placeholder="Phone number" className="bg-muted/50 border-border/50 text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setShowAddContact(false)}>Cancel</Button>
                    <Button size="sm" className="flex-1 text-xs" onClick={addContact}>Add Contact</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <Button className="w-full h-12 text-sm font-bold" onClick={createTrip}>
          <Send className="w-4 h-4 mr-2" /> Create Trip
        </Button>
      </div>
    );
  }

  // Analytics View
  if (view === "analytics") {
    const tripFrequencyData = [
      { name: 'Mon', trips: 1 },
      { name: 'Tue', trips: 0 },
      { name: 'Wed', trips: 2 },
      { name: 'Thu', trips: 1 },
      { name: 'Fri', trips: 3 },
      { name: 'Sat', trips: 4 },
      { name: 'Sun', trips: 2 },
    ];
    const safetyScoreData = [
      { name: 'Week 1', score: 85 },
      { name: 'Week 2', score: 88 },
      { name: 'Week 3', score: 92 },
      { name: 'Week 4', score: 90 },
    ];

    return (
      <div className="px-4 pt-4 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("list")}>
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">Your safety and trip history</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Weekly Trip Frequency</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
                <Bar dataKey="trips" fill="hsl(262, 95%, 58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Average Safety Score</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safetyScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(142, 70%, 45%)" strokeWidth={3} dot={{ fill: "hsl(142, 70%, 45%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // Trip list
  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">My Trips</h1>
          <p className="text-sm text-muted-foreground">Plan & share your travel safely</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setView("analytics")} className="text-xs">
            Analytics
          </Button>
          <Button size="sm" onClick={() => setView("create")} className="text-xs">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: trips.filter((t) => t.status === "active").length.toString(), color: "text-safe" },
          { label: "Planned", value: trips.filter((t) => t.status === "planned").length.toString(), color: "text-secondary" },
          { label: "Shared", value: trips.reduce((a, t) => a + t.sharedWith.length, 0).toString(), color: "text-warning" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-3 text-center">
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Trip cards */}
      <div className="space-y-3">
        {trips.map((trip, i) => {
          const cfg = STATUS_CONFIG[trip.status];
          return (
            <motion.button
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => { setSelectedTrip(trip); setView("detail"); }}
              className="glass-card rounded-2xl p-4 space-y-3 w-full text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{trip.title}</p>
                    <Badge className={`text-[10px] px-1.5 py-0 border-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <MapPin className="w-3 h-3 text-safe" />
                    <span className="text-xs text-muted-foreground">{trip.origin}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <MapPin className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">{trip.destination}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Share2 className="w-3 h-3" />
                  {trip.sharedWith.length} shared
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default TripsPage;
